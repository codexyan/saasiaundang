# Laporan Perbaikan — Pematangan Sistem ke Rilis B2C

**Tanggal:** 17 Agustus 2026
**Branch acuan:** `feat/cloudflare-migration`
**Basis analisis:** `docs/RANGKUMAN_TEKNIS_SISTEM.md` + pembacaan langsung kode di repo

> ## STATUS: SUDAH DITERAPKAN ke working tree — 17 Agustus 2026
>
> Keempat bagian selesai. `npx tsc --noEmit` bersih, `npx next build` sukses.
> Belum di-commit.
>
> Dua penyesuaian kecil terhadap dokumen ini saat penerapan:
>
> 1. **`navTo()` ikut menyetel `setCreating(false)`** (§4.5.3). Tanpa itu,
>    wizard "buat undangan baru" muncul lagi diam-diam saat pengguna berpindah
>    menu lalu kembali ke Beranda.
> 2. **`docs/ARCHITECTURE.md` dan `docs/RANGKUMAN_TEKNIS_SISTEM.md` ikut
>    diperbarui** (§6.4) supaya tidak lagi menyebut `findByUserId` dan aturan
>    satu-undangan-per-akun sebagai perilaku saat ini.
>
> **Belum diuji secara manual di browser.** Yang dijalankan baru typecheck dan
> build; daftar uji yang masih harus Anda lakukan ada di §1.4.

---

## Ringkasan Eksekutif

| # | Item | Tingkat | Berkas tersentuh | Risiko penerapan |
|---|---|---|---|---|
| 1 | Hotfix RSVP & Ucapan tidak tersimpan | **Kritis** | 11 berkas | Rendah (perubahan mekanis + 1 prop wajib baru) |
| 2 | Hotfix tautan WA blast tanpa nama tamu | **Kritis** | 1 berkas | Sangat rendah |
| 3 | Validasi Zod untuk payload JSONB `data` | Tinggi | 2 berkas (1 baru) | Sedang — baca **§3.1** soal `passthrough()` |
| 4 | Standardisasi B2C: 1 akun → banyak undangan | Tinggi | 4 berkas + Dashboard | Sedang — mengubah bentuk props Dashboard |

**Temuan terpenting yang belum tertulis di rangkuman:**
`Invitation.id` di `prisma/schema.prisma` adalah **`@default(cuid())`**, bukan UUID.

```prisma
model Invitation {
  id          String    @id @default(cuid())
```

Artinya `z.string().uuid()` di `/api/rsvp` dan `/api/wishes` **menolak 100% ID undangan asli** — bukan kadang-kadang, tapi selalu. Dan regex UUID di sisi klien menganggap **setiap undangan produksi sebagai "preview"**. Jadi ada dua lapis kerusakan yang saling menutupi:

1. **Klien** (renderer baru): regex gagal → `isPreview = true` → `fetch` **tidak pernah dipanggil**, tamu melihat animasi "Terima Kasih" palsu.
2. **Server**: andai `fetch` dipanggil, `z.string().uuid()` membalas **400** dan pesan errornya ditelan `catch` generik.

Template lama (`components/templates/shared/RSVPForm.tsx` & `WishesSection.tsx`) **tidak** punya guard preview — mereka selalu mengirim, dan selalu ditolak 400 oleh server. Jadi perbaikan §1.1 sekaligus memulihkan template lama.

---

# 1. HOTFIX KRITIS — RSVP & Ucapan

## 1.1 `app/api/rsvp/route.ts`

Ganti blok skema (baris 9–14):

```typescript
// SEBELUM
const schema = z.object({
  invitationId: z.string().uuid(),
  name: z.string().min(1).max(100),
  attending: z.boolean(),
  totalGuests: z.number().min(0).max(10),
})
```

```typescript
// SESUDAH
// invitationId BUKAN UUID. Prisma membuatnya dengan @default(cuid())
// (lihat prisma/schema.prisma), contoh: "clzk9r3v10001qw8h2t7x4b6d".
// z.string().uuid() menolak SETIAP id undangan asli, jadi tidak ada satu pun
// RSVP yang pernah lolos ke database sejak validasi ini dipasang.
// Kepemilikan/keabsahan id tetap dijaga oleh invitations.findById() +
// pemeriksaan is_published di bawah — bukan oleh bentuk stringnya.
const schema = z.object({
  invitationId: z.string().min(1).max(64),
  name: z.string().min(1).max(100),
  attending: z.boolean(),
  totalGuests: z.number().int().min(0).max(10),
})
```

Catatan atas dua penyesuaian kecil di luar permintaan:
- `.max(64)` — pagar panjang supaya id raksasa tidak dilempar ke query DB (cuid = 25 karakter, uuid = 36).
- `.int()` — mencegah `totalGuests: 2.7` masuk ke kolom integer.

## 1.2 `app/api/wishes/route.ts`

Ganti blok skema (baris 9–13):

```typescript
// SEBELUM
const schema = z.object({
  invitationId: z.string().uuid(),
  name: z.string().min(1).max(100),
  message: z.string().min(1).max(500),
})
```

```typescript
// SESUDAH
// Lihat catatan di app/api/rsvp/route.ts: id undangan adalah cuid, bukan uuid.
const schema = z.object({
  invitationId: z.string().min(1).max(64),
  name: z.string().min(1).max(100),
  message: z.string().min(1).max(500),
})
```

## 1.3 Mengganti deteksi `isPreview` berbasis regex

**Kenapa regex harus dibuang, bukan diperbaiki.** Menebak konteks render dari *bentuk string* selalu rapuh: hari ini cuid, besok nanoid, lusa id numerik. Yang membedakan preview dan produksi bukan bentuk id, melainkan **siapa yang me-render**. Jadi konteks itu kita jadikan **prop wajib** — sehingga TypeScript memaksa setiap pemanggil menyatakan niatnya, dan tidak ada call site baru yang bisa lupa.

Peta pemanggil hari ini:

| Pemanggil | `invitationId` yang dikirim | Mode |
|---|---|---|
| `app/invitation/[slug]/page.tsx` | `invitation.id` (asli) | **live** |
| `app/demo/renderer/DemoEditorClient.tsx` | `demo-<templateId>` | preview |
| `components/studio/InvitationStudio.tsx` (2×) | `preview-…`, `fullscreen-…` | preview |
| `components/dashboard/DashboardClient.tsx` | `inv.id` (asli!) | preview |
| `components/admin/tabs/TemplateLab.tsx` | `lab-preview`, `lab-fullscreen` | preview |

Perhatikan baris Dashboard: id-nya **asli**. Dengan pendekatan "kalau id valid berarti live", preview di dashboard akan menulis RSVP sungguhan ke undangan pemiliknya sendiri. Prop eksplisit menutup celah itu.

### 1.3.1 `lib/types.ts` — tambahkan tipe mode

Sisipkan di dekat deklarasi tipe renderer lain (mis. setelah `export type OpeningType = …`, sekitar baris 171):

```typescript
/**
 * Konteks render undangan.
 *
 * 'live'    = halaman undangan sungguhan. Aksi tamu (RSVP, ucapan) dikirim ke API.
 * 'preview' = editor, demo, atau Template Lab. Aksi tamu HANYA disimulasikan.
 *
 * Sengaja prop wajib di InvitationRenderer/SectionRenderer, bukan ditebak dari
 * bentuk invitationId: penebakan lewat regex UUID-lah yang dulu membuat seluruh
 * undangan produksi diperlakukan sebagai preview dan tidak pernah menyimpan RSVP.
 */
export type RenderMode = 'live' | 'preview'
```

### 1.3.2 `components/renderer/sections/RSVPSection.tsx`

**a. Import & props** (baris 5 dan 11–16):

```tsx
import type { SectionConfig, NewInvitationData, TemplateMeta, RenderMode } from '@/lib/types'

interface Props {
  section: SectionConfig
  data: NewInvitationData
  meta: TemplateMeta
  invitationId: string
  /** Wajib. 'live' = kirim ke /api/rsvp, 'preview' = simulasi lokal. */
  mode: RenderMode
}
```

**b. Signature & deteksi preview** (baris 22 dan 35):

```tsx
// SEBELUM
export default function RSVPSection({ section, data, meta, invitationId }: Props) {
  ...
  const isPreview = !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(invitationId)
```

```tsx
// SESUDAH
export default function RSVPSection({ section, data, meta, invitationId, mode }: Props) {
  ...
  const isPreview = mode === 'preview'
```

**c. `handleSubmit` — jangan telan pesan error server** (baris 49–58):

```tsx
// SEBELUM
    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationId, name: name.trim(), attending, totalGuests: attending ? totalGuests : 0 }),
      })
      if (!res.ok) throw new Error('Gagal mengirim')
      setSubmitted(true)
    } catch { setError('Terjadi kesalahan, coba lagi') }
    finally   { setLoading(false) }
```

```tsx
// SESUDAH
    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationId, name: name.trim(), attending, totalGuests: attending ? totalGuests : 0 }),
      })
      // Pesan error server ikut ditampilkan. Sebelumnya semua kegagalan runtuh
      // jadi satu kalimat generik — itulah kenapa 400 dari validasi uuid tidak
      // pernah terlihat oleh siapa pun selama berbulan-bulan.
      if (!res.ok) {
        const payload = await res.json().catch(() => null)
        throw new Error(payload?.error || 'Konfirmasinya gagal terkirim.')
      }
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan, coba lagi')
    }
    finally { setLoading(false) }
```

### 1.3.3 `components/renderer/sections/WishesSection.tsx`

**a. Import & props** (baris 5 dan 13–19):

```tsx
import type { SectionConfig, NewInvitationData, TemplateMeta, Wish, RenderMode } from '@/lib/types'

interface Props {
  section: SectionConfig
  data: NewInvitationData
  meta: TemplateMeta
  invitationId: string
  initialWishes?: Wish[]
  /** Wajib. 'live' = kirim ke /api/wishes, 'preview' = simulasi lokal. */
  mode: RenderMode
}
```

**b. Signature & deteksi preview** (baris 143 dan 148):

```tsx
// SEBELUM
export default function WishesSection({ section, data, meta, invitationId, initialWishes = [] }: Props) {
  ...
  const isPreview = !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(invitationId)
```

```tsx
// SESUDAH
export default function WishesSection({ section, data, meta, invitationId, initialWishes = [], mode }: Props) {
  ...
  const isPreview = mode === 'preview'
```

Sisa berkas tidak berubah — `useEffect` pengisi ucapan contoh dan cabang simulasi di `handleSubmit` tetap membaca `isPreview` yang sama.

**c. `handleSubmit` — samakan penanganan error** (baris 183–196):

```tsx
// SESUDAH
    try {
      const res = await fetch('/api/wishes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationId, name: name.trim(), message: message.trim() }),
      })
      if (!res.ok) {
        const payload = await res.json().catch(() => null)
        throw new Error(payload?.error || 'Ucapannya gagal terkirim.')
      }
      const { wish } = await res.json()
      setWishes(prev => [wish, ...prev])
      setName(''); setMessage('')
      setJustSent(true)
      setTimeout(() => setJustSent(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan, coba lagi')
    }
    finally { setLoading(false) }
```

### 1.3.4 `components/renderer/SectionRenderer.tsx`

```tsx
// Import (baris 3)
import type { SectionConfig, NewInvitationData, TemplateMeta, Wish, RenderMode } from '@/lib/types'

// Props (baris 21–27)
interface Props {
  sectionConfig: SectionConfig
  invitationData: NewInvitationData
  templateMeta: TemplateMeta
  invitationId: string
  initialWishes?: Wish[]
  /** Diteruskan ke section yang menulis ke database (RSVP, ucapan). */
  mode: RenderMode
}

// Signature (baris 29–31)
export default function SectionRenderer({
  sectionConfig, invitationData, templateMeta, invitationId, initialWishes, mode,
}: Props) {

// Dua baris switch (baris 48–49)
    case 'rsvp':          return <RSVPSection          {...shared} invitationId={invitationId} mode={mode} />
    case 'wishes':        return <WishesSection        {...shared} invitationId={invitationId} mode={mode} initialWishes={initialWishes} />
```

### 1.3.5 `components/renderer/InvitationRenderer.tsx`

```tsx
// Import (baris 5)
import type { TemplateRecord, NewInvitationData, Wish, SectionConfig, RenderMode } from '@/lib/types'

// Props (sisipkan di interface Props, baris 13–29)
interface Props {
  invitationId: string
  invitationData: NewInvitationData
  template: TemplateRecord
  /**
   * WAJIB — tidak ada nilai default yang disengaja.
   *
   * Kalau prop ini punya default, satu call site yang lupa mengisinya akan
   * diam-diam salah: 'live' sebagai default membuat preview editor menulis RSVP
   * sungguhan; 'preview' sebagai default membuat undangan asli berhenti menyimpan
   * (persis bug yang sedang kita perbaiki). Dijadikan wajib supaya kompilator
   * yang menegur, bukan pelanggan.
   */
  mode: RenderMode
  initialWishes?: Wish[]
  // ...sisanya tetap
}

// Signature (baris 33–44)
export default function InvitationRenderer({
  invitationId,
  invitationData,
  template,
  mode,
  initialWishes = [],
  musicUrl,
  contained,
  noMusic,
  previewGuestName,
  initialPhase,
  scrollToSection,
}: Props) {

// Pemanggilan SectionRenderer (baris 217–223)
                <SectionRenderer
                  sectionConfig={merged}
                  invitationData={invitationData}
                  templateMeta={meta}
                  invitationId={invitationId}
                  mode={mode}
                  initialWishes={section.type === 'wishes' ? initialWishes : undefined}
                />
```

### 1.3.6 `components/renderer/InvitationPreview.tsx`

Komponen ini **hanya** dipakai untuk pratinjau (Template Lab), jadi modenya dipatok:

```tsx
// Pemanggilan SectionRenderer (baris 69–76)
            <SectionRenderer
              key={`${section.id}-${section.style_variant ?? 'default'}`}
              sectionConfig={merged}
              invitationData={data}
              templateMeta={meta}
              invitationId={invitationId}
              // Komponen ini memang khusus pratinjau — tidak ada jalur live-nya.
              mode="preview"
              initialWishes={section.type === 'wishes' ? initialWishes : undefined}
            />
```

### 1.3.7 Lima call site `InvitationRenderer`

```tsx
// app/invitation/[slug]/page.tsx (baris 105)  — SATU-SATUNYA yang live
      <InvitationRenderer
        invitationId={invitation.id}
        mode="live"
        invitationData={invitation.data as unknown as NewInvitationData}
        template={template}
        initialWishes={invWishes}
        ...
```

```tsx
// app/demo/renderer/DemoEditorClient.tsx (baris 74)
      <InvitationRenderer
        invitationId={`demo-${template.id}`}
        mode="preview"
        invitationData={editedData}
        ...
```

```tsx
// components/dashboard/DashboardClient.tsx (baris 443)
                <InvitationRenderer
                  invitationId={inv.id}
                  // id-nya asli, tapi ini panel pratinjau milik pemilik.
                  // Tanpa baris ini, mencoba form RSVP di dashboard akan
                  // memasukkan tamu palsu ke daftar tamu sungguhan.
                  mode="preview"
                  invitationData={inv.data as unknown as NewInvitationData}
                  ...
```

```tsx
// components/studio/InvitationStudio.tsx (baris 529 dan 821)
                <InvitationRenderer
                  key={`preview-${previewKey}-${activeSection}`}
                  invitationId={`preview-${invitation.id}`}
                  mode="preview"
                  ...

              <InvitationRenderer
                key={`fs-${previewKey}`}
                invitationId={`fullscreen-${invitation.id}`}
                mode="preview"
                ...
```

```tsx
// components/admin/tabs/TemplateLab.tsx (baris 4316)
            <InvitationRenderer
              key={`fs-renderer-${showFullscreen}`}
              invitationId="lab-fullscreen"
              mode="preview"
              invitationData={previewData}
              ...
```

> Setelah patch ini, `npx tsc --noEmit` akan langsung menunjuk call site mana pun yang terlewat. Itu memang tujuannya.

## 1.4 Uji manual yang wajib lolos

1. Publikasikan satu undangan → buka `https://<slug>.iaundang.online` → isi RSVP → cek tab **RSVP** di dashboard: tamu baru muncul dengan `source = 'rsvp'`.
2. Kirim ucapan di halaman yang sama → refresh → ucapan masih ada (artinya benar-benar dari database, bukan state lokal).
3. Buka Studio/preview dashboard → isi RSVP di sana → **tidak ada** tamu baru di daftar tamu.
4. Undangan yang **belum** dipublikasikan: RSVP membalas pesan "Undangannya tidak ditemukan" — sekarang pesan itu tampil ke tamu, bukan tertelan.

---

# 2. HOTFIX KRITIS — Tautan WhatsApp Blast

## 2.1 Diagnosis

`getInvitationUrl()` (`lib/utils.ts:56`) mengembalikan **dua bentuk berbeda**:

```typescript
export function getInvitationUrl(slug: string): string {
  const domain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'iaundang.online'
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return `${window.location.origin}?slug=${slug}`   // ← sudah punya query string
  }
  return `https://${slug}.${domain}`                   // ← belum punya query string
}
```

Jadi menempelkan `?to=` secara buta akan menghasilkan `...?slug=x?to=y` di lingkungan lokal — query kedua tidak terbaca. Perbaikannya harus sadar-separator.

Nama tamu dibaca di sisi undangan lewat `new URLSearchParams(window.location.search).get('to')` (lihat `components/templates/*/…Template.tsx`), yang men-decode `%20` maupun `+` dengan benar — `encodeURIComponent` aman dipakai.

## 2.2 `components/dashboard/GuestManager.tsx`

Tambahkan helper tepat di bawah `generateWaLink` (setelah baris 34):

```tsx
/**
 * Sisipkan `?to=<nama tamu>` ke tautan undangan.
 *
 * Renderer membaca nama tamu dari query `to` untuk sampul "Kepada Yth."
 * (lihat OpeningScene / *Template.tsx). Tanpa parameter ini seluruh blast WA
 * mengirim tautan generik dan setiap tamu melihat "Bapak/Ibu/Saudara/i".
 *
 * Separator dihitung, bukan ditebak: getInvitationUrl() mengembalikan
 * `https://slug.iaundang.online` di produksi (perlu "?") tetapi
 * `http://localhost:3000?slug=x` saat pengembangan (perlu "&").
 * Fragment (#) dipertahankan di ekor supaya query tidak ikut tertelan hash.
 */
function withGuestName(baseUrl: string, guestName: string): string {
  const encoded = encodeURIComponent(guestName.trim())
  if (!encoded) return baseUrl
  const [path, hash] = baseUrl.split('#')
  const separator = path.includes('?') ? '&' : '?'
  return `${path}${separator}to=${encoded}${hash ? `#${hash}` : ''}`
}
```

Ganti `defaultMessage` (baris 53–55):

```tsx
// SEBELUM
  const defaultMessage = useCallback((name: string) =>
    `Assalamu'alaikum Yth. ${name},\n\nKami mengundang kehadiran Bapak/Ibu/Saudara/i dalam acara pernikahan kami.\n\n🔗 Undangan digital: ${invUrl}\n\nMohon hadir ya, terima kasih 💝`,
    [invUrl])
```

```tsx
// SESUDAH
  const defaultMessage = useCallback((name: string) => {
    const personalUrl = withGuestName(invUrl, name)
    return `Assalamu'alaikum Yth. ${name},\n\nKami mengundang kehadiran Bapak/Ibu/Saudara/i dalam acara pernikahan kami.\n\n🔗 Undangan digital: ${personalUrl}\n\nMohon hadir ya, terima kasih 💝`
  }, [invUrl])
```

Tidak ada perubahan lain yang dibutuhkan: `openWa()` (baris 128) dan `blastAll()` (baris 134) sama-sama lewat `defaultMessage`, jadi keduanya langsung ikut terbaiki.

## 2.3 Penyesuaian tampilan pratinjau (opsional, disarankan)

Panel pratinjau pesan blast (sekitar baris 477–482) masih memperlihatkan tautan generik sehingga pemilik mengira parameternya tidak ada:

```tsx
// SESUDAH
        <div className="bg-white rounded-xl p-3 text-xs text-gray-600 font-mono leading-relaxed border border-blue-100">
          Assalamu&apos;alaikum Yth. <strong>[Nama Tamu]</strong>,<br />
          Kami mengundang kehadiran...<br />
          🔗 {withGuestName(invUrl, '[Nama Tamu]')}
        </div>
```

> Tombol **"Salin Link"** (baris 228) sengaja **tidak** diubah: itu tautan umum untuk broadcast grup, memang tidak boleh membawa nama satu orang.

---

# 3. DATA INTEGRITY — Validasi JSONB `body.data`

## 3.1 Keputusan desain — `passthrough()`, bukan `strip`

Ini bagian yang paling mudah merusak produksi, jadi saya jelaskan alasannya dulu.

`InvitationStudio.scheduleSave()` (baris 321–331) mengirim **seluruh objek data** pada setiap autosave:

```tsx
body: JSON.stringify({ data: updatedData }),
```

Konsekuensinya:

1. **Zod bawaan membuang field tak dikenal.** Kalau skema dibiarkan `strip` (default), setiap field baru yang ditambahkan di Template Lab tetapi belum terdaftar di skema akan **hilang permanen** pada autosave berikutnya. Diam, tanpa error.
2. **Undangan lama memakai bentuk camelCase.** `DashboardClient.getDisplayNames()` masih membaca `inv.data.groomName` untuk `LEGACY_TEMPLATE_IDS`. Skema `NewInvitationData` (snake_case) yang ketat akan mengosongkan data undangan legacy pada penyimpanan pertama.

Karena itu skema di bawah: **semua field opsional**, **`.passthrough()` di setiap level**, dan yang divalidasi adalah **tipe + batas ukuran** — persis sasaran yang Anda minta ("agar tidak merusak render"). Yang dicegah adalah `gallery_photos: "bukan-array"` atau `akad: 42` yang membuat renderer melempar saat `.map()`, bukan kehadiran field asing.

## 3.2 Berkas baru: `lib/schemas/invitation-data.ts`

```typescript
import { z } from 'zod'

/**
 * Skema minimal untuk kolom JSONB `invitations.data`.
 *
 * FILOSOFI — validasi BENTUK, bukan kelengkapan:
 *
 * 1. Semua field opsional. Autosave studio mengirim data apa adanya termasuk
 *    saat undangan baru dibuat dan hampir semuanya masih kosong; mewajibkan
 *    bride_name/groom_name akan mengunci pengguna di luar editornya sendiri.
 *
 * 2. .passthrough() di setiap level. Zod default membuang key tak dikenal —
 *    dan karena studio menyimpan seluruh objek pada tiap autosave, "membuang"
 *    berarti KEHILANGAN DATA PERMANEN untuk (a) field baru dari Template Lab
 *    yang belum terdaftar di sini, dan (b) undangan legacy yang datanya masih
 *    camelCase (groomName, brideName — lihat DashboardClient.getDisplayNames).
 *
 * 3. Yang benar-benar dijaga: tipe dan batas ukuran. Renderer runtuh kalau
 *    gallery_photos ternyata string, atau akad ternyata angka. Batas panjang
 *    mencegah satu baris JSONB membengkak sampai memperlambat setiap render.
 *
 * 4. Enum (opening_type, transition, marketplace) sengaja divalidasi sebagai
 *    string berbatas, bukan z.enum(). Nilai-nilai itu bertambah dari Template
 *    Lab; z.enum() akan menolak template baru sampai berkas ini ikut diperbarui.
 */

/** Teks pendek: nama, label, judul, tanggal, jam. */
const shortText = z.string().max(200)
/** Teks panjang: bio, cerita, sambutan penutup. */
const longText = z.string().max(5000)
/** URL aset. Sengaja bukan z.string().url() — sebagian nilai adalah path relatif. */
const assetUrl = z.string().max(2000)
/** Nilai warna: hex, rgba, atau gradient CSS pendek. */
const colorValue = z.string().max(500)
/** Rasio 0–1 (opacity). */
const ratio = z.number().min(0).max(1)

const eventDetail = z.object({
  date: shortText.optional(),
  time: shortText.optional(),
  venue_name: shortText.optional(),
  venue_address: longText.optional(),
  maps_url: assetUrl.optional(),
  venue_photo_url: assetUrl.optional(),
}).passthrough()

const giftAccount = z.object({
  type: shortText.optional(),          // 'bank' | 'ewallet'
  bank: shortText.optional(),
  platform: shortText.optional(),
  number: shortText.optional(),
  name: shortText.optional(),
}).passthrough()

const timelineItem = z.object({
  date: shortText.optional(),
  title: shortText.optional(),
  description: longText.optional(),
  photo_url: assetUrl.optional(),
}).passthrough()

const storyChapter = z.object({
  title: shortText.optional(),
  text: longText.optional(),
  date: shortText.optional(),
  photo_url: assetUrl.optional(),
  video_url: assetUrl.optional(),
  overlay_opacity: ratio.optional(),
}).passthrough()

const giftRegistryLink = z.object({
  label: shortText.optional(),
  url: assetUrl.optional(),
  image_url: assetUrl.optional(),
  description: longText.optional(),
  price: shortText.optional(),
  marketplace: shortText.optional(),
}).passthrough()

const backgroundConfig = z.object({
  type: shortText.optional(),          // 'image' | 'video' | 'color' | 'gradient'
  url: assetUrl.optional(),
  value: colorValue.optional(),
  overlay_opacity: ratio.optional(),
}).passthrough()

const transitionOverride = z.object({
  in: shortText.optional(),
  out: shortText.optional(),
}).passthrough()

/**
 * Aset dekorasi punya ~20 field opsional yang masih sering berubah bentuk di
 * Template Lab (keyframe, idle, exit). Divalidasi longgar sebagai objek —
 * yang penting ia OBJEK di dalam ARRAY, karena DecorationAssetLayer
 * melakukan .map() atasnya dan runtuh kalau bentuknya lain.
 */
const decorationAsset = z.record(z.unknown())

export const newInvitationDataSchema = z.object({
  // ── Identitas mempelai ──────────────────────────────────────────────
  bride_name: shortText.optional(),
  groom_name: shortText.optional(),
  groom_nickname: shortText.optional(),
  bride_nickname: shortText.optional(),
  bride_parents: shortText.optional(),
  groom_parents: shortText.optional(),
  groom_father: shortText.optional(),
  groom_mother: shortText.optional(),
  bride_father: shortText.optional(),
  bride_mother: shortText.optional(),
  tagline: longText.optional(),
  groom_photo_url: assetUrl.optional(),
  bride_photo_url: assetUrl.optional(),
  groom_bio: longText.optional(),
  bride_bio: longText.optional(),
  couple_photo_url: assetUrl.optional(),

  // ── Warna ───────────────────────────────────────────────────────────
  primary_color: colorValue.optional(),
  accent_color: colorValue.optional(),
  text_color: colorValue.optional(),
  background_color: colorValue.optional(),

  // ── Sampul (opening) ────────────────────────────────────────────────
  opening_type: shortText.optional(),
  opening_greeting: longText.optional(),
  opening_subtitle: longText.optional(),
  opening_groom_name: shortText.optional(),
  opening_bride_name: shortText.optional(),
  opening_name_gap: z.number().optional(),

  // ── Kisah ───────────────────────────────────────────────────────────
  story_title: shortText.optional(),
  story_text: longText.optional(),
  story_timeline: z.array(timelineItem).max(50).optional(),
  story_chapters: z.array(storyChapter).max(50).optional(),

  // ── Hero & acara ────────────────────────────────────────────────────
  hero_video_url: assetUrl.optional(),
  akad: eventDetail.optional(),
  resepsi: eventDetail.optional(),
  gallery_photos: z.array(assetUrl).max(300).optional(),

  // ── Musik ───────────────────────────────────────────────────────────
  music_url: assetUrl.optional(),
  music_title: shortText.optional(),

  // ── Hadiah & penutup ────────────────────────────────────────────────
  gift_accounts: z.array(giftAccount).max(20).optional(),
  livestream_url: assetUrl.optional(),
  closing_text: longText.optional(),
  thank_you_message: longText.optional(),

  // ── Kutipan / doa ───────────────────────────────────────────────────
  quote_arabic: longText.optional(),
  quote_translation: longText.optional(),
  quote_source: shortText.optional(),

  // ── Video embed ─────────────────────────────────────────────────────
  video_embed_url: assetUrl.optional(),
  video_caption: longText.optional(),

  // ── Gift registry, IG story, QR ─────────────────────────────────────
  gift_registry: z.array(giftRegistryLink).max(50).optional(),
  ig_story_image_url: assetUrl.optional(),
  qr_target_url: assetUrl.optional(),
  qr_label: shortText.optional(),

  // ── Override tingkat lanjut ─────────────────────────────────────────
  loading_config: z.record(z.unknown()).optional(),
  opening_decoration_overrides: z.array(decorationAsset).max(100).optional(),
  section_decoration_overrides: z.record(z.array(decorationAsset).max(100)).optional(),
  section_background_overrides: z.record(backgroundConfig).optional(),
  section_transition_overrides: z.record(transitionOverride).optional(),
}).passthrough()

export type ValidatedInvitationData = z.infer<typeof newInvitationDataSchema>
```

## 3.3 `app/api/invitations/[id]/route.ts`

Tambahkan import (setelah baris 7):

```typescript
import { newInvitationDataSchema } from '@/lib/schemas/invitation-data'
```

Sisipkan validasi **tepat setelah** blok allowlist (setelah baris 60), yaitu **sebelum** `body.data?.music?.url` dan sebelum penegakan tier dekorasi — keduanya membaca `body.data` dan harus bekerja di atas data yang sudah tervalidasi:

```typescript
    // VALIDASI JSONB — body.data dulu diteruskan mentah ke invitations.update().
    //
    // Allowlist di atas hanya menjaga FIELD MANA yang boleh ditulis, bukan
    // ISINYA. Payload seperti { data: { gallery_photos: "bukan-array" } } lolos
    // ke kolom JSONB, lalu halaman undangan publik runtuh saat GallerySection
    // memanggil .map() — kegagalan render yang hanya bisa dipulihkan lewat
    // perbaikan database manual.
    //
    // Skemanya sengaja permisif (semua field opsional + passthrough): yang
    // dijaga adalah tipe dan batas ukuran, bukan kelengkapan. Lihat komentar
    // panjang di lib/schemas/invitation-data.ts sebelum memperketatnya.
    if (body.data !== undefined) {
      if (typeof body.data !== 'object' || body.data === null || Array.isArray(body.data)) {
        return NextResponse.json({ error: 'Format data undangannya tidak sesuai.' }, { status: 400 })
      }
      const parsedData = newInvitationDataSchema.safeParse(body.data)
      if (!parsedData.success) {
        console.warn('Invitation PATCH: data ditolak', params.id, parsedData.error.flatten())
        return NextResponse.json(
          { error: 'Ada isian undangan yang formatnya tidak sesuai. Coba periksa lagi ya.', details: parsedData.error.flatten() },
          { status: 400 }
        )
      }
      body.data = parsedData.data
    }
```

**Yang perlu diperhatikan saat rilis:** karena autosave berjalan diam-diam, tambahkan pemantauan pada `console.warn` di atas selama beberapa hari pertama. Kalau ada field yang ternyata sering ditolak, itu tanda skemanya kurang longgar — bukan tanda penggunanya salah.

---

# 4. KONSISTENSI BISNIS — Satu Akun, Banyak Undangan

## 4.1 Kondisi saat ini

```typescript
// app/api/invitations/route.ts:50
if (await invitations.findByUserId(session.userId)) {
  return NextResponse.json({ error: 'Kalian sudah punya undangan. ...' }, { status: 409 })
}
```

`findByUserId` memakai `findFirst(orderBy: createdAt desc)` — mengembalikan **satu** objek. Efeknya untuk B2C:

- Pelanggan yang menikahkan anak kedua, atau membeli untuk saudaranya, **terblokir** dan harus membuat akun baru dengan email berbeda.
- Lebih buruk: kalau pelanggan lama membeli lagi lewat Mayar, `provisionPaidOrder` **tetap membuat** undangan kedua (ia mencari lewat `findBySlug`, bukan `findByUserId`). Undangan kedua itu berhasil dibuat, tapi **tidak pernah terlihat di dashboard** karena `findByUserId` hanya mengembalikan yang terbaru. Pesanan berbayar yang tak terlihat — ini yang paling mendesak diperbaiki.

## 4.2 `lib/db/invitations.ts`

Ganti `findByUserId` (baris 33–36):

```typescript
// SEBELUM
  async findByUserId(userId: string): Promise<Invitation | null> {
    const i = await prisma.invitation.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } })
    return i ? mapInvitation(i) : null
  },
```

```typescript
// SESUDAH
  // Satu akun boleh punya banyak undangan (model B2C). findByUserId yang lama
  // memakai findFirst dan mengembalikan SATU objek — undangan kedua milik
  // pelanggan yang sama (dibuat lewat provisionPaidOrder, yang mencari via
  // findBySlug) tidak pernah muncul di dashboard meski sudah dibayar.
  //
  // Namanya diganti, bukan ditambah, supaya kompilator menunjuk seluruh
  // pemanggil lama alih-alih membiarkan keduanya hidup berdampingan.
  //
  // take:100 sebagai pagar pengaman, sejalan dengan findAll().
  async findManyByUserId(userId: string): Promise<Invitation[]> {
    const all = await prisma.invitation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
    return all.map(mapInvitation)
  },
  async countByUserId(userId: string): Promise<number> {
    return prisma.invitation.count({ where: { userId } })
  },
```

> `writerProfiles.findByUserId`, `affiliates.findByUserId`, `paymentProofs.findByUserId`, dan `userFeedback.findByUserId` adalah modul lain dan **tidak** ikut berubah.

## 4.3 `app/api/invitations/route.ts`

```typescript
// Tambahkan konstanta di dekat `const schema = …` (setelah baris 19)

/**
 * Batas jumlah undangan per akun.
 *
 * B2C: satu akun boleh punya banyak undangan (anak kedua, pesanan untuk
 * saudara, dst). Batas ini bukan aturan bisnis melainkan pagar penyalahgunaan —
 * tanpa batas, satu akun bisa memborong subdomain lewat trial gratis 7 hari
 * secara massal. Jalur berbayar (provisionPaidOrder) sengaja TIDAK tunduk pada
 * batas ini: pesanan yang sudah dibayar tidak boleh gagal disediakan.
 */
const MAX_INVITATIONS_PER_USER = 10
```

```typescript
// GET (baris 22–28)

// SEBELUM
export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Sesi kamu sudah berakhir. Silakan masuk lagi ya.' }, { status: 401 })

  const inv = await invitations.findByUserId(session.userId)
  return NextResponse.json({ invitation: inv })
}
```

```typescript
// SESUDAH
export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Sesi kamu sudah berakhir. Silakan masuk lagi ya.' }, { status: 401 })

  const list = await invitations.findManyByUserId(session.userId)
  // `invitation` (tunggal) dipertahankan sebagai kompatibilitas mundur —
  // isinya undangan terbaru. Boleh dihapus setelah tidak ada lagi pemanggil
  // yang membacanya (per hari ini: tidak ada di dalam repo).
  return NextResponse.json({ invitations: list, invitation: list[0] ?? null })
}
```

```typescript
// POST — ganti blok 409 (baris 50–52)

// SEBELUM
  if (await invitations.findByUserId(session.userId)) {
    return NextResponse.json({ error: 'Kalian sudah punya undangan. Buka dari halaman utama untuk mengeditnya.' }, { status: 409 })
  }
```

```typescript
// SESUDAH
  const ownedCount = await invitations.countByUserId(session.userId)
  if (ownedCount >= MAX_INVITATIONS_PER_USER) {
    return NextResponse.json(
      { error: `Satu akun maksimal ${MAX_INVITATIONS_PER_USER} undangan. Hapus undangan lama dulu, atau hubungi kami kalau butuh lebih.` },
      { status: 409 }
    )
  }
```

```typescript
// POST — notifikasi trial (baris 75–79)

// SEBELUM
  await subscriptions.createTrial(inv.id, session.userId)
  runAfterResponse(
    notifyUser('trial_started', session.email, { slug, name: session.email }),
    'notifyUser(trial_started)'
  )
```

```typescript
// SESUDAH
  await subscriptions.createTrial(inv.id, session.userId)
  // Email "trial dimulai" hanya untuk undangan PERTAMA. Sekarang satu akun bisa
  // membuat sampai MAX_INVITATIONS_PER_USER undangan; mengirim email onboarding
  // yang sama sepuluh kali ke alamat yang sama adalah jalan cepat menuju folder
  // spam — dan reputasi domain pengirim berlaku untuk seluruh pelanggan.
  if (ownedCount === 0) {
    runAfterResponse(
      notifyUser('trial_started', session.email, { slug, name: session.email }),
      'notifyUser(trial_started)'
    )
  }
```

Respons POST tetap `{ invitation: inv }` status 201, jadi `OnboardingWizard` (baris 177) tidak perlu diubah.

## 4.4 Tinjauan jalur provision Mayar — **tidak ada perubahan yang diwajibkan**

`lib/provision-order.ts` sudah aman untuk multi-undangan, dan alasannya penting untuk dicatat:

```typescript
// lib/provision-order.ts:85
let invitation = await invitations.findBySlug(order.subdomain)

if (!invitation) {
  invitation = await invitations.create({ user_id: user.id, slug: order.subdomain, ... })
} else if (invitation.user_id !== user.id) {
  return { status: 'invalid-tier', tier: `slug "${order.subdomain}" sudah dipakai akun lain` }
} else {
  await invitations.update(invitation.id, { is_paid: true, expires_at: expiresAt.toISOString() })
}
```

Ia mencari lewat **slug**, bukan user — jadi pesanan kedua dengan subdomain berbeda memang membuat undangan kedua untuk akun yang sama. Yang selama ini rusak bukan pembuatannya, melainkan **penampilannya**: `findByUserId` menyembunyikan undangan itu dari dashboard. §4.2 + §4.5 yang memperbaikinya.

Tiga hal yang **sengaja** dibiarkan:

1. `MAX_INVITATIONS_PER_USER` tidak diterapkan di sini. Pesanan berbayar tidak boleh ditolak karena pagar anti-penyalahgunaan trial.
2. `subscriptions.findByInvitation(invitation.id)` sudah per-undangan, bukan per-user. Aman.
3. `app/api/user/subscription/route.ts` memakai `subscriptions.findByUser()` yang mengembalikan daftar. Aman.

## 4.5 Penyesuaian Dashboard (jawaban atas pertanyaan Anda)

**Ya, ada tiga penyesuaian.** Kabar baiknya: seluruh panel anak (`TemplateModule`, `GuestManager`, `RSVPList`, `AnalyticsPanel`, `SettingsPanel`, `DashboardOverview`) menerima **satu** `invitation` dan **tidak perlu disentuh** — selama `DashboardClient` tetap menyediakan satu "undangan aktif".

### 4.5.1 `app/(app)/dashboard/page.tsx`

```tsx
// SEBELUM (baris 19)
  const invitation = await invitations.findByUserId(session.userId) as Invitation | null
```

```tsx
// SESUDAH
  const invitationList = await invitations.findManyByUserId(session.userId) as Invitation[]
```

```tsx
// Dan pada JSX (baris 34–41)
    <DashboardClient
      user={{ id: session.userId, email: session.email }}
      invitations={invitationList}
      selectedTemplateId={selectedTemplateId}
      allTemplates={allTemplates}
      isAdmin={isAdmin(session)}
      paymentSuccess={paymentSuccess}
    />
```

### 4.5.2 `components/dashboard/DashboardClient.tsx` — props & state

```tsx
// Props (baris 42–49)

// SEBELUM
interface Props {
  user: { id: string; email: string }
  invitation: Invitation | null
  ...
}
```

```tsx
// SESUDAH
interface Props {
  user: { id: string; email: string }
  /** Semua undangan milik user, terbaru dulu. Boleh kosong (user belum punya). */
  invitations: Invitation[]
  selectedTemplateId: string
  allTemplates: TemplateInfo[]
  isAdmin?: boolean
  paymentSuccess?: boolean
}
```

```tsx
// Signature + state (baris 78–93)

// SEBELUM
export default function DashboardClient({ user, invitation, selectedTemplateId, allTemplates, isAdmin, paymentSuccess }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('overview')
  const [inv, setInv] = useState<Invitation | null>(invitation)
  ...
```

```tsx
// SESUDAH
export default function DashboardClient({ user, invitations, selectedTemplateId, allTemplates, isAdmin, paymentSuccess }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('overview')

  // Daftar undangan + penunjuk yang sedang dibuka.
  //
  // `inv` tetap SATU objek supaya seluruh panel anak (TemplateModule,
  // GuestManager, RSVPList, AnalyticsPanel, SettingsPanel) tidak perlu diubah
  // sama sekali. Yang berubah hanya dari mana objek itu berasal.
  const [list, setList] = useState<Invitation[]>(invitations)
  const [activeId, setActiveId] = useState<string | null>(invitations[0]?.id ?? null)
  // `creating` = pengguna menekan "Buat undangan baru" walau sudah punya satu.
  const [creating, setCreating] = useState(false)

  // Fallback ke list[0] disengaja: setelah sebuah undangan dihapus, dashboard
  // langsung berpindah ke undangan tersisa alih-alih menampilkan layar kosong.
  const inv = list.find(i => i.id === activeId) ?? list[0] ?? null

  /**
   * Pengganti setInv lama — sengaja bernama sama supaya ketiga pemanggil yang
   * ada (togglePublish, TemplateModule.onInvitationUpdate, SettingsPanel.onDeleted)
   * tidak perlu diubah. Bersifat UPSERT, karena OnboardingWizard memakai
   * callback yang sama untuk undangan yang BARU dibuat.
   */
  function setInv(updated: Invitation | null) {
    if (!updated) {
      const removedId = inv?.id
      setList(prev => prev.filter(i => i.id !== removedId))
      setActiveId(null)
      return
    }
    setList(prev => prev.some(i => i.id === updated.id)
      ? prev.map(i => (i.id === updated.id ? updated : i))
      : [updated, ...prev])
    setActiveId(updated.id)
    setCreating(false)
  }

  const [sidebarOpen, setSidebarOpen] = useState(false)
  // ...sisa state tetap
```

Sisa berkas — `isPaid`, `isPublished`, `expired`, `names`, `togglePublish`, `openFullPreview`, `statusConfig`, dan seluruh JSON-nya — **tidak berubah**, karena semuanya bekerja di atas `inv`.

### 4.5.3 Gerbang wizard + pemilih undangan

```tsx
// Baris 319–325

// SEBELUM
              {!inv && (
                <OnboardingWizard
                  invitation={null}
                  onInvitationCreated={setInv}
                  allTemplates={allTemplates}
                />
              )}

              {inv && (
                <>
```

```tsx
// SESUDAH
              {(!inv || creating) && (
                <OnboardingWizard
                  invitation={null}
                  onInvitationCreated={setInv}
                  allTemplates={allTemplates}
                />
              )}

              {inv && !creating && (
                <>
```

Dan pemilih undangan di sidebar — sisipkan tepat di bawah kartu slug (setelah blok `{inv?.slug && (…)}`, sekitar baris 209–220):

```tsx
        {/* Pemilih undangan — hanya muncul kalau akun ini punya lebih dari satu */}
        {list.length > 1 && (
          <div className="mx-3 mb-3">
            <label className="block text-[10px] uppercase tracking-wider text-white/30 mb-1.5 px-1">
              Undangan Aktif
            </label>
            <select
              value={inv?.id ?? ''}
              onChange={e => { setActiveId(e.target.value); setCreating(false) }}
              className="w-full bg-white/[0.06] border border-white/[0.08] rounded-lg px-3 py-2 text-[12px] text-white/80 outline-none focus:border-white/20 transition-colors"
            >
              {list.map(i => (
                <option key={i.id} value={i.id} className="bg-[#1a1a1a]">
                  {i.slug}
                </option>
              ))}
            </select>
          </div>
        )}

        {list.length > 0 && !creating && (
          <button
            onClick={() => { setCreating(true); setTab('overview'); setSidebarOpen(false) }}
            className="mx-3 mb-3 flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-white/15 px-3 py-2 text-[11px] text-white/50 hover:text-white/80 hover:border-white/30 transition-colors"
          >
            + Buat undangan baru
          </button>
        )}
```

### 4.5.4 Yang **tidak** perlu diubah

`OnboardingWizard` (props `invitation`/`onInvitationCreated` tetap sama), `TemplateModule`, `GuestManager`, `RSVPList`, `AnalyticsPanel`, `SubscriptionInfo`, `SettingsPanel`, `DashboardOverview`, `ReferralPanel`, `SupportTickets`.

---

# 5. Urutan Penerapan yang Disarankan

Empat commit terpisah — bagian 1 & 2 bisa dirilis ke produksi hari ini tanpa menunggu sisanya.

| Urutan | Cakupan | Bisa rilis sendiri? |
|---|---|---|
| 1 | §1.1 + §1.2 (dua skema Zod) | **Ya** — dua baris, langsung memulihkan template lama |
| 2 | §1.3 (plumbing `mode`) | Ya — perlu `tsc --noEmit` bersih dulu |
| 3 | §2 (tautan WA) | Ya — terisolasi di satu berkas |
| 4 | §3 (validasi JSONB) | Ya — pantau `console.warn` beberapa hari |
| 5 | §4 (multi-undangan) | Ya — sentuh Dashboard, uji paling lama |

Sebelum tiap commit:

```bash
npx tsc --noEmit
npm run build
```

Catatan Windows dari pengalaman sebelumnya: kalau `prisma generate` gagal dengan `EPERM`, hentikan dulu proses `node`/dev server yang masih memegang `query_engine-windows.dll.node`.

---

# 6. Temuan Sampingan (belum dikerjakan — keputusan Anda)

Ditemukan saat menelusuri kode untuk empat item di atas. Semuanya **di luar cakupan** laporan ini dan sengaja tidak saya ubah.

1. **`GiftSection` punya pola preview yang sama rapuhnya.** Ia menerima `invitationId = 'preview'` sebagai default lalu tetap POST ke `/api/gift-proof`. Di Template Lab ia akan mengirim `invitationId: "lab-preview"` dan menerima 404. Tidak merusak data, tapi memberi pesan error membingungkan ke admin. Solusinya sama: teruskan prop `mode` dari `SectionRenderer`.

2. **`OnboardingWizard` mengirim `package_tier`, tapi diam-diam dibuang.** `app/api/invitations/route.ts:15–19` tidak mendaftarkan `package_tier` di skema, jadi Zod membuangnya dan `invitations.create()` menyimpan `null`. Kalau pilihan paket di wizard memang seharusnya berpengaruh, ini bug; kalau tier hanya boleh berasal dari pesanan berbayar, ini benar — tapi wizard-nya jadi menyesatkan pengguna.

3. **Trial 7 hari kini bisa digandakan hingga 10×.** `MAX_INVITATIONS_PER_USER` membatasi jumlah, bukan nilai ekonomisnya. Kalau trial terbukti disalahgunakan, batasi trial ke undangan pertama saja dan wajibkan pembayaran untuk sisanya.

4. **Dokumentasi perlu menyusul.** `docs/ARCHITECTURE.md:167` masih mencantumkan `findByUserId` pada daftar metode `invitations`, dan `docs/RANGKUMAN_TEKNIS_SISTEM.md:1057–1066` masih menyebut aturan satu-undangan-per-akun sebagai perilaku saat ini.
