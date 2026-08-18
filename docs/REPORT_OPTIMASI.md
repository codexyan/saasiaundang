# Laporan Optimasi Gambar Dua Lapis

**Tanggal:** 17 Agustus 2026
**Branch acuan:** `feat/cloudflare-migration`
**Sasaran:** load undangan < 3 detik di koneksi lambat, tanpa `sharp` (tidak jalan di Workers)

> ## STATUS: SUDAH DITERAPKAN ke working tree — 17 Agustus 2026
>
> `npx tsc --noEmit` bersih, `npx next build` sukses.
>
> **Belum dikerjakan dan memang menunggu Anda:** seluruh §0 (konfigurasi
> dashboard Cloudflare). `NEXT_PUBLIC_CF_IMAGE_RESIZING` sengaja ditulis
> `false` di `.env.local` dan `.env.example`, jadi lapis 2 sudah ada di kode
> tetapi **belum aktif**. Perilaku produksi hari ini belum berubah sedikit pun
> oleh lapis 2 — yang sudah berjalan hanya lapis 1.
>
> Tiga hal di bawah berbeda dari rancangan awal dokumen ini, dan bagian yang
> bersangkutan sudah diperbarui: skrip worker di-vendorkan ke origin sendiri
> (§1.2), `ImageUploadField` mendapat prop `folder` alih-alih nilai keras
> (§1.5), dan §5.1 memakai pendekatan bedah karena penalaran awalnya keliru.

---

## Ringkasan Eksekutif

| Lapis | Apa yang dikerjakan | Berkas tersentuh | Prasyarat |
|---|---|---|---|
| **1. Kompresi klien** | Kecilkan sebelum upload: maks 500 KB / 1920 px, keluaran WebP | 5 berkas (1 baru) | `npm i browser-image-compression` |
| **2. Cloudflare Image Resizing** | Antar ukuran yang pas per slot + AVIF otomatis | 3 berkas (1 baru) | **Konfigurasi dashboard dulu — §0** |

### Tiga temuan yang mengubah bentuk implementasi

**1. Lapis klien sudah ada, tapi bocor di jalur yang paling penting.**
`lib/image-resize.ts` sudah melakukan resize kanvas → WebP, dipakai `GalleryManager` dan `ImagePicker`. Tetapi **Foto Pembuka** (`couple_photo_url`) diupload **mentah tanpa kompresi apa pun** lewat `BasicInfoForm.handleUpload()` — batas servernya 8 MB. Padahal foto itulah gambar yang paling sering dimuat di seluruh sistem: ia dipakai sebagai latar Hero, latar Countdown, dan foto Story sekaligus. Foto 4 MB langsung dari kamera HP lolos apa adanya. Sama halnya `ImageUploadField` (foto tempat, foto mempelai, foto bab cerita, gift registry, IG story) — **lima form, nol kompresi**.

**2. Paket Free BISA memakai transformations, tapi origin Supabase diblokir secara bawaan.**
Terverifikasi dari dokumentasi Cloudflare hari ini:
- Free plan termasuk fitur transformations, **5.000 transformasi unik per bulan**. Lewat kuota, permintaan transformasi **mengembalikan error** (tidak ditagih, tapi juga tidak melayani).
- Cloudflare **selalu menolak** gambar sumber dari luar zona kecuali domainnya didaftarkan di **Images → Transformations → Sources**. Bucket kita ada di `*.supabase.co` — **di luar zona**. Tanpa langkah ini, seluruh URL `/cdn-cgi/image/` gagal, bukan sebagian.

**3. `onerror=redirect` TIDAK berlaku untuk sumber di luar zona.**
Dokumentasi menyatakan opsi itu hanya bekerja bila gambar berada di zona yang sama. Jadi jaring pengaman standar itu **tidak tersedia** untuk kita, dan penggantinya harus di sisi klien (`onError` pada `<img>`). Ini juga alasan §2 dipasang di belakang saklar env — bukan gaya-gayaan, tapi karena kegagalannya tidak punya jaring bawaan.

> **Blocker di luar cakupan yang harus Anda tahu:** kelima form studio memanggil `<ImageUploadField>` **tanpa** prop `uploadUrl`, sehingga defaultnya `/api/admin/upload` — endpoint yang dibungkus `withAdminAuth`. Untuk pelanggan biasa, upload foto tempat/mempelai/cerita **membalas 403 hari ini**. Mengoptimasi jalur yang gagal itu percuma; patch-nya ada di **§5.1**.

---

# 0. Prasyarat Cloudflare — kerjakan SEBELUM menyentuh kode

Lapis 2 tidak akan bekerja tanpa tiga langkah ini. Semuanya di dashboard, bukan di repo.

## 0.1 Aktifkan Transformations untuk zona

Dashboard Cloudflare → **Images** → **Transformations** → pilih zona `iaundang.online` → aktifkan.

## 0.2 Daftarkan Supabase sebagai origin sumber

Masih di **Images → Transformations** → tab **Sources** → **Add origin**.

| Kolom | Isi |
|---|---|
| Domain | `*.supabase.co` |
| Path (opsional) | `/storage/v1/object/public/uploads` |

Wildcard `*.supabase.co` mencakup subdomain proyek Anda. Path opsional mempersempit izin ke bucket kita saja — disarankan diisi, supaya zona kita tidak bisa dipakai orang lain sebagai proksi resize gratis untuk sembarang berkas Supabase.

> Tanpa langkah ini gambar **ditolak**, bukan diteruskan apa adanya. Itulah kenapa saklar env di §2.2 harus tetap `false` sampai uji curl di §0.3 hijau.

## 0.3 Uji sebelum menyentuh kode

Ganti `<PROJECT>` dan nama berkas dengan yang nyata dari tabel `galleries`:

```bash
# 1. Apakah transformasi jalan, dan apakah AVIF keluar?
curl -sI \
  -H "Accept: image/avif,image/webp,image/*,*/*" \
  "https://iaundang.online/cdn-cgi/image/width=480,quality=80,format=auto/https://<PROJECT>.supabase.co/storage/v1/object/public/uploads/galleries/<FILE>.webp"

# Yang dicari:
#   HTTP/2 200
#   content-type: image/avif        <- format=auto bekerja
#   cf-resized: ...                 <- penanda transformasi benar-benar terjadi
#   content-length jauh lebih kecil dari aslinya

# 2. Apakah subdomain undangan juga dilayani? (wildcard * sudah Proxied)
curl -sI -H "Accept: image/avif,image/webp,*/*" \
  "https://demo.iaundang.online/cdn-cgi/image/width=480,format=auto/https://<PROJECT>.supabase.co/storage/v1/object/public/uploads/galleries/<FILE>.webp"
```

**Yang khusus perlu diperhatikan pada uji ke-2.** Zona kita punya route Worker `*.iaundang.online/*` yang mencakup SEMUA path. Dokumentasi Cloudflare tidak menyatakan secara eksplisit apakah `/cdn-cgi/image/` diproses edge lebih dulu atau diserahkan ke Worker. Kalau uji ke-2 mengembalikan 404 dari Next (bukan gambar), berarti Worker mencegatnya, dan pilihannya:

- kecualikan `/cdn-cgi/*` dari route Worker, **atau**
- alihkan ke jalur `fetch()` dengan opsi `cf.image` di dalam Worker (mekanisme yang sama, kendali programatik).

`middleware.ts` sendiri sudah aman — matcher-nya (`'/((?!api|_next/static|_next/image|favicon.ico|uploads|.*\\..*).*)'`) mengecualikan path yang mengandung titik, dan URL gambar selalu berakhiran ekstensi.

## 0.4 Anggaran kuota — batasan nyata untuk B2C

Satu transformasi unik = satu kombinasi **(gambar sumber + parameter)**, dihitung sekali per bulan kalender. `foto.webp` pada `width=480` dan `width=1080` adalah **dua** transformasi.

Perkiraan per undangan aktif per bulan, dengan tangga lebar di §2.1:

| Slot | Jumlah gambar | Lebar dipakai | Transformasi |
|---|---|---|---|
| Foto pembuka (Hero/Countdown/Story) | 1 | 1080 | 1 |
| Galeri — petak | 20 | 480 | 20 |
| Galeri — lightbox | 20 | 1080 | 20 |
| Foto mempelai, tempat, bab cerita | ±6 | 480 | 6 |
| **Total** | | | **±47** |

**5.000 ÷ 47 ≈ 105 undangan aktif per bulan** sebelum kuota Free habis. Itu batas yang nyata untuk B2C, jadi:

1. **Jangan pakai `srcSet` padat.** Lima lebar per foto akan mengalikan angka di atas dengan 2,5 dan menghabiskan kuota di ~40 undangan. Helper `getOptimizedSrcSet()` tetap saya sediakan di §2.1, tapi **jangan dipakai** sebelum pindah ke paket berbayar.
2. **Tangga lebar dikunci di 5 nilai** (§2.1). Lebar sembarang dari komponen di-snap ke nilai terdekat di atasnya, supaya `width=437` dan `width=442` tidak jadi dua transformasi berbeda.
3. **Pasang pengingat kalender** untuk mengecek pemakaian di dashboard Images tiap awal bulan. Saat mendekati 105 undangan aktif, hitung ulang harga paket berbayar Images yang berlaku saat itu — angkanya berubah, jadi jangan pakai angka lama.

---

# 1. LAPIS 1 — Kompresi Sisi Klien

## 1.1 Peta jalur upload hari ini

| Komponen | Endpoint | Dipakai untuk | Kompresi hari ini |
|---|---|---|---|
| `GalleryManager` | `/api/galleries/upload` | Galeri foto | ✅ kanvas, 1600 px, WebP q0,8 |
| `ImagePicker` (dengan `variant`) | `/api/user/upload` | Cover artikel | ✅ kanvas, crop 1.91:1 |
| `ImagePicker` (tanpa `variant`) | `/api/user/upload` | Gambar inline artikel | ❌ **mentah** |
| `BasicInfoForm` | `/api/user/upload` | **Foto Pembuka** | ❌ **mentah** |
| `ImageUploadField` | `/api/admin/upload` ⚠️ | 5 form studio | ❌ **mentah** |

Sasaran: satu fungsi kompresi yang dipakai semua baris di atas, dengan kontrak yang sama seperti util yang sudah ada — **gagal berarti `null`, dan pemanggil mengupload file asli**. Upload tidak boleh pernah gagal gara-gara langkah optimasi.

## 1.2 Pasang pustaka

```bash
npm install browser-image-compression@^2.0.2
```

Tiga hal yang membuat pustaka ini layak ditambahkan di samping kode kanvas yang sudah ada — bukan sekadar duplikasi:

1. **Target byte, bukan target kualitas.** Kode kanvas kita memakai q0,8 satu lintasan. Foto berdetail tinggi (pasir, dedaunan, gaun berpayet) tetap bisa tembus 1,5 MB di q0,8. Pustaka ini melakukan pencarian kualitas berulang sampai hasilnya benar-benar ≤ 500 KB — itu tepat yang Anda minta dan tidak bisa dijanjikan oleh satu lintasan `toBlob`.
2. **Web Worker.** `useWebWorker: true` memindahkan encoding keluar dari main thread. Saat pengguna melepas 20 foto sekaligus di HP kelas menengah, UI tidak membeku.
3. **EXIF dibuang.** `preserveExif: false` menghapus metadata — termasuk **koordinat GPS** yang ditanam kamera HP. Foto pernikahan yang diupload lalu disajikan dari bucket publik seharusnya tidak membawa lokasi rumah pemiliknya.

Ukuran bundel ±12 KB gzip, **hanya di sisi klien**. Tidak menyentuh batas 3 MB skrip Worker: JS klien disajikan sebagai static asset oleh OpenNext, terpisah dari skrip Worker.

### Jebakan yang ditemukan saat penerapan: worker memuat skrip dari CDN pihak ketiga

Nilai bawaan opsi `libURL` pustaka ini adalah:

```
https://cdn.jsdelivr.net/npm/browser-image-compression@2.0.2/dist/browser-image-compression.js
```

Saat `useWebWorker: true`, worker-nya menjalankan `self.importScripts(<libURL>)` pada kompresi **pertama**. Artinya setiap upload pertama pengguna bergantung pada jsDelivr yang bisa dijangkau. Kalau CDN itu lambat atau diblokir — kejadian nyata di sebagian jaringan Indonesia — permintaan itu menggantung dulu sebelum pustaka jatuh ke jalur main-thread, persis saat pengguna sedang menunggu uploadnya jalan.

Penanganannya: salinan pustaka di-vendorkan ke `public/vendor/browser-image-compression.js` (57 KB) dan `libURL` diarahkan ke origin sendiri:

```bash
# Ulangi perintah ini setiap kali versi paketnya dinaikkan di package.json,
# supaya worker tidak menjalankan versi yang lebih tua dari main thread.
cp node_modules/browser-image-compression/dist/browser-image-compression.js public/vendor/
```

URL-nya dibentuk **absolut** dari `window.location.origin` (lihat `workerLibUrl()` di `lib/image-compress.ts`) karena worker dibuat dari blob URL, dan resolusi path relatif di dalamnya tidak dijamin mengarah ke origin halaman.

> Kabar baiknya, pustaka ini memang punya jaring pengaman sendiri: kalau jalur worker gagal, ia mengulang kompresi di main thread. Vendoring bukan memperbaiki kerusakan, melainkan menghapus ketergantungan runtime ke pihak ketiga dan menjaga manfaat "UI tidak membeku" justru saat jaringannya buruk.

Kode kanvas yang lama **tetap dipertahankan**, karena varian `cover` artikel butuh crop tengah 1.91:1 yang tidak bisa dilakukan pustaka ini, dan karena ia jadi jalur cadangan saat pustaka gagal.

## 1.3 Berkas baru: `lib/image-compress.ts`

```typescript
/**
 * Kompresi gambar DI BROWSER sebelum diupload — target byte, bukan target
 * kualitas.
 *
 * Bedanya dengan lib/image-resize.ts (kanvas satu lintasan q0,8): berkas ini
 * menjamin ukuran AKHIR di bawah ambang. Foto berdetail tinggi bisa tembus
 * 1,5 MB pada q0,8, dan itulah yang selama ini lolos ke Supabase Storage.
 *
 * Kontraknya sengaja sama dengan resizeArticleImage(): gagal = null, dan
 * pemanggil mengupload file ASLI. Upload tidak boleh pernah gagal gara-gara
 * langkah optimasi — pola ini sudah terbukti di GalleryManager dan ImagePicker.
 *
 * Hanya boleh dipanggil dari komponen client.
 */
import imageCompression from 'browser-image-compression'

export interface CompressedImage {
  file: File
  width?: number
  height?: number
  /** Ukuran berkas asli — untuk log/telemetri, bukan untuk dikirim ke server. */
  originalBytes: number
  bytes: number
}

export const UPLOAD_IMAGE = {
  /**
   * 500 KB. Di 3G lambat (±400 kbps efektif) satu gambar sebesar ini turun
   * dalam ±1,5 detik lewat koneksi yang sudah hangat — masih muat dalam
   * anggaran 3 detik bersama HTML, font, dan JS.
   */
  maxSizeMB: 0.5,
  /**
   * Undangan dirender di kolom selebar telepon (maks ±430 px CSS). 1920 px
   * memberi ruang untuk layar dpr 3 DAN untuk zoom lightbox, tanpa menyimpan
   * piksel yang tidak akan pernah dilihat siapa pun.
   */
  maxWidthOrHeight: 1920,
  /** Titik awal. Pustaka menurunkannya sendiri sampai <= maxSizeMB tercapai. */
  initialQuality: 0.82,
}

function replaceExt(name: string, ext: string): string {
  const dot = name.lastIndexOf('.')
  const base = dot > 0 ? name.slice(0, dot) : name
  return `${base}${ext}`
}

/** Dimensi hasil — best effort, hanya untuk ditampilkan balik ke editor. */
async function readDimensions(file: File): Promise<{ width: number; height: number } | null> {
  if (typeof createImageBitmap !== 'function') return null
  let bitmap: ImageBitmap | undefined
  try {
    bitmap = await createImageBitmap(file)
    return { width: bitmap.width, height: bitmap.height }
  } catch {
    return null
  } finally {
    bitmap?.close()
  }
}

export async function compressUploadImage(
  file: File,
  options: Partial<typeof UPLOAD_IMAGE> = {}
): Promise<CompressedImage | null> {
  if (typeof window === 'undefined') return null
  if (!file.type.startsWith('image/')) return null
  // GIF animasi akan diratakan jadi satu frame — biarkan apa adanya.
  if (file.type === 'image/gif') return null
  // SVG tidak punya piksel untuk dikompresi.
  if (file.type === 'image/svg+xml') return null

  const cfg = { ...UPLOAD_IMAGE, ...options }

  try {
    const out = await imageCompression(file, {
      maxSizeMB: cfg.maxSizeMB,
      maxWidthOrHeight: cfg.maxWidthOrHeight,
      initialQuality: cfg.initialQuality,
      // Encoding keluar dari main thread — penting saat 20 foto dilepas
      // sekaligus di HP kelas menengah.
      useWebWorker: true,
      fileType: 'image/webp',
      // Buang metadata. Selain memangkas byte, ini menghapus koordinat GPS
      // yang ditanam kamera HP — bucket kita publik.
      preserveExif: false,
    })

    // Browser tanpa encoder WebP diam-diam menghasilkan PNG. Untuk foto, PNG
    // hampir selalu lebih besar dari sumbernya — lebih baik pakai file asli.
    if (out.type !== 'image/webp') return null
    if (out.size >= file.size) return null

    // Nama berkas HARUS ikut jadi .webp: route upload mengambil ekstensi dari
    // nama untuk menentukan path penyimpanan. Tanpa ini, isi WebP tersimpan
    // sebagai "foto.jpg" — lolos validasi, tapi menyesatkan selamanya.
    const named = new File([out], replaceExt(file.name, '.webp'), { type: 'image/webp' })
    const dim = await readDimensions(named)

    return {
      file: named,
      width: dim?.width,
      height: dim?.height,
      originalBytes: file.size,
      bytes: named.size,
    }
  } catch {
    return null
  }
}
```

## 1.4 `lib/image-resize.ts` — sambungkan galeri ke jalur baru

Ganti `resizeGalleryPhoto` (baris 107–109). Tidak ada perubahan di `GalleryManager` — ia memanggil fungsi yang sama.

```typescript
// SEBELUM
export function resizeGalleryPhoto(file: File): Promise<ResizedImage | null> {
  return resizeArticleImage(file, 'inline')
}
```

```typescript
// SESUDAH

// Import di kepala berkas:
// import { compressUploadImage } from './image-compress'

/**
 * Kompresi foto galeri sebelum diupload.
 *
 * Sekarang lewat browser-image-compression (target 500 KB / 1920 px), dengan
 * jalur kanvas lama sebagai CADANGAN — bukan diganti. Kanvas tetap dibutuhkan
 * saat pustaka gagal: browser tanpa Web Worker, kuota memori habis di HP
 * lawas, atau berkas yang tidak bisa di-decode.
 *
 * Dua-duanya boleh mengembalikan null; pemanggil mengupload file asli.
 */
export async function resizeGalleryPhoto(file: File): Promise<ResizedImage | null> {
  const compressed = await compressUploadImage(file)
  if (compressed) {
    const width = compressed.width ?? 0
    return {
      file: compressed.file,
      width,
      height: compressed.height ?? 0,
      lowRes: width > 0 && width < ARTICLE_IMAGE.coverMinWidth,
    }
  }
  return resizeArticleImage(file, 'inline')
}
```

## 1.5 `components/admin/ImageUploadField.tsx` — menutup 5 form studio sekaligus

Satu patch di sini menutup foto mempelai (`BasicInfoForm`), foto tempat (`EventDetailsForm`), foto bab cerita (`StoryForm`), foto produk (`GiftRegistryForm`), gambar IG Story (`IGStoryForm`), dan latar section (`SectionBackgroundControl`).

> Berbeda dari draf pertama dokumen ini, folder tidak lagi ditulis keras `'covers'` melainkan menjadi prop `folder` (bawaan `'covers'`). Alasannya di §5.1: endpoint pengguna dan endpoint admin punya daftar folder yang berbeda.

```tsx
// Import baru (setelah baris 5)
import { compressUploadImage } from '@/lib/image-compress'
```

```tsx
// uploadFile() — baris 27–43

// SEBELUM
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'covers')
      // Session cookie (__ku_session) otomatis dikirim browser
      const res = await fetch(uploadUrl ?? '/api/admin/upload', { method: 'POST', body: formData })
```

```tsx
// SESUDAH
    setUploading(true)
    try {
      // Dikecilkan dulu di browser. Gagal = null, dan file ASLI yang diupload —
      // sama seperti pola di GalleryManager dan ImagePicker.
      const compressed = await compressUploadImage(file)

      const formData = new FormData()
      formData.append('file', compressed?.file ?? file)
      formData.append('folder', folder)          // <- prop baru, bawaan 'covers'
      if (compressed?.width && compressed?.height) {
        formData.append('width', String(compressed.width))
        formData.append('height', String(compressed.height))
      }
      // Session cookie (__ku_session) otomatis dikirim browser
      const res = await fetch(uploadUrl ?? '/api/admin/upload', { method: 'POST', body: formData })
```

## 1.6 `components/studio/forms/BasicInfoForm.tsx` — Foto Pembuka

Gambar terberat di seluruh sistem, dan satu-satunya yang sampai hari ini diupload sepenuhnya mentah.

```tsx
// Import baru (di kelompok import atas)
import { compressUploadImage } from '@/lib/image-compress'
```

```tsx
// handleUpload() — baris 58–64

// SEBELUM
  async function handleUpload(file: File) {
    setUploading(true)
    const form = new FormData()
    form.append('file', file)
    form.append('folder', 'hero')
    try {
      const res = await fetch('/api/user/upload', { method: 'POST', body: form })
```

```tsx
// SESUDAH
  async function handleUpload(file: File) {
    setUploading(true)
    // Foto Pembuka dipakai ulang sebagai latar Hero, latar Countdown, DAN foto
    // Story — satu berkas ini yang paling menentukan waktu muat undangan.
    // Sebelumnya diupload mentah: foto 4 MB langsung dari kamera HP lolos utuh.
    const compressed = await compressUploadImage(file)

    const form = new FormData()
    form.append('file', compressed?.file ?? file)
    form.append('folder', 'hero')
    try {
      const res = await fetch('/api/user/upload', { method: 'POST', body: form })
```

## 1.7 `components/ui/ImagePicker.tsx` — tutup jalur tanpa `variant`

Saat `variant` tidak diberikan (gambar inline artikel), tidak ada kompresi sama sekali hari ini.

```tsx
// Import baru (setelah baris 6)
import { compressUploadImage } from '@/lib/image-compress'
```

```tsx
// uploadFile() — baris 62–75

// SEBELUM
      const resized = variant ? await resizeArticleImage(file, variant) : null

      const formData = new FormData()
      formData.append('file', resized?.file ?? file)
      formData.append('folder', folder)
      if (resized) {
        formData.append('width', String(resized.width))
        formData.append('height', String(resized.height))
        formData.append('lowRes', String(resized.lowRes))
      }
```

```tsx
// SESUDAH
      // Varian 'cover' TETAP lewat jalur kanvas: ia butuh crop tengah 1.91:1
      // (standar OG image), dan browser-image-compression tidak bisa memotong.
      // Tanpa variant (gambar inline artikel) dulu tidak dikompresi sama sekali.
      const resized    = variant ? await resizeArticleImage(file, variant) : null
      const compressed = resized ? null : await compressUploadImage(file)

      const upload = resized?.file ?? compressed?.file ?? file
      const width  = resized?.width  ?? compressed?.width
      const height = resized?.height ?? compressed?.height

      const formData = new FormData()
      formData.append('file', upload)
      formData.append('folder', folder)
      if (width && height) {
        formData.append('width', String(width))
        formData.append('height', String(height))
        formData.append('lowRes', String(resized?.lowRes ?? false))
      }
```

## 1.8 Sisi server sengaja TIDAK diubah

Batas `MAX_SIZE` di `/api/galleries/upload` (5 MB) dan `MAX_IMAGE` di `/api/user/upload` (8 MB) tetap. Keduanya adalah **jaring pengaman**, bukan alat optimasi: kompresi klien bisa dilewati oleh siapa pun yang mengirim `multipart/form-data` langsung. Menurunkannya ke 500 KB akan menolak upload sah dari browser yang jalur kompresinya gagal — persis kasus yang kontrak `null → file asli` dirancang untuk selamatkan.

---

# 2. LAPIS 2 — Cloudflare Image Resizing

## 2.1 Berkas baru: `lib/image-utils.ts`

```typescript
/**
 * Pembentuk URL Cloudflare Image Resizing.
 *
 * Kenapa bukan optimizer bawaan Next: `next/image` memakai `sharp` (binding
 * native libvips) yang tidak bisa jalan di Workers — itu sebabnya
 * next.config.mjs menyetel `images.unoptimized: true`. Cloudflare melakukan
 * pekerjaan yang sama di edge, tanpa kode Node.
 *
 * Bentuk URL:  /cdn-cgi/image/<opsi>/<url-sumber>
 *
 * URL sengaja RELATIF (diawali "/cdn-cgi/"), bukan absolut ke iaundang.online.
 * Undangan disajikan dari subdomain pelanggan (<slug>.iaundang.online, semuanya
 * Proxied), jadi URL relatif tetap berada di host yang sama dengan halamannya —
 * tanpa koneksi TLS baru dan tanpa menuliskan nama domain di dalam kode.
 *
 * PRASYARAT DASHBOARD (lihat docs/REPORT_OPTIMASI.md §0):
 *   1. Images -> Transformations diaktifkan untuk zona iaundang.online
 *   2. *.supabase.co terdaftar di Sources — origin luar zona DITOLAK secara
 *      bawaan, dan tanpa langkah ini SEMUA gambar gagal, bukan sebagian
 *   3. Kuota Free: 5.000 transformasi unik/bulan, lalu error (bukan tagihan)
 */

/**
 * Saklar utama. Sengaja env, bukan deteksi `window.location.hostname`:
 * hostname hanya ada di klien, sehingga HTML server dan hasil hidrasi akan
 * berbeda dan React melempar hydration mismatch. Nilai env di-inline saat
 * build, jadi kedua sisi selalu sepakat.
 *
 * CATATAN DEPLOY: NEXT_PUBLIC_* dibaca saat BUILD, bukan runtime. Menyetelnya
 * sebagai var Worker di dashboard TIDAK berpengaruh — ia harus ada di
 * lingkungan saat `npm run cf:build` dijalankan.
 */
const RESIZING_ENABLED = process.env.NEXT_PUBLIC_CF_IMAGE_RESIZING === 'true'

/**
 * Tangga lebar. Lebar sembarang di-snap ke nilai terdekat di ATASNYA.
 *
 * Ini bukan kerapian, tapi anggaran: satu transformasi unik = satu kombinasi
 * (gambar + parameter), dan kuota Free hanya 5.000/bulan. Tanpa snapping,
 * width=437 dan width=442 dari dua komponen berbeda menjadi dua transformasi
 * berbayar untuk gambar yang sama.
 */
const WIDTH_BUCKETS = [320, 480, 720, 1080, 1440] as const

/** Ekstensi yang tidak layak/aman ditransformasi. */
const SKIP_PATTERN = /\.(svg|gif)(\?|#|$)/i

function snapWidth(width: number): number {
  for (const bucket of WIDTH_BUCKETS) {
    if (width <= bucket) return bucket
  }
  return WIDTH_BUCKETS[WIDTH_BUCKETS.length - 1]
}

function clampQuality(quality: number): number {
  if (!Number.isFinite(quality)) return 80
  return Math.min(100, Math.max(1, Math.round(quality)))
}

/**
 * Ubah URL gambar menjadi URL Cloudflare Image Resizing.
 *
 * Mengembalikan URL ASLI apa adanya kalau: fitur dimatikan, URL kosong,
 * data:/blob:, sudah ditransformasi, atau berformat SVG/GIF. Fungsi ini aman
 * dipanggil di mana pun — paling buruk ia tidak melakukan apa-apa.
 *
 * @param originalUrl URL Supabase Storage, atau path absolut di origin ini
 * @param width       lebar TAMPILAN dalam piksel CSS (bukan piksel perangkat)
 * @param quality     1-100, bawaan 80
 */
export function getOptimizedImageUrl(
  originalUrl: string,
  width: number,
  quality = 80
): string {
  if (!RESIZING_ENABLED) return originalUrl
  if (!originalUrl) return originalUrl
  if (originalUrl.startsWith('data:') || originalUrl.startsWith('blob:')) return originalUrl
  if (originalUrl.startsWith('/cdn-cgi/')) return originalUrl
  if (SKIP_PATTERN.test(originalUrl)) return originalUrl

  const isAbsolute = /^https?:\/\//i.test(originalUrl)
  // Selain URL absolut, hanya path berakar ("/foo.png") yang sah sebagai
  // sumber. Path relatif akan menghasilkan URL yang salah diam-diam.
  if (!isAbsolute && !originalUrl.startsWith('/')) return originalUrl

  const options = [
    `width=${snapWidth(width)}`,
    `quality=${clampQuality(quality)}`,
    // AVIF/WebP sesuai header Accept peramban. Ini sumber penghematan
    // terbesar: AVIF biasanya 30-50% lebih kecil dari WebP pada mutu setara.
    'format=auto',
    // scale-down = jangan pernah MEMPERBESAR. Foto yang sudah kecil disajikan
    // apa adanya, bukan diregangkan jadi buram dan lebih berat.
    'fit=scale-down',
  ].join(',')

  // URL absolut butuh pemisah "/"; path berakar sudah membawa "/" sendiri.
  const source = isAbsolute ? `/${originalUrl}` : originalUrl
  return `/cdn-cgi/image/${options}${source}`
}

/**
 * srcSet responsif.
 *
 * SENGAJA TIDAK DIPAKAI DI MANA PUN HARI INI. Tiap lebar tambahan adalah satu
 * transformasi unik lagi per gambar per bulan; tiga lebar melipatgandakan
 * pemakaian kuota Free (5.000) sampai habis di sekitar 40 undangan aktif.
 * Pakai ini hanya setelah pindah ke paket berbayar. Lihat §0.4.
 */
export function getOptimizedSrcSet(
  originalUrl: string,
  widths: number[],
  quality = 80
): string | undefined {
  if (!RESIZING_ENABLED) return undefined
  const unique = Array.from(new Set(widths.map(snapWidth))).sort((a, b) => a - b)
  const entries = unique
    .map(w => `${getOptimizedImageUrl(originalUrl, w, quality)} ${w}w`)
    .filter(entry => !entry.startsWith(originalUrl))
  return entries.length > 0 ? entries.join(', ') : undefined
}

/**
 * Handler onError untuk <img> yang memakai URL hasil transformasi.
 *
 * WAJIB dipasang. Opsi bawaan Cloudflare `onerror=redirect` HANYA bekerja
 * untuk gambar di zona yang sama — sumber kita ada di *.supabase.co, di luar
 * zona, jadi opsi itu tidak berpengaruh sama sekali. Tanpa handler ini,
 * kuota bulanan yang habis akan tampil ke tamu sebagai gambar rusak.
 *
 * Penjaga dataset mencegah loop tak berujung kalau URL aslinya pun gagal.
 */
export function fallbackToOriginal(originalUrl: string) {
  return (event: { currentTarget: HTMLImageElement }) => {
    const img = event.currentTarget
    if (img.dataset.originalApplied === '1') return
    img.dataset.originalApplied = '1'
    img.src = originalUrl
  }
}
```

## 2.2 Variabel lingkungan

```bash
# .env.local — dan WAJIB ada juga di lingkungan CI/mesin yang menjalankan
# `npm run cf:build`, karena NEXT_PUBLIC_* di-inline saat build.
#
# Biarkan false sampai uji curl di §0.3 hijau. Menyalakannya sebelum origin
# Supabase didaftarkan akan membuat SELURUH gambar undangan gagal dimuat.
NEXT_PUBLIC_CF_IMAGE_RESIZING=false
```

Tambahkan juga barisnya ke tabel env di `CLOUDFLARE_SETUP.md` (sekitar baris 125) agar tidak hilang saat setup ulang.

## 2.3 Terapan #1 — `components/renderer/SectionWrapper.tsx` (leverage tertinggi)

Satu baris di sini menutup **latar seluruh section** sekaligus, termasuk Foto Pembuka: `HeroSection` tidak merender fotonya sendiri, melainkan mengoper `couple_photo_url` ke `SectionWrapper` sebagai `background` (lihat `HeroSection.tsx:702`).

```tsx
// Import baru (setelah baris 7)
import { getOptimizedImageUrl } from '@/lib/image-utils'
```

```tsx
// Baris 111–116

// SEBELUM
  } else if (bg.type === 'image' && bg.url) {
    bgStyle.backgroundImage = `url(${bg.url})`
    bgStyle.backgroundSize = 'cover'
    bgStyle.backgroundPosition = 'center'
    bgStyle.backgroundRepeat = 'no-repeat'
  }
```

```tsx
// SESUDAH
  } else if (bg.type === 'image' && bg.url) {
    // 1080 px: undangan dirender di kolom selebar telepon (maks ±430 px CSS),
    // jadi 1080 sudah menutup layar dpr 2,5 dengan aman. Latar full-bleed
    // memakai fit=scale-down, sehingga foto potret tinggi tidak dipotong —
    // pemotongan tetap dikerjakan CSS lewat backgroundSize: 'cover'.
    //
    // CATATAN: latar CSS TIDAK punya onError, jadi tidak ada jaring pengaman
    // per-gambar di sini (lihat fallbackToOriginal di lib/image-utils.ts).
    // Itu sebabnya saklar NEXT_PUBLIC_CF_IMAGE_RESIZING baru boleh dinyalakan
    // setelah uji curl §0.3 hijau.
    bgStyle.backgroundImage = `url(${getOptimizedImageUrl(bg.url, 1080)})`
    bgStyle.backgroundSize = 'cover'
    bgStyle.backgroundPosition = 'center'
    bgStyle.backgroundRepeat = 'no-repeat'
  }
```

**Cakupan satu patch ini:** latar Hero (foto pembuka), latar section apa pun yang dipilih pemilik lewat `section_background_overrides`, dan seluruh latar bawaan template.

## 2.4 Terapan #2 — `components/renderer/sections/GallerySection.tsx`

Di sinilah penghematan terbesar per byte: galeri 20 foto adalah bagian terberat dari sebuah undangan, dan petaknya hanya selebar ±190 px CSS — tetapi hari ini memuat berkas 1600–1920 px penuh untuk tiap petak.

```tsx
// Import baru (setelah baris 9)
import { getOptimizedImageUrl, fallbackToOriginal } from '@/lib/image-utils'
```

**a. Foto utama `DefaultView` (baris 161)** — lebar penuh:

```tsx
// SEBELUM
            <img src={photos[0]} alt="Foto utama" style={{ width: '100%', aspectRatio: '4 / 5', objectFit: 'cover', display: 'block' }} />
```

```tsx
// SESUDAH
            <img
              src={getOptimizedImageUrl(photos[0], 1080)}
              onError={fallbackToOriginal(photos[0])}
              alt="Foto utama"
              loading="lazy" decoding="async"
              style={{ width: '100%', aspectRatio: '4 / 5', objectFit: 'cover', display: 'block' }} />
```

**b. Petak masonry (baris 180 dan 193)** — dua kolom, masing-masing ±190 px CSS → 480 px sudah cukup untuk dpr 2:

```tsx
// SEBELUM (baris 180; baris 193 identik selain aspectRatio-nya)
                    <img src={url} alt={`Foto ${idx + 1}`} style={{ width: '100%', display: 'block', objectFit: 'cover', aspectRatio: ci % 3 === 0 ? '3 / 4' : '1 / 1' }} />
```

```tsx
// SESUDAH
                    <img
                      src={getOptimizedImageUrl(url, 480)}
                      onError={fallbackToOriginal(url)}
                      alt={`Foto ${idx + 1}`}
                      loading="lazy" decoding="async"
                      style={{ width: '100%', display: 'block', objectFit: 'cover', aspectRatio: ci % 3 === 0 ? '3 / 4' : '1 / 1' }} />
```

**c. `MosaicTile` (baris 439)** — dipakai berulang oleh varian mosaic:

```tsx
// SESUDAH
      <img
        src={getOptimizedImageUrl(url, 480)}
        onError={fallbackToOriginal(url)}
        alt={`Foto ${idx + 1}`}
        loading="lazy" decoding="async"
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
```

**d. `Lightbox` (baris 101–110)** — satu-satunya tempat tamu benar-benar melihat foto besar:

```tsx
// SEBELUM
        <motion.img
          key={index}
          src={photos[index]} alt="Foto"
          ...
```

```tsx
// SESUDAH
        <motion.img
          key={index}
          // Lightbox memakai 1080, bukan 1440: sumbernya sendiri sudah dibatasi
          // 1920 px oleh lapis 1, dan tiap lebar tambahan adalah satu
          // transformasi unik lagi per foto per bulan (lihat §0.4).
          src={getOptimizedImageUrl(photos[index], 1080)}
          onError={fallbackToOriginal(photos[index])}
          alt="Foto"
          ...
```

**e. Sisa `<img>` di varian lain** (`DramaticView` baris 334, `FilmstripView` baris 502, `CollageView` baris 596 & 617) mengikuti pola yang sama. Panduan lebar:

| Konteks | Lebar | Alasan |
|---|---|---|
| Lebar penuh / full-bleed | `1080` | ±430 px CSS × dpr 2,5 |
| Dua kolom (petak, mosaic) | `480` | ±190 px CSS × dpr 2,5 |
| Strip mini / thumbnail | `320` | ±120 px CSS × dpr 2,5 |
| Lightbox | `1080` | sumber memang maks 1920 |

> `loading="lazy"` yang ikut ditambahkan berdiri sendiri dari Cloudflare — ia bekerja bahkan saat saklar env masih `false`, dan mungkin memberi perbaikan waktu-muat awal yang paling besar untuk galeri 20 foto.

## 2.5 Yang sengaja TIDAK ditransformasi

| Aset | Alasan |
|---|---|
| `DecorationAssetLayer` (PNG transparan) | Ukurannya sudah kecil (aset kurasi admin), dan sebagian animasi. Transformasi menambah pemakaian kuota tanpa penghematan berarti. |
| SVG dan GIF | Dilewati `SKIP_PATTERN`. Transformasi GIF animasi berisiko merusak animasi; SVG tidak punya piksel. |
| `<video>` hero | Bukan gambar. Kompresi video butuh Cloudflare Stream — di luar cakupan. |
| Logo/aset statis di `/public` | Sudah kecil dan disajikan dari edge yang sama. |

---

# 3. Perkiraan Dampak

**Angka di bawah adalah perkiraan, bukan hasil pengukuran.** Cara mengukurnya yang sebenarnya ada di §4.

| Skenario | Hari ini | Setelah lapis 1 | Setelah lapis 1+2 |
|---|---|---|---|
| Foto Pembuka dari kamera HP | ±4,2 MB | ±420 KB | ±110 KB (1080, AVIF) |
| Galeri 20 foto — tampilan petak | ±8,4 MB | ±8,4 MB* | ±700 KB (480, AVIF) |
| Satu foto di lightbox | ±420 KB | ±420 KB | ±140 KB |

\* Lapis 1 tidak mengurangi tampilan petak karena berkasnya memang sudah dikompresi saat upload — yang berlebihan adalah **dimensinya**, dan itu persoalan lapis 2. Kedua lapis saling melengkapi, bukan tumpang tindih: lapis 1 membatasi kasus terburuk yang masuk ke penyimpanan, lapis 2 memotong ukuran per-slot saat penyajian.

---

# 4. Urutan Penerapan & Verifikasi

| Urutan | Cakupan | Bisa rilis sendiri? |
|---|---|---|
| 1 | §0.1–§0.3 (dashboard + curl) | Tidak ada perubahan kode |
| 2 | §1 (kompresi klien) | **Ya** — tidak bergantung pada Cloudflare sama sekali |
| 3 | §2 dengan env `false` | **Ya** — kode masuk, perilaku belum berubah |
| 4 | Nyalakan env `true` lalu rebuild | Ya — satu baris untuk berbalik arah |

## Uji lapis 1

1. Upload foto 4 MB lewat **Foto Pembuka** di studio → DevTools → Network → periksa `Content-Length` request `/api/user/upload` (harus < 500 KB) dan responsnya berakhiran `.webp`.
2. Lepas 20 foto sekaligus di galeri di HP kelas menengah → UI tetap responsif selama proses (bukti Web Worker bekerja).
3. Matikan JS Web Worker (atau uji di browser lama) → upload tetap berhasil dengan file asli, tidak ada error ke pengguna.
4. Upload GIF animasi → tetap animasi setelah tersimpan.

## Uji lapis 2

```bash
# Bandingkan byte asli vs hasil transformasi
ORIG="https://<PROJECT>.supabase.co/storage/v1/object/public/uploads/galleries/<FILE>.webp"
curl -sI "$ORIG" | grep -i content-length
curl -sI -H "Accept: image/avif,image/webp,*/*" \
  "https://iaundang.online/cdn-cgi/image/width=480,quality=80,format=auto,fit=scale-down/$ORIG" \
  | grep -iE 'content-length|content-type|cf-resized'
```

Lalu buka undangan sungguhan dari HP (bukan preview studio) dan periksa di DevTools:
- URL gambar diawali `/cdn-cgi/image/`
- `content-type: image/avif` di Chrome/Android
- Tidak ada gambar rusak setelah scroll penuh sampai galeri

---

# 5. Temuan Sampingan

## 5.1 BLOCKER — form studio mengunggah ke endpoint khusus admin ✅ SUDAH DIPERBAIKI

`ImageUploadField` memakai `uploadUrl ?? '/api/admin/upload'` (baris 33), dan **tidak satu pun** dari lima pemanggilnya mengoper `uploadUrl`:

| Berkas | Baris | Kolom |
|---|---|---|
| `components/studio/forms/BasicInfoForm.tsx` | 142, 179 | Foto mempelai pria & wanita |
| `components/studio/forms/EventDetailsForm.tsx` | 78 | Foto tempat acara |
| `components/studio/forms/StoryForm.tsx` | 142 | Foto latar bab cerita |
| `components/studio/forms/GiftRegistryForm.tsx` | 72 | Foto produk |
| `components/studio/forms/IGStoryForm.tsx` | 17 | Gambar IG Story |

Ditambah satu lagi yang baru ketahuan saat penerapan: **`SectionBackgroundControl`** (latar belakang section) juga dipakai bersama oleh `TemplateLab` (admin) dan `studio/SectionAppearanceControls` (pelanggan), dan `VideoUploadField` di dalamnya bahkan **mengunci** `/api/admin/upload` tanpa prop sama sekali.

`/api/admin/upload` dibungkus `withAdminAuth`, jadi bagi pelanggan biasa seluruh kolom itu **gagal dengan 403**. Kemungkinan besar tidak terdeteksi karena pengujian selalu dilakukan dari akun admin.

### Koreksi terhadap rancangan awal dokumen ini

Versi pertama §5.1 menyarankan **membalik nilai bawaan** `ImageUploadField` ke `/api/user/upload`, dengan alasan "admin sudah mengoper `uploadUrl` secara eksplisit di panelnya". **Alasan itu salah.** Pembacaan ulang menunjukkan panel admin juga TIDAK pernah mengoper `uploadUrl`:

| Pemanggil admin | Baris |
|---|---|
| `components/admin/tabs/TemplateLab.tsx` | 2413, 3216, 3357, 3370, 3380, 3417, 3452 |
| `components/admin/tabs/SettingsTab.tsx` | 242, 255 |
| `components/admin/tabs/template-lab/LoadingScreenPanel.tsx` | 232 |

Membalik defaultnya akan memindahkan seluruh aset admin itu ke endpoint dan folder pengguna — menukar satu bug dengan bug lain.

### Yang diterapkan: endpoint ditentukan di sisi pemanggil

1. **`components/studio/ui/StudioImageField.tsx` (baru)** — pembungkus tipis yang mengikat `uploadUrl="/api/user/upload"` dan `folder="photos"` di satu tempat. Kelima form studio sekarang mengimpor ini, bukan `ImageUploadField` langsung, sehingga form studio berikutnya tidak bisa lupa.
2. **`ImageUploadField`** mendapat prop `folder` (bawaan `'covers'`) di samping `uploadUrl` yang sudah ada. Nilai bawaannya **tidak diubah**, jadi seluruh pemanggil admin di tabel atas berperilaku persis seperti sebelumnya.
3. **`VideoUploadField`** mendapat prop `uploadUrl` dan `folder` (bawaan `'bg-videos'`), menggantikan URL yang sebelumnya dikunci.
4. **`SectionBackgroundControl`** mendapat prop `context: 'admin' | 'studio'` (bawaan `'admin'`) yang memetakan ke endpoint + folder yang benar untuk gambar maupun video:

```tsx
const UPLOAD_TARGET = {
  admin:  { url: '/api/admin/upload', image: 'covers', video: 'bg-videos' },
  studio: { url: '/api/user/upload',  image: 'photos', video: 'videos' },
} as const
```

`SectionAppearanceControls` (studio) mengoper `context="studio"`; `TemplateLab` dibiarkan memakai bawaannya.

Folder `'photos'` dan `'videos'` dipilih karena keduanya ada di `ALLOWED_FOLDERS` milik `/api/user/upload` (`['user', 'music', 'photos', 'videos']`) — `'covers'` akan diam-diam jatuh ke folder `user`.

**Efek samping yang menguntungkan:** `/api/admin/upload` tidak mengizinkan GIF (`IMAGE_EXTS` tanpa `.gif`), sedangkan `/api/user/upload` mengizinkannya. Jadi latar section berupa GIF animasi — yang selama ini dijanjikan teks bantuan "JPG, PNG, WebP, atau GIF animasi" — baru sekarang benar-benar bisa diupload dari studio.

## 5.2 `next.config.mjs` — komentar jadi usang

Baris 77–83 menyatakan "Kalau nanti berlangganan Cloudflare Images, ganti ini dengan loader kustom". Setelah §2 diterapkan, komentar itu perlu diperbarui: transformasi **sudah** dipakai lewat URL `/cdn-cgi/image/` pada paket Free, dan `images.unoptimized: true` tetap benar karena kita sengaja tidak memakai `next/image`.

## 5.3 Kandidat berikutnya, sesuai urutan dampak

1. **`OpeningScene` dan 17 komponen opening** — semuanya menyetel `backgroundImage: url(${bgPhoto})` sendiri-sendiri, di luar `SectionWrapper`. Foto pembuka adalah gambar PERTAMA yang dilihat tamu, jadi ini paling menentukan kesan waktu-muat. Sebaiknya `bgPhoto` dihitung sekali di `OpeningScene` lalu dioper ke bawah, bukan menambal 17 berkas.
2. **`ClosingSection.tsx:205`, `StorySection.tsx:106`, `GiftRegistrySection.tsx` (3 tempat), `CountdownSection.tsx:447`** — latar CSS yang tidak lewat `SectionWrapper`.
3. **`EventsSection.tsx`** — 5 `<img>` foto tempat.
4. **Preload foto pembuka.** Menambahkan `<link rel="preload" as="image">` di `app/invitation/[slug]/page.tsx` untuk foto pembuka akan memangkas LCP lebih jauh daripada optimasi ukuran mana pun, karena gambar itu saat ini baru ditemukan setelah JS renderer dieksekusi.
