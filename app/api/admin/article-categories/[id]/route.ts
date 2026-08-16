import { NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/route-guards'
import { articleCategories } from '@/lib/db'
import { slugify } from '@/lib/article-markdown'
import { readJsonBody } from '@/lib/request-body'

export const dynamic = 'force-dynamic'

export const PATCH = withAdminAuth<{ params: Promise<{ id: string }> }>(async (req, session, props) => {
  const params = await props.params;
  try {
    const body = await readJsonBody(req)
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
})

export const DELETE = withAdminAuth<{ params: Promise<{ id: string }> }>(async (_req, session, props) => {
  const params = await props.params;
  // Articles keep existing (categoryId set to NULL via onDelete: SetNull).
  await articleCategories.delete(params.id)
  return NextResponse.json({ ok: true })
})
