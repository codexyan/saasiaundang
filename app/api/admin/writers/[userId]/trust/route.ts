import { NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/route-guards'
import { prisma } from '@/lib/prisma'
import { writerProfiles } from '@/lib/db'
import { readJsonBody } from '@/lib/request-body'

export const dynamic = 'force-dynamic'

// Toggle whether a writer is "trusted" (can publish without admin review).
// Backed by the WriterProfile upsert from Tahap 1.
export const PATCH = withAdminAuth<{ params: Promise<{ userId: string }> }>(async (req, session, props) => {
  const params = await props.params;

  const user = await prisma.user.findUnique({ where: { id: params.userId } })
  if (!user) {
    return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
  }

  const body = await readJsonBody(req)
  const isTrusted = !!body.isTrusted
  const profile = await writerProfiles.upsert(params.userId, { isTrusted })

  return NextResponse.json({ profile })
})
