import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session-server'
import { isAdmin } from '@/lib/auth'
import { invitations } from '@/lib/db'

export const dynamic = 'force-dynamic'


interface Params { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, props: Params) {
  const params = await props.params;
  const session = await getSession()
  if (!isAdmin(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const updated = await invitations.update(params.id, body)
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ invitation: updated })
  } catch (error) {
    console.error('Admin invitation PATCH error:', error)
    return NextResponse.json({ error: 'Gagal memperbarui undangan' }, { status: 500 })
  }
}
