import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session-server'
import { isAdmin } from '@/lib/auth'
import { settings } from '@/lib/db'

export const dynamic = 'force-dynamic'


interface Params { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, props: Params) {
  const params = await props.params;
  const session = await getSession()
  if (!isAdmin(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const s = await settings.get()
  const idx = s.templates.findIndex((t) => t.id === params.id)
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  s.templates[idx] = { ...s.templates[idx], ...body }
  await settings.save(s)
  return NextResponse.json({ template: s.templates[idx] })
}

export async function DELETE(_req: NextRequest, props: Params) {
  const params = await props.params;
  const session = await getSession()
  if (!isAdmin(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const s = await settings.get()
  const tpl = s.templates.find((t) => t.id === params.id)
  if (!tpl) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (tpl.isBuiltIn) return NextResponse.json({ error: 'Template bawaan tidak bisa dihapus' }, { status: 403 })

  s.templates = s.templates.filter((t) => t.id !== params.id)
  await settings.save(s)
  return NextResponse.json({ success: true })
}
