import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { invitations, wishes } from '@/lib/db'
import { readJsonBody } from '@/lib/request-body'

export const dynamic = 'force-dynamic'

const schema = z.object({
  invitationId: z.string().uuid(),
  name: z.string().min(1).max(100),
  message: z.string().min(1).max(500),
})

export async function POST(req: NextRequest) {
  try {
    const body = await readJsonBody(req)
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 })
    }

    const { invitationId, name, message } = parsed.data

    const inv = await invitations.findById(invitationId)
    if (!inv || !inv.is_published) {
      return NextResponse.json({ error: 'Undangan tidak ditemukan' }, { status: 404 })
    }

    const wish = await wishes.create({ invitation_id: invitationId, name, message })
    return NextResponse.json({ wish })
  } catch (error) {
    console.error('Wishes error:', error)
    return NextResponse.json({ error: 'Gagal menyimpan ucapan' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const invitationId = req.nextUrl.searchParams.get('invitationId') || ''
    return NextResponse.json({ wishes: await wishes.findByInvitationId(invitationId) })
  } catch (error) {
    console.error('Wishes GET error:', error)
    return NextResponse.json({ error: 'Gagal memuat ucapan' }, { status: 500 })
  }
}
