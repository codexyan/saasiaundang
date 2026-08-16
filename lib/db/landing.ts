import { cache } from 'react'
import { prisma } from '../prisma'

//  LANDING PAGE SETTINGS

export interface LandingPageSettings {
  hero: {
    headline: string
    subheadline: string
    ctaPrimary: string
    ctaSecondary: string
    socialProofCount: string
    socialProofRating: string
  }
  heroMockup: {
    groomName: string
    brideName: string
    date: string
    venue: string
  }
  templateShowcase: {
    featured: { name: string; tagline: string; coverPhoto: string; primary: string; accent: string; href: string }
    comingSoon: { label: string; accent: string; bg: string }[]
  }
  personalisasiMockup: {
    guestName: string
    groomName: string
    brideName: string
  }
  trustBar: {
    items: { value: string; label: string }[]
  }
  testimonials: {
    items: { names: string; date: string; template: string; quote: string; initial: string; color: string }[]
  }
  faq: {
    items: { q: string; a: string }[]
  }
  howItWorks: {
    steps: { title: string; description: string }[]
  }
}

const DEFAULT_LANDING: LandingPageSettings = {
  hero: {
    headline: 'Undangan digital yang terasa personal sejak tamu membukanya',
    subheadline: 'Begitu tamu membuka undangan kalian, musik mengalir lembut dan nama mereka tersapa satu per satu. Kesan hangat yang terasa sejak detik pertama, tanpa perlu memasang aplikasi apa pun.',
    ctaPrimary: 'Mulai Buat Undangan',
    ctaSecondary: 'Lihat Demo',
    socialProofCount: '',
    socialProofRating: '',
  },
  heroMockup: {
    groomName: 'Rizky',
    brideName: 'Aulia',
    date: '12 · 04 · 2026',
    venue: 'Hotel Grand Ballroom, Jakarta',
  },
  templateShowcase: {
    featured: {
      name: 'Javanese Gold',
      tagline: 'Elegansi tradisi Jawa dalam sentuhan modern',
      coverPhoto: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=800&h=1200&fit=crop',
      primary: '#1a4a1a',
      accent: '#d4af37',
      href: '/demo/renderer?id=javanese-gold',
    },
    comingSoon: [
      { label: 'Modern Minimal', accent: '#64ffda', bg: '#060e1f' },
      { label: 'Romantic Bloom', accent: '#f5a0b5', bg: '#1a0810' },
    ],
  },
  personalisasiMockup: {
    guestName: 'Bapak & Ibu Hendra',
    groomName: 'Rizky',
    brideName: 'Aulia',
  },
  trustBar: {
    items: [
      { value: 'Gratis Preview', label: 'Coba sebelum bayar' },
      { value: '< 5 mnt', label: 'Cepat jadi' },
      { value: 'Sekali Bayar', label: 'Tanpa langganan' },
      { value: 'Tanpa Aplikasi', label: 'Langsung terbuka di HP' },
    ],
  },
  testimonials: {
    items: [
      { names: 'Rizky & Aulia', date: 'Maret 2026', template: 'Modern', quote: 'Tamunya banyak yang nanya "link undangannya keren banget, pakai apa?". Langsung kami rekomendasiin iaundang. Bikinnya cepat banget, kurang dari 30 menit sudah jadi.', initial: 'RA', color: '#2c4a34' },
      { names: 'Dimas & Nadia', date: 'Februari 2026', template: 'Casual', quote: 'Kami berdua kerja penuh waktu dan tidak ada waktu ngurusin undangan fisik. iaundang jadi jalan keluarnya: gampang, cantik, dan tamu bisa konfirmasi kehadiran langsung dari HP mereka.', initial: 'DN', color: '#9a7d3f' },
      { names: 'Fajar & Syifa', date: 'April 2026', template: 'Traditional', quote: 'Yang paling suka fitur nama tamu personalnya. Tamu merasa diperhatikan karena nama mereka muncul langsung di undangan. Banyak yang WA bilang terkesan.', initial: 'FS', color: '#4a6355' },
      { names: 'Hendra & Mita', date: 'Januari 2026', template: 'Modern', quote: 'Harga segini sudah dapat semua fitur lengkap, tidak ada tambahan biaya. Undangan kami masih bisa dibuka 6 bulan setelah nikah untuk kenangan.', initial: 'HM', color: '#5d7a6a' },
    ],
  },
  faq: {
    items: [
      { q: 'Bisa dilihat dulu hasilnya sebelum bayar?', a: 'Bisa. Pilih gaya yang kalian suka, masukkan nama kalian berdua, dan lihat sendiri hasilnya. Bayar hanya kalau sudah benar-benar cocok dan siap dibagikan ke tamu.' },
      { q: 'Tamu perlu download atau install sesuatu?', a: 'Tidak perlu sama sekali. Tamu cukup menyentuh tautan yang kalian kirim lewat WhatsApp, dan undangan langsung terbuka di HP mereka.' },
      { q: 'Berapa lama undangan bisa diakses setelah bayar?', a: '6 bulan penuh sejak tanggal pembelian. Lebih dari cukup untuk sebelum hari H, saat hari H, dan beberapa bulan setelahnya.' },
      { q: 'Bisa ganti foto atau detail acara setelah dibagikan?', a: 'Bisa, kapan saja dan sebanyak yang kalian mau. Ubah info acara, ganti foto, ganti musik, bahkan ganti gaya tampilan tanpa biaya tambahan.' },
      { q: 'Bagaimana cara tamu menerima undangan?', a: 'Setelah undangan kalian aktif, kalian dapat alamat sendiri seperti ikhwal-fani.iaundang.online. Tinggal salin dan kirim ke tamu lewat WhatsApp atau media apa pun.' },
      { q: 'Kalau ada yang membingungkan, ada yang bisa dihubungi?', a: 'Tentu. Hubungi kami lewat WhatsApp dan kami akan bantu dengan senang hati. Kami balas dalam 1 hari kerja.' },
    ],
  },
  howItWorks: {
    steps: [
      { title: 'Coba dulu, gratis', description: 'Tanpa daftar, tanpa bayar. Pilih template, masukkan nama, dan lihat hasilnya langsung.' },
      { title: 'Bayar sekali', description: 'Rp 149.000 untuk 6 bulan penuh. Tidak ada biaya tambahan atau langganan.' },
      { title: 'Isi detail & bagikan', description: 'Lengkapi detail acara, masukkan foto, pilih musik. Siap dalam kurang dari 30 menit.' },
    ],
  },
}

export const landingSettings = {
  // Tidak ada satu pun pemanggil landingSettings.save() di app/, jadi aman
  // di-cache() tanpa perlu khawatir save-then-get dalam request yang sama.
  get: cache(async (): Promise<LandingPageSettings> => {
    const row = await prisma.appSetting.findUnique({ where: { key: 'landing' } })
    if (!row) return DEFAULT_LANDING
    const stored = row.value as Partial<LandingPageSettings>
    return {
      hero: { ...DEFAULT_LANDING.hero, ...stored.hero },
      heroMockup: { ...DEFAULT_LANDING.heroMockup, ...stored.heroMockup },
      templateShowcase: { ...DEFAULT_LANDING.templateShowcase, ...stored.templateShowcase },
      personalisasiMockup: { ...DEFAULT_LANDING.personalisasiMockup, ...stored.personalisasiMockup },
      trustBar: { ...DEFAULT_LANDING.trustBar, ...stored.trustBar },
      testimonials: { ...DEFAULT_LANDING.testimonials, ...stored.testimonials },
      faq: { ...DEFAULT_LANDING.faq, ...stored.faq },
      howItWorks: { ...DEFAULT_LANDING.howItWorks, ...stored.howItWorks },
    }
  }),
  async save(data: LandingPageSettings): Promise<void> {
    await prisma.appSetting.upsert({
      where: { key: 'landing' },
      update: { value: data as object },
      create: { key: 'landing', value: data as object },
    })
  },
}

//  LANDING SECTIONS CONFIG

export interface LandingSectionConfig {
  id: string
  label: string
  visible: boolean
  order: number
}

const DEFAULT_SECTIONS: LandingSectionConfig[] = [
  { id: 'hero', label: 'Hero', visible: true, order: 0 },
  { id: 'trustBar', label: 'Trust Bar', visible: true, order: 1 },
  { id: 'templatePreview', label: 'Template Preview', visible: true, order: 2 },
  { id: 'featureShowcase', label: 'Fitur Unggulan', visible: true, order: 3 },
  { id: 'howItWorks', label: 'Cara Kerja', visible: true, order: 4 },
  { id: 'testimonials', label: 'Testimoni', visible: true, order: 5 },
  { id: 'pricing', label: 'Harga', visible: true, order: 6 },
  { id: 'blogShowcase', label: 'Blog', visible: true, order: 7 },
  { id: 'faq', label: 'FAQ', visible: true, order: 8 },
  { id: 'closingCta', label: 'Closing CTA', visible: true, order: 9 },
]

export const landingSections = {
  async get(): Promise<LandingSectionConfig[]> {
    const row = await prisma.appSetting.findUnique({ where: { key: 'landing_sections' } })
    if (!row) return DEFAULT_SECTIONS
    const stored = row.value as unknown as LandingSectionConfig[]
    if (!Array.isArray(stored) || stored.length === 0) return DEFAULT_SECTIONS
    for (const def of DEFAULT_SECTIONS) {
      if (!stored.find(s => s.id === def.id)) stored.push(def)
    }
    return stored.sort((a, b) => a.order - b.order)
  },

  async save(sections: LandingSectionConfig[]): Promise<void> {
    await prisma.appSetting.upsert({
      where: { key: 'landing_sections' },
      update: { value: sections as unknown as import('@prisma/client').Prisma.InputJsonValue },
      create: { key: 'landing_sections', value: sections as unknown as import('@prisma/client').Prisma.InputJsonValue },
    })
  },
}
