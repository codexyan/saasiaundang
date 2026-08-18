import { NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/route-guards'
import { musicCategories, MUSIC_FALLBACK_CATEGORY } from '@/lib/db'
import { readJsonBody } from '@/lib/request-body'
import { musicCategorySchema } from '@/lib/schemas/music'

export const dynamic = 'force-dynamic'

interface Params { params: Promise<{ id: string }> }

export const PATCH = withAdminAuth<Params>(async (req, session, props) => {
  const { id } = await props.params

  const parsed = musicCategorySchema.partial().safeParse(await readJsonBody(req))
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Data kategori tidak valid' },
      { status: 400 },
    )
  }

  // musicCategories.update() sekaligus memindahkan trek yang menempel pada
  // nama lama — lihat catatannya di lib/db/music.ts.
  const cat = await musicCategories.update(id, parsed.data)
  if (!cat) return NextResponse.json({ error: 'Datanya tidak ditemukan.' }, { status: 404 })
  return NextResponse.json({ category: cat })
})

export const DELETE = withAdminAuth<Params>(async (_req, session, props) => {
  const { id } = await props.params

  const all = await musicCategories.findAll()
  const target = all.find(c => c.id === id)
  if (!target) return NextResponse.json({ error: 'Datanya tidak ditemukan.' }, { status: 404 })

  // "Lainnya" adalah tempat mendaratnya trek dari kategori yang dihapus.
  // Menghapusnya membuat trek jatuh ke kategori yang tidak ada.
  if (target.name === MUSIC_FALLBACK_CATEGORY) {
    return NextResponse.json(
      { error: `Kategori "${MUSIC_FALLBACK_CATEGORY}" tidak bisa dihapus — ini tempat penampungan lagu dari kategori yang dihapus.` },
      { status: 403 },
    )
  }

  const { ok, moved } = await musicCategories.delete(id)
  if (!ok) return NextResponse.json({ error: 'Datanya tidak ditemukan.' }, { status: 404 })
  return NextResponse.json({ ok: true, moved, moved_to: MUSIC_FALLBACK_CATEGORY })
})
