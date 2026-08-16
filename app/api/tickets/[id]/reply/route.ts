import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/session-server'
import { prisma } from '@/lib/prisma'
import { readJsonBody } from '@/lib/request-body'

export const dynamic = 'force-dynamic'

/** Batas panjang — lihat catatan di app/api/tickets/route.ts. */
const replySchema = z.object({
  message: z.string().max(5000),
})

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Sesi kamu sudah berakhir. Silakan masuk lagi ya.' }, { status: 401 })

  const parsed = replySchema.safeParse(await readJsonBody(req))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Pesannya belum diisi.' }, { status: 400 })
  }
  const message = parsed.data.message.trim()

  if (!message) {
    return NextResponse.json({ error: 'Pesannya belum diisi.' }, { status: 400 })
  }

  const ticket = await prisma.supportTicket.findUnique({ where: { id: params.id } })
  if (!ticket) return NextResponse.json({ error: 'Pesan bantuannya tidak ditemukan.' }, { status: 404 })
  if (ticket.userId !== session.userId) return NextResponse.json({ error: 'Kamu belum punya akses ke bagian ini.' }, { status: 403 })

  if (ticket.status === 'closed') {
    return NextResponse.json({ error: 'Percakapan ini sudah ditutup. Kirim pesan baru kalau masih ada yang perlu dibantu.' }, { status: 400 })
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
