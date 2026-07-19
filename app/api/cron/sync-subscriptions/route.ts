import { NextRequest, NextResponse } from 'next/server'
import { subscriptions } from '@/lib/subscription'
import { notifyUser } from '@/lib/notifications'
import { prisma } from '@/lib/prisma'
import { verifyBearer } from '@/lib/secure-compare'

export const dynamic = 'force-dynamic'

// Dipanggil oleh Cron Trigger Cloudflare lewat scheduled() di custom-worker.ts,
// yang mengirim header Authorization: Bearer ${CRON_SECRET}.
export async function GET(req: NextRequest) {
  // Dulu: `authHeader !== \`Bearer ${process.env.CRON_SECRET}\``. Kalau
  // CRON_SECRET tidak diset, string pembandingnya menjadi literal
  // "Bearer undefined" — siapa pun yang mengirim header itu lolos.
  if (!(await verifyBearer(req.headers.get('authorization'), process.env.CRON_SECRET))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const expiredCount = await subscriptions.syncExpiredStatuses()

  const expiringSoon = await subscriptions.findExpiringSoon()

  // Dulu: 2 query per langganan di dalam loop (N+1). Sekarang dua findMany
  // saja, lalu dicocokkan di memori — penting karena cron di Workers punya
  // batas CPU dan dulu loopnya tumbuh linear terhadap jumlah langganan.
  const [users, invitationList] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: [...new Set(expiringSoon.map(s => s.userId))] } },
      select: { id: true, email: true },
    }),
    prisma.invitation.findMany({
      where: { id: { in: [...new Set(expiringSoon.map(s => s.invitationId))] } },
      select: { id: true, slug: true },
    }),
  ])
  const emailByUserId = new Map(users.map(u => [u.id, u.email]))
  const slugByInvitationId = new Map(invitationList.map(i => [i.id, i.slug]))

  let notified = 0
  for (const sub of expiringSoon) {
    const email = emailByUserId.get(sub.userId)
    if (!email) continue

    const type = sub.tier === 'trial' ? 'trial_expiring' as const : 'subscription_expiring' as const
    await notifyUser(type, email, {
      slug: slugByInvitationId.get(sub.invitationId) ?? '',
      daysLeft: Math.ceil((new Date(sub.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      tierName: sub.tier,
      expiresAt: new Date(sub.expiresAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
    })
    notified++
  }

  return NextResponse.json({
    expired: expiredCount,
    expiring_soon_notified: notified,
    timestamp: new Date().toISOString(),
  })
}
