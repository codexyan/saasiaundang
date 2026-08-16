import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session-server'
import { affiliates, users, userReferrals } from '@/lib/db'
import { readJsonBody } from '@/lib/request-body'

export const dynamic = 'force-dynamic'

function generateCode(email: string): string {
  const base = email.split('@')[0].replace(/[^a-z0-9]/gi, '').slice(0, 8).toUpperCase()
  const suffix = Math.random().toString(36).slice(2, 5).toUpperCase()
  return `${base}-${suffix}`
}

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Sesi kamu sudah berakhir. Silakan masuk lagi ya.' }, { status: 401 })

  const user = await users.findById(session.userId)
  if (!user) return NextResponse.json({ error: 'Akunnya tidak ditemukan.' }, { status: 404 })

  let referralCode = user.referral_code
  if (!referralCode) {
    referralCode = generateCode(user.email)
    await users.setReferralCode(user.id, referralCode)
  }

  const stats = await userReferrals.countByReferrer(user.id)
  const referrals = await userReferrals.findByReferrerId(user.id)

  return NextResponse.json({
    referralCode,
    referralLink: `https://iaundang.online/order?ref=${referralCode}`,
    stats,
    referrals,
  })
}

export async function POST(req: NextRequest) {
  const { code } = await readJsonBody(req)
  if (!code) return NextResponse.json({ error: 'Kode referralnya belum diisi.' }, { status: 400 })

  const affiliate = await affiliates.findByCode(code)
  if (!affiliate || !affiliate.isActive) {
    return NextResponse.json({ error: 'Kode referralnya tidak dikenali.' }, { status: 404 })
  }

  await affiliates.incrementClicks(affiliate.id)

  const res = NextResponse.json({ ok: true, affiliateId: affiliate.id })
  res.cookies.set('ref', code, { maxAge: 60 * 60 * 24 * 30, path: '/', httpOnly: true, sameSite: 'lax' })
  return res
}
