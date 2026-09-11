// Sengaja dari './built-in-data', BUKAN './db' — lib/packages.ts diimpor oleh
// 5 komponen client, dan lewat './db' seluruh Prisma + pg ikut masuk bundle browser.
import { BUILT_IN_PRICE_TIERS } from './built-in-data'
import type { TierFeatures, SectionConfig, PriceTier } from './types'

export type PackageTier = 'starter' | 'popular' | 'eksklusif'

export interface PackageFeatures {
  name: string
  emoji: string
  price: number
  color: string
  maxPhotos: number     // -1 = unlimited
  maxGuests: number     // for guest blast, -1 = unlimited
  canChangeTemplate: boolean
  canCustomizeSections: boolean  // enable/disable sections
  canReorderSections: boolean    // drag-and-drop   true for ALL tiers
  canHideWishes: boolean
  hasCustomDomain: boolean
  hasWatermarkFree: boolean
  activeMonths: number
  rsvpLimit: number
}

export const PACKAGES: Record<PackageTier, PackageFeatures> = {
  starter: {
    name: 'Starter',
    emoji: '🌱',
    price: 79000,
    color: 'blue',
    maxPhotos: 10,
    maxGuests: 200,
    canChangeTemplate: false,
    canCustomizeSections: true,
    canReorderSections: true,
    canHideWishes: false,
    hasCustomDomain: false,
    hasWatermarkFree: false,
    activeMonths: 1,
    rsvpLimit: 200,
  },
  popular: {
    name: 'Popular',
    emoji: '✨',
    price: 149000,
    color: 'rose',
    maxPhotos: 20,
    maxGuests: 500,
    canChangeTemplate: false,
    canCustomizeSections: true,
    canReorderSections: true,
    canHideWishes: true,
    hasCustomDomain: false,
    hasWatermarkFree: true,
    activeMonths: 3,
    rsvpLimit: 500,
  },
  eksklusif: {
    name: 'Eksklusif',
    emoji: '👑',
    price: 249000,
    color: 'amber',
    maxPhotos: -1,
    maxGuests: -1,
    canChangeTemplate: false,
    canCustomizeSections: true,
    canReorderSections: true,
    canHideWishes: true,
    hasCustomDomain: true,
    hasWatermarkFree: true,
    activeMonths: 6,
    rsvpLimit: 1000,
  },
}

export function getPackage(tier?: PackageTier | null): PackageFeatures {
  return PACKAGES[tier ?? 'popular']
}

export function canDoFeature(
  tier: PackageTier | null | undefined,
  feature: keyof Pick<PackageFeatures,
    'canChangeTemplate' | 'canCustomizeSections' | 'canReorderSections' |
    'canHideWishes' | 'hasCustomDomain' | 'hasWatermarkFree'
  >
): boolean {
  return getPackage(tier)[feature] as boolean
}

export function getPhotoLimit(tier?: PackageTier | null): number {
  return getPackage(tier).maxPhotos
}

export function formatPrice(price: number): string {
  return `Rp ${price.toLocaleString('id-ID')}`
}

export const PACKAGE_LIST: PackageTier[] = ['starter', 'popular', 'eksklusif']

export function getTierFeatures(tier?: PackageTier | null): TierFeatures {
  const id = tier ?? 'popular'
  const found = BUILT_IN_PRICE_TIERS.find(t => t.id === id)
  return found?.features as TierFeatures
}

const SECTION_TIER_KEY: Record<string, keyof TierFeatures> = {
  hero: 'hero', profiles: 'profiles', events: 'events', quote: 'quote',
  countdown: 'countdown', gallery: 'gallery', rsvp: 'rsvp', wishes: 'wishes',
  story: 'story', video: 'video', gift: 'gift', 'gift-registry': 'gift_registry',
  livestream: 'livestream', 'ig-story': 'ig_story', qrcode: 'qrcode', closing: 'closing',
}

export function isSectionActiveForTier(section: SectionConfig, tier: PackageTier): boolean {
  const key = SECTION_TIER_KEY[section.type]
  if (!key) return true
  return !!getTierFeatures(tier)[key]
}

export function countActiveSections(sections: SectionConfig[], tier: PackageTier): number {
  return sections.filter(s => isSectionActiveForTier(s, tier)).length
}

/**
 * Resolusi tier dinamis untuk komponen CLIENT.
 *
 * lib/tiers.ts (resolveTier/resolveTierFeatures) adalah sumber kebenaran
 * sungguhan, tapi itu SERVER-ONLY karena menyentuh Prisma lewat
 * settings.get(). Komponen client (dashboard, Studio editor) menerima
 * `priceTiers` sebagai prop dari server component (lihat lib/tiers.ts),
 * lalu pakai fungsi ini untuk mencari tier yang relevan dari array itu.
 *
 * Fallback ke data lama (getPackage/getTierFeatures, hardcoded) kalau
 * pemanggil belum sempat dikirimi prop `priceTiers`, atau id-nya somehow
 * tidak ketemu — supaya tidak ada komponen yang tiba-tiba crash selama
 * migrasi bertahap.
 */
export function resolveTierDisplay(
  priceTiers: PriceTier[] | undefined,
  tierId: string | null | undefined
): { label: string; features: TierFeatures } {
  const found = priceTiers?.find(t => t.id === tierId)
  if (found?.features) return { label: found.label, features: found.features }
  const fallbackId = (tierId ?? 'popular') as PackageTier
  return { label: found?.label ?? getPackage(fallbackId).name, features: getTierFeatures(fallbackId) }
}

/** Tier mana saja yang PALING MURAH sudah menyertakan sebuah fitur, dari
 *  daftar priceTiers dinamis (diurutkan naik dari harga). Dipakai untuk
 *  pesan "upgrade ke paket X" di Studio editor. Fallback ke tiga tier tetap
 *  kalau priceTiers tidak dikirim. */
export function findCheapestTierWithFeature(
  priceTiers: PriceTier[] | undefined,
  featureKey: keyof TierFeatures
): string | undefined {
  const list = priceTiers?.length ? [...priceTiers].sort((a, b) => a.price - b.price) : null
  if (list) {
    for (const t of list) {
      if (t.features?.[featureKey]) return t.label
    }
    return list[list.length - 1]?.label
  }
  const fallbackOrder: PackageTier[] = ['starter', 'popular', 'eksklusif']
  for (const t of fallbackOrder) {
    if (getTierFeatures(t)[featureKey]) return getPackage(t).name
  }
  return getPackage('eksklusif').name
}
