import { NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/route-guards'
import { userFeedback } from '@/lib/db'

export const dynamic = 'force-dynamic'

export const GET = withAdminAuth(async () => {
  const [nps, all] = await Promise.all([
    userFeedback.getAverageNps(),
    userFeedback.findAll(200),
  ])

  return NextResponse.json({ nps, feedback: all })
})
