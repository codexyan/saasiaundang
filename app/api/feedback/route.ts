import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session-server'
import { userFeedback } from '@/lib/db'
import { readJsonBody } from '@/lib/request-body'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await readJsonBody(req)
  const { score, comment, page, type } = body

  if (score === undefined || score < 0 || score > 10) {
    return NextResponse.json({ error: 'Score harus 0-10' }, { status: 400 })
  }

  const feedback = await userFeedback.create({
    user_id: session.userId,
    type: type || 'nps',
    score: Number(score),
    comment: comment || '',
    page: page || '',
  })

  return NextResponse.json({ feedback }, { status: 201 })
}

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [hasRecent, history] = await Promise.all([
    userFeedback.hasRecentFeedback(session.userId),
    userFeedback.findByUserId(session.userId),
  ])

  return NextResponse.json({ hasRecent, history })
}
