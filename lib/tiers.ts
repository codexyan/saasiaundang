import { settings } from './db'
import { BUILT_IN_PRICE_TIERS } from './built-in-data'
import type { PriceTier, TierFeatures } from './types'

/**
 * Sumber kebenaran paket — SATU, dan itu pengaturan admin.
 *
 * Sebelum berkas ini ada, definisi paket hidup di EMPAT tempat:
 *   settings.priceTiers   — diedit admin; hanya HARGA-nya yang dipakai
 *   PACKAGES              — hardcoded; yang benar-benar menegakkan watermark,
 *                           batas foto, dan masa aktif
 *   BUILT_IN_PRICE_TIERS  — hardcoded; dibaca getTierFeatures untuk batas dekorasi
 *   PRICING_CONFIG        — hardcoded; teks fitur di landing
 *
 * Akibatnya seluruh matriks fitur di panel Paket & Promo bersifat write-only:
 * admin menyalakan "Video" atau menaikkan batas foto, tersimpan rapi, dan tidak
 * ada satu pun penegak yang membacanya.
 *
 * Sekarang: `settings.priceTiers` yang berkuasa, `BUILT_IN_PRICE_TIERS` hanya
 * nilai awal kalau admin belum pernah menyentuhnya.
 *
 * SERVER-ONLY — menyentuh Prisma lewat settings.get(). Komponen client tidak
 * boleh mengimpornya; terima hasilnya sebagai props dari server component.
 */

export type TierId = string

/** Paket lengkap menurut pengaturan admin, dengan fallback ke bawaan. */
export async function resolveTier(tierId: string | null | undefined): Promise<PriceTier | null> {
  const id = tierId || 'popular'
  const s = await settings.get()
  const fromSettings = s.priceTiers.find(t => t.id === id)
  if (fromSettings) return fromSettings
  return BUILT_IN_PRICE_TIERS.find(t => t.id === id) ?? null
}

/** Fitur paket. Melempar kalau tiernya tidak dikenal sama sekali — menebak
 *  fitur berarti memberi akses yang tidak pernah dibeli. */
export async function resolveTierFeatures(tierId: string | null | undefined): Promise<TierFeatures> {
  const tier = await resolveTier(tierId)
  if (!tier?.features) {
    throw new Error(`Paket "${tierId}" tidak dikenal atau tidak punya definisi fitur`)
  }
  return tier.features
}

/** Masa aktif dalam HARI.
 *
 *  Satu satuan saja. Dulu ada dua: `validity_days` yang diedit admin dan
 *  ditampilkan ke pembeli di checkout, dan `activeMonths` hardcoded yang
 *  benar-benar dipakai saat menyediakan langganan. Keduanya kebetulan setara
 *  hari ini (30/90/180 vs 1/3/6 bulan) — dan akan langsung melenceng begitu
 *  admin menyentuh salah satunya.
 */
export async function resolveValidityDays(tierId: string | null | undefined): Promise<number> {
  const f = await resolveTierFeatures(tierId)
  return f.validity_days
}

/** Tanggal kedaluwarsa langganan untuk sebuah paket, dihitung dari `from`. */
export async function resolveExpiry(tierId: string | null | undefined, from = new Date()): Promise<Date> {
  const days = await resolveValidityDays(tierId)
  const d = new Date(from)
  d.setDate(d.getDate() + days)
  return d
}

// Perhitungan promo bersifat murni dan dipakai juga oleh komponen client, jadi
// tinggal di lib/pricing.ts. Di-re-export supaya pemanggil sisi server cukup
// mengimpor satu berkas.
export {
  isFlashSaleLive, findLiveFlashSale, applyDiscount,
  checkCoupon, computePrice,
} from './pricing'
export type { CouponCheck, CouponRejection, PriceBreakdown } from './pricing'
