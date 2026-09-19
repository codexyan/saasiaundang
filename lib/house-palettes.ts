import type { ColorScheme } from './types'

/**
 * Palet yang benar benar dipakai tema tema kami.
 *
 * Disalin ke sini, tidak diimpor dari lib/template-configs/*.ts, supaya layar
 * Tema Warna tidak menyeret tiga konfigurasi tema utuh (23 KB mentah) ke
 * dalam bundel studio hanya untuk membaca empat warna. Sisa anggaran Worker
 * cuma sekitar 54 KiB gzip dari batas 3.072 KiB.
 *
 * Bahaya salinan adalah melenceng diam diam dari sumbernya. Itu dijaga
 * scripts/cek-tema-efektif.ts: ia membandingkan daftar ini dengan konfigurasi
 * tema yang sebenarnya dan gagal kalau ada satu warna pun berbeda.
 */
export interface PaletRumah {
  id: string
  nama: string
  warna: Required<ColorScheme>
}

export const PALET_RUMAH: PaletRumah[] = [
  {
    id: 'rose-garden',
    nama: 'Rose Garden',
    warna: { primary: '#6b3a3a', accent: '#d4918b', text: '#ffffff', background: '#fdf6f4' },
  },
  {
    id: 'javanese-gold',
    nama: 'Javanese Gold',
    warna: { primary: '#1a4a1a', accent: '#d4af37', text: '#ffffff', background: '#0f2d0f' },
  },
  {
    id: 'midnight-luxe',
    nama: 'Midnight Luxe',
    warna: { primary: '#0c0c0c', accent: '#b8977e', text: '#f5f0eb', background: '#0c0c0c' },
  },
]
