import { NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/route-guards'
import { orders } from '@/lib/db'

export const dynamic = 'force-dynamic'

export const GET = withAdminAuth(async () => {
  try {
    const all = await orders.findAll()
    return NextResponse.json({ orders: all })
  } catch (error) {
    console.error('Orders GET error:', error)
    return NextResponse.json({ error: 'Gagal memuat pesanan' }, { status: 500 })
  }
})
