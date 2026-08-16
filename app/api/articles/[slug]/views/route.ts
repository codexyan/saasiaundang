import { NextResponse } from 'next/server'
import { articles } from '@/lib/db'
import { allowRequest } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

// Sengaja tanpa login — dipicu setiap pengunjung anonim yang membuka artikel.
export async function POST(_req: Request, props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  if (!(await allowRequest('COUNTER_RATE_LIMIT', `article-views:${params.slug}`))) {
    return NextResponse.json({ ok: true }) // diam-diam diabaikan, bukan error ke pengunjung
  }
  const article = await articles.findBySlug(params.slug)
  if (!article) {
    return NextResponse.json({ error: 'Datanya tidak ditemukan.' }, { status: 404 })
  }
  await articles.incrementViews(article.id)
  return NextResponse.json({ ok: true })
}
