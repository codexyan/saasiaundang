import { NextRequest, NextResponse } from 'next/server'
import { orders, settings } from '@/lib/db'
import { readOrderStatusToken, toOrderStatusView } from '@/lib/order-status'

export const dynamic = 'force-dynamic'

/**
 * Status satu pesanan, tanpa sesi.
 *
 * Dipanggil halaman /order/status/[token] untuk memeriksa ulang sendiri
 * selagi pembayaran diproses. Berbeda dengan GET /api/orders yang mensyaratkan
 * nomor pesanan DAN email di query string, di sini token bertanda tanganlah
 * yang menentukan pesanan mana yang boleh dibaca — tidak ada email atau nomor
 * pesanan yang bisa dicocok-cocokkan dari luar.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) {
    return NextResponse.json({ error: 'Tautannya tidak lengkap.' }, { status: 400 })
  }

  const parsed = await readOrderStatusToken(token)
  const [appSettings, order] = await Promise.all([
    settings.get(),
    parsed.ok ? orders.findById(parsed.orderId) : Promise.resolve(null),
  ])

  if (!order) {
    // Pesan dan status yang sama untuk token kedaluwarsa, token palsu, dan
    // pesanan yang sudah tidak ada. Pembeli butuh langkah berikutnya, bukan
    // sebab teknisnya.
    return NextResponse.json(
      {
        error: 'Tautannya sudah tidak berlaku.',
        whatsapp: appSettings.confirmationWhatsapp || appSettings.contactWhatsapp || null,
      },
      { status: 404 },
    )
  }

  return NextResponse.json({ status: toOrderStatusView(order, appSettings) })
}
