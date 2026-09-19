import type { DecorationAsset, SectionConfig } from './types'

/**
 * Aset yang sudah diunggah dan dipakai di mana pun dalam satu tema.
 *
 * Dipakai rak "Sudah dipakai di tema ini" di panel Dekorasi. Sebelum ada rak
 * itu, satu berkas yang sudah diunggah hanya hidup di satu tujuan: memakainya
 * lagi di seksi lain berarti mengunggah berkas yang sama sekali lagi, dan
 * menumpuk salinan identik di storage.
 *
 * Tidak ada tabel baru untuk ini. Daftarnya diturunkan dari konfigurasi tema
 * itu sendiri, jadi selalu cocok dengan kenyataan dan ikut hilang begitu aset
 * terakhir yang memakainya dihapus.
 *
 * Ornamen bawaan (`BUILT_IN:`) sengaja tidak ikut: bentuknya sudah punya rak
 * sendiri di pustaka, dan memunculkannya dua kali hanya menambah panjang
 * panel tanpa menambah pilihan.
 *
 * Dipisah ke berkas sendiri supaya bisa diuji tanpa merender editor.
 */
export function asetTerpakaiDiTema(
  openingAssets: DecorationAsset[] | undefined,
  sections: Pick<SectionConfig, 'decoration_assets'>[],
): DecorationAsset[] {
  const semua: DecorationAsset[] = [
    ...(openingAssets ?? []),
    ...sections.flatMap(s => s.decoration_assets ?? []),
  ]

  const perUrl = new Map<string, DecorationAsset>()
  for (const a of semua) {
    if (!a?.url || a.url.startsWith('BUILT_IN:')) continue
    // Yang pertama ditemukan yang dipakai: posisinya jadi contoh saat aset
    // dipasang ulang, dan yang pertama biasanya yang paling sengaja diatur.
    if (!perUrl.has(a.url)) perUrl.set(a.url, a)
  }
  return [...perUrl.values()]
}

/**
 * Berapa dekorasi yang dipasang di seluruh sebuah konfigurasi tema.
 *
 * Dipakai membandingkan draf dengan versi terbit sebelum menekan Terbitkan.
 * Tanpa perbandingan itu, draf yang kebetulan tidak memuat dekorasi akan
 * menghapus dekorasi yang sudah tampil di undangan orang, tanpa satu pun
 * peringatan. Keadaan itu benar benar ada di produksi 19 Sep 2026: config
 * Javanese Gold memuat satu dekorasi di halaman sampul, drafnya nol.
 */
export function hitungDekorasi(
  konfigurasi: {
    opening?: { decoration_assets?: DecorationAsset[] }
    sections?: Pick<SectionConfig, 'decoration_assets'>[]
  } | null | undefined,
): number {
  if (!konfigurasi) return 0
  const diOpening = konfigurasi.opening?.decoration_assets?.length ?? 0
  const diSeksi = (konfigurasi.sections ?? []).reduce(
    (n, s) => n + (s.decoration_assets?.length ?? 0), 0)
  return diOpening + diSeksi
}
