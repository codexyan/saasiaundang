import { NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/route-guards'
import { templateRecords } from '@/lib/db'
import { readJsonBody } from '@/lib/request-body'

export const dynamic = 'force-dynamic'

interface Params { params: Promise<{ id: string }> }

export const PATCH = withAdminAuth<Params>(async (req, session, props) => {
  const params = await props.params;

  const existing = await templateRecords.findById(params.id)
  if (!existing) return NextResponse.json({ error: 'Datanya tidak ditemukan.' }, { status: 404 })

  const body = await readJsonBody(req)

  // Cek konflik slug kalau di-update
  if (body.slug && body.slug !== existing.slug) {
    const other = await templateRecords.findBySlug(body.slug)
    if (other && other.id !== existing.id) {
      return NextResponse.json({ error: 'Slug template sudah dipakai' }, { status: 409 })
    }
  }

  const updated = {
    ...existing,
    ...body,
    id: existing.id, // id tidak boleh berubah
    created_at: existing.created_at, // timestamp protected
  }

  await templateRecords.upsert(updated)
  return NextResponse.json({ record: updated })
})

export const DELETE = withAdminAuth<Params>(async (_req, session, props) => {
  const params = await props.params;

  const existing = await templateRecords.findById(params.id)
  if (!existing) return NextResponse.json({ error: 'Datanya tidak ditemukan.' }, { status: 404 })

  // Built-in template (Javanese Gold dsb.) tidak bisa dihapus
  if (existing.id === 'javanese-gold') {
    return NextResponse.json({ error: 'Template bawaan tidak bisa dihapus' }, { status: 403 })
  }

  await templateRecords.delete(params.id)
  return NextResponse.json({ success: true })
})
