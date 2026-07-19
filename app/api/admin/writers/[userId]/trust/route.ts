import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session-server'
import { isAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writerProfiles } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Toggle whether a writer is "trusted" (can publish without admin review).
// Backed by the WriterProfile upsert from Tahap 1.
export async function PATCH(req: NextRequest, props: { params: Promise<{ userId: string }> }) {
  const params = await props.params;
  const session = await getSession()
  if (!isAdmin(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({ where: { id: params.userId } })
  if (!user) {
    return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
  }

  const body = await req.json()
  const isTrusted = !!body.isTrusted
  const profile = await writerProfiles.upsert(params.userId, { isTrusted })

  return NextResponse.json({ profile })
}
