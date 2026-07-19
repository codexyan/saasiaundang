import { NextRequest, NextResponse } from 'next/server'
import { musicTracks } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  await musicTracks.incrementUsage(params.id)
  return NextResponse.json({ ok: true })
}
