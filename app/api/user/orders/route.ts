import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session-server'
import { orders } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * Riwayat pesanan milik pengguna yang sedang masuk.
 *
 * Menggantikan `GET /api/payment/proof` sebagai sumber "Riwayat Pembayaran" di
 * dashboard. Route lama membaca tabel payment_proofs yang tidak pernah terisi
 * satu baris pun — tidak ada UI yang bisa mengirim bukti — jadi riwayatnya
 * selalu kosong meskipun pembelinya sudah membayar. Pesanan adalah catatan yang
 * benar-benar ada untuk setiap pembayaran.
 *
 * Hanya kolom yang memang perlu dilihat pemiliknya yang dikirim; nama orang tua,
 * profesi, dan catatan admin tidak ada urusannya dengan riwayat pembayaran.
 */
export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Sesi kamu sudah berakhir. Silakan masuk lagi ya.' }, { status: 401 })
  }

  const mine = await orders.findByEmail(session.email)

  return NextResponse.json({
    orders: mine.map((o) => ({
      id: o.id,
      order_number: o.order_number,
      package_tier: o.package_tier,
      amount: o.amount,
      unique_code: o.unique_code,
      total_amount: o.total_amount,
      status: o.status,
      payment_method: o.payment_method,
      created_at: o.created_at,
      reviewed_at: o.reviewed_at,
    })),
  })
}
