import { NextRequest, NextResponse } from 'next/server'
import { verifyMayarWebhook } from '@/lib/mayar'
import { prisma } from '@/lib/prisma'
import { subscriptions } from '@/lib/subscription'
import { notifyUser } from '@/lib/notifications'
import { runAfterResponse } from '@/lib/after-response'
import { PACKAGES, type PackageTier } from '@/lib/packages'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
      || req.headers.get('x-mayar-token')
      || ''

    const body = await req.json()

    const isValid = verifyMayarWebhook(token) || verifyMayarWebhook(body.token || '')
    if (!isValid) {
      console.warn('Mayar webhook: invalid token')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const eventType = body?.event?.received
    if (eventType !== 'payment.received') {
      return NextResponse.json({ ok: true, skipped: true })
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

    if (order.status === 'approved') {
      return NextResponse.json({ ok: true, message: 'Already processed' })
    }

    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'approved', reviewedAt: new Date() },
    })

    const tier = order.packageTier as PackageTier
    const pkg = PACKAGES[tier]
    if (order.invitationId && pkg) {
      const existingSub = await subscriptions.findByInvitation(order.invitationId)

      if (existingSub) {
        await subscriptions.renew(existingSub.id, tier)
      } else {
        await subscriptions.create({
          invitationId: order.invitationId,
          userId: order.email,
          orderId: order.id,
          tier,
        })
      }

      await prisma.invitation.update({
        where: { id: order.invitationId },
        data: { isPaid: true },
      })
    }

    runAfterResponse(
      notifyUser('order_approved', order.email, {
        orderNumber: order.orderNumber,
        email: customerEmail || order.email,
        name: customerName || `${order.groomName} & ${order.brideName}`,
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
