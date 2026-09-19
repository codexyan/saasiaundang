import type { TemplateRecord, NewInvitationData, TierFeatures } from './types'

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

  // `fitur` tidak diketahui (mis. pratinjau demo tanpa paket) berarti jangan
  // mematikan apa pun. Yang dimatikan hanya kalau paketnya jelas melarang.
  const musikDilarang = fitur ? fitur.music === false : false

  return {
    ...template,
    config: {
      ...template.config,
      meta: { ...meta, color_scheme: warna, font },
      // `config.music` boleh tidak ada sama sekali di tema lama, jadi
      // pematiannya hanya ditulis kalau objeknya memang ada.
      ...(musikDilarang && template.config.music
        ? { music: { ...template.config.music, enabled: false } }
        : {}),
    },
  }
}
