import { NextRequest, NextResponse } from 'next/server'
import { experiments } from '@/lib/experiments'
import { readJsonBody } from '@/lib/request-body'
import { allowRequest } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

// Sengaja tanpa login — dipicu setiap pengunjung anonim yang masuk eksperimen A/B.
export async function POST(req: NextRequest) {
  const { key, sessionId } = await readJsonBody(req)
  if (!key || !sessionId) {
    return NextResponse.json({ error: 'key and sessionId required' }, { status: 400 })
  }

  if (!(await allowRequest('COUNTER_RATE_LIMIT', `experiment:${key}:${sessionId}`))) {
    return NextResponse.json({ variant: null }) // diam-diam diabaikan, bukan error ke pengunjung
  }

  const result = await experiments.assign(key, sessionId)
  if (!result) return NextResponse.json({ variant: null })

  return NextResponse.json(result)
}
