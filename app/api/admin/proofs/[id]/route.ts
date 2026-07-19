import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session-server'
import { isAdmin } from '@/lib/auth'
import { paymentProofs, invitations, affiliates, users } from '@/lib/db'
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

    const updated = await paymentProofs.update(params.id, {
      status: body.status,
      admin_notes: body.admin_notes || '',
      reviewed_at: new Date().toISOString(),
    })

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
          const saleAmount = proof.amount ?? 0
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
