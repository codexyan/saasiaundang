/**
 * Kompresi gambar DI BROWSER sebelum diupload — target BYTE, bukan target
 * kualitas.
 *
 * Bedanya dengan lib/image-resize.ts (kanvas satu lintasan q0,8): berkas ini
 * menjamin ukuran AKHIR di bawah ambang. Foto berdetail tinggi (pasir,
 * dedaunan, gaun berpayet) bisa tembus 1,5 MB pada q0,8 — dan itulah yang
 * selama ini lolos ke Supabase Storage.
 *
 * Kontraknya sengaja sama dengan resizeArticleImage(): GAGAL = null, dan
 * pemanggil mengupload file ASLI. Upload tidak boleh pernah gagal gara-gara
 * langkah optimasi.
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

/**
 * Skrip pustaka untuk Web Worker, disajikan dari origin kita sendiri.
 *
 * Bawaan browser-image-compression adalah
 * `https://cdn.jsdelivr.net/npm/browser-image-compression@2.0.2/dist/...` —
 * worker-nya melakukan importScripts() ke CDN pihak ketiga saat kompresi
 * PERTAMA dijalankan. Kalau jsDelivr lambat atau diblokir (kasus nyata di
 * sebagian jaringan Indonesia), permintaan itu menggantung dulu sebelum
 * pustaka jatuh ke jalur main-thread — persis di saat pengguna sedang
 * menunggu uploadnya jalan.
 *
 * Salinannya ada di public/vendor/browser-image-compression.js.
 * PENTING: kalau versi paket di package.json dinaikkan, salin ulang berkas itu
 * dari node_modules/browser-image-compression/dist/browser-image-compression.js
 * supaya worker tidak menjalankan versi yang lebih tua dari main thread.
 *
 * URL sengaja ABSOLUT: worker dibuat dari blob URL, dan resolusi path relatif
 * di dalamnya tidak dijamin mengarah ke origin halaman.
 */
function workerLibUrl(): string | undefined {
  if (typeof window === 'undefined') return undefined
  return `${window.location.origin}/vendor/browser-image-compression.js`
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
      // sekaligus di HP kelas menengah. Kalau worker gagal dibuat, pustaka
      // sendiri yang jatuh ke jalur main-thread.
      useWebWorker: true,
      libURL: workerLibUrl(),
      fileType: 'image/webp',
      // Buang metadata. Selain memangkas byte, ini menghapus koordinat GPS
      // yang ditanam kamera HP — bucket Supabase kita publik.
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
