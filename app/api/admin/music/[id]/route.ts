import { NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/route-guards'
import { musicTracks } from '@/lib/db'
import { readJsonBody } from '@/lib/request-body'

export const dynamic = 'force-dynamic'

export const PATCH = withAdminAuth<{ params: Promise<{ id: string }> }>(async (req, session, props) => {
  const params = await props.params;

  const body = await readJsonBody(req)
  const track = await musicTracks.update(params.id, body)
  if (!track) return NextResponse.json({ error: 'Datanya tidak ditemukan.' }, { status: 404 })
  return NextResponse.json({ track })
})

export const DELETE = withAdminAuth<{ params: Promise<{ id: string }> }>(async (_req, session, props) => {
  const params = await props.params;

  const ok = await musicTracks.delete(params.id)
  if (!ok) return NextResponse.json({ error: 'Datanya tidak ditemukan.' }, { status: 404 })
  return NextResponse.json({ ok: true })
})
