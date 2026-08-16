import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session-server'
import { isWriter } from '@/lib/auth'
import { articleCategories } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Read-only category list for the writer editor's category dropdown.
// Categories themselves stay admin-managed (see /api/admin/article-categories).
export async function GET() {
  const session = await getSession()
  if (!isWriter(session)) {
    return NextResponse.json({ error: 'Sesi kamu sudah berakhir. Silakan masuk lagi ya.' }, { status: 401 })
  }
  return NextResponse.json({ categories: await articleCategories.findAll() })
}
