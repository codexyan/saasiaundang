import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session-server'
import { isAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await getSession()
  if (!isAdmin(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
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
}
