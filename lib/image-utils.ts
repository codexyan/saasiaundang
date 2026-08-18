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
 * Pakai ini hanya setelah pindah ke paket berbayar.
 * Lihat docs/REPORT_OPTIMASI.md §0.4.
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
