import { NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/route-guards'
import { articles } from '@/lib/db'
import { readJsonBody } from '@/lib/request-body'

export const dynamic = 'force-dynamic'

export const GET = withAdminAuth(async () => {
  try {
    return NextResponse.json({ articles: await articles.findAll() })
  } catch (error) {
    console.error('Articles GET error:', error)
    return NextResponse.json({ error: 'Gagal memuat artikel' }, { status: 500 })
  }
})

export const POST = withAdminAuth(async (req, session) => {
  try {
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
      authorId: session.userId,
      authorName: body.authorName || 'Admin',
      authorAvatar: body.authorAvatar || '',
      allowLikes: body.allowLikes ?? true,
      allowComments: body.allowComments ?? true,
      metaTitle: body.metaTitle || '',
      metaDesc: body.metaDesc || '',
      tags: body.tags || '',
      settings: body.settings,
    })
    return NextResponse.json({ article }, { status: 201 })
  } catch (error) {
    console.error('Articles POST error:', error)
    return NextResponse.json({ error: 'Gagal membuat artikel' }, { status: 500 })
  }
})
