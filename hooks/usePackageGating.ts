import { useMemo } from 'react'
import type { PackageTier } from '@/lib/packages'
import { resolveTierDisplay, findCheapestTierWithFeature } from '@/lib/packages'
import type { TierFeatures, PriceTier } from '@/lib/types'

const SECTION_FEATURE_MAP: Record<string, keyof TierFeatures> = {
  hero: 'hero',
  profil: 'profiles',
  acara: 'events',
  cerita: 'story',
  hadiah: 'gift',
  galeri: 'gallery',
  musik: 'music',
  quote: 'quote',
  countdown: 'countdown',
  dekorasi: 'decoration_editing',
  video: 'video',
  livestream: 'livestream',
  ig_story: 'ig_story',
  qrcode: 'qrcode',
  gift_registry: 'gift_registry',
  penutup: 'closing',
}

/**
 * `priceTiers` opsional dan berasal dari server component (lihat komentar
 * SERVER-ONLY di lib/tiers.ts) — hook ini sendiri tidak boleh menyentuh
 * Prisma. Kalau tidak dikirim, resolveTierDisplay/findCheapestTierWithFeature
 * jatuh ke data lama supaya pemanggil yang belum sempat di-migrasi tetap jalan.
 */
export function usePackageGating(tier: PackageTier | string | null | undefined, priceTiers?: PriceTier[]) {
  return useMemo(() => {
    const effectiveTier = tier ?? 'starter'
    const { label, features } = resolveTierDisplay(priceTiers, effectiveTier)
    return {
      tier: effectiveTier,
      tierName: label,
      features,
      canEditDecorations: features.decoration_editing,
      canUseCustomAnimations: features.custom_animations,
      maxDecorationAssets: features.max_decoration_assets,
      maxPhotos: features.max_photos,
      isSectionAllowed(studioSectionId: string): boolean {
        const featureKey = SECTION_FEATURE_MAP[studioSectionId]
        if (!featureKey) return true
        return !!features[featureKey]
      },
      getRequiredTier(studioSectionId: string): string | undefined {
        const featureKey = SECTION_FEATURE_MAP[studioSectionId]
        if (!featureKey) return undefined
        if (features[featureKey]) return undefined
        return findCheapestTierWithFeature(priceTiers, featureKey)
      },
    }
  }, [tier, priceTiers])
}
