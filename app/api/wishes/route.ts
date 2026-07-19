import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { invitations, wishes } from '@/lib/db'
import { getSession } from '@/lib/session-server'
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

/**
 * Ucapan memang publik — tamu saling melihat ucapan di halaman undangan, jadi
 * endpoint ini sengaja tidak menuntut login.
 *
 * Yang diperbaiki: dulu `is_published` tidak diperiksa sama sekali, sehingga
 * ucapan pada undangan yang MASIH DRAF pun bisa dibaca siapa saja yang tahu
 * invitationId (dan id itu tampil di markup halaman undangan). Sekarang undangan
 * yang belum terbit hanya bisa dilihat pemiliknya sendiri.
 */
export async function GET(req: NextRequest) {
  try {
    const invitationId = req.nextUrl.searchParams.get('invitationId') || ''
    if (!invitationId) return NextResponse.json({ wishes: [] })

    const inv = await invitations.findById(invitationId)
    if (!inv) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (!inv.is_published) {
      const session = await getSession()
      if (!session || inv.user_id !== session.userId) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }
    }

    return NextResponse.json({ wishes: await wishes.findByInvitationId(invitationId) })
  } catch (error) {
    console.error('Wishes GET error:', error)
    return NextResponse.json({ error: 'Gagal memuat ucapan' }, { status: 500 })
  }
}
