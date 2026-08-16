import { NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/route-guards'
import { articleCategories } from '@/lib/db'
import { slugify } from '@/lib/article-markdown'
import { readJsonBody } from '@/lib/request-body'

export const dynamic = 'force-dynamic'

export const GET = withAdminAuth(async () => {
  return NextResponse.json({ categories: await articleCategories.findAll() })
})

export const POST = withAdminAuth(async (req) => {
  try {
    const body = await readJsonBody(req)
    const name = (body.name ?? '').trim()
    if (!name) {
      return NextResponse.json({ error: 'Nama kategori wajib diisi' }, { status: 400 })
    }
    const slug = (body.slug ?? '').trim() || slugify(name)
    const category = await articleCategories.create({ name, slug, sortOrder: body.sortOrder })
    return NextResponse.json({ category }, { status: 201 })
  } catch (error) {
    console.error('Category POST error:', error)
    return NextResponse.json({ error: 'Gagal membuat kategori (nama/slug mungkin sudah dipakai)' }, { status: 400 })
  }
})
