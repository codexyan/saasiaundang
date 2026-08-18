import { NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/route-guards'
import { templateRecords } from '@/lib/db'
import type { TemplateRecord, JsonTemplateConfig } from '@/lib/types'
import { readJsonBody } from '@/lib/request-body'
import { templateCreateSchema, slugify } from '@/lib/schemas/template-record'

export const dynamic = 'force-dynamic'

export const GET = withAdminAuth(async () => {
  // Panel admin selalu butuh angka pemakaian nyata di kolom koleksi, jadi
  // dihitung sekali di sini alih-alih memicu request kedua dari client.
  return NextResponse.json({ records: await templateRecords.findAllWithUsage() })
})

/**
 * Buat template baru. Template LANGSUNG punya baris DB berstatus draft —
 * tidak lagi hanya hidup di localStorage browser admin, sehingga hasil kerja
 * tidak hilang saat ganti perangkat, ganti browser, atau membersihkan cache.
 */
export const POST = withAdminAuth(async (req) => {
  const body = await readJsonBody(req)
  const parsed = templateCreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Data template tidak valid' },
      { status: 400 },
    )
  }
  const { name, category, description, config } = parsed.data

  const baseSlug = parsed.data.slug || slugify(name)
  if (!baseSlug || baseSlug.length < 3) {
    return NextResponse.json({ error: 'Nama template terlalu pendek untuk dijadikan slug' }, { status: 400 })
  }

  // Slug bentrok tidak lagi ditolak mentah-mentah dengan 409. Admin yang
  // membuat "Rose Garden" kedua kali tidak peduli soal slug — dia peduli
  // templatenya jadi. Jadi slug-nya yang diberi sufiks, bukan alurnya distop.
  let slug = baseSlug
  for (let n = 2; await templateRecords.findBySlug(slug); n++) {
    slug = `${baseSlug.slice(0, 36)}-${n}`
  }

  const all = await templateRecords.findAll()
  const maxOrder = all.reduce((m, t) => Math.max(m, t.sort_order), 0)

  const record: TemplateRecord = {
    id: crypto.randomUUID().slice(0, 8),
    name,
    slug,
    category: category || 'modern',
    description: description || '',
    config: config as unknown as JsonTemplateConfig,
    draft_config: null,
    thumbnail_url: '',
    status: 'draft',
    sort_order: maxOrder + 1,
    usage_count: 0,
    price: 0,
    required_package: 'all',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const saved = await templateRecords.upsert(record)
  return NextResponse.json({ record: saved }, { status: 201 })
})
