/**
 * Watermark undangan, dan kenapa sekarang dipasang di semua paket.
 *
 * Setiap undangan yang terbit dibungkus bar iaundang di atas dan di bawah, dan
 * setiap undangan dibuka 100 sampai 500 tamu yang semuanya berada di lingkaran
 * sosial pernikahan. Itu saluran distribusi berbiaya nol dengan penargetan yang
 * tidak bisa ditandingi iklan mana pun.
 *
 * Sampai 18 Sep 2026, penghapusannya dijual mulai paket Popular. Artinya
 * pelanggan yang paling banyak membayar, yang undangannya paling bagus dan
 * paling banyak dibagikan, adalah yang paling tidak menyebut nama iaundang,
 * tepat ketika belum ada satu orang pun yang mengenal mereknya.
 *
 * Keputusan D-12: distribusi didahulukan sampai 200 undangan terbit. Sesudah
 * itu, ubah konstanta di bawah menjadi false dan penghapusan watermark kembali
 * menjadi fitur berbayar tanpa perubahan kode lain.
 *
 * Konstanta ini juga yang mematikan janji "Tanpa watermark" di halaman harga
 * dan di langkah Paket, supaya tidak ada yang dijual tapi tidak diberikan.
 */
export const WATERMARK_DI_SEMUA_UNDANGAN = true

/** Jumlah undangan terbit yang menjadi syarat meninjau ulang keputusan di atas. */
export const AMBANG_TINJAU_ULANG = 200

export function bolehHapusWatermark(fiturPaket: boolean | undefined): boolean {
  if (WATERMARK_DI_SEMUA_UNDANGAN) return false
  return Boolean(fiturPaket)
}
