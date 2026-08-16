import { NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/route-guards'
import { musicCategories } from '@/lib/db'
import { readJsonBody } from '@/lib/request-body'

export const dynamic = 'force-dynamic'

export const PATCH = withAdminAuth<{ params: Promise<{ id: string }> }>(async (req, session, props) => {
  const params = await props.params;

  const body = await readJsonBody(req)
  const cat = await musicCategories.update(params.id, body)
  if (!cat) return NextResponse.json({ error: 'Datanya tidak ditemukan.' }, { status: 404 })
  return NextResponse.json({ category: cat })
})

export const DELETE = withAdminAuth<{ params: Promise<{ id: string }> }>(async (_req, session, props) => {
  const params = await props.params;

  const ok = await musicCategories.delete(params.id)
  if (!ok) return NextResponse.json({ error: 'Datanya tidak ditemukan.' }, { status: 404 })
  return NextResponse.json({ ok: true })
})
