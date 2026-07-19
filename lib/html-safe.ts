/**
 * Helper escaping untuk HTML markdown artikel yang dirender lewat
 * dangerouslySetInnerHTML.
 *
 * Kenapa ada:
 * `esc()` yang lama hanya mengganti & < >, TIDAK termasuk tanda kutip ganda.
 * Padahal URL disisipkan langsung ke dalam atribut:
 *
 *     <img src="$2" alt="$1" />
 *     <a href="${href}">
 *
 * Sehingga `![x](" onerror="fetch(...))` keluar dari atribut src dan menanam
 * handler onerror. Artikel ditulis oleh content_writer lalu DIBUKA ADMIN saat
 * review — jadi ini jalur naik hak akses dari writer ke admin, sekaligus XSS
 * tersimpan untuk semua pengunjung begitu artikel terbit.
 *
 * Tidak ada allowlist protokol juga, jadi `[klik](javascript:...)` ikut lolos.
 */

/** Untuk teks di antara tag. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/** Untuk nilai yang masuk ke dalam atribut — kutip WAJIB ikut di-escape. */
export function escapeAttribute(value: string): string {
  return escapeHtml(value)
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const SAFE_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:'])

/** Buang spasi dan karakter kontrol (<= U+0020) tanpa perlu regex escape. */
function stripBlankAndControl(value: string): string {
  return Array.from(value)
    .filter(char => char.charCodeAt(0) > 0x20)
    .join('')
}

/**
 * Kembalikan URL yang aman dipakai di href/src, atau '#' kalau mencurigakan.
 *
 * Path relatif dan anchor dibiarkan. Selain itu protokol harus ada di allowlist:
 * `javascript:`, `data:`, dan `vbscript:` ditolak.
 */
export function safeUrl(raw: string): string {
  const url = raw.trim()
  if (!url) return '#'

  if (url.startsWith('/') || url.startsWith('#') || url.startsWith('./') || url.startsWith('../')) {
    return url
  }

  // Normalkan dulu sebelum mencocokkan skema: "java\tscript:alert(1)" tetap
  // dieksekusi browser, jadi tab/newline/spasi harus dibuang saat memeriksa.
  const normalized = stripBlankAndControl(url).toLowerCase()
  if (
    normalized.startsWith('javascript:') ||
    normalized.startsWith('data:') ||
    normalized.startsWith('vbscript:')
  ) {
    return '#'
  }

  try {
    const parsed = new URL(url)
    return SAFE_PROTOCOLS.has(parsed.protocol) ? url : '#'
  } catch {
    // Tanpa skema (mis. "example.com/artikel") — perlakukan sebagai relatif.
    return url
  }
}

/** safeUrl + escaping atribut, untuk langsung ditempel ke href="..."/src="...". */
export function safeUrlAttribute(raw: string): string {
  return escapeAttribute(safeUrl(raw))
}
