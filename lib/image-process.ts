/**
 * Standar gambar artikel — dipakai bersama oleh sisi browser (lib/image-resize.ts)
 * dan sisi server (route upload) supaya angkanya tidak bercabang.
 *
 * Dulu file ini melakukan resize server-side memakai `sharp`. `sharp` adalah
 * binding native libvips dan TIDAK bisa jalan di Cloudflare Workers, jadi
 * pengecilan gambar dipindah ke browser sebelum upload. Lihat lib/image-resize.ts.
 */
export const ARTICLE_IMAGE = {
  maxWidth: 1600,          // di atas ini mubazir — kolom artikel hanya ~800-900px
  coverRatio: 1.91,        // standar OG / social share (1200x630)
  coverMinWidth: 800,      // di bawah ini, peringatkan "bisa tampak buram"
  quality: 0.8,            // 0-1 untuk canvas.toBlob (dulu 80 untuk sharp)
  maxBytes: 2 * 1024 * 1024,
}

export type ImageVariant = 'cover' | 'inline'
