import { prisma } from './prisma'

export interface ExperimentConfig {
  id: string
  key: string
  name: string
  description: string
  variants: Record<string, { weight: number; value: unknown }>
  traffic: number
  is_active: boolean
  created_at: string
}

export interface VariantStats {
  variant: string
  views: number
  conversions: number
  conversionRate: number
}

export interface ExperimentReport {
  experiment: ExperimentConfig
  stats: VariantStats[]
  totalEvents: number
}

function mapExperiment(e: { id: string; key: string; name: string; description: string; variants: unknown; traffic: number; isActive: boolean; createdAt: Date }): ExperimentConfig {
  return {
    id: e.id, key: e.key, name: e.name, description: e.description,
    variants: e.variants as ExperimentConfig['variants'],
    traffic: e.traffic, is_active: e.isActive,
    created_at: e.createdAt.toISOString(),
  }
}

function pickVariant(variants: ExperimentConfig['variants'], sessionId: string): string {
  const keys = Object.keys(variants)
  if (keys.length === 0) return 'control'

  let hash = 0
  for (let i = 0; i < sessionId.length; i++) {
    hash = ((hash << 5) - hash + sessionId.charCodeAt(i)) | 0
  }
  const normalized = Math.abs(hash) / 2147483647

  const totalWeight = Object.values(variants).reduce((s, v) => s + v.weight, 0)
  let cumulative = 0
  for (const [key, config] of Object.entries(variants)) {
    cumulative += config.weight / totalWeight
    if (normalized <= cumulative) return key
  }
  return keys[keys.length - 1]
}

export const experiments = {
  async findByKey(key: string): Promise<ExperimentConfig | null> {
    const e = await prisma.experiment.findUnique({ where: { key } })
    return e ? mapExperiment(e) : null
  },

  async findAll(): Promise<ExperimentConfig[]> {
    const all = await prisma.experiment.findMany({ orderBy: { createdAt: 'desc' } })
    return all.map(mapExperiment)
  },

  async findActive(): Promise<ExperimentConfig[]> {
    const all = await prisma.experiment.findMany({ where: { isActive: true }, orderBy: { createdAt: 'desc' } })
    return all.map(mapExperiment)
  },

  async create(data: { key: string; name: string; description?: string; variants: ExperimentConfig['variants']; traffic?: number }): Promise<ExperimentConfig> {
    const e = await prisma.experiment.create({
      data: {
        key: data.key, name: data.name, description: data.description || '',
        variants: data.variants as unknown as import('@prisma/client').Prisma.InputJsonValue,
        traffic: data.traffic ?? 100,
      },
    })
    return mapExperiment(e)
  },

  async update(id: string, data: Partial<{ name: string; description: string; variants: ExperimentConfig['variants']; traffic: number; is_active: boolean }>): Promise<ExperimentConfig> {
    const e = await prisma.experiment.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.variants !== undefined && { variants: data.variants as unknown as import('@prisma/client').Prisma.InputJsonValue }),
        ...(data.traffic !== undefined && { traffic: data.traffic }),
        ...(data.is_active !== undefined && { isActive: data.is_active }),
      },
    })
    return mapExperiment(e)
  },

  async delete(id: string): Promise<void> {
    await prisma.experiment.delete({ where: { id } })
  },

  async assign(key: string, sessionId: string): Promise<{ variant: string; value: unknown } | null> {
    const exp = await this.findByKey(key)
    if (!exp || !exp.is_active) return null

    const variant = pickVariant(exp.variants, sessionId)
    const value = exp.variants[variant]?.value ?? null

    await prisma.experimentEvent.create({
      data: { experimentId: exp.id, variant, event: 'view', sessionId },
    }).catch(() => {})

    return { variant, value }
  },

  async trackConversion(key: string, sessionId: string, variant: string): Promise<void> {
    const exp = await this.findByKey(key)
    if (!exp) return

    await prisma.experimentEvent.create({
      data: { experimentId: exp.id, variant, event: 'conversion', sessionId },
    }).catch(() => {})
  },

  async getReport(id: string): Promise<ExperimentReport | null> {
    const exp = await prisma.experiment.findUnique({ where: { id } })
    if (!exp) return null

    // Dulu SETIAP baris event ditarik lalu dihitung di JS. Untuk eksperimen
    // yang berjalan lama itu bisa ratusan ribu baris masuk memori Worker hanya
    // untuk menghasilkan beberapa angka. groupBy membuat Postgres yang
    // menghitung, dan yang kembali hanya satu baris per (variant, event).
    const grouped = await prisma.experimentEvent.groupBy({
      by: ['variant', 'event'],
      where: { experimentId: id },
      _count: { _all: true },
    })

    const variantMap = new Map<string, { views: number; conversions: number }>()
    for (const key of Object.keys(exp.variants as Record<string, unknown>)) {
      variantMap.set(key, { views: 0, conversions: 0 })
    }

    for (const row of grouped) {
      const stats = variantMap.get(row.variant) ?? { views: 0, conversions: 0 }
      if (row.event === 'view') stats.views += row._count._all
      if (row.event === 'conversion') stats.conversions += row._count._all
      variantMap.set(row.variant, stats)
    }

    const stats: VariantStats[] = Array.from(variantMap.entries()).map(([variant, s]) => ({
      variant,
      views: s.views,
      conversions: s.conversions,
      conversionRate: s.views > 0 ? Math.round((s.conversions / s.views) * 10000) / 100 : 0,
    }))

    // Dulu `events.length` (jumlah baris yang ditarik). Sekarang barisnya tidak
    // ditarik lagi, jadi totalnya dijumlahkan dari hasil groupBy — angkanya
    // sama, tanpa memuat satu pun baris event ke memori.
    const totalEvents = grouped.reduce((sum, row) => sum + row._count._all, 0)

    return { experiment: mapExperiment(exp), stats, totalEvents }
  },
}
