import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session-server'
import { isAdmin } from '@/lib/auth'
import { settings } from '@/lib/db'
import type { ColorPalette } from '@/lib/types'

export const dynamic = 'force-dynamic'

interface Params { params: Promise<{ id: string }> }

const HEX_RE = /^#[0-9a-fA-F]{6}$/

export async function PATCH(req: NextRequest, props: Params) {
  const params = await props.params;
  const session = await getSession()
  if (!isAdmin(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const s = await settings.get()
  const idx = s.colorPalettes.findIndex((p) => p.id === params.id)
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const current = s.colorPalettes[idx]
  if (current.is_built_in) return NextResponse.json({ error: 'Palet bawaan tidak bisa diubah' }, { status: 403 })

  const next: ColorPalette = {
    ...current,
    name: typeof body.name === 'string' && body.name.trim() ? body.name.trim() : current.name,
    group: typeof body.group === 'string' && body.group.trim() ? body.group.trim() : current.group,
    primary: typeof body.primary === 'string' && HEX_RE.test(body.primary) ? body.primary : current.primary,
    accent: typeof body.accent === 'string' && HEX_RE.test(body.accent) ? body.accent : current.accent,
    text: typeof body.text === 'string' && HEX_RE.test(body.text) ? body.text : current.text,
    background: typeof body.background === 'string' && HEX_RE.test(body.background) ? body.background : current.background,
  }
  s.colorPalettes[idx] = next
  await settings.save(s)
  return NextResponse.json({ palette: next })
}

export async function DELETE(_req: NextRequest, props: Params) {
  const params = await props.params;
  const session = await getSession()
  if (!isAdmin(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const s = await settings.get()
  const target = s.colorPalettes.find((p) => p.id === params.id)
  if (!target) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (target.is_built_in) return NextResponse.json({ error: 'Palet bawaan tidak bisa dihapus' }, { status: 403 })

  s.colorPalettes = s.colorPalettes.filter((p) => p.id !== params.id)
  await settings.save(s)
  return NextResponse.json({ success: true })
}
