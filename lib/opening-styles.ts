import type { OpeningType } from './types'

/**
 * Ketujuh belas gaya pembuka, satu daftar untuk semua.
 *
 * Sebelumnya daftarnya ada DUA, dan keduanya tidak pernah dibandingkan:
 * `OPENING_META` di panel admin, dan `OPENING_STYLES` di studio pembeli.
 * Akibatnya enam belas dari tujuh belas gaya punya nama yang berbeda di dua
 * layar untuk barang yang sama persis:
 *
 *   lantern-rise    admin "Lampion"       pembeli "Lentera Naik"
 *   frosted-blur    admin "Kabut"         pembeli "Kaca Buram"
 *   veil-lift       admin "Kerudung"      pembeli "Selubung Terangkat"
 *   parallax-split  admin "Parallax"      pembeli "Belah Paralaks"
 *
 * Hanya `flower-bloom` yang kebetulan sama. Artinya admin dan pembeli tidak
 * bisa membicarakan gaya yang sama: "pakai Lampion" dijawab "yang mana, saya
 * lihatnya Lentera Naik".
 *
 * Nama yang dipakai sekarang nama versi pembeli, karena itu yang dibaca orang
 * yang membayar. Admin ikut nama itu, bukan sebaliknya.
 *
 * Kategorinya juga dulu hanya ada di sisi pembeli. Panel admin memajang
 * tujuh belas kartu berderet tanpa kelompok, jadi admin justru mendapat
 * pemilih yang lebih buruk daripada pelanggannya sendiri.
 */

export type KategoriPembuka = 'klasik' | 'romantis' | 'modern' | 'dramatis'

export interface GayaPembuka {
  id: OpeningType
  nama: string
  desc: string
  kategori: KategoriPembuka
}

export const KATEGORI_PEMBUKA: { id: KategoriPembuka; label: string }[] = [
  { id: 'klasik', label: 'Klasik' },
  { id: 'romantis', label: 'Romantis' },
  { id: 'modern', label: 'Modern' },
  { id: 'dramatis', label: 'Dramatis' },
]

export const GAYA_PEMBUKA: GayaPembuka[] = [
  { id: 'fade-reveal', nama: 'Fade Elegan', desc: 'Muncul perlahan seperti fajar', kategori: 'klasik' },
  { id: 'envelope', nama: 'Amplop Surat', desc: 'Seperti membuka surat cinta', kategori: 'klasik' },
  { id: 'scroll-reveal', nama: 'Gulungan Kertas', desc: 'Terbuka seperti gulungan undangan kuno', kategori: 'klasik' },
  { id: 'book-open', nama: 'Buku Terbuka', desc: 'Buku pernikahan membuka halaman', kategori: 'klasik' },

  { id: 'flower-bloom', nama: 'Bunga Mekar', desc: 'Kelopak bunga mekar dari tengah', kategori: 'romantis' },
  { id: 'petal-fall', nama: 'Kelopak Jatuh', desc: 'Hujan kelopak bunga romantis', kategori: 'romantis' },
  { id: 'veil-lift', nama: 'Selubung Terangkat', desc: 'Kerudung halus terangkat perlahan', kategori: 'romantis' },
  { id: 'lantern-rise', nama: 'Lentera Naik', desc: 'Lentera terbang ke langit malam', kategori: 'romantis' },

  { id: 'ring-zoom', nama: 'Zoom Cincin', desc: 'Cincin dari jauh mendekat', kategori: 'modern' },
  { id: 'diamond-split', nama: 'Berlian Terbelah', desc: 'Pecahan berlian berpencar elegan', kategori: 'modern' },
  { id: 'mosaic-reveal', nama: 'Mosaik', desc: 'Pecahan gambar menyatu menjadi satu', kategori: 'modern' },
  { id: 'typewriter', nama: 'Mesin Ketik', desc: 'Nama diketik perlahan satu per satu', kategori: 'modern' },
  { id: 'gold-shimmer', nama: 'Kilauan Emas', desc: 'Partikel emas berterbangan elegan', kategori: 'modern' },
  { id: 'frosted-blur', nama: 'Kaca Buram', desc: 'Kabut foto perlahan menjadi jelas', kategori: 'modern' },

  { id: 'curtain', nama: 'Tirai Sinema', desc: 'Tirai terbuka seperti panggung', kategori: 'dramatis' },
  { id: 'gate-open', nama: 'Gerbang Terbuka', desc: 'Dua pintu membuka ke dalam', kategori: 'dramatis' },
  { id: 'parallax-split', nama: 'Belah Paralaks', desc: 'Layar terbelah atas bawah dramatis', kategori: 'dramatis' },
]

/** Urutan id saja, untuk pemanggil yang cuma butuh daftarnya. */
export const ID_GAYA_PEMBUKA = GAYA_PEMBUKA.map(g => g.id)

export function cariGayaPembuka(id: string): GayaPembuka | undefined {
  return GAYA_PEMBUKA.find(g => g.id === id)
}

/** Dikelompokkan per kategori, kategori kosong ikut dibuang. */
export function gayaPerKategori(): { label: string; gaya: GayaPembuka[] }[] {
  return KATEGORI_PEMBUKA
    .map(k => ({ label: k.label, gaya: GAYA_PEMBUKA.filter(g => g.kategori === k.id) }))
    .filter(k => k.gaya.length > 0)
}
