import { NextRequest, NextResponse } from 'next/server'
import { invitationViews } from '@/lib/db'
import { readJsonBody } from '@/lib/request-body'
import { allowRequest } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

// Sengaja tanpa login — dipicu setiap pengunjung anonim yang membuka
// undangan. Tapi dulu tanpa batas sama sekali, jadi bisa dibanjiri untuk
// memalsukan angka kunjungan yang dipakai pemilik undangan.
export async function POST(req: NextRequest) {
  try {
    const { invitation_id, referrer } = await readJsonBody(req)
    if (!invitation_id) {
      return NextResponse.json({ error: 'Undangannya belum dipilih.' }, { status: 400 })
    }

    if (!(await allowRequest('COUNTER_RATE_LIMIT', `views:${invitation_id}`))) {
      return NextResponse.json({ ok: true }) // diam-diam diabaikan, bukan error ke pengunjung
    }

    const ua = req.headers.get('user-agent') || ''

    await invitationViews.record({
      invitation_id,
      referrer: referrer || '',
      user_agent: ua,
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
