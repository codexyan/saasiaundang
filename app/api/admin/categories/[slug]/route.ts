import { NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/route-guards'
import { settings, templateRecords } from '@/lib/db'
import { readJsonBody } from '@/lib/request-body'

export const dynamic = 'force-dynamic'

export const PATCH = withAdminAuth<{ params: Promise<{ slug: string }> }>(async (req, session, { params }) => {
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
})

export const DELETE = withAdminAuth<{ params: Promise<{ slug: string }> }>(async (_req, session, { params }) => {
  const { slug } = await params
  const s = await settings.get()
  const target = s.categories.find((c) => c.slug === slug)
  if (!target) return NextResponse.json({ error: 'Datanya tidak ditemukan.' }, { status: 404 })

  // Kategori yang masih menempel di template tidak boleh hilang begitu saja:
  // template jadi tak berkategori, tidak muncul di filter mana pun, dan hilang
  // dari galeri publik yang memfilter per kategori. Panel Manajemen sudah
  // memblokir ini, Studio Desain tidak — sekarang aturannya satu, di server.
  const usedBy = (await templateRecords.findAll()).filter((t) => t.category === slug)
  if (usedBy.length > 0) {
    return NextResponse.json(
      { error: `Masih dipakai ${usedBy.length} template (${usedBy.slice(0, 3).map((t) => t.name).join(', ')}${usedBy.length > 3 ? ', ...' : ''}). Pindahkan dulu kategorinya.` },
      { status: 409 },
    )
  }

  s.categories = s.categories.filter((c) => c.slug !== slug)
  s.deletedCategoryIds = [...(s.deletedCategoryIds ?? []), slug]
  await settings.save(s)
  return NextResponse.json({ success: true })
})
