import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session-server'
import { paymentProofs, invitations, users } from '@/lib/db'
import { readJsonBody } from '@/lib/request-body'
import { safeUrl } from '@/lib/html-safe'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Sesi kamu sudah berakhir. Silakan masuk lagi ya.' }, { status: 401 })
    return NextResponse.json({ proofs: await paymentProofs.findByUserId(session.userId) })
  } catch (error) {
    console.error('Payment proof GET error:', error)
    return NextResponse.json({ error: 'Datanya gagal dimuat. Coba muat ulang halaman ya.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Sesi kamu sudah berakhir. Silakan masuk lagi ya.' }, { status: 401 })

    const body = await readJsonBody(req)
    const { invitation_id, amount, bank_name, transfer_date, proof_url, notes } = body

    const inv = await invitations.findById(invitation_id)
    if (!inv || inv.user_id !== session.userId) return NextResponse.json({ error: 'Undangannya tidak ditemukan. Coba periksa lagi alamatnya.' }, { status: 404 })

    if (inv.is_paid) return NextResponse.json({ error: 'Undangan ini sudah aktif, jadi tidak perlu bayar lagi.' }, { status: 409 })

    const existingPending = (await paymentProofs.findByInvitationId(invitation_id)).find((p) => p.status === 'pending')
    if (existingPending) return NextResponse.json({ error: 'Bukti transfer kalian sedang kami periksa. Mohon tunggu ya.' }, { status: 409 })

    const user = await users.findById(session.userId)
    const proof = await paymentProofs.create({
      invitation_id,
      user_id: session.userId,
      user_email: user?.email ?? session.email,
      slug: inv.slug,
      amount: Number(amount) || 0,
      bank_name: bank_name || '',
      transfer_date: transfer_date || '',
      // Disaring protokolnya: nilai ini dikirim pembeli dan kemudian dirender
      // langsung sebagai href di panel admin, jadi `javascript:` di sini berarti
      // XSS yang menyasar admin saat ia memverifikasi pembayaran.
      proof_url: proof_url ? safeUrl(String(proof_url)) : '',
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
