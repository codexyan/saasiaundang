import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session-server'
import { isAdmin } from '@/lib/auth'
import { articleCategories } from '@/lib/db'
import { slugify } from '@/lib/article-markdown'
import { readJsonBody } from '@/lib/request-body'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (!isAdmin(session)) {
    return NextResponse.json({ error: 'Sesi kamu sudah berakhir. Silakan masuk lagi ya.' }, { status: 401 })
  }
  return NextResponse.json({ categories: await articleCategories.findAll() })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!isAdmin(session)) {
    return NextResponse.json({ error: 'Sesi kamu sudah berakhir. Silakan masuk lagi ya.' }, { status: 401 })
  }
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
}
