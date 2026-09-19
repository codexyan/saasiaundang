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
