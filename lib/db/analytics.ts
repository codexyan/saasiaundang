import { prisma } from '../prisma'

// ─── INVITATION VIEWS (analytics) ─────────────────────────────

export interface InvitationViewRecord {
  id: string
  invitation_id: string
  viewed_at: string
  referrer: string
  user_agent: string
  country: string
}

export const invitationViews = {
  async record(data: { invitation_id: string; referrer?: string; user_agent?: string }): Promise<void> {
    await prisma.invitationView.create({
      data: {
        invitationId: data.invitation_id,
        referrer: data.referrer || '',
        userAgent: data.user_agent || '',
      },
    })
  },

  async countByInvitation(invitationId: string): Promise<number> {
    return prisma.invitationView.count({ where: { invitationId } })
  },

  async countByDateRange(invitationId: string, from: Date, to: Date): Promise<number> {
    return prisma.invitationView.count({
      where: { invitationId, viewedAt: { gte: from, lte: to } },
    })
  },

  async dailyCounts(invitationId: string, days: number = 30): Promise<{ date: string; count: number }[]> {
    const since = new Date()
    since.setDate(since.getDate() - days)
    since.setHours(0, 0, 0, 0)

    const views = await prisma.invitationView.findMany({
      where: { invitationId, viewedAt: { gte: since } },
      select: { viewedAt: true },
      orderBy: { viewedAt: 'asc' },
    })

    const map = new Map<string, number>()
    for (let i = 0; i < days; i++) {
      const d = new Date(since)
      d.setDate(d.getDate() + i)
      map.set(d.toISOString().slice(0, 10), 0)
    }
    for (const v of views) {
      const key = v.viewedAt.toISOString().slice(0, 10)
      map.set(key, (map.get(key) ?? 0) + 1)
    }
    return Array.from(map.entries()).map(([date, count]) => ({ date, count }))
  },

  /**
   * Dulu SETIAP baris view ditarik lalu dikelompokkan di JS — untuk undangan
   * yang ramai itu bisa puluhan ribu baris masuk memori Worker hanya untuk
   * mengambil 10 teratas. groupBy menyerahkan penghitungan, pengurutan, dan
   * pembatasan ke Postgres.
   */
  async topReferrers(invitationId: string, limit: number = 10): Promise<{ referrer: string; count: number }[]> {
    const grouped = await prisma.invitationView.groupBy({
      by: ['referrer'],
      where: { invitationId, referrer: { not: '' } },
      _count: { _all: true },
      orderBy: { _count: { referrer: 'desc' } },
      take: limit,
    })
    return grouped.map(row => ({ referrer: row.referrer, count: row._count._all }))
  },
}

// ─── USER FEEDBACK ────────────────────────────────────────────

export interface FeedbackRecord {
  id: string
  user_id: string
  type: string
  score: number
  comment: string
  page: string
  created_at: string
}

export const userFeedback = {
  async create(data: { user_id: string; type?: string; score: number; comment?: string; page?: string }): Promise<FeedbackRecord> {
    const r = await prisma.userFeedback.create({
      data: {
        userId: data.user_id,
        type: data.type || 'nps',
        score: data.score,
        comment: data.comment || '',
        page: data.page || '',
      },
    })
    return { id: r.id, user_id: r.userId, type: r.type, score: r.score, comment: r.comment, page: r.page, created_at: r.createdAt.toISOString() }
  },

  async findByUserId(userId: string): Promise<FeedbackRecord[]> {
    const all = await prisma.userFeedback.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } })
    return all.map(r => ({ id: r.id, user_id: r.userId, type: r.type, score: r.score, comment: r.comment, page: r.page, created_at: r.createdAt.toISOString() }))
  },

  async hasRecentFeedback(userId: string, days: number = 30): Promise<boolean> {
    const since = new Date()
    since.setDate(since.getDate() - days)
    const count = await prisma.userFeedback.count({
      where: { userId, createdAt: { gte: since } },
    })
    return count > 0
  },

  async getAverageNps(): Promise<{ average: number; total: number; promoters: number; passives: number; detractors: number }> {
    const all = await prisma.userFeedback.findMany({
      where: { type: 'nps' },
      select: { score: true },
    })
    if (all.length === 0) return { average: 0, total: 0, promoters: 0, passives: 0, detractors: 0 }
    const promoters = all.filter(f => f.score >= 9).length
    const detractors = all.filter(f => f.score <= 6).length
    const passives = all.length - promoters - detractors
    const nps = Math.round(((promoters - detractors) / all.length) * 100)
    return { average: nps, total: all.length, promoters, passives, detractors }
  },

  async findAll(limit: number = 100): Promise<FeedbackRecord[]> {
    const all = await prisma.userFeedback.findMany({ orderBy: { createdAt: 'desc' }, take: limit })
    return all.map(r => ({ id: r.id, user_id: r.userId, type: r.type, score: r.score, comment: r.comment, page: r.page, created_at: r.createdAt.toISOString() }))
  },
}
