import { NextRequest, NextResponse } from 'next/server'
import { verifyMayarWebhook } from '@/lib/mayar'
import { prisma } from '@/lib/prisma'
import { notifyUser } from '@/lib/notifications'
import { runAfterResponse } from '@/lib/after-response'
import { provisionPaidOrder } from '@/lib/provision-order'
import { passwordTokenUrl, validityLabel, PASSWORD_TOKEN_PURPOSE } from '@/lib/password-token'

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
      // Pemanggilnya mesin, bukan pembeli. Pesan "sesi berakhir" yang dulu
      // dipakai di sini menyesatkan saat membaca log uji integrasi.
      return NextResponse.json({ error: 'Token webhook tidak cocok' }, { status: 401 })
    }

    // Bentuk `event` dari Mayar tidak pernah dipastikan: dokumentasi mereka
    // menulis parameternya "event.received | String", yang bisa dibaca sebagai
    // objek { received } maupun sebagai satu field string. Dulu di sini hanya
    // bentuk objek yang dikenali, jadi kalau Mayar mengirim
    // "event": "payment.received" SETIAP pembayaran dilewati dengan balasan
    // 200 — tanpa error, tanpa log, dan pesanannya diam di pending selamanya.
    // Nol pesanan pernah lewat Mayar, jadi ini memang belum pernah terlihat.
    const rawEvent: unknown = body.event
    const eventType =
      typeof rawEvent === 'string'
        ? rawEvent
        : rawEvent && typeof rawEvent === 'object'
          ? (rawEvent as { received?: unknown }).received
          : undefined

    if (typeof eventType !== 'string') {
      // Bentuk yang tidak dikenal dicatat lengkap dengan kunci payload, supaya
      // satu uji kirim dari dashboard Mayar cukup untuk memastikan bentuk
      // aslinya tanpa menebak lagi.
      console.warn(
        `Mayar webhook: bentuk event tidak dikenal (typeof=${typeof rawEvent}). ` +
        `Kunci payload: ${Object.keys(body).join(', ')}`
      )
      return NextResponse.json({ ok: true, skipped: true, reason: 'unknown-event-shape' })
    }

    if (eventType !== 'payment.received') {
      console.log(`Mayar webhook: event ${eventType} dilewati`)
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
        // Akun yang lahir dari pesanan ini menerima tautan buat password.
        // Akun lama tidak menerima apa pun dan tetap memakai password lamanya.
        ...(outcome.passwordSetupToken
          ? {
              setupUrl: passwordTokenUrl(outcome.passwordSetupToken),
              setupValidity: validityLabel(PASSWORD_TOKEN_PURPOSE.purchase),
            }
          : {}),
        packageTier: order.packageTier,
        slug: order.subdomain,
        invitationId: outcome.invitationId,
      }),
      `notifyUser(order_approved) order=${order.orderNumber}`
    )

    console.log(`Mayar webhook processed: order=${order.orderNumber} email=${order.email}`)
    return NextResponse.json({ ok: true })
  } catch (error) {
    // Dibalas 500, bukan 200. Dulu kegagalan apa pun di sini, misalnya
    // database putus di tengah provisionPaidOrder, dibalas 200 sehingga Mayar
    // menganggap notifikasinya sukses dan tidak mengirim ulang: pembeli sudah
    // membayar tapi pesanannya diam di pending sampai admin melihatnya.
    // Mengirim ulang aman: provisionPaidOrder memakai ulang akun, undangan,
    // langganan, dan komisi yang sudah tercatat, dan baru menandai pesanan
    // approved di langkah terakhir. Cabang invalid-tier di atas sudah memakai
    // 500 dengan alasan yang sama.
    console.error('Mayar webhook error:', error)
    return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 })
  }
}
