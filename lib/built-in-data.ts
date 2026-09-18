/**
 * Data bawaan (kategori, tier harga, palet warna) — TANPA dependensi database.
 *
 * Dulu konstanta ini tinggal di lib/db.ts. Akibatnya setiap komponen client
 * yang mengimpornya ikut menyeret seluruh lib/db.ts -> lib/prisma.ts ->
 * @prisma/adapter-pg -> pg -> modul `net`/`tls` Node ke dalam bundle browser.
 * Di webpack lama hal itu "hanya" membengkakkan bundle; setelah pindah ke
 * driver adapter Postgres, build langsung gagal dengan
 * "Module not found: Can't resolve 'net'".
 *
 * Isinya murni data — aman diimpor dari client maupun server.
 * lib/db.ts me-re-export ulang supaya kode server lama tidak perlu berubah.
 */
import type { TemplateCategory, TierFeatures, PriceTier, ColorPalette } from './types'

/** Template yang hidup di lib/template-configs, bukan di database.
 *  Tidak bisa dihapus — kalau baris DB-nya hilang, kodenya tetap
 *  mengembalikannya, jadi tombol Hapus hanya akan membingungkan. */
export const BUILT_IN_TEMPLATE_IDS = ['javanese-gold', 'rose-garden', 'midnight-luxe'] as const

export const BUILT_IN_CATEGORIES: TemplateCategory[] = [
  { slug: 'modern',      label: 'Modern',      is_built_in: true },
  { slug: 'tradisional', label: 'Tradisional', is_built_in: true },
  { slug: 'minimalis',   label: 'Minimalis',   is_built_in: true },
  { slug: 'floral',      label: 'Floral',      is_built_in: true },
  { slug: 'rustic',      label: 'Rustic',      is_built_in: true },
]

const STARTER_FEATURES: TierFeatures = {
  max_photos: 6, max_guests: 100, music: true, custom_music: false,
  opening_animation: true, opening_styles: 'basic',
  hero: true, profiles: true, events: true, quote: true,
  countdown: true, gallery: true, rsvp: true, wishes: true,
  story: false, video: false, gift: false, gift_registry: false,
  livestream: false, ig_story: false, qrcode: false, closing: true,
  custom_domain: false, subdomain: true, remove_watermark: false,
  analytics: false, priority_support: false, validity_days: 365,
  decoration_editing: false, max_decoration_assets: 0, custom_animations: false,
}

const POPULAR_FEATURES: TierFeatures = {
  max_photos: 20, max_guests: 500, music: true, custom_music: true,
  opening_animation: true, opening_styles: 'all',
  hero: true, profiles: true, events: true, quote: true,
  countdown: true, gallery: true, rsvp: true, wishes: true,
  story: true, video: true, gift: true, gift_registry: true,
  livestream: true, ig_story: false, qrcode: false, closing: true,
  // remove_watermark false di semua paket sampai 200 undangan terbit (D-12),
  // dan masa aktif disamakan 1 tahun (D-11).
  custom_domain: false, subdomain: true, remove_watermark: false,
  analytics: true, priority_support: false, validity_days: 365,
  decoration_editing: true, max_decoration_assets: 3, custom_animations: false,
}

const EKSKLUSIF_FEATURES: TierFeatures = {
  max_photos: 50, max_guests: -1, music: true, custom_music: true,
  opening_animation: true, opening_styles: 'all',
  hero: true, profiles: true, events: true, quote: true,
  countdown: true, gallery: true, rsvp: true, wishes: true,
  story: true, video: true, gift: true, gift_registry: true,
  livestream: true, ig_story: true, qrcode: true, closing: true,
  custom_domain: true, subdomain: true, remove_watermark: false,
  analytics: true, priority_support: true, validity_days: 365,
  decoration_editing: true, max_decoration_assets: -1, custom_animations: true,
}

export const BUILT_IN_PRICE_TIERS: PriceTier[] = [
  { id: 'starter',    label: 'Starter',    price: 79000,  is_built_in: true, description: 'Undangan digital esensial untuk pasangan hemat', color: '#3b82f6', icon: 'rocket', features: STARTER_FEATURES },
  { id: 'popular',    label: 'Popular',    price: 149000, is_built_in: true, description: 'Fitur lengkap untuk pernikahan yang berkesan', color: '#8b5cf6', icon: 'crown', highlight: true, features: POPULAR_FEATURES },
  { id: 'eksklusif',  label: 'Eksklusif',  price: 249000, is_built_in: true, description: 'Pengalaman premium tanpa batas untuk hari spesial', color: '#d97706', icon: 'gem', features: EKSKLUSIF_FEATURES },
]

export const BUILT_IN_PALETTES: ColorPalette[] = [
  { id: 'jawa-emas',      name: 'Jawa Emas',       group: 'Nusantara', primary: '#1a4a1a', accent: '#d4af37', text: '#ffffff',  background: '#0f2d0f', is_built_in: true },
  { id: 'jawa-kerajaan',  name: 'Jawa Kerajaan',   group: 'Nusantara', primary: '#2d1b4e', accent: '#c5a028', text: '#f5e6c8', background: '#1a0d30', is_built_in: true },
  { id: 'sumatera-tanah', name: 'Sumatera Tanah',  group: 'Nusantara', primary: '#4a2c17', accent: '#e8a830', text: '#f5ebe0', background: '#2c1a0e', is_built_in: true },
  { id: 'bali-sakral',    name: 'Bali Sakral',     group: 'Nusantara', primary: '#3d0000', accent: '#ffd700', text: '#fff8e7', background: '#1a0000', is_built_in: true },
  { id: 'sunda-hijau',    name: 'Sunda Hijau',     group: 'Nusantara', primary: '#1b3a1b', accent: '#8fbe6f', text: '#f0faf0', background: '#0d1f0d', is_built_in: true },
  { id: 'betawi-merah',   name: 'Betawi Merah',    group: 'Nusantara', primary: '#2c1810', accent: '#e07b30', text: '#fff5ed', background: '#1a0e08', is_built_in: true },
  { id: 'bugis-biru',     name: 'Bugis Biru',      group: 'Nusantara', primary: '#0a1f3d', accent: '#d4aa70', text: '#f0eee8', background: '#050f20', is_built_in: true },
  { id: 'modern-putih',   name: 'Modern Putih',    group: 'Modern',    primary: '#f9f9f9', accent: '#1a1a1a', text: '#1a1a1a', background: '#ffffff', is_built_in: true },
  { id: 'modern-hitam',   name: 'Modern Hitam',    group: 'Modern',    primary: '#0f0f0f', accent: '#e8e0d0', text: '#f5f5f5', background: '#1a1a1a', is_built_in: true },
  { id: 'navy-elegan',    name: 'Navy Elegan',     group: 'Modern',    primary: '#0a192f', accent: '#64ffda', text: '#ccd6f6', background: '#020c1b', is_built_in: true },
  { id: 'sage-tenang',    name: 'Sage Tenang',     group: 'Modern',    primary: '#2c3e2d', accent: '#8fba8f', text: '#f0f4f0', background: '#1a2b1c', is_built_in: true },
  { id: 'charcoal-gold',  name: 'Charcoal Gold',   group: 'Modern',    primary: '#1c1c1c', accent: '#c8a84b', text: '#f0ead8', background: '#111111', is_built_in: true },
  { id: 'rose-garden',    name: 'Rose Garden',     group: 'Floral',    primary: '#3d1020', accent: '#f5a0b5', text: '#fff0f5', background: '#2a0815', is_built_in: true },
  { id: 'lavender-dream', name: 'Lavender Dream',  group: 'Floral',    primary: '#1a0d33', accent: '#b088f9', text: '#f5f0ff', background: '#100820', is_built_in: true },
  { id: 'peony-soft',     name: 'Peony Soft',      group: 'Floral',    primary: '#fdf0f3', accent: '#c45876', text: '#2d1018', background: '#fff5f7', is_built_in: true },
  { id: 'dusty-mauve',    name: 'Dusty Mauve',     group: 'Floral',    primary: '#2e1a28', accent: '#e0a8c8', text: '#f8eef5', background: '#1c0f1a', is_built_in: true },
  { id: 'cream-lembut',   name: 'Cream Lembut',    group: 'Minimalis', primary: '#faf8f5', accent: '#8b7355', text: '#1a1510', background: '#f5f2ed', is_built_in: true },
  { id: 'abu-elegan',     name: 'Abu Elegan',      group: 'Minimalis', primary: '#2a2a2a', accent: '#b8b8b8', text: '#f0f0f0', background: '#1a1a1a', is_built_in: true },
  { id: 'off-white',      name: 'Off White',       group: 'Minimalis', primary: '#fcfaf7', accent: '#6b6b6b', text: '#2a2a2a', background: '#f7f5f2', is_built_in: true },
  { id: 'kayu-tua',       name: 'Kayu Tua',        group: 'Rustic',    primary: '#3d2b1f', accent: '#d4956a', text: '#f5e6d3', background: '#2a1a10', is_built_in: true },
  { id: 'hijau-hutan',    name: 'Hijau Hutan',     group: 'Rustic',    primary: '#1e3a2f', accent: '#8fb870', text: '#e8f4e8', background: '#122518', is_built_in: true },
  { id: 'terracotta',     name: 'Terracotta',      group: 'Rustic',    primary: '#2c1a15', accent: '#c87941', text: '#f5e5d8', background: '#1a0e0a', is_built_in: true },
]
