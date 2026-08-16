import { NextRequest, NextResponse } from 'next/server'
import { invitations, orders } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')?.toLowerCase().replace(/[^a-z0-9-]/g, '')
  if (!slug || slug.length < 3) {
    return NextResponse.json({ available: false, reason: 'Minimal 3 karakter' })
  }

  const slugTaken = await invitations.slugExists(slug)
  const orderTaken = await orders.subdomainExists(slug)

  return NextResponse.json({
    available: !slugTaken && !orderTaken,
    reason: slugTaken || orderTaken ? 'Alamat undangan ini sudah dipakai pasangan lain. Coba nama lain ya.' : null,
  })
}
