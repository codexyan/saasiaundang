import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session-server'
import { galleries, invitations } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/galleries?invitationId=xxx
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Sesi kamu sudah berakhir. Silakan masuk lagi ya.' }, { status: 401 })

  const invitationId = req.nextUrl.searchParams.get('invitationId') || ''
  const inv = await invitations.findById(invitationId)
  if (!inv || inv.user_id !== session.userId) {
    return NextResponse.json({ error: 'Datanya tidak ditemukan.' }, { status: 404 })
  }

  return NextResponse.json({ galleries: await galleries.findByInvitationId(invitationId) })
}
