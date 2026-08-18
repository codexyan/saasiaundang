import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { invitations, wishes } from '@/lib/db'
import { getSession } from '@/lib/session-server'
import { readJsonBody } from '@/lib/request-body'

export const dynamic = 'force-dynamic'

// Lihat catatan di app/api/rsvp/route.ts: id undangan adalah cuid, bukan uuid.
// z.string().uuid() di sini menolak setiap ucapan dari undangan sungguhan.
const schema = z.object({
  invitationId: z.string().min(1).max(64),
  name: z.string().min(1).max(100),
  message: z.string().min(1).max(500),
})

export async function POST(req: NextRequest) {
  try {
    const body = await readJsonBody(req)
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Ada data yang belum sesuai. Coba periksa lagi ya.' }, { status: 400 })
    }

    const { invitationId, name, message } = parsed.data

    const inv = await invitations.findById(invitationId)
    if (!inv || !inv.is_published) {
      return NextResponse.json({ error: 'Undangannya tidak ditemukan. Coba periksa lagi alamatnya.' }, { status: 404 })
    }

    const wish = await wishes.create({ invitation_id: invitationId, name, message })
    return NextResponse.json({ wish })
  } catch (error) {
    console.error('Wishes error:', error)
    return NextResponse.json({ error: 'Ucapannya gagal tersimpan. Coba lagi sebentar lagi ya.' }, { status: 500 })
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
    if (!inv) return NextResponse.json({ error: 'Datanya tidak ditemukan.' }, { status: 404 })

    if (!inv.is_published) {
      const session = await getSession()
      if (!session || inv.user_id !== session.userId) {
        return NextResponse.json({ error: 'Datanya tidak ditemukan.' }, { status: 404 })
      }
    }

    return NextResponse.json({ wishes: await wishes.findByInvitationId(invitationId) })
  } catch (error) {
    console.error('Wishes GET error:', error)
    return NextResponse.json({ error: 'Ucapannya gagal dimuat. Coba muat ulang halaman ya.' }, { status: 500 })
  }
}
