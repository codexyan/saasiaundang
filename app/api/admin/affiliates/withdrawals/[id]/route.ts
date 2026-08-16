import { NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/route-guards'
import { affiliateWithdrawals } from '@/lib/db'
import { readJsonBody } from '@/lib/request-body'

export const dynamic = 'force-dynamic'

export const PATCH = withAdminAuth<{ params: Promise<{ id: string }> }>(async (req, session, props) => {
  const params = await props.params;

  const { action, adminNotes } = await readJsonBody(req)

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
})
