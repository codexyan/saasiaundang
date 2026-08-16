import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/session-server'
import { prisma } from '@/lib/prisma'
import { readJsonBody } from '@/lib/request-body'

export const dynamic = 'force-dynamic'

/**
 * Yang ditutup di sini batas panjangnya. `String(body?.x || '')` yang lama
 * sudah aman soal tipe, tapi tidak ada apa pun yang mencegah judul/pesan
 * sepanjang megabyte tersimpan ke database — lalu dirender utuh di panel admin
 * saat tiket dibaca.
 *
 * Pemeriksaan "belum lengkap" tetap dilakukan setelah `.trim()` di bawah,
 * supaya pesan errornya tidak berubah dan spasi-saja tetap dianggap kosong.
 */
const ticketSchema = z.object({
  subject: z.string().max(200),
  message: z.string().max(5000),
})

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Sesi kamu sudah berakhir. Silakan masuk lagi ya.' }, { status: 401 })

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
  if (!session) return NextResponse.json({ error: 'Sesi kamu sudah berakhir. Silakan masuk lagi ya.' }, { status: 401 })

  const parsed = ticketSchema.safeParse(await readJsonBody(req))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Judul dan isi pesannya belum lengkap.' }, { status: 400 })
  }
  const subject = parsed.data.subject.trim()
  const message = parsed.data.message.trim()

  if (!subject || !message) {
    return NextResponse.json({ error: 'Judul dan isi pesannya belum lengkap.' }, { status: 400 })
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
