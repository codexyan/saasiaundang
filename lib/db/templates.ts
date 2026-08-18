import { Prisma } from '@prisma/client'
import { prisma } from '../prisma'
import type { TemplateRecord, TemplatePackageRequirement, JsonTemplateConfig } from '../types'
import JAVANESE_GOLD from '../template-configs/javanese-gold'
import ROSE_GARDEN from '../template-configs/rose-garden'
import MIDNIGHT_LUXE from '../template-configs/midnight-luxe'

interface TemplateRow {
  id: string; name: string; slug: string; category: string; description: string
  config: unknown; draftConfig: unknown
  thumbnailUrl: string; status: string; sortOrder: number; usageCount: number
  price: number; requiredPackage: string; createdAt: Date; updatedAt: Date
}

function mapTemplateRecord(t: TemplateRow): TemplateRecord {
  return {
    id: t.id, name: t.name, slug: t.slug, category: t.category,
    description: t.description ?? '',
    config: t.config as JsonTemplateConfig,
    draft_config: (t.draftConfig ?? null) as JsonTemplateConfig | null,
    thumbnail_url: t.thumbnailUrl, status: t.status as TemplateRecord['status'],
    sort_order: t.sortOrder, usage_count: t.usageCount, price: t.price,
    required_package: t.requiredPackage as TemplatePackageRequirement,
    created_at: t.createdAt.toISOString(),
    updated_at: t.updatedAt.toISOString(),
  }
}

//  TEMPLATE RECORDS

const BUILT_IN_TEMPLATE_RECORDS: TemplateRecord[] = [JAVANESE_GOLD, ROSE_GARDEN, MIDNIGHT_LUXE]

/** Kolom-kolom yang boleh ditulis lewat upsert — dikumpulkan sekali supaya
 *  create dan update tidak bisa lagi diam-diam berbeda isi. */
function writableColumns(record: TemplateRecord) {
  return {
    name: record.name,
    slug: record.slug,
    category: record.category,
    description: record.description ?? '',
    config: record.config as object,
    // Kolom Json nullable: SQL NULL harus ditulis lewat Prisma.DbNull,
    // bukan literal null (yang oleh Prisma diartikan 'jangan diubah').
    draftConfig: record.draft_config ? (record.draft_config as object) : Prisma.DbNull,
    thumbnailUrl: record.thumbnail_url,
    status: record.status,
    sortOrder: record.sort_order,
    price: record.price,
    requiredPackage: record.required_package,
  }
}

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
    const cols = writableColumns(record)
    const db = await prisma.templateRecord.upsert({
      where: { id: record.id },
      update: cols,
      // usageCount HANYA di create. Kalau ikut di update, setiap kali admin
      // menyimpan dari editor angka pemakaian akan dilempar balik ke nilai
      // yang dibawa client — yaitu snapshot basi saat halaman dibuka.
      create: { id: record.id, usageCount: record.usage_count ?? 0, ...cols },
    })
    return mapTemplateRecord(db)
  },
  /** Simpan salinan kerja editor tanpa menyentuh versi terbit. */
  async saveDraft(id: string, draftConfig: JsonTemplateConfig): Promise<TemplateRecord | null> {
    try {
      const db = await prisma.templateRecord.update({
        where: { id },
        data: { draftConfig: draftConfig as object },
      })
      return mapTemplateRecord(db)
    } catch { return null }
  },
  /** Naikkan draft jadi versi terbit lalu kosongkan draft. */
  async publishDraft(id: string, status?: TemplateRecord['status']): Promise<TemplateRecord | null> {
    const existing = await prisma.templateRecord.findUnique({ where: { id } })
    if (!existing) return null
    const db = await prisma.templateRecord.update({
      where: { id },
      data: {
        config: (existing.draftConfig ?? existing.config) as object,
        draftConfig: Prisma.DbNull,
        ...(status ? { status } : {}),
      },
    })
    return mapTemplateRecord(db)
  },
  /** Buang salinan kerja, kembali ke versi terbit. */
  async discardDraft(id: string): Promise<TemplateRecord | null> {
    try {
      const db = await prisma.templateRecord.update({ where: { id }, data: { draftConfig: Prisma.DbNull } })
      return mapTemplateRecord(db)
    } catch { return null }
  },
  /** Jumlah pemakaian nyata per template, dihitung dari tabel undangan.
   *
   *  Kolom `usage_count` yang lama adalah counter yang TIDAK PERNAH dinaikkan
   *  siapa pun, jadi selalu 0. Counter juga tidak bisa dipakai untuk tiga
   *  template bawaan yang belum punya baris DB, dan akan melenceng permanen
   *  setiap kali sebuah undangan dihapus. Menghitung langsung dari sumbernya
   *  selalu benar dan tidak butuh hook di mana pun. */
  async usageCounts(): Promise<Record<string, number>> {
    const rows = await prisma.invitation.groupBy({
      by: ['templateId'],
      _count: { _all: true },
    })
    const out: Record<string, number> = {}
    for (const r of rows) out[r.templateId] = r._count._all
    return out
  },
  /** findAll() + angka pemakaian nyata. Dipakai panel admin. */
  async findAllWithUsage(): Promise<TemplateRecord[]> {
    const [all, usage] = await Promise.all([this.findAll(), this.usageCounts()])
    return all.map(t => ({ ...t, usage_count: usage[t.id] ?? 0 }))
  },
  async delete(id: string): Promise<void> {
    await prisma.templateRecord.delete({ where: { id } })
  },
}
