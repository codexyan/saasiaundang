import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session-server'
import { isAdmin } from '@/lib/auth'
import { invitations } from '@/lib/db'
import { readJsonBody } from '@/lib/request-body'

export const dynamic = 'force-dynamic'


interface Params { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, props: Params) {
  const params = await props.params;
  const session = await getSession()
  if (!isAdmin(session)) {
    return NextResponse.json({ error: 'Sesi kamu sudah berakhir. Silakan masuk lagi ya.' }, { status: 401 })
  }

  try {
    const body = await readJsonBody(req)
    const updated = await invitations.update(params.id, body)
    if (!updated) return NextResponse.json({ error: 'Datanya tidak ditemukan.' }, { status: 404 })
    return NextResponse.json({ invitation: updated })
  } catch (error) {
    console.error('Admin invitation PATCH error:', error)
    return NextResponse.json({ error: 'Perubahannya gagal disimpan. Coba lagi sebentar lagi ya.' }, { status: 500 })
  }
}
