import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session-server'
import { isWriter } from '@/lib/auth'
import { articles } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Lightweight count for the nav badge: articles sent back for revision that
// this writer hasn't opened yet since the revision was requested.
export async function GET() {
  const session = await getSession()
  if (!isWriter(session)) {
    return NextResponse.json({ error: 'Sesi kamu sudah berakhir. Silakan masuk lagi ya.' }, { status: 401 })
  }
  const needsRevisionUnseen = await articles.findUnseenRevisionCount(session!.userId)
  return NextResponse.json({ needsRevisionUnseen })
}
