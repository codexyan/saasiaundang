import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session-server'
import { subscriptions, daysRemaining } from '@/lib/subscription'
import { resolveTier } from '@/lib/tiers'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Sesi kamu sudah berakhir. Silakan masuk lagi ya.' }, { status: 401 })
  }

  const subs = await subscriptions.findByUser(session.userId)

  // resolveTier() dibungkus cache() per request lewat settings.get(), jadi
  // memanggilnya per langganan di sini tidak menambah query database.
  //
  // Cabang trial (tierName "Free Trial" dan field limits berisi TRIAL_LIMITS)
  // dibuang bersama mesin trialnya. Tidak ada lagi yang membuat langganan
  // trial, dan satu-satunya pemanggil endpoint ini, SubscriptionInfo, tidak
  // pernah membaca field limits.
  const result = await Promise.all(subs.map(async sub => {
    const pkg = await resolveTier(sub.tier)
    return {
      ...sub,
      tierName: pkg?.label ?? sub.tier,
      daysRemaining: daysRemaining(sub.expiresAt),
    }
  }))

  return NextResponse.json({ subscriptions: result })
}
