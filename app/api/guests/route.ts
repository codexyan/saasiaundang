import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/session-server'
import { resolveTierFeatures } from '@/lib/tiers'
import { guests, invitations } from '@/lib/db'
import { readJsonBody } from '@/lib/request-body'

export const dynamic = 'force-dynamic'

const createSchema = z.object({
  invitation_id: z.string().min(1),
  name: z.string().min(1).max(100),
  phone: z.string().max(20).default(''),
  group: z.string().max(50).default(''),
  note: z.string().max(200).default(''),
})

const updateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100).optional(),
  phone: z.string().max(20).optional(),
  group: z.string().max(50).optional(),
  note: z.string().max(200).optional(),
  attending: z.boolean().nullable().optional(),
  total_guests: z.number().min(1).max(10).optional(),
})

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Sesi kamu sudah berakhir. Silakan masuk lagi ya.' }, { status: 401 })

  const invitationId = req.nextUrl.searchParams.get('invitation_id')
  if (!invitationId) return NextResponse.json({ error: 'Undangannya belum dipilih.' }, { status: 400 })

  const inv = await invitations.findById(invitationId)
  if (!inv || inv.user_id !== session.userId) {
    return NextResponse.json({ error: 'Datanya tidak ditemukan.' }, { status: 404 })
  }

  const list = await guests.findByInvitationId(invitationId)
  const stats = await guests.countByInvitation(invitationId)

  return NextResponse.json({ guests: list, stats })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Sesi kamu sudah berakhir. Silakan masuk lagi ya.' }, { status: 401 })

  const body = await readJsonBody(req)
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ada data yang belum sesuai. Coba periksa lagi ya.', details: parsed.error.flatten() }, { status: 400 })
  }

  const inv = await invitations.findById(parsed.data.invitation_id)
  if (!inv || inv.user_id !== session.userId) {
    return NextResponse.json({ error: 'Datanya tidak ditemukan.' }, { status: 404 })
  }

  /**
   * Batas tamu mengikuti paket.
   *
   * `max_guests` sudah lama ada di definisi paket dan ditampilkan ke pembeli
   * di halaman harga ("hingga 200 tamu"), tapi TIDAK ADA satu pun tempat yang
   * menegakkannya — batas itu murni tulisan pemasaran. Sekarang ditegakkan di
   * satu-satunya jalur yang menambah tamu.
   */
  try {
    const features = await resolveTierFeatures(inv.package_tier)
    // -1 = tanpa batas.
    if (features.max_guests !== -1) {
      const existing = await guests.findByInvitationId(parsed.data.invitation_id)
      if (existing.length >= features.max_guests) {
        return NextResponse.json(
          { error: `Paketmu memuat maksimal ${features.max_guests} tamu. Tingkatkan paket untuk menambah lagi ya.` },
          { status: 400 },
        )
      }
    }
  } catch {
    // Paket tidak dikenal (undangan lama tanpa tier): jangan menghalangi.
  }

  const guest = await guests.create({
    invitation_id: parsed.data.invitation_id,
    name: parsed.data.name,
    phone: parsed.data.phone,
    group: parsed.data.group,
    note: parsed.data.note,
    source: 'manual',
    attending: null,
    total_guests: 1,
  })

  return NextResponse.json({ guest }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Sesi kamu sudah berakhir. Silakan masuk lagi ya.' }, { status: 401 })

  const body = await readJsonBody(req)
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ada data yang belum sesuai. Coba periksa lagi ya.' }, { status: 400 })
  }

  const { id, ...updates } = parsed.data

  // Wajib: update() hanya menerima id, jadi tanpa cek ini siapa pun yang login
  // bisa mengubah tamu milik undangan orang lain.
  if (!(await guests.isOwnedBy(id, session.userId))) {
    return NextResponse.json({ error: 'Datanya tidak ditemukan.' }, { status: 404 })
  }

  const guest = await guests.update(id, updates)
  return NextResponse.json({ guest })
}

export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Sesi kamu sudah berakhir. Silakan masuk lagi ya.' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Datanya belum lengkap.' }, { status: 400 })

  if (!(await guests.isOwnedBy(id, session.userId))) {
    return NextResponse.json({ error: 'Datanya tidak ditemukan.' }, { status: 404 })
  }

  await guests.delete(id)
  return NextResponse.json({ success: true })
}
