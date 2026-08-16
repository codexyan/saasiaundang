import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session-server'
import { subscriptions, daysRemaining, TRIAL_TIER, TRIAL_LIMITS } from '@/lib/subscription'
import { PACKAGES, type PackageTier } from '@/lib/packages'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Sesi kamu sudah berakhir. Silakan masuk lagi ya.' }, { status: 401 })
  }

  const subs = await subscriptions.findByUser(session.userId)

  const result = subs.map(sub => {
    const isTrial = sub.tier === TRIAL_TIER
    const pkg = isTrial ? null : PACKAGES[sub.tier as PackageTier]
    return {
      ...sub,
      tierName: isTrial ? 'Free Trial' : (pkg?.name ?? sub.tier),
      daysRemaining: daysRemaining(sub.expiresAt),
      limits: isTrial ? TRIAL_LIMITS : undefined,
    }
  })

  return NextResponse.json({ subscriptions: result })
}
