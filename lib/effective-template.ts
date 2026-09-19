import type { TemplateRecord, NewInvitationData, TierFeatures, OpeningType } from './types'

/**
 * Tema yang benar benar dipakai sebuah undangan.
 *
 * Tema adalah cetakan milik kami; undangan adalah milik pembeli. Selama ini
 * keduanya tidak pernah bertemu: layar "Tema Warna" di studio menulis
 * `primary_color`, `accent_color`, `text_color`, dan `background_color` ke
 * data undangan, lalu TIDAK ADA satu pun yang membacanya. Renderer selalu
 * memakai `meta.color_scheme` bawaan tema. Jadi pembeli memilih warna,
 * melihatnya tersimpan, dan undangannya tidak berubah sedikit pun, baik di
 * pratinjau maupun di halaman tamu.
 *
 * Fungsi ini tempat keduanya bertemu, dan sengaja satu satunya. Dipanggil di
 * dua tempat: pratinjau studio dan halaman undangan tamu. Kalau nanti ada
 * pemanggil ketiga, ia ikut ke sini, bukan menyalin logikanya.
 *
 * Batas paket ikut ditegakkan di sini, bukan di renderer, karena
 * `components/renderer/*` dibekukan PRD dan karena tema yang sama dipakai
 * semua paket. Musik contohnya: temanya menyalakan pemutar, tapi paket
 * Starter tidak lagi menjual musik, jadi pemutarnya dimatikan di sini alih
 * alih di dalam mesin render.
 */
/**
 * Jenis seksi render dan kunci fitur paket yang membukanya.
 *
 * Peta ini dulu ada di InvitationStudio, di mana ia hanya menyaring
 * pratinjau. Sekarang tinggal di sini karena penyaringnya juga di sini.
 */
const SEKSI_KE_FITUR: Record<string, keyof TierFeatures> = {
  hero: 'hero', profiles: 'profiles', events: 'events', quote: 'quote',
  countdown: 'countdown', gallery: 'gallery', rsvp: 'rsvp', wishes: 'wishes',
  story: 'story', video: 'video', gift: 'gift', 'gift-registry': 'gift_registry',
  livestream: 'livestream', 'ig-story': 'ig_story', qrcode: 'qrcode', closing: 'closing',
}

export function temaEfektif(
  template: TemplateRecord,
  data: NewInvitationData,
  fitur?: TierFeatures | null,
): TemplateRecord {
  const meta = template.config.meta

  const warna = {
    ...meta.color_scheme,
    ...(data.primary_color ? { primary: data.primary_color } : {}),
    ...(data.accent_color ? { accent: data.accent_color } : {}),
    ...(data.text_color ? { text: data.text_color } : {}),
    ...(data.background_color ? { background: data.background_color } : {}),
  }

  const font = {
    ...meta.font,
    ...(data.font_heading ? { heading: data.font_heading } : {}),
    ...(data.font_body ? { body: data.font_body } : {}),
  }

  /**
   * Gaya pembuka dan dua teks sampulnya.
   *
   * Penggabungan ini dulu hidup di dalam InvitationStudio, hanya untuk
   * pratinjau. Halaman tamu memanggil fungsi ini dan tidak pernah tahu
   * tentangnya, jadi pembeli memilih "Amplop Surat", melihatnya di
   * pratinjau, menyimpan, lalu undangannya tetap terbuka dengan gaya
   * bawaan tema. Persis kegagalan yang sama dengan warna, cuma di layar
   * sebelah, dan komentar di studio justru berbunyi "supaya pratinjau
   * tidak pernah berbohong".
   *
   * `opening_name_gap` sengaja TIDAK ikut digabungkan. Tidak ada satu pun
   * komponen pembuka yang membaca `couple_name_gap`, jadi menggabungkannya
   * hanya akan memindahkan kontrol mati, bukan menghidupkannya.
   */
  const pembuka = {
    ...template.config.opening,
    ...(data.opening_type ? { type: data.opening_type as OpeningType } : {}),
    ...(data.opening_greeting ? { subtitle: data.opening_greeting } : {}),
    ...(data.opening_subtitle ? { invitation_text: data.opening_subtitle } : {}),
  }

  /**
   * Layar loading, kegagalan yang sama persis dengan pembuka.
   *
   * `loading_config` juga digabung hanya di dalam studio, hanya untuk
   * pratinjau. Pembeli mengatur layar loading, melihatnya berubah, menyimpan,
   * lalu tamu tetap melihat layar loading bawaan tema.
   */
  const memuat = {
    ...template.config.loading,
    ...(data.loading_config ?? {}),
  }

  // `fitur` tidak diketahui (mis. pratinjau demo tanpa paket) berarti jangan
  // mematikan apa pun. Yang dimatikan hanya kalau paketnya jelas melarang.
  const musikDilarang = fitur ? fitur.music === false : false

  /**
   * Latar seksi ikut berganti kalau warnanya memang warna tema.
   *
   * Tanpa ini, pembeli yang mengganti warna primer melihat sampulnya berubah
   * tapi seluruh badan undangan tetap warna lama, karena latar tiap seksi
   * disimpan sebagai nilai hex sendiri di konfigurasi tema, bukan diturunkan
   * dari meta.color_scheme. Hasilnya sampul biru dengan isi hijau.
   *
   * Pemetaannya sempit dan disengaja: hanya seksi yang latarnya PERSIS salah
   * satu dari empat warna tema yang ikut berganti. Seksi yang sengaja diberi
   * warna lepas oleh perancang tema tetap seperti aslinya, dan latar yang
   * diubah sendiri oleh pembeli lewat section_background_overrides tidak
   * disentuh sama sekali karena digabungkan belakangan di renderer.
   */
  const peta = new Map<string, string>()
  const pasangkan = (dari?: string, ke?: string) => {
    if (dari && ke && dari.toLowerCase() !== ke.toLowerCase()) peta.set(dari.toLowerCase(), ke)
  }
  pasangkan(meta.color_scheme.primary, warna.primary)
  pasangkan(meta.color_scheme.background, warna.background)
  pasangkan(meta.color_scheme.accent, warna.accent)

  const diwarnai = peta.size === 0
    ? template.config.sections
    : template.config.sections.map(s => {
      if (s.background?.type !== 'color') return s
      const baru = peta.get((s.background.value ?? '').toLowerCase())
      return baru ? { ...s, background: { ...s.background, value: baru } } : s
    })

  /**
   * Seksi yang paketnya tidak beli dibuang, di sini, bukan hanya di studio.
   *
   * Penyaringan ini dulu hidup di dalam InvitationStudio dan hanya menyaring
   * pratinjau. Halaman tamu memanggil fungsi ini dan merender seluruh seksi
   * yang dinyalakan tema. Untuk pembeli Starter itu berarti undangannya
   * memuat seksi Kisah Kami lengkap dengan ornamen dan judul "Perjalanan
   * Cinta", kosong isinya, karena studio memang tidak pernah mengizinkannya
   * mengisi. Enam seksi lain ikut bocor tapi punya penjaga sendiri dan
   * mengembalikan null saat datanya kosong, jadi yang benar benar terlihat
   * satu.
   *
   * `fitur` tidak diketahui berarti jangan menyaring apa pun, aturan yang
   * sama dengan musik di atas.
   */
  const sections = fitur
    ? diwarnai.filter(s => {
      const kunci = SEKSI_KE_FITUR[s.type]
      return kunci ? !!fitur[kunci] : true
    })
    : diwarnai

  return {
    ...template,
    config: {
      ...template.config,
      meta: { ...meta, color_scheme: warna, font },
      opening: pembuka,
      loading: memuat,
      sections,
      // `config.music` boleh tidak ada sama sekali di tema lama, jadi
      // pematiannya hanya ditulis kalau objeknya memang ada.
      ...(musikDilarang && template.config.music
        ? { music: { ...template.config.music, enabled: false } }
        : {}),
    },
  }
}
