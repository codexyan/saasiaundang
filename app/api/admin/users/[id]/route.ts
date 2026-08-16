import { NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/route-guards'
import { getAdminEmail } from '@/lib/auth'
import { users } from '@/lib/db'
import type { UserRole } from '@/lib/db'
import { readJsonBody } from '@/lib/request-body'

export const dynamic = 'force-dynamic'

interface Params { params: Promise<{ id: string }> }

export const PATCH = withAdminAuth<Params>(async (req, session, props) => {
  const params = await props.params;
  const body = await readJsonBody(req)
  const validRoles: UserRole[] = ['admin', 'content_writer', 'affiliate', 'user']
  if (!body.role || !validRoles.includes(body.role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }
  const target = await users.findById(params.id)
  if (!target) return NextResponse.json({ error: 'Datanya tidak ditemukan.' }, { status: 404 })
  if (target.email === getAdminEmail() && body.role !== 'admin') {
    return NextResponse.json({ error: 'Tidak bisa mengubah role admin utama' }, { status: 403 })
  }
  await users.updateRole(params.id, body.role)
  return NextResponse.json({ success: true })
})

export const DELETE = withAdminAuth<Params>(async (_req, session, props) => {
  const params = await props.params;

  const target = await users.findById(params.id)
  if (!target) return NextResponse.json({ error: 'Datanya tidak ditemukan.' }, { status: 404 })
  if (target.role === 'admin' || target.email === getAdminEmail()) {
    return NextResponse.json({ error: 'Tidak bisa menghapus akun admin' }, { status: 403 })
  }

  await users.delete(params.id)
  return NextResponse.json({ success: true })
})
