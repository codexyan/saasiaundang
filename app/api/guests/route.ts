import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/session-server'
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
