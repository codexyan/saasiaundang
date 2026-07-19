import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session-server'
import { isAdmin } from '@/lib/auth'
import { articleCategories } from '@/lib/db'
import { slugify } from '@/lib/article-markdown'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await getSession()
  if (!isAdmin(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body = await req.json()
    const data: Partial<{ name: string; slug: string; sortOrder: number }> = {}
    if (body.name !== undefined) data.name = String(body.name).trim()
    if (body.slug !== undefined) data.slug = String(body.slug).trim() || slugify(String(body.name ?? ''))
    if (body.sortOrder !== undefined) data.sortOrder = Number(body.sortOrder)
    const category = await articleCategories.update(params.id, data)
    return NextResponse.json({ category })
  } catch (error) {
    console.error('Category PATCH error:', error)
    return NextResponse.json({ error: 'Gagal memperbarui kategori' }, { status: 400 })
  }
}

export async function DELETE(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await getSession()
  if (!isAdmin(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // Articles keep existing (categoryId set to NULL via onDelete: SetNull).
  await articleCategories.delete(params.id)
  return NextResponse.json({ ok: true })
}
