import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session-server'
import { isAdmin } from '@/lib/auth'
import { settings } from '@/lib/db'
import type { TemplateCategory } from '@/lib/types'
import { readJsonBody } from '@/lib/request-body'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (!isAdmin(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({ categories: (await settings.get()).categories })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!isAdmin(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await readJsonBody(req)
  const label = String(body?.label || '').trim()
  if (!label) return NextResponse.json({ error: 'Nama kategori wajib diisi' }, { status: 400 })

  const slug = String(body?.slug || label).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '')
  if (!/^[a-z0-9-]{2,30}$/.test(slug)) {
    return NextResponse.json({ error: 'Slug: 2-30 karakter, huruf kecil + angka + strip' }, { status: 400 })
  }

  const s = await settings.get()
  if (s.categories.find((c) => c.slug === slug)) {
    return NextResponse.json({ error: 'Kategori dengan slug itu sudah ada' }, { status: 409 })
  }

  const category: TemplateCategory = { slug, label, is_built_in: false }
  s.categories = [...s.categories, category]
  await settings.save(s)
  return NextResponse.json({ category }, { status: 201 })
}
