/**
 * Random kriptografis lewat Web Crypto — tersedia di Workers, Node 18+, dan
 * browser. Menggantikan `randomBytes` dari modul `crypto` Node yang tidak
 * ideal untuk dibundel ke Cloudflare Workers.
 */

/** n byte acak sebagai string heksadesimal (panjang string = n * 2). */
export function randomHex(byteLength: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength))
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * String acak sepanjang `length` dari `alphabet`.
 *
 * Memakai rejection sampling: mengambil `byte % alphabet.length` begitu saja
 * membuat karakter di awal alfabet lebih sering muncul (modulo bias). Untuk
 * password sementara biasnya kecil, tapi menghindarinya praktis gratis.
 */
export function randomString(length: number, alphabet: string): string {
  if (alphabet.length === 0) throw new Error('alphabet tidak boleh kosong')
  // Batas terbesar kelipatan alphabet.length yang masih muat di satu byte.
  const limit = Math.floor(256 / alphabet.length) * alphabet.length

  let out = ''
  while (out.length < length) {
    const bytes = crypto.getRandomValues(new Uint8Array(length - out.length))
    for (const byte of bytes) {
      if (byte < limit) out += alphabet[byte % alphabet.length]
    }
  }
  return out
}
