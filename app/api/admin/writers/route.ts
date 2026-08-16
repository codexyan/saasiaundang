import { NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/route-guards'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// List content writers with their trust status + per-status article counts,
// so the admin can triage who has work waiting for review at a glance.
export const GET = withAdminAuth(async () => {
  const writers = await prisma.user.findMany({
    where: { role: 'content_writer' },
    orderBy: { createdAt: 'desc' },
    include: { writerProfile: true },
  })

  const grouped = writers.length
    ? await prisma.article.groupBy({
        by: ['authorId', 'status'],
        where: { authorId: { in: writers.map(w => w.id) } },
        _count: { _all: true },
      })
    : []

  const countsByAuthor: Record<string, Record<string, number>> = {}
  for (const g of grouped) {
    if (!g.authorId) continue
    countsByAuthor[g.authorId] ??= {}
    countsByAuthor[g.authorId][g.status] = g._count._all
  }

  const data = writers.map(w => {
    const c = countsByAuthor[w.id] ?? {}
    const total = Object.values(c).reduce((s, n) => s + n, 0)
    return {
      id: w.id,
      email: w.email,
      createdAt: w.createdAt.toISOString(),
      isTrusted: w.writerProfile?.isTrusted ?? false,
      counts: {
        draft: c.draft ?? 0,
        pending_review: c.pending_review ?? 0,
        needs_revision: c.needs_revision ?? 0,
        scheduled: c.scheduled ?? 0,
        published: c.published ?? 0,
        archived: c.archived ?? 0,
        total,
      },
    }
  })

  return NextResponse.json({ writers: data })
})
