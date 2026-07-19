import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { invitations, guests } from '@/lib/db'
import { getSession } from '@/lib/session-server'
import { readJsonBody } from '@/lib/request-body'

export const dynamic = 'force-dynamic'

const schema = z.object({
  invitationId: z.string().uuid(),
  name: z.string().min(1).max(100),
  attending: z.boolean(),
  totalGuests: z.number().min(0).max(10),
})

export async function POST(req: NextRequest) {
  try {
    const body = await readJsonBody(req)
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 })
    }

    const { invitationId, name, attending, totalGuests } = parsed.data

    const inv = await invitations.findById(invitationId)
    if (!inv || !inv.is_published) {
      return NextResponse.json({ error: 'Undangan tidak ditemukan' }, { status: 404 })
    }

    const guest = await guests.create({
      invitation_id: invitationId,
      name,
      phone: '',
      group: '',
      note: '',
      source: 'rsvp',
      attending,
      total_guests: totalGuests,
    })

    return NextResponse.json({ guest })
  } catch (error) {
    console.error('RSVP error:', error)
    return NextResponse.json({ error: 'Gagal menyimpan RSVP' }, { status: 500 })
  }
}

/**
 * Daftar tamu sebuah undangan — HANYA untuk pemiliknya.
 *
 * Dulu endpoint ini tanpa autentikasi sama sekali: cukup kirim invitationId dan
 * seluruh daftar tamu keluar lengkap dengan NOMOR TELEPON (mapGuest menyertakan
 * phone/group/note). Padahal invitationId tampil terang-terangan di markup
 * halaman undangan publik (<ViewTracker invitationId=...>), jadi siapa pun bisa
 * memanennya lalu mengambil seluruh kontak tamu.
 *
 * Hanya dipanggil dari dashboard pemilik (DashboardOverview, RSVPList), jadi
 * menambahkan pemeriksaan sesi tidak mengubah alur tamu — form RSVP publik
 * memakai POST, bukan GET.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const invitationId = req.nextUrl.searchParams.get('invitationId') || ''
    if (!invitationId) {
      return NextResponse.json({ error: 'invitationId required' }, { status: 400 })
    }

    const inv = await invitations.findById(invitationId)
    if (!inv || inv.user_id !== session.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ guests: await guests.findByInvitationId(invitationId) })
  } catch (error) {
    console.error('RSVP GET error:', error)
    return NextResponse.json({ error: 'Gagal memuat data RSVP' }, { status: 500 })
  }
}
