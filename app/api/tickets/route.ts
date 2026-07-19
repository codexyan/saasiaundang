import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session-server'
import { prisma } from '@/lib/prisma'
import { readJsonBody } from '@/lib/request-body'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tickets = await prisma.supportTicket.findMany({
    where: { userId: session.userId },
    include: { replies: { orderBy: { createdAt: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({
    tickets: tickets.map(t => ({
      id: t.id,
      subject: t.subject,
      message: t.message,
      status: t.status,
      priority: t.priority,
      created_at: t.createdAt.toISOString(),
      closed_at: t.closedAt?.toISOString() ?? null,
      replies: t.replies.map(r => ({
        id: r.id,
        message: r.message,
        is_admin: r.isAdmin,
        created_at: r.createdAt.toISOString(),
      })),
    })),
  })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await readJsonBody(req)
  const subject = String(body?.subject || '').trim()
  const message = String(body?.message || '').trim()

  if (!subject || !message) {
    return NextResponse.json({ error: 'Subjek dan pesan wajib diisi' }, { status: 400 })
  }

  const ticket = await prisma.supportTicket.create({
    data: {
      userId: session.userId,
      subject,
      message,
    },
  })

  return NextResponse.json({
    ok: true,
    ticket: {
      id: ticket.id,
      subject: ticket.subject,
      message: ticket.message,
      status: ticket.status,
      priority: ticket.priority,
      created_at: ticket.createdAt.toISOString(),
      closed_at: null,
      replies: [],
    },
  }, { status: 201 })
}
