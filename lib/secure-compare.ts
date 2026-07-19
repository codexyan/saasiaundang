/**
 * Perbandingan rahasia yang aman.
 *
 * Dua masalah yang diselesaikan:
 *
 * 1. `a === b` pada string berhenti di byte pertama yang berbeda, sehingga
 *    lama eksekusinya membocorkan berapa banyak karakter awal yang sudah benar.
 *    Dengan membandingkan digest SHA-256 (panjangnya selalu 32 byte) lewat loop
 *    penuh, waktunya tidak lagi bergantung pada isi.
 *
 * 2. Rahasia yang kosong/undefined. Pola lama `token === process.env.X` ikut
 *    lolos ketika keduanya kebetulan kosong — mis. MAYAR_WEBHOOK_TOKEN="" di
 *    .env.example membuat `'' === ''` bernilai true, jadi webhook palsu diterima.
 *    Di sini nilai kosong SELALU ditolak.
 */
export async function secureEquals(
  provided: string | null | undefined,
  expected: string | null | undefined
): Promise<boolean> {
  if (!provided || !expected) return false

  const encoder = new TextEncoder()
  const [a, b] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(provided)),
    crypto.subtle.digest('SHA-256', encoder.encode(expected)),
  ])

  const viewA = new Uint8Array(a)
  const viewB = new Uint8Array(b)

  let diff = 0
  for (let i = 0; i < viewA.length; i++) diff |= viewA[i] ^ viewB[i]
  return diff === 0
}

/**
 * Verifikasi header `Authorization: Bearer <secret>`.
 * Mengembalikan false kalau header tidak ada, formatnya salah, atau
 * secret yang diharapkan belum dikonfigurasi.
 */
export async function verifyBearer(
  authorizationHeader: string | null,
  expectedSecret: string | null | undefined
): Promise<boolean> {
  if (!authorizationHeader?.startsWith('Bearer ')) return false
  return secureEquals(authorizationHeader.slice('Bearer '.length), expectedSecret)
}
