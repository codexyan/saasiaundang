import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session-server'
import { isAdmin } from '@/lib/auth'
import { experiments } from '@/lib/experiments'
import { readJsonBody } from '@/lib/request-body'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (!isAdmin(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const all = await experiments.findAll()
  return NextResponse.json({ experiments: all })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!isAdmin(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await readJsonBody(req)
  const { key, name, description, variants, traffic } = body

  if (!key || !name || !variants) {
    return NextResponse.json({ error: 'key, name, dan variants wajib diisi' }, { status: 400 })
  }

  const experiment = await experiments.create({ key, name, description, variants, traffic })
  return NextResponse.json({ experiment }, { status: 201 })
}
