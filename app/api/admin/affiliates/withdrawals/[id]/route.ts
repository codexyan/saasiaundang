import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session-server'
import { isAdmin } from '@/lib/auth'
import { affiliateWithdrawals } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await getSession()
  if (!isAdmin(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { action, adminNotes } = await req.json()

  let changed: boolean
  if (action === 'approve') {
    changed = await affiliateWithdrawals.approve(params.id, adminNotes)
  } else if (action === 'reject') {
    changed = await affiliateWithdrawals.reject(params.id, adminNotes || 'Ditolak oleh admin')
  } else {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  // false = permintaannya sudah tidak 'pending' (klik ganda, atau sudah
  // diproses admin lain). Bukan error, tapi jangan laporkan seolah berhasil.
  if (!changed) {
    return NextResponse.json(
      { ok: false, error: 'Permintaan ini sudah diproses sebelumnya.' },
      { status: 409 }
    )
  }

  return NextResponse.json({ ok: true })
}
