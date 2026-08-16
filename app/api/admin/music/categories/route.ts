import { NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/route-guards'
import { musicCategories } from '@/lib/db'
import { readJsonBody } from '@/lib/request-body'

export const dynamic = 'force-dynamic'

export const GET = withAdminAuth(async () => {
  const categories = await musicCategories.findAll()
  return NextResponse.json({ categories })
})

export const POST = withAdminAuth(async (req) => {
  const body = await readJsonBody(req)
  const name = String(body?.name || '').trim()
  if (!name) return NextResponse.json({ error: 'Nama kategori wajib diisi' }, { status: 400 })

  try {
    const category = await musicCategories.create(name)
    return NextResponse.json({ category }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Kategori sudah ada' }, { status: 409 })
  }
})
