import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session-server'
import { paymentProofs, invitations, users } from '@/lib/db'
import { readJsonBody } from '@/lib/request-body'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ proofs: await paymentProofs.findByUserId(session.userId) })
  } catch (error) {
    console.error('Payment proof GET error:', error)
    return NextResponse.json({ error: 'Gagal memuat data' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await readJsonBody(req)
    const { invitation_id, amount, bank_name, transfer_date, proof_url, notes } = body

    const inv = await invitations.findById(invitation_id)
    if (!inv || inv.user_id !== session.userId) return NextResponse.json({ error: 'Undangan tidak ditemukan' }, { status: 404 })

    if (inv.is_paid) return NextResponse.json({ error: 'Undangan sudah aktif' }, { status: 409 })

    const existingPending = (await paymentProofs.findByInvitationId(invitation_id)).find((p) => p.status === 'pending')
    if (existingPending) return NextResponse.json({ error: 'Sudah ada bukti transfer yang menunggu verifikasi' }, { status: 409 })

    const user = await users.findById(session.userId)
    const proof = await paymentProofs.create({
      invitation_id,
      user_id: session.userId,
      user_email: user?.email ?? session.email,
      slug: inv.slug,
      amount: Number(amount) || 0,
      bank_name: bank_name || '',
      transfer_date: transfer_date || '',
      proof_url: proof_url || '',
      notes: notes || '',
      status: 'pending',
      admin_notes: '',
    })

    return NextResponse.json({ proof }, { status: 201 })
  } catch (error) {
    console.error('Payment proof POST error:', error)
    return NextResponse.json({ error: 'Gagal mengirim bukti pembayaran' }, { status: 500 })
  }
}
