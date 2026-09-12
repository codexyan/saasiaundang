/**
 * Aturan alamat undangan (<alamat>.iaundang.online). MURNI, tanpa impor apa
 * pun, jadi aman dipakai middleware (Edge), route handler, dan komponen client.
 *
 * Dulu aturannya tersebar dan tidak sama. Middleware memperlakukan `www` dan
 * label domain utama (`iaundang`) sebagai situs utama, sementara /api/orders
 * dan /api/orders/check-subdomain hanya mengecilkan huruf, membuang karakter
 * selain a-z0-9 dan tanda hubung, lalu mensyaratkan minimal 3 karakter.
 * Akibatnya `www` dan `iaundang` bisa dibeli padahal tidak pernah diarahkan ke
 * undangan, dan alamat bertanda hubung di awal atau akhir (termasuk `---`)
 * ikut tersimpan walau bukan label DNS yang sah.
 */

/** Domain utama. Nilai dan bawaannya sama dengan yang dulu ditulis di middleware.ts. */
export const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || 'iaundang.online'

const MAIN_LABEL = APP_DOMAIN.split('.')[0]
const MIN_LENGTH = 3
/** Batas panjang satu label DNS. */
const MAX_LENGTH = 63

/**
 * Label yang diperlakukan middleware sebagai situs utama, bukan undangan.
 *
 * Middleware dan normalizeSubdomain() memanggil fungsi yang sama, supaya alamat
 * yang boleh dibeli tidak bisa berbeda dari alamat yang benar-benar diarahkan
 * ke undangan.
 */
export function isMainSiteLabel(label: string): boolean {
  return label === 'www' || label === MAIN_LABEL
}

export type SubdomainCheck =
  | { ok: true; slug: string }
  | { ok: false; message: string }

/**
 * Normalisasi lalu validasi alamat undangan. Dipakai POST /api/orders dan
 * GET /api/orders/check-subdomain, jadi alamat yang dinyatakan tersedia dan
 * alamat yang benar-benar dipesan selalu sama.
 *
 * Normalisasi: huruf kecil dan buang karakter selain a-z0-9 dan tanda hubung,
 * persis seperti sebelumnya, lalu pangkas tanda hubung di awal dan akhir.
 *
 * Tanda hubung di tepi sengaja DIPANGKAS, bukan ditolak. Saran alamat di
 * OrderForm menyambung nama panggilan dengan tanda hubung dan mengganti
 * karakter lain dengan tanda hubung, jadi nama panggilan yang berakhir dengan
 * spasi atau tanda baca menghasilkan "raka-sinta-". Kalau ditolak, form hanya
 * bisa menampilkan "Subdomain sudah digunakan" untuk alamat yang sebenarnya
 * masih kosong, dan pembeli dari pratinjau demo tertahan di langkah itu.
 */
export function normalizeSubdomain(input: string): SubdomainCheck {
  const slug = input
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/^-+|-+$/g, '')

  if (slug.length < MIN_LENGTH) {
    return { ok: false, message: 'Alamat undangan minimal 3 huruf ya.' }
  }
  if (slug.length > MAX_LENGTH) {
    return { ok: false, message: 'Alamat undangan maksimal 63 karakter ya.' }
  }
  if (isMainSiteLabel(slug)) {
    return { ok: false, message: 'Alamat ini dipakai situs iaundang. Coba nama lain ya.' }
  }
  return { ok: true, slug }
}
