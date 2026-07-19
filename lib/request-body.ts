/**
 * Baca body JSON tanpa bisa melempar.
 *
 * `await req.json()` melempar kalau body-nya bukan JSON valid — kosong,
 * terpotong, atau Content-Type salah. Di route handler yang tidak punya
 * try/catch (mayoritas di app ini, termasuk /api/auth/login), lemparan itu
 * menjadi unhandled rejection dan Next membalas HALAMAN ERROR 500 HTML.
 * Klien yang mengharapkan JSON lalu gagal saat mem-parsing respons error-nya,
 * jadi pengguna melihat "terjadi kesalahan" alih-alih pesan yang jelas.
 *
 * Sengaja mengembalikan objek kosong, BUKAN melempar atau mengembalikan null:
 * dengan begitu validasi yang sudah ada di tiap route (zod safeParse atau
 * pengecekan field manual) berjalan seperti biasa dan menghasilkan 400 yang
 * benar — tanpa perlu menambah percabangan di 57 lokasi.
 *
 * Array dipertahankan apa adanya karena sebagian endpoint menerima array.
 */
// Tipe kembalian sengaja `any`, persis seperti `req.json()` bawaan, supaya
// menjadi pengganti langsung tanpa mengubah tipe di 57 lokasi pemanggilan.
export async function readJsonBody(req: Request): Promise<any> {
  const parsed = await readJsonBodyOrNull(req)
  return parsed ?? {}
}

/**
 * Varian KETAT: mengembalikan null kalau body-nya tidak bisa dibaca sebagai
 * objek JSON.
 *
 * WAJIB dipakai di route yang menulis body sebagai SATU RECORD UTUH atau
 * membuat record baru dari body tanpa validasi field. Di tempat seperti itu,
 * mengubah body rusak menjadi `{}` berarti "simpan objek kosong" — bukan
 * "tolak permintaan".
 *
 * Ini bukan kekhawatiran teoretis: `await req.json()` yang lama MELEMPAR pada
 * body rusak, dan lemparan itulah yang selama ini menjadi validasinya. Mengganti
 * seluruh call site secara mekanis dengan readJsonBody() mengubah perilaku
 * gagal-tertutup menjadi gagal-terbuka, dan di /api/admin/settings hasilnya
 * menimpa SELURUH baris pengaturan dengan {} lalu membalas 200 — seluruh
 * template, kategori, palet, tier harga, kupon, dan rekening bank buatan admin
 * hilang permanen tanpa cadangan.
 */
export async function readJsonBodyOrNull(req: Request): Promise<Record<string, unknown> | null> {
  try {
    const parsed = await req.json()
    if (parsed === null || typeof parsed !== 'object') return null
    return parsed as Record<string, unknown>
  } catch {
    return null
  }
}

/** Objek kosong `{}` juga ditolak — biasanya berarti body hilang, bukan niat. */
export async function readNonEmptyJsonBody(req: Request): Promise<Record<string, unknown> | null> {
  const parsed = await readJsonBodyOrNull(req)
  if (!parsed || Array.isArray(parsed) || Object.keys(parsed).length === 0) return null
  return parsed
}
