import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/session-server'
import { guests } from '@/lib/db'
import { readJsonBody } from '@/lib/request-body'

export const dynamic = 'force-dynamic'

const schema = z.object({
  ids: z.array(z.string().min(1)).min(1),
})

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await readJsonBody(req)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 })
  }

  // markBlastSent memfilter berdasarkan kepemilikan; id milik orang lain
  // diabaikan diam-diam, bukan diproses.
  const marked = await guests.markBlastSent(parsed.data.ids, session.userId)
  return NextResponse.json({ success: true, marked })
}
