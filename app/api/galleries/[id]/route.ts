import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session-server'
import { galleries, invitations } from '@/lib/db'

export const dynamic = 'force-dynamic'

interface Params { params: Promise<{ id: string }> }

export async function DELETE(_req: NextRequest, props: Params) {
  const params = await props.params;
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Sesi kamu sudah berakhir. Silakan masuk lagi ya.' }, { status: 401 })

  const gallery = await galleries.findById(params.id)
  if (!gallery) return NextResponse.json({ error: 'Datanya tidak ditemukan.' }, { status: 404 })

  const inv = await invitations.findById(gallery.invitation_id)
  if (!inv || inv.user_id !== session.userId) {
    return NextResponse.json({ error: 'Kamu belum punya akses ke bagian ini.' }, { status: 403 })
  }

  await galleries.delete(params.id)
  return NextResponse.json({ ok: true })
}
