import { NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/route-guards'
import { templateRecords } from '@/lib/db'
import type { TemplateRecord } from '@/lib/types'
import { readJsonBody } from '@/lib/request-body'

export const dynamic = 'force-dynamic'

export const GET = withAdminAuth(async () => {
  return NextResponse.json({ records: await templateRecords.findAll() })
})

/** Rilis template dari Studio Desain — terima full JsonTemplateConfig. */
export const POST = withAdminAuth(async (req) => {
  const body = await readJsonBody(req)

  if (!body?.config || !body?.name || !body?.slug) {
    return NextResponse.json({ error: 'Field `config`, `name`, `slug` wajib diisi' }, { status: 400 })
  }

  // Cek duplicate slug — slug dipakai sebagai public identifier.
  const existing = await templateRecords.findBySlug(body.slug)
  if (existing && existing.id !== body.id) {
    return NextResponse.json({ error: 'Slug template sudah dipakai' }, { status: 409 })
  }

  const all = await templateRecords.findAll()
  const maxOrder = all.reduce((m, t) => Math.max(m, t.sort_order), 0)

  const record: TemplateRecord = {
    id: body.id || crypto.randomUUID().slice(0, 8),
    name: body.name,
    slug: body.slug,
    category: body.category || 'modern',
    config: body.config,
    thumbnail_url: body.thumbnail_url || '',
    status: body.status === 'active' ? 'active' : 'draft',
    sort_order: typeof body.sort_order === 'number' ? body.sort_order : maxOrder + 1,
    usage_count: 0,
    price: typeof body.price === 'number' && body.price >= 0 ? body.price : 0,
    required_package: body.required_package ?? 'all',
    created_at: new Date().toISOString(),
  }

  await templateRecords.upsert(record)
  return NextResponse.json({ record }, { status: 201 })
})
