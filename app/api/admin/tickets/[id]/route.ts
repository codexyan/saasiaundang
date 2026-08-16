import { NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/route-guards'
import { prisma } from '@/lib/prisma'
import { readJsonBody } from '@/lib/request-body'

export const dynamic = 'force-dynamic'

export const PATCH = withAdminAuth<{ params: Promise<{ id: string }> }>(async (req, session, props) => {
  const params = await props.params;

  const body = await readJsonBody(req)
  const { status } = body as { status?: string }

  if (!status || !['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
    return NextResponse.json({ error: 'Status tidak valid' }, { status: 400 })
  }

  const ticket = await prisma.supportTicket.update({
    where: { id: params.id },
    data: {
      status,
      closedAt: ['resolved', 'closed'].includes(status) ? new Date() : null,
    },
  })

  return NextResponse.json({ ok: true, ticket })
})
