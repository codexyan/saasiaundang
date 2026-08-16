import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session-server'
import { isAdmin } from '@/lib/auth'
import { orders } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (!session || !isAdmin(session)) {
    return NextResponse.json({ error: 'Sesi kamu sudah berakhir. Silakan masuk lagi ya.' }, { status: 401 })
  }
  try {
    const all = await orders.findAll()
    return NextResponse.json({ orders: all })
  } catch (error) {
    console.error('Orders GET error:', error)
    return NextResponse.json({ error: 'Gagal memuat pesanan' }, { status: 500 })
  }
}
