import { NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/route-guards'
import { affiliates } from '@/lib/db'
import { readJsonBody } from '@/lib/request-body'

export const dynamic = 'force-dynamic'

export const PATCH = withAdminAuth<{ params: Promise<{ id: string }> }>(async (req, session, props) => {
  const params = await props.params;

  const body = await readJsonBody(req)
  if (body.isActive !== undefined) {
    await affiliates.toggleActive(params.id, body.isActive)
  }
  return NextResponse.json({ ok: true })
})
