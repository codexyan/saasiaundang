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

  if (action === 'approve') {
    await affiliateWithdrawals.approve(params.id, adminNotes)
  } else if (action === 'reject') {
    await affiliateWithdrawals.reject(params.id, adminNotes || 'Ditolak oleh admin')
  } else {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
