import { BUILT_IN_PRICE_TIERS } from './built-in-data'
import type { PriceTier, TierFeatures, FlashSale, Coupon } from './types'

/**
 * Perhitungan harga & promo — MURNI, tanpa akses database.
 *
 * Sengaja dipisah dari lib/tiers.ts: berkas itu memanggil settings.get() yang
 * menyeret Prisma, dan komponen client (halaman galeri template, form pesanan)
 * perlu memakai fungsi yang PERSIS SAMA dengan yang dipakai server saat
 * menagih. Pemisahan yang sama sudah dilakukan lib/packages.ts untuk alasan
 * ini juga — lihat komentarnya di sana.
 *
 * Satu fungsi untuk menampilkan dan untuk menagih adalah intinya: dulu halaman
 * publik menghitung diskon flash sale sendiri sementara /api/orders tidak
 * menyebut promo sama sekali, jadi pembeli melihat satu angka dan ditagih
 * angka lain.
 */

/** Paket bawaan sebagai nilai awal — dipakai kalau admin belum pernah
 *  menyentuh pengaturannya. */
export function builtInTier(tierId: string): PriceTier | null {
  return BUILT_IN_PRICE_TIERS.find(t => t.id === tierId) ?? null
}

export type { TierFeatures }

//  Promo

export function isFlashSaleLive(sale: FlashSale, now = new Date()): boolean {
  return sale.is_active
    && new Date(sale.start_date) <= now
    && new Date(sale.end_date) >= now
}

/** Flash sale yang sedang berjalan untuk kombinasi paket + kategori template. */
export function findLiveFlashSale(
  sales: FlashSale[],
  scope: { tierId: string; category?: string },
  now = new Date(),
): FlashSale | null {
  return sales.find(s =>
    isFlashSaleLive(s, now) && (
      s.scope === 'all'
      || (s.scope === 'tier' && s.scope_ids.includes(scope.tierId))
      || (s.scope === 'category' && !!scope.category && s.scope_ids.includes(scope.category))
    ),
  ) ?? null
}

export function applyDiscount(price: number, type: 'percentage' | 'fixed', value: number): number {
  const out = type === 'percentage'
    ? Math.round(price * (1 - value / 100))
    : price - value
  return Math.max(0, out)
}

export type CouponRejection =
  | 'not-found'
  | 'inactive'
  | 'not-started'
  | 'expired'
  | 'exhausted'
  | 'out-of-scope'

export type CouponCheck =
  | { ok: true; coupon: Coupon }
  | { ok: false; reason: CouponRejection; message: string }

const COUPON_MESSAGE: Record<CouponRejection, string> = {
  'not-found':    'Kode kuponnya tidak ditemukan.',
  'inactive':     'Kupon ini sedang tidak aktif.',
  'not-started':  'Kupon ini belum berlaku.',
  'expired':      'Kupon ini sudah kedaluwarsa.',
  'exhausted':    'Kuota kupon ini sudah habis.',
  'out-of-scope': 'Kupon ini tidak berlaku untuk paket atau tema yang dipilih.',
}

/**
 * Validasi kupon. Dipakai BAIK oleh endpoint pengecekan (agar pembeli tahu
 * sebelum submit) MAUPUN oleh /api/orders saat benar-benar menagih — supaya
 * tidak ada celah antara "yang dicek" dan "yang ditagih".
 */
export function checkCoupon(
  coupons: Coupon[],
  code: string,
  scope: { tierId: string; category?: string },
  now = new Date(),
): CouponCheck {
  const normalized = code.trim().toUpperCase()
  const coupon = coupons.find(c => c.code.toUpperCase() === normalized)

  const fail = (reason: CouponRejection): CouponCheck =>
    ({ ok: false, reason, message: COUPON_MESSAGE[reason] })

  if (!coupon) return fail('not-found')
  if (!coupon.is_active) return fail('inactive')
  if (coupon.valid_from && new Date(coupon.valid_from) > now) return fail('not-started')
  if (coupon.valid_until && new Date(coupon.valid_until) < now) return fail('expired')
  // max_uses 0 = tanpa batas.
  if (coupon.max_uses > 0 && coupon.used_count >= coupon.max_uses) return fail('exhausted')

  const inScope = coupon.scope === 'all'
    || (coupon.scope === 'tier' && coupon.scope_ids.includes(scope.tierId))
    || (coupon.scope === 'category' && !!scope.category && coupon.scope_ids.includes(scope.category))
  if (!inScope) return fail('out-of-scope')

  return { ok: true, coupon }
}

export interface PriceBreakdown {
  /** Harga dasar sebelum promo apa pun. */
  base: number
  /** Harga setelah flash sale dan kupon. */
  final: number
  flashSale: { label: string; saved: number } | null
  coupon: { code: string; saved: number } | null
}

/**
 * Hitung harga yang BENAR-BENAR ditagih.
 *
 * Satu fungsi dipakai halaman publik dan endpoint pesanan, supaya angka yang
 * dilihat pembeli dan angka yang ditagih tidak bisa berbeda. Dulu bisa:
 * halaman galeri menghitung diskon flash sale sendiri untuk ditampilkan,
 * sementara /api/orders tidak pernah menyebut promo sama sekali — pembeli
 * melihat Rp 104.300 lalu ditagih Rp 149.000.
 */
export function computePrice(input: {
  basePrice: number
  tierId: string
  category?: string
  flashSales: FlashSale[]
  coupons: Coupon[]
  couponCode?: string | null
  now?: Date
}): PriceBreakdown {
  const now = input.now ?? new Date()
  const scope = { tierId: input.tierId, category: input.category }

  let price = input.basePrice
  const out: PriceBreakdown = { base: input.basePrice, final: price, flashSale: null, coupon: null }

  const sale = findLiveFlashSale(input.flashSales, scope, now)
  if (sale) {
    const after = applyDiscount(price, sale.discount_type, sale.discount_value)
    out.flashSale = { label: sale.label, saved: price - after }
    price = after
  }

  if (input.couponCode) {
    const check = checkCoupon(input.coupons, input.couponCode, scope, now)
    if (check.ok) {
      const after = applyDiscount(price, check.coupon.discount_type, check.coupon.discount_value)
      out.coupon = { code: check.coupon.code, saved: price - after }
      price = after
    }
  }

  out.final = price
  return out
}

/**
 * Harga TERENDAH yang benar-benar bisa dibayar untuk sebuah template, untuk
 * label "Mulai dari" di galeri /templates dan halaman detail template.
 *
 * Dulu keduanya memajang "Gratis" untuk template berharga 0, padahal 0 berarti
 * "ikut harga paket" dan /api/orders menagih harga paket yang dipilih. Galeri
 * juga tidak mengenal paket untuk required_package 'all', jadi template
 * berharga 0 dengan syarat itu selalu tampil gratis walau tidak ada yang bisa
 * memesannya tanpa bayar.
 *
 * Aturan kelayakan paket disalin dari /api/orders supaya angka yang dipajang
 * tidak pernah lebih murah dari tagihan yang mungkin: paket diurutkan menurut
 * harga lalu diberi peringkat, paket di bawah peringkat required_package
 * ditolak, dan harga khusus template (price > 0) menggantikan harga paket.
 * Flash sale ikut dihitung lewat computePrice(). Kupon tidak, karena kupon baru
 * diketahui saat pembeli memasukkannya.
 */
export function startingPrice(input: {
  templatePrice: number
  requiredPackage: string
  category?: string
  tiers: PriceTier[]
  flashSales: FlashSale[]
  now?: Date
}): { tier: PriceTier; price: PriceBreakdown } | null {
  const sorted = [...input.tiers].sort((a, b) => a.price - b.price)
  // Peringkat 0 untuk id yang tidak dikenal, sama seperti `?? 0` di /api/orders.
  const rank = (id: string) => sorted.findIndex(t => t.id === id) + 1
  const needed = input.requiredPackage === 'all' ? 0 : rank(input.requiredPackage)

  let best: { tier: PriceTier; price: PriceBreakdown } | null = null
  for (const tier of sorted) {
    if (rank(tier.id) < needed) continue
    const price = computePrice({
      basePrice: input.templatePrice > 0 ? input.templatePrice : tier.price,
      tierId: tier.id,
      category: input.category,
      flashSales: input.flashSales,
      coupons: [],
      now: input.now,
    })
    if (!best || price.final < best.price.final) best = { tier, price }
  }
  return best
}
