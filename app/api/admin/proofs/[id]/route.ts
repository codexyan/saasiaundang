import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session-server'
import { isAdmin } from '@/lib/auth'
import { paymentProofs, invitations, affiliates, users, settings } from '@/lib/db'
import { subscriptions } from '@/lib/subscription'
import { PACKAGES, type PackageTier } from '@/lib/packages'

export const dynamic = 'force-dynamic'

interface Params { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, props: Params) {
  const params = await props.params;
  try {
    const session = await getSession()
    if (!isAdmin(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json() as { status: 'approved' | 'rejected'; admin_notes?: string; packageDuration?: number }
    const proof = await paymentProofs.findById(params.id)
    if (!proof) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Klaim transisi status secara atomik. null = sudah pernah diproses, jadi
    // JANGAN jalankan lagi efek sampingnya (langganan + komisi afiliasi).
    const updated = await paymentProofs.review(
      params.id,
      body.status,
      body.admin_notes || ''
    )
    if (!updated) {
      return NextResponse.json(
        { error: 'Bukti pembayaran ini sudah diproses sebelumnya.' },
        { status: 409 }
      )
    }

    if (body.status === 'approved') {
      const invitation = await invitations.findById(proof.invitation_id)
      const tier = (invitation?.package_tier || 'popular') as PackageTier
      const pkg = PACKAGES[tier] ?? PACKAGES.popular
      const expiresAt = new Date()
      expiresAt.setMonth(expiresAt.getMonth() + pkg.activeMonths)

      await invitations.update(proof.invitation_id, {
        is_paid: true,
        is_published: true,
        expires_at: expiresAt.toISOString(),
      })

      if (invitation) {
        await subscriptions.create({
          invitationId: proof.invitation_id,
          userId: proof.user_id,
          tier,
        })
      }
      if (invitation?.referred_by) {
        const affiliate = await affiliates.findByCode(invitation.referred_by)
        if (affiliate && affiliate.isActive) {
          // Nilai penjualan diambil dari harga paket menurut server, BUKAN dari
          // proof.amount. proof.amount berasal dari pembeli
          // (api/payment/proof: `Number(amount) || 0`, tanpa validasi apa pun),
          // jadi afiliator bisa mereferensikan dirinya sendiri, mengaku
          // mentransfer Rp 100 juta, lalu dibayari komisi atas angka fiktif itu.
          const appSettings = await settings.get()
          const priceTier = appSettings.priceTiers.find(t => t.id === tier)
          const saleAmount = priceTier?.price ?? pkg.price
          const commission = Math.round(saleAmount * (affiliate.commissionRate / 100))
          if (commission > 0) {
            const buyer = await users.findById(invitation.user_id)
            await affiliates.recordConversion(affiliate.id, {
              invitationId: proof.invitation_id,
              buyerEmail: buyer?.email || proof.user_email || '',
              packageTier: invitation.package_tier || 'popular',
              saleAmount,
              commission,
            })
          }
        }
      }
    }

    return NextResponse.json({ proof: updated })
  } catch (error) {
    console.error('Admin proof update error:', error)
    return NextResponse.json({ error: 'Gagal memperbarui bukti pembayaran' }, { status: 500 })
  }
}
