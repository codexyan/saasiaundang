import { NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/route-guards'
import { invitations } from '@/lib/db'
import { readJsonBody } from '@/lib/request-body'

export const dynamic = 'force-dynamic'


interface Params { params: Promise<{ id: string }> }

export const PATCH = withAdminAuth<Params>(async (req, session, props) => {
  const params = await props.params;

  try {
    const body = await readJsonBody(req)
    const updated = await invitations.update(params.id, body)
    if (!updated) return NextResponse.json({ error: 'Datanya tidak ditemukan.' }, { status: 404 })
    return NextResponse.json({ invitation: updated })
  } catch (error) {
    console.error('Admin invitation PATCH error:', error)
    return NextResponse.json({ error: 'Perubahannya gagal disimpan. Coba lagi sebentar lagi ya.' }, { status: 500 })
  }
})
