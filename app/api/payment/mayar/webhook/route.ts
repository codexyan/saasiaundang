import { NextRequest, NextResponse } from 'next/server'
import { verifyMayarWebhook } from '@/lib/mayar'
import { prisma } from '@/lib/prisma'
import { notifyUser } from '@/lib/notifications'
import { runAfterResponse } from '@/lib/after-response'
import { provisionPaidOrder } from '@/lib/provision-order'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
      || req.headers.get('x-mayar-token')
      || ''

    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Body tidak valid' }, { status: 400 })
    }

    const isValid = (await verifyMayarWebhook(token)) || (await verifyMayarWebhook(body.token))
    if (!isValid) {
      console.warn('Mayar webhook: invalid token')
      return NextResponse.json({ error: 'Sesi kamu sudah berakhir. Silakan masuk lagi ya.' }, { status: 401 })
    }

    const eventType = body?.event?.received
    if (eventType !== 'payment.received') {
      return NextResponse.json({ ok: true, skipped: true })
    }

    if (!body.data || typeof body.data !== 'object') {
      return NextResponse.json({ error: 'Payload tanpa data' }, { status: 400 })
    }
    const { customerEmail, customerName, amount } = body.data

    let order = await prisma.order.findFirst({
      where: { mayarTransactionId: body.data.id },
    })

    if (!order) {
      order = await prisma.order.findFirst({
        where: {
          status: 'pending',
          totalAmount: amount,
          email: customerEmail?.toLowerCase(),
        },
        orderBy: { createdAt: 'desc' },
      })
    }

    if (!order) {
      console.warn(`Mayar webhook: order not found for email=${customerEmail} amount=${amount}`)
      return NextResponse.json({ ok: true, message: 'Order not found' })
    }

    // CATATAN: pemeriksaan `order.status === 'approved'` yang dulu ada di sini
    // sengaja DIHAPUS. Pesanan yang terlanjur ditandai "approved" oleh webhook
    // versi lama TIDAK punya undangan sama sekali; kalau langsung dibalas
    // "Already processed", pesanan rusak itu tidak akan pernah pulih.
    // provisionPaidOrder() sendiri yang memutuskan: ia hanya menganggap selesai
    // kalau statusnya approved DAN invitation_id-nya sudah terisi.

    // Penyediaan LENGKAP — akun, undangan, langganan — lewat jalur yang sama
    // dengan approve admin.
    //
    // Dulu di sini status langsung diubah jadi "approved", lalu penyediaannya
    // dibungkus `if (order.invitationId && pkg)`. Pesanan dari /api/orders
    // SELALU punya invitationId null (undangannya baru dibuat saat approve),
    // jadi blok itu tidak pernah jalan: pelanggan bayar, ordernya "approved",
    // tapi tidak ada akun, undangan, maupun langganan — dan admin tidak bisa
    // membetulkan karena jalur manual menolak dengan 409 "sudah diapprove".
    const outcome = await provisionPaidOrder(order.id)

    if (outcome.status === 'not-found') {
      return NextResponse.json({ ok: true, message: 'Order not found' })
    }

    if (outcome.status === 'invalid-tier') {
      // Jangan tandai selesai. Balas 500 supaya Mayar mengirim ulang, dan
      // pesanannya tetap "pending" sehingga admin masih bisa memprosesnya.
      console.error(
        `Mayar webhook: order=${order.orderNumber} tidak bisa disediakan (${outcome.tier}). ` +
        'Status dibiarkan pending untuk penanganan manual.'
      )
      return NextResponse.json({ error: 'Provisioning gagal' }, { status: 500 })
    }

    if (outcome.status === 'already-provisioned') {
      return NextResponse.json({ ok: true, message: 'Already processed' })
    }

    runAfterResponse(
      notifyUser('order_approved', order.email, {
        orderNumber: order.orderNumber,
        email: customerEmail || order.email,
        name: customerName || `${order.groomName} & ${order.brideName}`,
        // Pada jalur Mayar tidak ada admin yang meneruskan kredensial secara
        // manual, jadi akun yang BARU dibuat harus menerima passwordnya lewat
        // email ini — kalau tidak, pelanggan sudah membayar tapi tidak bisa masuk.
        ...(outcome.plainPassword ? { password: outcome.plainPassword } : {}),
        packageTier: order.packageTier,
        slug: order.subdomain,
      }),
      `notifyUser(order_approved) order=${order.orderNumber}`
    )

    console.log(`Mayar webhook processed: order=${order.orderNumber} email=${order.email}`)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Mayar webhook error:', error)
    return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 200 })
  }
}
