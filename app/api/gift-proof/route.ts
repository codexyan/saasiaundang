import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { invitations, giftProofs } from '@/lib/db'
import { getSession } from '@/lib/session-server'
import { readJsonBody } from '@/lib/request-body'

export const dynamic = 'force-dynamic'

const schema = z.object({
  invitationId: z.string().min(1),
  name:         z.string().min(1).max(100),
  proofUrl:     z.string().min(1),
})

export async function POST(req: NextRequest) {
  const body   = await readJsonBody(req)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 })

  const { invitationId, name, proofUrl } = parsed.data

  // Skip DB check for preview mode
  if (invitationId !== 'preview') {
    const inv = await invitations.findById(invitationId)
    if (!inv || !inv.is_published) {
      return NextResponse.json({ error: 'Undangan tidak ditemukan' }, { status: 404 })
    }
    const proof = await giftProofs.create({ invitation_id: invitationId, name, proof_url: proofUrl })
    return NextResponse.json({ proof }, { status: 201 })
  }

  return NextResponse.json({ proof: { id: 'preview', invitation_id: invitationId, name, proof_url: proofUrl, created_at: new Date().toISOString() } }, { status: 201 })
}

/**
 * Daftar bukti hadiah — HANYA untuk pemilik undangan.
 *
 * Dulu tanpa autentikasi sama sekali: siapa pun yang tahu invitationId (dan id
 * itu tampil di markup halaman undangan publik) bisa menarik seluruh daftar
 * pengirim hadiah beserta URL gambar buktinya.
 *
 * Endpoint ini tidak dipanggil dari mana pun di aplikasi (sudah dicek: hanya
 * POST yang dipakai GiftSection), jadi mengetatkannya tidak memutus alur apa pun.
 */
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const invitationId = req.nextUrl.searchParams.get('invitationId') ?? ''
  if (!invitationId) return NextResponse.json({ proofs: [] })

  const inv = await invitations.findById(invitationId)
  if (!inv || inv.user_id !== session.userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ proofs: await giftProofs.findByInvitationId(invitationId) })
}
