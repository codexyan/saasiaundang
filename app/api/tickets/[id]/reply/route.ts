import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session-server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const message = String(body?.message || '').trim()

  if (!message) {
    return NextResponse.json({ error: 'Pesan tidak boleh kosong' }, { status: 400 })
  }

  const ticket = await prisma.supportTicket.findUnique({ where: { id: params.id } })
  if (!ticket) return NextResponse.json({ error: 'Tiket tidak ditemukan' }, { status: 404 })
  if (ticket.userId !== session.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  if (ticket.status === 'closed') {
    return NextResponse.json({ error: 'Tiket sudah ditutup' }, { status: 400 })
  }

  const reply = await prisma.ticketReply.create({
    data: {
      ticketId: params.id,
      userId: session.userId,
      message,
      isAdmin: false,
    },
  })

  return NextResponse.json({
    ok: true,
    reply: {
      id: reply.id,
      message: reply.message,
      is_admin: reply.isAdmin,
      created_at: reply.createdAt.toISOString(),
    },
  })
}
