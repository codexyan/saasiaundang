import { NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/route-guards'
import { orders } from '@/lib/db'
import { notifyUser } from '@/lib/notifications'
import { runAfterResponse } from '@/lib/after-response'
import { provisionPaidOrder } from '@/lib/provision-order'
import { passwordTokenUrl, validityLabel, PASSWORD_TOKEN_PURPOSE } from '@/lib/password-token'
import { readJsonBody } from '@/lib/request-body'

export const dynamic = 'force-dynamic'

export const PATCH = withAdminAuth<{ params: Promise<{ id: string }> }>(async (req, session, props) => {
  const params = await props.params;

  try {
    const { id } = params
    const body = await readJsonBody(req)
    const { action, admin_notes } = body

    const order = await orders.findById(id)
    if (!order) return NextResponse.json({ error: 'Pesanannya tidak ditemukan. Coba periksa lagi nomor pesanan dan emailnya.' }, { status: 404 })

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
        return NextResponse.json({ error: 'Pesanannya tidak ditemukan. Coba periksa lagi nomor pesanan dan emailnya.' }, { status: 404 })
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
          // Jalur yang sama persis dengan webhook: pembeli membuat sendiri
          // passwordnya lewat email. Admin tidak lagi menjadi perantara.
          ...(outcome.passwordSetupToken
            ? {
                setupUrl: passwordTokenUrl(outcome.passwordSetupToken),
                setupValidity: validityLabel(PASSWORD_TOKEN_PURPOSE.purchase),
              }
            : {}),
        }),
        `notifyUser(order_approved) order=${order.order_number}`
      )

      return NextResponse.json({
        success: true,
        // Admin tidak lagi menerima password pembeli. Dulu password akun baru
        // dikirim balik ke layar admin untuk diteruskan lewat WhatsApp, dan
        // untuk akun lama dikirim password yang bahkan tidak pernah disimpan,
        // jadi tidak bisa dipakai masuk.
        passwordLinkSent: outcome.passwordSetupToken !== null,
        accountAlreadyExisted: outcome.passwordSetupToken === null,
        invitation_id: outcome.invitationId,
        slug: outcome.slug,
        subscription_id: outcome.subscriptionId,
      })
    }

    return NextResponse.json({ error: 'Action tidak valid' }, { status: 400 })
  } catch (error) {
    console.error('Order PATCH error:', error)
    return NextResponse.json({ error: 'Pesanannya gagal diproses. Coba lagi sebentar lagi ya.' }, { status: 500 })
  }
})
