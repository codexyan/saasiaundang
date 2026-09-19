/**
 * Pasangan font terkurasi.
 *
 * Dulu daftar ini ditulis mati di dalam AppearancePanel, satu satunya tempat
 * yang memakainya. Sekarang pelanggan juga memilih font untuk undangannya
 * sendiri, dan dua salinan daftar yang sama adalah cara paling cepat membuat
 * pilihan admin dan pilihan pelanggan diam diam berbeda.
 *
 * Nama font di sini harus persis nama keluarga di Google Fonts: renderer
 * menyusun tautan `fonts.googleapis.com` langsung dari nilai ini, jadi salah
 * ketik berarti undangannya jatuh ke serif bawaan tanpa pesan apa pun.
 */
export interface FontPair {
  /** Nama pasangan, yang dilihat pemakai. */
  name: string
  heading: string
  body: string
  /** Satu baris watak pasangan ini, bukan istilah tipografi. */
  desc: string
}

export const FONT_PAIRS: FontPair[] = [
  { name: 'Clean Swiss',       heading: 'Geist',               body: 'Geist',               desc: 'Sans-serif monokromatik bersih' },
  { name: 'Royal Formal',      heading: 'Cinzel',              body: 'Raleway',             desc: 'Romawi agung + modern ringan' },
  { name: 'Refined Modern',    heading: 'Cormorant Garamond',  body: 'Montserrat',          desc: 'Garamond halus + geometris tegas' },
  { name: 'Romantic Script',   heading: 'Great Vibes',         body: 'Lato',                desc: 'Kaligrafi romantis + body netral' },
  { name: 'High Fashion',      heading: 'Bodoni Moda',         body: 'DM Sans',             desc: 'Editorial mode + sans-serif kontemporer' },
  { name: 'Grand Luxury',      heading: 'Cinzel Decorative',   body: 'EB Garamond',         desc: 'Dekoratif megah + serif klasik' },
  { name: 'Calligraphy Suite', heading: 'Alex Brush',          body: 'Cormorant Garamond',  desc: 'Kaligrafi anggun + serif elegan' },
  { name: 'Italian Romance',   heading: 'Italiana',            body: 'Spectral',            desc: 'Italia dramatis + serif hangat' },
  { name: 'Timeless Grace',    heading: 'Marcellus',           body: 'Lora',                desc: 'Serif klasik + serif lembut' },
  { name: 'Chic Contrast',     heading: 'Prata',               body: 'Josefin Sans',        desc: 'Didone tajam + sans geometris' },
  { name: 'Garden Party',      heading: 'Sacramento',          body: 'Work Sans',           desc: 'Script kasual elegan + sans modern' },
  { name: 'Dreamy Vintage',    heading: 'Allura',              body: 'Crimson Text',        desc: 'Script bermimpi + serif klasik' },
  { name: 'Art Deco',          heading: 'Gilda Display',       body: 'Nunito',              desc: 'Display 1920-an + sans-serif lunak' },
  { name: 'Understated Luxe',  heading: 'Tenor Sans',          body: 'Gentium Book Plus',   desc: 'Sans elegan + serif sastra' },
  { name: 'Monumental',        heading: 'Cormorant SC',        body: 'Raleway',             desc: 'Small caps formal + sans ringan' },
  { name: 'Intellectual',      heading: 'Philosopher',         body: 'Source Serif 4',      desc: 'Unik intelektual + serif modern' },
]

/** Pasangan yang cocok dengan sebuah kombinasi, kalau ada. */
export function cariPasangan(heading?: string, body?: string): FontPair | undefined {
  if (!heading || !body) return undefined
  return FONT_PAIRS.find(p => p.heading === heading && p.body === body)
}
