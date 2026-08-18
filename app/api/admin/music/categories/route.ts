import { NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/route-guards'
import { musicCategories } from '@/lib/db'
import { readJsonBody } from '@/lib/request-body'
import { musicCategorySchema } from '@/lib/schemas/music'

export const dynamic = 'force-dynamic'

export const GET = withAdminAuth(async () => {
  const categories = await musicCategories.findAll()
  return NextResponse.json({ categories })
})

export const POST = withAdminAuth(async (req) => {
  const parsed = musicCategorySchema.safeParse(await readJsonBody(req))
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Nama kategori wajib diisi' },
      { status: 400 },
    )
  }

  try {
    const category = await musicCategories.create(parsed.data.name)
    return NextResponse.json({ category }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Kategori sudah ada' }, { status: 409 })
  }
})
