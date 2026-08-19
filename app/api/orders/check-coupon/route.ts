import { NextRequest, NextResponse } from 'next/server'
import { settings, templateRecords } from '@/lib/db'
import { checkCoupon, computePrice } from '@/lib/tiers'
import { readJsonBody } from '@/lib/request-body'
import { allowRequest } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

/**
 * Cek kode kupon sebelum pesanan dibuat.
 *
 * Memakai checkCoupon() dan computePrice() YANG SAMA dengan /api/orders, jadi
 * tidak ada celah antara harga yang dijanjikan di layar dan harga yang
 * benar-benar ditagih. Nilai diskon tidak pernah dikirim dari client.
 *
 * Sengaja tanpa login — pembeli belum punya akun saat memesan. Karena itu
 * dibatasi rate: tanpa itu endpoint ini jadi alat menebak kode kupon.
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || 'unknown'
  if (!(await allowRequest('COUNTER_RATE_LIMIT', `coupon-check:${ip}`))) {
    return NextResponse.json({ ok: false, message: 'Terlalu banyak percobaan. Coba lagi sebentar lagi ya.' }, { status: 429 })
  }

  const body = await readJsonBody(req)
  const code = String(body?.code ?? '').trim()
  const tierId = String(body?.package_tier ?? '').trim()
  const templateId = String(body?.template_id ?? '').trim()

  if (!code || !tierId) {
    return NextResponse.json({ ok: false, message: 'Kode kupon dan paket wajib diisi' }, { status: 400 })
  }

  const [appSettings, template] = await Promise.all([
    settings.get(),
    templateId ? templateRecords.findById(templateId) : Promise.resolve(null),
  ])

  const tier = appSettings.priceTiers.find(t => t.id === tierId)
  if (!tier) {
    return NextResponse.json({ ok: false, message: 'Paket yang dipilih belum kami kenali.' }, { status: 400 })
  }

  const scope = { tierId, category: template?.category }
  const check = checkCoupon(appSettings.coupons, code, scope)
  if (!check.ok) {
    return NextResponse.json({ ok: false, message: check.message })
  }

  const basePrice = template && template.price > 0 ? template.price : tier.price
  const price = computePrice({
    basePrice,
    tierId,
    category: template?.category,
    flashSales: appSettings.flashSales,
    coupons: appSettings.coupons,
    couponCode: code,
  })

  return NextResponse.json({
    ok: true,
    code: check.coupon.code,
    label: check.coupon.label,
    price,
  })
}
