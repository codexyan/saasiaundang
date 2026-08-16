import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session-server'
import { isWriter, isAdmin } from '@/lib/auth'
import { articles } from '@/lib/db'
import { readJsonBody } from '@/lib/request-body'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (!isWriter(session)) {
    return NextResponse.json({ error: 'Sesi kamu sudah berakhir. Silakan masuk lagi ya.' }, { status: 401 })
  }
  const list = isAdmin(session)
    ? await articles.findAll()
    : await articles.findByAuthorId(session!.userId)
  return NextResponse.json({ articles: list })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!isWriter(session)) {
    return NextResponse.json({ error: 'Sesi kamu sudah berakhir. Silakan masuk lagi ya.' }, { status: 401 })
  }
  const body = await readJsonBody(req)
  if (!body.title || !body.slug) {
    return NextResponse.json({ error: 'Title dan slug wajib diisi' }, { status: 400 })
  }
  const existing = await articles.findBySlug(body.slug)
  if (existing) {
    return NextResponse.json({ error: 'Slug sudah digunakan' }, { status: 409 })
  }
  const article = await articles.create({
    title: body.title,
    slug: body.slug,
    excerpt: body.excerpt || '',
    content: body.content || '',
    coverUrl: body.coverUrl || '',
    authorId: session!.userId,
    authorName: body.authorName || session!.email.split('@')[0],
    authorAvatar: body.authorAvatar || '',
    allowLikes: body.allowLikes ?? true,
    allowComments: body.allowComments ?? true,
    metaTitle: body.metaTitle || '',
    metaDesc: body.metaDesc || '',
    tags: body.tags || '',
    settings: body.settings,
    categoryId: body.categoryId || null,
  })
  return NextResponse.json({ article }, { status: 201 })
}
