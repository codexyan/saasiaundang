import { NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/route-guards'
import { articles } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Lightweight count for the admin sidebar badge (articles awaiting review).
export const GET = withAdminAuth(async () => {
  return NextResponse.json({ count: await articles.findPendingCount() })
})
