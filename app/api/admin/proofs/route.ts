import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session-server'
import { isAdmin } from '@/lib/auth'
import { paymentProofs } from '@/lib/db'

export const dynamic = 'force-dynamic'


export async function GET() {
  const session = await getSession()
  if (!isAdmin(session)) return NextResponse.json({ error: 'Sesi kamu sudah berakhir. Silakan masuk lagi ya.' }, { status: 401 })
  return NextResponse.json({ proofs: await paymentProofs.findAll() })
}
