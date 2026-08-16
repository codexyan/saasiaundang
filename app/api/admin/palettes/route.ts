import { NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/route-guards'
import { settings } from '@/lib/db'
import type { ColorPalette } from '@/lib/types'
import { readJsonBody } from '@/lib/request-body'

export const dynamic = 'force-dynamic'

const HEX_RE = /^#[0-9a-fA-F]{6}$/

function isHex(v: unknown): v is string {
  return typeof v === 'string' && HEX_RE.test(v)
}

export const GET = withAdminAuth(async () => {
  return NextResponse.json({ palettes: (await settings.get()).colorPalettes })
})

export const POST = withAdminAuth(async (req) => {
  const body = await readJsonBody(req)
  const name = String(body?.name || '').trim()
  const group = String(body?.group || '').trim()
  if (!name || !group) return NextResponse.json({ error: 'Nama dan grup wajib diisi' }, { status: 400 })
  if (!isHex(body.primary) || !isHex(body.accent) || !isHex(body.text) || !isHex(body.background)) {
    return NextResponse.json({ error: 'Semua warna wajib format #RRGGBB' }, { status: 400 })
  }

  const s = await settings.get()
  const id = String(body?.id || name).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '') || crypto.randomUUID().slice(0, 8)
  if (s.colorPalettes.find((p) => p.id === id)) {
    return NextResponse.json({ error: 'Palet dengan ID itu sudah ada' }, { status: 409 })
  }

  const palette: ColorPalette = {
    id,
    name,
    group,
    primary: body.primary,
    accent: body.accent,
    text: body.text,
    background: body.background,
    is_built_in: false,
  }
  s.colorPalettes = [...s.colorPalettes, palette]
  await settings.save(s)
  return NextResponse.json({ palette }, { status: 201 })
})
