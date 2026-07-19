import { NextResponse } from 'next/server'
import { articles } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(_req: Request, props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const article = await articles.findBySlug(params.slug)
  if (!article) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  await articles.incrementViews(article.id)
  return NextResponse.json({ ok: true })
}
