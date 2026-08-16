import { prisma } from '../prisma'
import type { TemplateRecord, TemplatePackageRequirement } from '../types'
import JAVANESE_GOLD from '../template-configs/javanese-gold'
import ROSE_GARDEN from '../template-configs/rose-garden'
import MIDNIGHT_LUXE from '../template-configs/midnight-luxe'

function mapTemplateRecord(t: {
  id: string; name: string; slug: string; category: string; config: unknown;
  thumbnailUrl: string; status: string; sortOrder: number; usageCount: number;
  price: number; requiredPackage: string; createdAt: Date
}): TemplateRecord {
  return {
    id: t.id, name: t.name, slug: t.slug, category: t.category,
    config: t.config as TemplateRecord['config'],
    thumbnail_url: t.thumbnailUrl, status: t.status as TemplateRecord['status'],
    sort_order: t.sortOrder, usage_count: t.usageCount, price: t.price,
    required_package: t.requiredPackage as TemplatePackageRequirement,
    created_at: t.createdAt.toISOString(),
  }
}

//  TEMPLATE RECORDS

const BUILT_IN_TEMPLATE_RECORDS: TemplateRecord[] = [JAVANESE_GOLD, ROSE_GARDEN, MIDNIGHT_LUXE]

export const templateRecords = {
  async findAll(): Promise<TemplateRecord[]> {
    const dbRecords = await prisma.templateRecord.findMany({ orderBy: { sortOrder: 'asc' } })
    const mapped = dbRecords.map(mapTemplateRecord)
    // Merge built-ins: DB overrides built-in by id if exists
    const map = new Map<string, TemplateRecord>()
    for (const t of BUILT_IN_TEMPLATE_RECORDS) map.set(t.id, t)
    for (const t of mapped) map.set(t.id, t)
    return Array.from(map.values()).sort((a, b) => a.sort_order - b.sort_order)
  },
  async findById(id: string): Promise<TemplateRecord | null> {
    const builtIn = BUILT_IN_TEMPLATE_RECORDS.find(t => t.id === id)
    const db = await prisma.templateRecord.findUnique({ where: { id } })
    if (db) return mapTemplateRecord(db)
    return builtIn ?? null
  },
  async findBySlug(slug: string): Promise<TemplateRecord | null> {
    const builtIn = BUILT_IN_TEMPLATE_RECORDS.find(t => t.slug === slug)
    const db = await prisma.templateRecord.findUnique({ where: { slug } })
    if (db) return mapTemplateRecord(db)
    return builtIn ?? null
  },
  async findActive(): Promise<TemplateRecord[]> {
    const all = await this.findAll()
    return all.filter(t => t.status === 'active')
  },
  async upsert(record: TemplateRecord): Promise<TemplateRecord> {
    const db = await prisma.templateRecord.upsert({
      where: { id: record.id },
      update: {
        name: record.name, slug: record.slug, category: record.category,
        config: record.config as object, thumbnailUrl: record.thumbnail_url,
        status: record.status, sortOrder: record.sort_order,
        usageCount: record.usage_count, price: record.price,
        requiredPackage: record.required_package,
      },
      create: {
        id: record.id, name: record.name, slug: record.slug, category: record.category,
        config: record.config as object, thumbnailUrl: record.thumbnail_url,
        status: record.status, sortOrder: record.sort_order,
        usageCount: record.usage_count, price: record.price,
        requiredPackage: record.required_package,
      },
    })
    return mapTemplateRecord(db)
  },
  async delete(id: string): Promise<void> {
    await prisma.templateRecord.delete({ where: { id } })
  },
}
