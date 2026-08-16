import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session-server'
import { isAdmin } from '@/lib/auth'
import { settings } from '@/lib/db'
import { readJsonBody } from '@/lib/request-body'

export const dynamic = 'force-dynamic'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getSession()
  if (!isAdmin(session)) return NextResponse.json({ error: 'Sesi kamu sudah berakhir. Silakan masuk lagi ya.' }, { status: 401 })

  const { slug } = await params
  const body = await readJsonBody(req)
  const newLabel = String(body?.label || '').trim()
  if (!newLabel) return NextResponse.json({ error: 'Nama kategori wajib diisi' }, { status: 400 })

  const s = await settings.get()
  const idx = s.categories.findIndex((c) => c.slug === slug)
  if (idx === -1) return NextResponse.json({ error: 'Datanya tidak ditemukan.' }, { status: 404 })

  s.categories[idx] = { ...s.categories[idx], label: newLabel }
  await settings.save(s)
  return NextResponse.json({ category: s.categories[idx] })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getSession()
  if (!isAdmin(session)) return NextResponse.json({ error: 'Sesi kamu sudah berakhir. Silakan masuk lagi ya.' }, { status: 401 })

  const { slug } = await params
  const s = await settings.get()
  const target = s.categories.find((c) => c.slug === slug)
  if (!target) return NextResponse.json({ error: 'Datanya tidak ditemukan.' }, { status: 404 })

  s.categories = s.categories.filter((c) => c.slug !== slug)
  s.deletedCategoryIds = [...(s.deletedCategoryIds ?? []), slug]
  await settings.save(s)
  return NextResponse.json({ success: true })
}
