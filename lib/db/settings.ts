import { cache } from 'react'
import { prisma } from '../prisma'
import { BUILT_IN_CATEGORIES, BUILT_IN_PRICE_TIERS, BUILT_IN_PALETTES } from '../built-in-data'
import type { TemplateCategory, ColorPalette, PriceTier, FlashSale, Coupon, TemplatePackageRequirement } from '../types'

export interface BankAccount {
  id: string
  bankName: string
  accountNumber: string
  accountName: string
  logoUrl: string
  isActive: boolean
}

export interface AdminTemplateConfig {
  id: string
  name: string
  description: string
  thumbnailUrl: string
  demoSlug: string
  tags: string[]
  enabled: boolean
  sortOrder: number
  themeColor: string
  isBuiltIn: boolean
  features: {
    gallery: boolean
    music: boolean
    countdown: boolean
    rsvp: boolean
    wishes: boolean
  }
  price: number
  required_package: TemplatePackageRequirement
}

export interface AppSettings {
  price: number
  packageName: string
  packageDuration: number
  promoEndDate: string
  templates: AdminTemplateConfig[]
  categories: TemplateCategory[]
  colorPalettes: ColorPalette[]
  priceTiers: PriceTier[]
  flashSales: FlashSale[]
  coupons: Coupon[]
  deletedCategoryIds: string[]
  deletedTierIds: string[]
  bankAccounts: BankAccount[]
  qrisImageUrl: string
  paymentInstructions: string
  confirmationWhatsapp: string
  siteName: string
  siteTagline: string
  logoHorizontalUrl: string
  logoVerticalUrl: string
  contactWhatsapp: string
  contactEmail: string
  socialInstagram: string
  socialTwitter: string
  socialGithub: string
  appDomain: string
  demoSubdomain: string
  maintenanceMode: boolean
}

//  SETTINGS

// Data bawaan dipindah ke lib/built-in-data.ts supaya bisa diimpor komponen
// client tanpa ikut menyeret Prisma/pg. Di-re-export di sini agar kode server
// lama yang mengimpornya dari @/lib/db tetap jalan.
export { BUILT_IN_CATEGORIES, BUILT_IN_PRICE_TIERS, BUILT_IN_PALETTES }

const BUILT_IN_TEMPLATES: AdminTemplateConfig[] = [
  {
    id: 'modern-white', name: 'Modern White', description: 'Bersih, minimalis, elegan.',
    thumbnailUrl: '/templates/modern-white/thumbnail.jpg', demoSlug: 'demo-modern',
    tags: ['minimalis', 'modern', 'putih'], enabled: true, price: 0, required_package: 'all',
    sortOrder: 1, themeColor: '#e11d48', isBuiltIn: true,
    features: { gallery: true, music: true, countdown: true, rsvp: true, wishes: true },
  },
  {
    id: 'floral-garden', name: 'Floral Garden', description: 'Penuh bunga dan warna hangat.',
    thumbnailUrl: '/templates/floral-garden/thumbnail.jpg', demoSlug: 'demo-floral',
    tags: ['bunga', 'romantis', 'feminin'], enabled: true, price: 0, required_package: 'all',
    sortOrder: 2, themeColor: '#ec4899', isBuiltIn: true,
    features: { gallery: true, music: true, countdown: true, rsvp: true, wishes: true },
  },
  {
    id: 'dark-elegant', name: 'Dark Elegant', description: 'Gelap, mewah, dan berkesan.',
    thumbnailUrl: '/templates/dark-elegant/thumbnail.jpg', demoSlug: 'demo-dark',
    tags: ['gelap', 'mewah', 'elegan'], enabled: true, price: 0, required_package: 'all',
    sortOrder: 3, themeColor: '#f59e0b', isBuiltIn: true,
    features: { gallery: true, music: true, countdown: true, rsvp: true, wishes: true },
  },
]

const DEFAULT_SETTINGS: AppSettings = {
  price: 149000, packageName: 'Popular', packageDuration: 3, promoEndDate: '2026-08-31',
  templates: BUILT_IN_TEMPLATES, categories: BUILT_IN_CATEGORIES, colorPalettes: BUILT_IN_PALETTES,
  priceTiers: BUILT_IN_PRICE_TIERS, flashSales: [], coupons: [],
  deletedCategoryIds: [], deletedTierIds: [],
  bankAccounts: [
    { id: 'bca-1', bankName: 'BCA', accountNumber: '8730456192', accountName: 'PT Iaundang Digital', isActive: true, logoUrl: '' },
    { id: 'bsi-1', bankName: 'BSI', accountNumber: '7210384756', accountName: 'PT Iaundang Digital', isActive: true, logoUrl: '' },
  ],
  qrisImageUrl: '',
  paymentInstructions: 'Pastikan nominal transfer sesuai dengan total tagihan (termasuk kode unik) agar pembayaran dapat diverifikasi.\n\nLangkah pembayaran:\n1. Transfer ke salah satu rekening di atas sesuai nominal yang tertera\n2. Screenshot bukti transfer\n3. Klik tombol "Konfirmasi via WhatsApp" dan kirimkan bukti transfer\n4. Tim kami akan memverifikasi dalam 1×24 jam kerja\n5. Setelah diverifikasi, akun login akan dikirim via WhatsApp/email\n\nCatatan:\n• Pembayaran berlaku 1×24 jam sejak pesanan dibuat\n• Jika ada kendala, silakan hubungi admin via WhatsApp',
  confirmationWhatsapp: '628123456789', siteName: 'iaundang', siteTagline: 'Digital Wedding Invitation',
  logoHorizontalUrl: '/logos/logo-horizontal.png', logoVerticalUrl: '/logos/logo-vertical.png',
  contactWhatsapp: '628123456789', contactEmail: 'halo@iaundang.online',
  socialInstagram: 'ia.undang', socialTwitter: 'iaundang', socialGithub: 'iaundang',
  appDomain: 'iaundang.online', demoSubdomain: 'demo',
  maintenanceMode: false,
}

export const settings = {
  // Dipanggil di puluhan lokasi (landing, order, templates, panel admin) tanpa
  // dedup sama sekali sebelumnya. Aman di-cache(): dicek seluruh pemanggil
  // settings.save() di app/api/admin/** — tidak ada satu pun yang memanggil
  // get() LAGI setelah save() dalam request yang sama (semuanya get()->mutate
  // lokal->save(), bukan save()->get()), jadi tidak ada risiko baca data basi
  // dalam satu request. Antar-request otomatis fresh karena cache() di-scope
  // per request, bukan cache global.
  get: cache(async (): Promise<AppSettings> => {
    const row = await prisma.appSetting.findUnique({ where: { key: 'main' } })
    const stored = (row?.value ?? {}) as Partial<AppSettings>

    let templates = BUILT_IN_TEMPLATES
    if (stored.templates && stored.templates.length > 0) {
      templates = stored.templates
      for (const b of BUILT_IN_TEMPLATES) {
        if (!templates.find(t => t.id === b.id)) templates.push(b)
      }
    }

    const deletedCatIds = new Set(stored.deletedCategoryIds ?? [])
    const deletedTierIds = new Set(stored.deletedTierIds ?? [])

    const storedCategories = (stored.categories ?? []) as TemplateCategory[]
    const categories: TemplateCategory[] = [
      ...BUILT_IN_CATEGORIES.filter(b => !deletedCatIds.has(b.slug)),
      ...storedCategories.filter(c => !BUILT_IN_CATEGORIES.find(b => b.slug === c.slug) && !deletedCatIds.has(c.slug)),
    ]

    const storedPalettes = (stored.colorPalettes ?? []) as ColorPalette[]
    const colorPalettes: ColorPalette[] = [
      ...BUILT_IN_PALETTES,
      ...storedPalettes.filter(p => !BUILT_IN_PALETTES.find(b => b.id === p.id)),
    ]

    const storedTiers = (stored.priceTiers ?? []) as PriceTier[]
    const priceTiers: PriceTier[] = [
      ...BUILT_IN_PRICE_TIERS.filter(b => !deletedTierIds.has(b.id)),
      ...storedTiers.filter(t => !BUILT_IN_PRICE_TIERS.find(b => b.id === t.id) && !deletedTierIds.has(t.id)),
    ]

    return { ...DEFAULT_SETTINGS, ...stored, templates, categories, colorPalettes, priceTiers, deletedCategoryIds: stored.deletedCategoryIds ?? [], deletedTierIds: stored.deletedTierIds ?? [], flashSales: stored.flashSales ?? [], coupons: stored.coupons ?? [], bankAccounts: stored.bankAccounts ?? [] }
  }),
  async save(data: AppSettings): Promise<void> {
    await prisma.appSetting.upsert({
      where: { key: 'main' },
      update: { value: data as object },
      create: { key: 'main', value: data as object },
    })
  },
}
