import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session-server'
import { isAdmin } from '@/lib/auth'
import { orders } from '@/lib/db'
import { notifyUser } from '@/lib/notifications'
import { runAfterResponse } from '@/lib/after-response'
import { provisionPaidOrder } from '@/lib/provision-order'
import { readJsonBody } from '@/lib/request-body'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await getSession()
  if (!session || !isAdmin(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = params
    const body = await readJsonBody(req)
    const { action, admin_notes } = body

    const order = await orders.findById(id)
    if (!order) return NextResponse.json({ error: 'Pesanan tidak ditemukan' }, { status: 404 })

    if (action === 'reject') {
      await orders.update(id, {
        status: 'rejected',
        admin_notes: admin_notes || '',
        reviewed_at: new Date().toISOString(),
      })
      runAfterResponse(
        notifyUser('order_rejected', order.email, {
          orderNumber: order.order_number,
          reason: admin_notes || '',
        }),
        `notifyUser(order_rejected) order=${order.order_number}`
      )
      return NextResponse.json({ success: true })
    }

    if (action === 'approve') {
      // Jalur penyediaan yang SAMA dengan webhook Mayar (lib/provision-order.ts),
      // supaya keduanya tidak bisa berbeda perilaku. Dulu logikanya hanya ada di
      // sini, dan itulah sebabnya jalur webhook tidak pernah membuat apa pun.
      const outcome = await provisionPaidOrder(id, { adminNotes: admin_notes || '' })

      if (outcome.status === 'not-found') {
        return NextResponse.json({ error: 'Pesanan tidak ditemukan' }, { status: 404 })
      }
      if (outcome.status === 'already-provisioned') {
        return NextResponse.json({ error: 'Pesanan sudah diapprove' }, { status: 409 })
      }
      if (outcome.status === 'invalid-tier') {
        return NextResponse.json(
          { error: `Pesanan tidak bisa diproses: ${outcome.tier}` },
          { status: 400 }
        )
      }

      runAfterResponse(
        notifyUser('order_approved', order.email, {
          orderNumber: order.order_number,
          slug: outcome.slug,
          email: order.email,
          tierName: outcome.tierName,
          expiresAt: outcome.expiresAt.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
        }),
        `notifyUser(order_approved) order=${order.order_number}`
      )

      return NextResponse.json({
        success: true,
        // Password hanya ada kalau akunnya memang BARU dibuat. Dulu selalu
        // dikirim: kalau emailnya sudah punya akun, password baru digenerate
        // tapi tidak pernah disimpan — admin meneruskan kredensial yang tidak
        // bisa dipakai login.
        credentials: outcome.plainPassword
          ? { email: order.email, password: outcome.plainPassword }
          : null,
        accountAlreadyExisted: outcome.plainPassword === null,
        invitation_id: outcome.invitationId,
        slug: outcome.slug,
        subscription_id: outcome.subscriptionId,
      })
    }

    return NextResponse.json({ error: 'Action tidak valid' }, { status: 400 })
  } catch (error) {
    console.error('Order PATCH error:', error)
    return NextResponse.json({ error: 'Gagal memproses pesanan' }, { status: 500 })
  }
}
