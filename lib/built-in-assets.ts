/**
 * Ornamen bawaan, digambar sebagai SVG inline dan dipakai lewat tag <img>
 * dengan url berawalan `BUILT_IN:`.
 *
 * Kenapa bukan berkas di /public: warnanya dijahit ke dalam SVG saat ornamen
 * dipasang, jadi satu bentuk bisa dipakai di tema emas, tembaga, atau perak
 * tanpa menyimpan tiga berkas. Ukurannya juga nol byte di storage.
 *
 * Bentuk url:
 *
 *   BUILT_IN:<id>            warna bawaan (emas)
 *   BUILT_IN:<id>@c5a028     warna khusus, hex tanpa pagar
 *
 * Renderer memanggil resolveAssetUrl tanpa argumen warna, jadi warnanya harus
 * ikut di dalam url. Itu disengaja: components/renderer dibekukan PRD, dan
 * menitipkan warna di url membuat ornamen tetap benar di undangan hidup tanpa
 * satu baris pun berubah di sana.
 */

/** viewBox menentukan rasio aset, karena <img> dirender width 100% height auto. */
interface Shape {
  vb: string
  body: (c: string) => string
}

const SHAPES: Record<string, Shape> = {
  //  Sudut

  'floral-corner': {
    vb: '0 0 100 100',
    body: (c) => `
      <path d='M6 6 Q34 8 36 36 M6 6 Q8 34 36 36' stroke='${c}' stroke-width='1.5' fill='none' stroke-linecap='round'/>
      <path d='M6 6 Q20 6 22 20' stroke='${c}' stroke-width='1.2' fill='none' opacity='0.7' stroke-linecap='round'/>
      <path d='M36 36 Q52 38 56 54' stroke='${c}' stroke-width='1.1' fill='none' opacity='0.55' stroke-linecap='round'/>
      <circle cx='10' cy='10' r='2.4' fill='${c}' opacity='0.7'/>
      <circle cx='36' cy='36' r='3' fill='${c}' opacity='0.5'/>
      <circle cx='6' cy='22' r='1.6' fill='${c}' opacity='0.5'/>
      <circle cx='22' cy='6' r='1.6' fill='${c}' opacity='0.5'/>
      <circle cx='56' cy='54' r='2' fill='${c}' opacity='0.4'/>`,
  },

  'geo-corner': {
    vb: '0 0 100 100',
    body: (c) => `
      <path d='M4 34 L4 4 L34 4' stroke='${c}' stroke-width='1.6' fill='none' stroke-linecap='round'/>
      <path d='M4 52 L52 4' stroke='${c}' stroke-width='1.2' fill='none' opacity='0.5'/>
      <rect x='9' y='9' width='12' height='12' transform='rotate(45 15 15)' stroke='${c}' stroke-width='1.3' fill='none' opacity='0.85'/>
      <path d='M14 44 L44 14' stroke='${c}' stroke-width='1' fill='none' opacity='0.35'/>`,
  },

  'art-deco-corner': {
    vb: '0 0 100 100',
    body: (c) => `
      <path d='M4 60 L4 4 L60 4' stroke='${c}' stroke-width='1.8' fill='none'/>
      <path d='M12 52 L12 12 L52 12' stroke='${c}' stroke-width='1.1' fill='none' opacity='0.7'/>
      <path d='M20 44 L20 20 L44 20' stroke='${c}' stroke-width='0.9' fill='none' opacity='0.45'/>
      <path d='M4 72 Q16 72 16 60' stroke='${c}' stroke-width='1.2' fill='none' opacity='0.6'/>
      <path d='M72 4 Q72 16 60 16' stroke='${c}' stroke-width='1.2' fill='none' opacity='0.6'/>`,
  },

  'leaf-corner': {
    vb: '0 0 100 100',
    body: (c) => `
      <path d='M6 60 Q6 6 60 6' stroke='${c}' stroke-width='1.4' fill='none' stroke-linecap='round'/>
      <ellipse cx='18' cy='26' rx='9' ry='4' transform='rotate(-55 18 26)' fill='${c}' opacity='0.5'/>
      <ellipse cx='26' cy='16' rx='9' ry='4' transform='rotate(-30 26 16)' fill='${c}' opacity='0.5'/>
      <ellipse cx='40' cy='9' rx='9' ry='4' transform='rotate(-12 40 9)' fill='${c}' opacity='0.5'/>
      <ellipse cx='9' cy='42' rx='8' ry='3.6' transform='rotate(-76 9 42)' fill='${c}' opacity='0.45'/>
      <circle cx='60' cy='6' r='2' fill='${c}' opacity='0.6'/>
      <circle cx='6' cy='60' r='2' fill='${c}' opacity='0.6'/>`,
  },

  //  Pembatas

  'divider-diamond': {
    vb: '0 0 200 24',
    body: (c) => `
      <path d='M8 12 L86 12' stroke='${c}' stroke-width='1.1' stroke-linecap='round'/>
      <path d='M114 12 L192 12' stroke='${c}' stroke-width='1.1' stroke-linecap='round'/>
      <rect x='94' y='6' width='12' height='12' transform='rotate(45 100 12)' stroke='${c}' stroke-width='1.3' fill='none'/>
      <circle cx='100' cy='12' r='1.8' fill='${c}' opacity='0.8'/>
      <circle cx='80' cy='12' r='1.4' fill='${c}' opacity='0.5'/>
      <circle cx='120' cy='12' r='1.4' fill='${c}' opacity='0.5'/>`,
  },

  'divider-leaf': {
    vb: '0 0 200 24',
    body: (c) => `
      <path d='M14 12 L78 12' stroke='${c}' stroke-width='1' stroke-linecap='round' opacity='0.8'/>
      <path d='M122 12 L186 12' stroke='${c}' stroke-width='1' stroke-linecap='round' opacity='0.8'/>
      <ellipse cx='88' cy='12' rx='9' ry='4' transform='rotate(-18 88 12)' fill='${c}' opacity='0.55'/>
      <ellipse cx='112' cy='12' rx='9' ry='4' transform='rotate(18 112 12)' fill='${c}' opacity='0.55'/>
      <circle cx='100' cy='12' r='2.6' fill='${c}' opacity='0.85'/>`,
  },

  'divider-wave': {
    vb: '0 0 200 16',
    body: (c) => `
      <path d='M6 8 Q22 1 38 8 T70 8 T102 8 T134 8 T166 8 T194 8' stroke='${c}' stroke-width='1.2' fill='none' stroke-linecap='round'/>`,
  },

  'divider-double': {
    vb: '0 0 200 12',
    body: (c) => `
      <path d='M4 4 L196 4' stroke='${c}' stroke-width='1.3' stroke-linecap='round'/>
      <path d='M28 9 L172 9' stroke='${c}' stroke-width='0.8' stroke-linecap='round' opacity='0.55'/>`,
  },

  //  Bunga dan daun

  rose: {
    vb: '0 0 100 100',
    body: (c) => `
      <circle cx='50' cy='50' r='8' stroke='${c}' stroke-width='2' fill='none' opacity='0.9'/>
      <path d='M50 50 Q40 34 50 27 Q63 31 58 48' stroke='${c}' stroke-width='2' fill='none' opacity='0.7' stroke-linecap='round'/>
      <path d='M50 50 Q67 44 71 55 Q66 67 52 60' stroke='${c}' stroke-width='2' fill='none' opacity='0.7' stroke-linecap='round'/>
      <path d='M50 50 Q56 67 45 73 Q33 66 40 52' stroke='${c}' stroke-width='2' fill='none' opacity='0.7' stroke-linecap='round'/>
      <path d='M50 50 Q33 55 29 44 Q35 32 48 40' stroke='${c}' stroke-width='2' fill='none' opacity='0.7' stroke-linecap='round'/>`,
  },

  'leaf-branch': {
    vb: '0 0 100 100',
    body: (c) => `
      <path d='M50 4 L50 96' stroke='${c}' stroke-width='1.4' fill='none' opacity='0.8' stroke-linecap='round'/>
      <ellipse cx='38' cy='16' rx='12' ry='5.5' transform='rotate(-32 38 16)' fill='${c}' opacity='0.6'/>
      <ellipse cx='62' cy='30' rx='12' ry='5.5' transform='rotate(32 62 30)' fill='${c}' opacity='0.6'/>
      <ellipse cx='38' cy='46' rx='12' ry='5.5' transform='rotate(-32 38 46)' fill='${c}' opacity='0.6'/>
      <ellipse cx='62' cy='62' rx='12' ry='5.5' transform='rotate(32 62 62)' fill='${c}' opacity='0.6'/>
      <ellipse cx='38' cy='78' rx='10' ry='5' transform='rotate(-32 38 78)' fill='${c}' opacity='0.6'/>`,
  },

  'flower-spray': {
    vb: '0 0 100 100',
    body: (c) => `
      <path d='M50 94 Q46 62 30 40 M50 94 Q54 64 70 44 M50 94 L50 48' stroke='${c}' stroke-width='1.2' fill='none' opacity='0.7' stroke-linecap='round'/>
      <g opacity='0.75'>
        <circle cx='30' cy='38' r='5.5' stroke='${c}' stroke-width='1.3' fill='none'/>
        <circle cx='30' cy='38' r='1.8' fill='${c}'/>
        <circle cx='70' cy='42' r='4.5' stroke='${c}' stroke-width='1.3' fill='none'/>
        <circle cx='70' cy='42' r='1.6' fill='${c}'/>
        <circle cx='50' cy='28' r='7' stroke='${c}' stroke-width='1.4' fill='none'/>
        <circle cx='50' cy='28' r='2.2' fill='${c}'/>
      </g>
      <ellipse cx='38' cy='64' rx='9' ry='4' transform='rotate(-34 38 64)' fill='${c}' opacity='0.5'/>
      <ellipse cx='63' cy='70' rx='9' ry='4' transform='rotate(34 63 70)' fill='${c}' opacity='0.5'/>`,
  },

  eucalyptus: {
    vb: '0 0 100 100',
    body: (c) => `
      <path d='M12 88 Q40 66 58 30 Q64 18 66 8' stroke='${c}' stroke-width='1.3' fill='none' opacity='0.8' stroke-linecap='round'/>
      <circle cx='24' cy='76' r='7' fill='${c}' opacity='0.4'/>
      <circle cx='38' cy='62' r='8' fill='${c}' opacity='0.45'/>
      <circle cx='48' cy='46' r='7' fill='${c}' opacity='0.4'/>
      <circle cx='57' cy='30' r='6' fill='${c}' opacity='0.35'/>
      <circle cx='63' cy='15' r='4.5' fill='${c}' opacity='0.3'/>
      <circle cx='36' cy='82' r='5' fill='${c}' opacity='0.3'/>`,
  },

  //  Simbol

  ring: {
    vb: '0 0 100 100',
    body: (c) => `<circle cx='50' cy='50' r='46' stroke='${c}' stroke-width='1.1' fill='none'/>`,
  },

  'ring-pair': {
    vb: '0 0 140 100',
    body: (c) => `
      <circle cx='54' cy='54' r='34' stroke='${c}' stroke-width='2' fill='none'/>
      <circle cx='88' cy='54' r='34' stroke='${c}' stroke-width='2' fill='none' opacity='0.85'/>
      <path d='M50 14 L54 6 L58 14 Z' fill='${c}' opacity='0.9'/>
      <path d='M84 14 L88 6 L92 14 Z' fill='${c}' opacity='0.7'/>`,
  },

  dove: {
    vb: '0 0 120 100',
    body: (c) => `
      <path d='M10 66 Q34 74 58 62 Q78 52 104 30' stroke='${c}' stroke-width='1.6' fill='none' stroke-linecap='round'/>
      <path d='M40 66 Q44 40 70 32 Q58 52 56 64' fill='${c}' opacity='0.55'/>
      <path d='M104 30 L114 26 L106 38 Z' fill='${c}' opacity='0.8'/>
      <circle cx='100' cy='34' r='1.8' fill='${c}'/>`,
  },

  'crescent-star': {
    vb: '0 0 100 100',
    body: (c) => `
      <path d='M62 12 A38 38 0 1 0 62 88 A30 30 0 1 1 62 12 Z' fill='${c}' opacity='0.75'/>
      <path d='M78 34 L82 45 L93 45 L84 52 L88 63 L78 56 L68 63 L72 52 L63 45 L74 45 Z' fill='${c}' opacity='0.9'/>`,
  },

  //  Bingkai

  'frame-arch': {
    vb: '0 0 100 140',
    body: (c) => `
      <path d='M8 134 L8 50 A42 42 0 0 1 92 50 L92 134' stroke='${c}' stroke-width='1.6' fill='none'/>
      <path d='M15 130 L15 51 A35 35 0 0 1 85 51 L85 130' stroke='${c}' stroke-width='0.8' fill='none' opacity='0.5'/>
      <circle cx='50' cy='11' r='2.6' fill='${c}' opacity='0.8'/>`,
  },

  'frame-rect': {
    vb: '0 0 100 140',
    body: (c) => `
      <rect x='8' y='8' width='84' height='124' stroke='${c}' stroke-width='1.6' fill='none'/>
      <rect x='15' y='15' width='70' height='110' stroke='${c}' stroke-width='0.8' fill='none' opacity='0.5'/>
      <rect x='44' y='2' width='12' height='12' transform='rotate(45 50 8)' stroke='${c}' stroke-width='1.2' fill='none' opacity='0.9'/>
      <rect x='44' y='126' width='12' height='12' transform='rotate(45 50 132)' stroke='${c}' stroke-width='1.2' fill='none' opacity='0.9'/>`,
  },
}

const DEFAULT_COLOR = '#d4af37'

export type OrnamentGroup = 'Sudut' | 'Pembatas' | 'Bunga & Daun' | 'Simbol' | 'Bingkai'

export interface BuiltInOrnament {
  id: keyof typeof SHAPES & string
  label: string
  group: OrnamentGroup
  /** Penempatan awal dalam persen kanvas: x,y titik pusat, w lebar. */
  x: number
  y: number
  w: number
  rotation?: number
}

/**
 * Penempatan awal sengaja berbeda per bentuk. Ornamen sudut lahir di sudut,
 * pembatas lahir melebar di bawah judul, bingkai lahir memenuhi kanvas. Aset
 * yang selalu lahir di tengah memaksa admin menyeret setiap kali.
 */
export const BUILT_IN_ORNAMENTS: BuiltInOrnament[] = [
  { id: 'floral-corner',   label: 'Sudut Bunga',      group: 'Sudut',        x: 16, y: 14, w: 26 },
  { id: 'leaf-corner',     label: 'Sudut Daun',       group: 'Sudut',        x: 16, y: 14, w: 26 },
  { id: 'geo-corner',      label: 'Sudut Geometris',  group: 'Sudut',        x: 16, y: 14, w: 24 },
  { id: 'art-deco-corner', label: 'Sudut Art Deco',   group: 'Sudut',        x: 16, y: 14, w: 26 },

  { id: 'divider-diamond', label: 'Garis Berlian',    group: 'Pembatas',     x: 50, y: 22, w: 48 },
  { id: 'divider-leaf',    label: 'Garis Daun',       group: 'Pembatas',     x: 50, y: 22, w: 46 },
  { id: 'divider-wave',    label: 'Garis Ombak',      group: 'Pembatas',     x: 50, y: 22, w: 44 },
  { id: 'divider-double',  label: 'Garis Ganda',      group: 'Pembatas',     x: 50, y: 22, w: 42 },

  { id: 'rose',            label: 'Mawar',            group: 'Bunga & Daun', x: 50, y: 50, w: 22 },
  { id: 'flower-spray',    label: 'Rangkaian Bunga',  group: 'Bunga & Daun', x: 22, y: 76, w: 28 },
  { id: 'leaf-branch',     label: 'Ranting Daun',     group: 'Bunga & Daun', x: 12, y: 50, w: 18 },
  { id: 'eucalyptus',      label: 'Eukaliptus',       group: 'Bunga & Daun', x: 80, y: 72, w: 26 },

  { id: 'ring',            label: 'Cincin',           group: 'Simbol',       x: 50, y: 50, w: 20 },
  { id: 'ring-pair',       label: 'Sepasang Cincin',  group: 'Simbol',       x: 50, y: 30, w: 24 },
  { id: 'dove',            label: 'Merpati',          group: 'Simbol',       x: 70, y: 24, w: 24 },
  { id: 'crescent-star',   label: 'Bulan Bintang',    group: 'Simbol',       x: 50, y: 22, w: 16 },

  { id: 'frame-arch',      label: 'Bingkai Lengkung', group: 'Bingkai',      x: 50, y: 50, w: 74 },
  { id: 'frame-rect',      label: 'Bingkai Persegi',  group: 'Bingkai',      x: 50, y: 50, w: 78 },
]

export const ORNAMENT_GROUPS: OrnamentGroup[] = ['Sudut', 'Pembatas', 'Bunga & Daun', 'Simbol', 'Bingkai']

export interface OrnamentBundleItem {
  shape: string
  x: number
  y: number
  w: number
  rotation?: number
  flip_h?: boolean
  flip_v?: boolean
}

export interface OrnamentBundle {
  id: string
  label: string
  hint: string
  items: OrnamentBundleItem[]
}

/**
 * Paket siap pakai. Satu klik memasang beberapa ornamen sekaligus pada posisi
 * yang sudah pasti seimbang, karena menyusun empat sudut simetris dengan
 * tangan adalah pekerjaan yang paling sering dikeluhkan dan paling mudah
 * meleset.
 */
export const ORNAMENT_BUNDLES: OrnamentBundle[] = [
  {
    id: 'empat-sudut-bunga',
    label: 'Empat sudut bunga',
    hint: '4 ornamen',
    items: [
      { shape: 'floral-corner', x: 15, y: 12, w: 24 },
      { shape: 'floral-corner', x: 85, y: 12, w: 24, flip_h: true },
      { shape: 'floral-corner', x: 15, y: 88, w: 24, flip_v: true },
      { shape: 'floral-corner', x: 85, y: 88, w: 24, flip_h: true, flip_v: true },
    ],
  },
  {
    id: 'empat-sudut-deco',
    label: 'Empat sudut art deco',
    hint: '4 ornamen',
    items: [
      { shape: 'art-deco-corner', x: 14, y: 11, w: 22 },
      { shape: 'art-deco-corner', x: 86, y: 11, w: 22, flip_h: true },
      { shape: 'art-deco-corner', x: 14, y: 89, w: 22, flip_v: true },
      { shape: 'art-deco-corner', x: 86, y: 89, w: 22, flip_h: true, flip_v: true },
    ],
  },
  {
    id: 'pembatas-atas-bawah',
    label: 'Pembatas atas & bawah',
    hint: '2 ornamen',
    items: [
      { shape: 'divider-diamond', x: 50, y: 12, w: 46 },
      { shape: 'divider-diamond', x: 50, y: 88, w: 46 },
    ],
  },
  {
    id: 'ranting-sisi',
    label: 'Ranting kiri & kanan',
    hint: '2 ornamen',
    items: [
      { shape: 'leaf-branch', x: 9, y: 50, w: 16, rotation: -8 },
      { shape: 'leaf-branch', x: 91, y: 50, w: 16, rotation: 8, flip_h: true },
    ],
  },
  {
    id: 'bingkai-lengkung',
    label: 'Bingkai lengkung',
    hint: '1 ornamen',
    items: [
      { shape: 'frame-arch', x: 50, y: 50, w: 76 },
    ],
  },
  {
    id: 'karangan-bawah',
    label: 'Karangan sudut bawah',
    hint: '2 ornamen',
    items: [
      { shape: 'flower-spray', x: 20, y: 80, w: 26 },
      { shape: 'eucalyptus', x: 82, y: 78, w: 24, flip_h: true },
    ],
  },
]

/** Warna dijahit ke url supaya renderer tidak perlu tahu meta tema. */
export function builtInUrl(shape: string, color?: string): string {
  const hex = (color ?? DEFAULT_COLOR).replace('#', '').trim()
  return `BUILT_IN:${shape}@${hex}`
}

/**
 * Mengubah url `BUILT_IN:` jadi data URI yang bisa dipasang di <img>. Url lain
 * dikembalikan apa adanya.
 */
export function resolveAssetUrl(url: string, color: string = DEFAULT_COLOR): string {
  if (!url || !url.startsWith('BUILT_IN:')) return url

  const raw = url.slice('BUILT_IN:'.length)
  const [namaBentuk, hexDiUrl] = raw.split('@')

  // Data lama ditulis tanpa sufiks warna dan kadang dengan akhiran bebas,
  // jadi pencocokan awalan dipertahankan sebagai jaring pengaman.
  const key = SHAPES[namaBentuk]
    ? namaBentuk
    : (Object.keys(SHAPES).find((k) => namaBentuk.startsWith(k)) ?? 'ring')

  const warna = hexDiUrl ? `#${hexDiUrl.replace('#', '')}` : color
  const bentuk = SHAPES[key]
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='${bentuk.vb}' fill='none'>${bentuk.body(warna)}</svg>`
    .replace(/\s+/g, ' ')
    .trim()

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}
