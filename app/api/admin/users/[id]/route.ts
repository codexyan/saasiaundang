import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session-server'
import { isAdmin, getAdminEmail } from '@/lib/auth'
import { users } from '@/lib/db'
import type { UserRole } from '@/lib/db'

export const dynamic = 'force-dynamic'

interface Params { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, props: Params) {
  const params = await props.params;
  const session = await getSession()
  if (!isAdmin(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await req.json()
  const validRoles: UserRole[] = ['admin', 'content_writer', 'affiliate', 'user']
  if (!body.role || !validRoles.includes(body.role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }
  const target = await users.findById(params.id)
  if (!target) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (target.email === getAdminEmail() && body.role !== 'admin') {
    return NextResponse.json({ error: 'Tidak bisa mengubah role admin utama' }, { status: 403 })
  }
  await users.updateRole(params.id, body.role)
  return NextResponse.json({ success: true })
}

export async function DELETE(_req: NextRequest, props: Params) {
  const params = await props.params;
  const session = await getSession()
  if (!isAdmin(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const target = await users.findById(params.id)
  if (!target) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (target.role === 'admin' || target.email === getAdminEmail()) {
    return NextResponse.json({ error: 'Tidak bisa menghapus akun admin' }, { status: 403 })
  }

  await users.delete(params.id)
  return NextResponse.json({ success: true })
}
