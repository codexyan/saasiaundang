import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session-server'
import { isAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { readJsonBody } from '@/lib/request-body'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await getSession()
  if (!isAdmin(session)) return NextResponse.json({ error: 'Sesi kamu sudah berakhir. Silakan masuk lagi ya.' }, { status: 401 })

  const body = await readJsonBody(req)
  const message = String(body?.message || '').trim()

  if (!message) {
    return NextResponse.json({ error: 'Pesannya belum diisi.' }, { status: 400 })
  }

  const ticket = await prisma.supportTicket.findUnique({ where: { id: params.id } })
  if (!ticket) return NextResponse.json({ error: 'Pesan bantuannya tidak ditemukan.' }, { status: 404 })

  const reply = await prisma.ticketReply.create({
    data: {
      ticketId: params.id,
      userId: session!.userId,
      message,
      isAdmin: true,
    },
  })

  await prisma.supportTicket.update({
    where: { id: params.id },
    data: { status: 'in_progress' },
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
