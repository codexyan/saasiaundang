import { NextRequest, NextResponse } from 'next/server'
import { musicTracks } from '@/lib/db'
import { allowRequest } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

// Sengaja tanpa login — dipicu pengunjung anonim yang memutar musik latar.
export async function POST(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  if (!(await allowRequest('COUNTER_RATE_LIMIT', `music-usage:${params.id}`))) {
    return NextResponse.json({ ok: true }) // diam-diam diabaikan, bukan error ke pengunjung
  }
  await musicTracks.incrementUsage(params.id)
  return NextResponse.json({ ok: true })
}
