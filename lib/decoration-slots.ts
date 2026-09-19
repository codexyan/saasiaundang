import type { DecorationAsset } from './types'
import { builtInUrl } from './built-in-assets'

/**
 * Titik tempel dekorasi untuk pembeli.
 *
 * Admin memakai kanvas bebas: seret, ubah ukuran, putar, magnet. Pembeli
 * tidak. Keputusan pemilik produk 19 Sep 2026, dan alasannya satu baris:
 * kebebasan penuh di tangan orang yang tidak terbiasa mendesain menghasilkan
 * ornamen yang menabrak nama mempelai, lalu keluhan, lalu tiket dukungan.
 *
 * Titik tempel memberi rasa "ini undangan saya" tanpa satu pun cara untuk
 * merusaknya. Koordinatnya sengaja simetris supaya empat sudut terpasang
 * seimbang tanpa pembeli perlu tahu apa itu simetri.
 *
 * Nilainya tetap persen kanvas seperti aset admin, jadi mesin render tidak
 * perlu tahu apa apa tentang titik tempel: yang sampai ke sana tetap
 * DecorationAsset biasa.
 */
export interface DecorationSlot {
  id: string
  label: string
  x: number
  y: number
  w: number
  flip_h?: boolean
  flip_v?: boolean
  /** Posisi di peta 3x3 pemilih, supaya diagramnya bisa digambar dari data. */
  petak: number
}

export const DECORATION_SLOTS: DecorationSlot[] = [
  { id: 'kiri-atas',    label: 'Sudut kiri atas',    x: 15, y: 12, w: 22, petak: 0 },
  { id: 'atas',         label: 'Tengah atas',        x: 50, y: 10, w: 40, petak: 1 },
  { id: 'kanan-atas',   label: 'Sudut kanan atas',   x: 85, y: 12, w: 22, flip_h: true, petak: 2 },
  { id: 'tengah',       label: 'Tengah',             x: 50, y: 50, w: 34, petak: 4 },
  { id: 'kiri-bawah',   label: 'Sudut kiri bawah',   x: 15, y: 88, w: 22, flip_v: true, petak: 6 },
  { id: 'bawah',        label: 'Tengah bawah',       x: 50, y: 90, w: 40, petak: 7 },
  { id: 'kanan-bawah',  label: 'Sudut kanan bawah',  x: 85, y: 88, w: 22, flip_h: true, flip_v: true, petak: 8 },
]

export function cariSlot(id: string): DecorationSlot | undefined {
  return DECORATION_SLOTS.find(s => s.id === id)
}

/**
 * Aset yang lahir dari sebuah titik tempel.
 *
 * Id-nya diberi awalan `pembeli-` supaya gampang dibedakan dari aset bawaan
 * tema saat digabungkan (lihat lib/decoration-utils.ts), dan supaya pembeli
 * tidak pernah bisa menimpa atau menghapus aset milik tema.
 */
export function asetDariSlot(
  slot: DecorationSlot,
  bentuk: string,
  label: string,
  warna: string,
  zAtas: number,
): DecorationAsset {
  return {
    id: `pembeli-${slot.id}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
    url: builtInUrl(bentuk, warna),
    label,
    x: slot.x,
    y: slot.y,
    w: slot.w,
    rotation: 0,
    flip_h: slot.flip_h ?? false,
    flip_v: slot.flip_v ?? false,
    opacity: 100,
    animation: 'fade-in',
    animation_delay: 200,
    exit_animation: 'none',
    exit_delay: 0,
    idle_animation: 'none',
    z_layer: zAtas + 1,
  }
}
