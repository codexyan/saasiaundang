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
