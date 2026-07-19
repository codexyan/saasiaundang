import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session-server'
import { isAffiliate } from '@/lib/auth'
import { affiliates, referrals, affiliateWithdrawals } from '@/lib/db'
import { readJsonBody } from '@/lib/request-body'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (!isAffiliate(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const affiliate = await affiliates.findByUserId(session!.userId)
  if (!affiliate) return NextResponse.json({ affiliate: null, referrals: [], withdrawals: [] })

  const [refs, withdraws] = await Promise.all([
    referrals.findByAffiliateId(affiliate.id),
    affiliateWithdrawals.findByAffiliateId(affiliate.id),
  ])

  return NextResponse.json({ affiliate, referrals: refs, withdrawals: withdraws })
}

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!isAffiliate(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const affiliate = await affiliates.findByUserId(session!.userId)
  if (!affiliate) return NextResponse.json({ error: 'Not an affiliate' }, { status: 404 })

  const body = await readJsonBody(req)
  if (body.bankName !== undefined) {
    await affiliates.updateBank(affiliate.id, {
      bankName: body.bankName || '',
      accountNo: body.accountNo || '',
      accountName: body.accountName || '',
    })
  }

  return NextResponse.json({ ok: true })
}
