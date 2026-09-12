import { NextRequest, NextResponse } from 'next/server'
import { invitations, orders } from '@/lib/db'
import { normalizeSubdomain } from '@/lib/subdomain'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  // Aturan yang sama dengan POST /api/orders, lewat lib/subdomain.ts. Dulu cek
  // ini hanya membuang karakter dan mensyaratkan minimal 3 huruf, jadi form
  // pesanan menyatakan `www` atau `iaundang` "Tersedia!" padahal alamat itu
  // milik situs utama, dan pesanannya pun diterima.
  const check = normalizeSubdomain(req.nextUrl.searchParams.get('slug') ?? '')
  if (!check.ok) {
    return NextResponse.json({ available: false, reason: check.message })
  }
  const slug = check.slug

  const slugTaken = await invitations.slugExists(slug)
  const orderTaken = await orders.subdomainExists(slug)

  return NextResponse.json({
    available: !slugTaken && !orderTaken,
    reason: slugTaken || orderTaken ? 'Alamat undangan ini sudah dipakai pasangan lain. Coba nama lain ya.' : null,
  })
}
