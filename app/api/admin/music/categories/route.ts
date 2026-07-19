import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session-server'
import { isAdmin } from '@/lib/auth'
import { musicCategories } from '@/lib/db'
import { readJsonBody } from '@/lib/request-body'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (!isAdmin(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const categories = await musicCategories.findAll()
  return NextResponse.json({ categories })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!isAdmin(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await readJsonBody(req)
  const name = String(body?.name || '').trim()
  if (!name) return NextResponse.json({ error: 'Nama kategori wajib diisi' }, { status: 400 })

  try {
    const category = await musicCategories.create(name)
    return NextResponse.json({ category }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Kategori sudah ada' }, { status: 409 })
  }
}
