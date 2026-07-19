import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session-server'
import { isAdmin } from '@/lib/auth'
import { templateRecords } from '@/lib/db'

export const dynamic = 'force-dynamic'

interface Params { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, props: Params) {
  const params = await props.params;
  const session = await getSession()
  if (!isAdmin(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const existing = await templateRecords.findById(params.id)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()

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
}

export async function DELETE(_req: NextRequest, props: Params) {
  const params = await props.params;
  const session = await getSession()
  if (!isAdmin(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const existing = await templateRecords.findById(params.id)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Built-in template (Javanese Gold dsb.) tidak bisa dihapus
  if (existing.id === 'javanese-gold') {
    return NextResponse.json({ error: 'Template bawaan tidak bisa dihapus' }, { status: 403 })
  }

  await templateRecords.delete(params.id)
  return NextResponse.json({ success: true })
}
