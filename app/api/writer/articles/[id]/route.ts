import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session-server'
import { isWriter, isAdmin } from '@/lib/auth'
import { articles, writerProfiles } from '@/lib/db'

export const dynamic = 'force-dynamic'

async function canAccess(articleId: string) {
  const session = await getSession()
  if (!isWriter(session)) return null
  const article = await articles.findById(articleId)
  if (!article) return null
  if (isAdmin(session)) return session
  if (article.authorId !== session!.userId) return null
  return session
}

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await canAccess(params.id)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await req.json()

  // Admin keeps full control through this route (back-compat).
  if (isAdmin(session)) {
    const article = await articles.update(params.id, body)
    return NextResponse.json({ article })
  }

  // Non-admin writers may only edit content fields — editorial/privileged
  // fields are stripped so they can't self-publish or forge review state.
  const { isPublished, status, publishedAt, reviewedBy, reviewNotes, submittedAt, scheduledAt, ...safe } = body
  await articles.update(params.id, safe)

  // If the writer intends to publish, enforce the trust gate: trusted writers
  // publish directly, everyone else is forced into 'pending_review'.
  const wantsPublish = isPublished === true || status === 'published'
  if (wantsPublish) {
    const profile = await writerProfiles.findByUserId(session!.userId)
    const article = profile?.isTrusted
      ? await articles.approve(params.id, session!.userId)
      : await articles.submitForReview(params.id)
    return NextResponse.json({ article, gated: !profile?.isTrusted })
  }

  const article = await articles.findById(params.id)
  return NextResponse.json({ article })
}

export async function DELETE(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await canAccess(params.id)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await articles.delete(params.id)
  return NextResponse.json({ ok: true })
}
