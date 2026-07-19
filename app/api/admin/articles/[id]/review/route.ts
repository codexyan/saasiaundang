import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session-server'
import { isAdmin } from '@/lib/auth'
import { articles } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Admin editorial actions on an article. Body: { action, notes?, scheduledAt? }
//   approve  → publish now (status 'published', isPublished true)
//   reject   → status 'needs_revision' with review notes back to the writer
//   schedule → status 'scheduled', auto-published later by the cron
//   archive  → status 'archived', unpublished
export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await getSession()
  if (!isAdmin(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const existing = await articles.findById(params.id)
  if (!existing) {
    return NextResponse.json({ error: 'Artikel tidak ditemukan' }, { status: 404 })
  }

  const body = await req.json()
  const action = body.action as string

  try {
    let article
    switch (action) {
      case 'approve':
        article = await articles.approve(params.id, session!.userId)
        break
      case 'reject':
        article = await articles.requestRevision(params.id, body.notes ?? '')
        break
      case 'schedule': {
        const when = body.scheduledAt ? new Date(body.scheduledAt) : null
        if (!when || isNaN(when.getTime())) {
          return NextResponse.json({ error: 'scheduledAt tidak valid' }, { status: 400 })
        }
        article = await articles.schedule(params.id, when, session!.userId)
        break
      }
      case 'archive':
        article = await articles.archive(params.id)
        break
      default:
        return NextResponse.json({ error: 'Action tidak dikenal' }, { status: 400 })
    }
    return NextResponse.json({ article })
  } catch (error) {
    console.error('Article review error:', error)
    return NextResponse.json({ error: 'Gagal memproses aksi' }, { status: 500 })
  }
}
