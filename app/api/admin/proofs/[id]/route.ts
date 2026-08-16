import { NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/route-guards'
import { paymentProofs, invitations, affiliates, users, settings } from '@/lib/db'
import { subscriptions } from '@/lib/subscription'
import { PACKAGES, type PackageTier } from '@/lib/packages'
import { readJsonBody } from '@/lib/request-body'

export const dynamic = 'force-dynamic'

interface Params { params: Promise<{ id: string }> }

export const PATCH = withAdminAuth<Params>(async (req, session, props) => {
  const params = await props.params;
  try {
    const body = await readJsonBody(req) as { status: 'approved' | 'rejected'; admin_notes?: string; packageDuration?: number }
    const proof = await paymentProofs.findById(params.id)
    if (!proof) return NextResponse.json({ error: 'Datanya tidak ditemukan.' }, { status: 404 })

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
      // Klaim status DILAKUKAN LEBIH DULU (di atas) dan itu memang disengaja:
      // affiliates.recordConversion() TIDAK idempoten — ia membuat baris
      // Referral baru dan menaikkan penghitung, jadi kalau dijalankan dua kali
      // komisinya dibayar dua kali. Klaim atomik itulah yang menjamin
      // sekali-jalan.
      //
      // Konsekuensinya: kalau efek sampingnya gagal di tengah, statusnya
      // terlanjur 'approved' dan percobaan ulang akan dibalas 409 — approval
      // terkunci permanen tanpa langganan pernah dibuat. Karena itu blok ini
      // MENGEMBALIKAN status ke 'pending' saat gagal, supaya bisa dicoba lagi.
      try {
        const invitation = await invitations.findById(proof.invitation_id)
        const tier = (invitation?.package_tier || 'popular') as PackageTier
        const pkg = PACKAGES[tier]
        if (!pkg) {
          throw new Error(`Paket "${tier}" tidak dikenal — approval dibatalkan`)
        }

        const expiresAt = new Date()
        expiresAt.setMonth(expiresAt.getMonth() + pkg.activeMonths)

        await invitations.update(proof.invitation_id, {
          is_paid: true,
          is_published: true,
          expires_at: expiresAt.toISOString(),
        })

        if (invitation) {
          // Pakai ulang kalau sudah ada, supaya percobaan ulang tidak
          // menghasilkan langganan ganda.
          const existing = await subscriptions.findByInvitation(proof.invitation_id)
          if (!existing) {
            await subscriptions.create({
              invitationId: proof.invitation_id,
              userId: proof.user_id,
              tier,
            })
          }
        }

        if (invitation?.referred_by) {
          const affiliate = await affiliates.findByCode(invitation.referred_by)
          if (affiliate && affiliate.isActive) {
            // Nilai penjualan diambil dari harga paket menurut server, BUKAN dari
            // proof.amount. proof.amount berasal dari pembeli
            // (api/payment/proof: `Number(amount) || 0`, tanpa validasi apa pun),
            // jadi afiliator bisa mereferensikan dirinya sendiri, mengaku
            // mentransfer Rp 100 juta, lalu dibayari komisi atas angka fiktif itu.
            //
            // TIDAK ada fallback ke harga Popular: menebak harga berarti
            // membayar komisi atas nilai yang tidak pernah terjadi.
            const appSettings = await settings.get()
            const priceTier = appSettings.priceTiers.find(t => t.id === tier)
            if (!priceTier) {
              throw new Error(`Tier "${tier}" tidak ada di priceTiers — komisi tidak bisa dihitung`)
            }

            const commission = Math.round(priceTier.price * (affiliate.commissionRate / 100))
            if (commission > 0) {
              const buyer = await users.findById(invitation.user_id)
              await affiliates.recordConversion(affiliate.id, {
                invitationId: proof.invitation_id,
                buyerEmail: buyer?.email || proof.user_email || '',
                packageTier: invitation.package_tier || 'popular',
                saleAmount: priceTier.price,
                commission,
              })
            }
          }
        }
      } catch (sideEffectError) {
        // Buka kembali klaimnya supaya admin bisa mencoba lagi. Tanpa ini,
        // buktinya tetap 'approved' selamanya padahal tidak ada yang tersedia.
        await paymentProofs
          .update(params.id, { status: 'pending', admin_notes: '', reviewed_at: null })
          .catch(() => {
            console.error(
              `Gagal mengembalikan status bukti ${params.id} ke pending, ` +
              'perlu diperbaiki manual di database.'
            )
          })
        throw sideEffectError
      }
    }

    return NextResponse.json({ proof: updated })
  } catch (error) {
    console.error('Admin proof update error:', error)
    return NextResponse.json({ error: 'Bukti pembayarannya gagal diperbarui. Coba lagi sebentar lagi ya.' }, { status: 500 })
  }
})
