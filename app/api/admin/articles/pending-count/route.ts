import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session-server'
import { isAdmin } from '@/lib/auth'
import { articles } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Lightweight count for the admin sidebar badge (articles awaiting review).
export async function GET() {
  const session = await getSession()
  if (!isAdmin(session)) {
    return NextResponse.json({ error: 'Sesi kamu sudah berakhir. Silakan masuk lagi ya.' }, { status: 401 })
  }
  return NextResponse.json({ count: await articles.findPendingCount() })
}
