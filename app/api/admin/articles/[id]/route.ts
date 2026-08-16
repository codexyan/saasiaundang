import { NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/route-guards'
import { articles } from '@/lib/db'
import { readJsonBody } from '@/lib/request-body'

export const dynamic = 'force-dynamic'

export const PATCH = withAdminAuth<{ params: Promise<{ id: string }> }>(async (req, session, props) => {
  const params = await props.params;
  const body = await readJsonBody(req)
  const article = await articles.update(params.id, body)
  return NextResponse.json({ article })
})

export const DELETE = withAdminAuth<{ params: Promise<{ id: string }> }>(async (_req, session, props) => {
  const params = await props.params;
  await articles.delete(params.id)
  return NextResponse.json({ ok: true })
})
