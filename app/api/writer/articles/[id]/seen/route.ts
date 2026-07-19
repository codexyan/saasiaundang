import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session-server'
import { isWriter, isAdmin } from '@/lib/auth'
import { articles } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Called when the writer opens an article in the editor — clears the
// "unseen revision" flag that drives the nav notification badge.
export async function POST(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await getSession()
  if (!isWriter(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const article = await articles.findById(params.id)
  if (!article) {
    return NextResponse.json({ error: 'Artikel tidak ditemukan' }, { status: 404 })
  }
  if (!isAdmin(session) && article.authorId !== session!.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const updated = await articles.markRevisionSeen(params.id)
  return NextResponse.json({ article: updated })
}
