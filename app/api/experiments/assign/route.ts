import { NextRequest, NextResponse } from 'next/server'
import { experiments } from '@/lib/experiments'
import { readJsonBody } from '@/lib/request-body'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { key, sessionId } = await readJsonBody(req)
  if (!key || !sessionId) {
    return NextResponse.json({ error: 'key and sessionId required' }, { status: 400 })
  }

  const result = await experiments.assign(key, sessionId)
  if (!result) return NextResponse.json({ variant: null })

  return NextResponse.json(result)
}
