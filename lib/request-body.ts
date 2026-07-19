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
  try {
    const parsed = await req.json()
    if (parsed === null || typeof parsed !== 'object') return {}
    return parsed
  } catch {
    return {}
  }
}
