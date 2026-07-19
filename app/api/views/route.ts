import { NextRequest, NextResponse } from 'next/server'
import { invitationViews } from '@/lib/db'
import { readJsonBody } from '@/lib/request-body'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { invitation_id, referrer } = await readJsonBody(req)
    if (!invitation_id) {
      return NextResponse.json({ error: 'invitation_id required' }, { status: 400 })
    }

    const ua = req.headers.get('user-agent') || ''

    await invitationViews.record({
      invitation_id,
      referrer: referrer || '',
      user_agent: ua,
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
