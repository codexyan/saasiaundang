import { NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/route-guards'
import { paymentProofs } from '@/lib/db'

export const dynamic = 'force-dynamic'


export const GET = withAdminAuth(async () => {
  return NextResponse.json({ proofs: await paymentProofs.findAll() })
})
