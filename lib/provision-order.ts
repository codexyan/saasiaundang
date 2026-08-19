import bcrypt from 'bcryptjs'
import { orders, users, invitations } from './db'
import { subscriptions } from './subscription'
import { PACKAGES, type PackageTier } from './packages'
import { resolveExpiry } from './tiers'
import { randomString } from './random'
import type { InvitationData } from './types'

/**
 * Menyediakan (provision) pesanan yang sudah dibayar: akun, undangan, langganan.
 *
 * Kenapa ini ada sebagai modul terpisah:
 * Dulu logikanya hanya ada di jalur approve admin. Webhook Mayar punya jalurnya
 * sendiri yang dibungkus `if (order.invitationId && pkg)` — padahal pesanan yang
 * dibuat lewat /api/orders SELALU punya invitation_id null (undangannya baru
 * dibuat saat approve). Jadi seluruh blok penyediaan itu DILEWATI, tapi
 * statusnya terlanjur diubah jadi "approved". Akibatnya: pelanggan membayar
 * lewat Mayar, tidak mendapat akun/undangan/langganan apa pun, DAN admin tidak
 * bisa memperbaikinya karena jalur approve manual menolak dengan
 * 409 "Pesanan sudah diapprove". Uang masuk, pelanggan tidak dapat apa-apa.
 *
 * Urutan operasi DISENGAJA: seluruh penyediaan dikerjakan LEBIH DULU, dan
 * status pesanan baru diubah jadi "approved" di langkah TERAKHIR. Kalau ada
 * langkah yang gagal di tengah, pesanan tetap "pending" sehingga bisa diulang —
 * bukan terkunci "approved" tanpa langganan seperti sebelumnya.
 *
 * Tiap langkah juga memakai ulang data yang sudah ada (akun, undangan dengan
 * slug sama, langganan untuk undangan itu), supaya pengulangan aman: webhook
 * pembayaran dikirim dengan jaminan at-least-once dan memang bisa datang ganda.
 */
export type ProvisionOutcome =
  | { status: 'not-found' }
  | { status: 'invalid-tier'; tier: string }
  | { status: 'already-provisioned'; invitationId: string }
  | {
      status: 'provisioned'
      invitationId: string
      subscriptionId: string
      userId: string
      slug: string
      tierName: string
      expiresAt: Date
      /** Hanya terisi kalau akunnya BARU dibuat. Akun lama tetap memakai password lamanya. */
      plainPassword: string | null
    }

const PASSWORD_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789'

export async function provisionPaidOrder(
  orderId: string,
  options: { adminNotes?: string } = {}
): Promise<ProvisionOutcome> {
  const order = await orders.findById(orderId)
  if (!order) return { status: 'not-found' }

  // Sudah pernah disediakan sepenuhnya — jangan kerjakan dua kali.
  if (order.status === 'approved' && order.invitation_id) {
    return { status: 'already-provisioned', invitationId: order.invitation_id }
  }

  const tier = order.package_tier as PackageTier
  const pkg = PACKAGES[tier]
  // Sengaja TIDAK jatuh ke PACKAGES.popular: menebak paket berarti memberi
  // durasi dan fitur yang tidak dibayar pelanggan. Lebih baik gagal terang.
  if (!pkg) return { status: 'invalid-tier', tier: String(order.package_tier) }

  // ── 1. Akun ────────────────────────────────────────────────────────────
  let user = await users.findByEmail(order.email)
  let plainPassword: string | null = null

  if (!user) {
    plainPassword = randomString(12, PASSWORD_ALPHABET)
    user = await users.create({
      email: order.email,
      password_hash: await bcrypt.hash(plainPassword, 10),
      role: 'user',
    })
  }

  // ── 2. Undangan ────────────────────────────────────────────────────────
  //
  // Masa aktif dari `validity_days` milik paket DI PENGATURAN ADMIN, bukan
  // `pkg.activeMonths` yang hardcoded. Dulu keduanya hidup berdampingan:
  // checkout memamerkan "aktif 90 hari" dari pengaturan, penyediaan memakai
  // 3 bulan dari konstanta — setara hari ini, dan langsung melenceng begitu
  // admin menyentuh salah satunya.
  const expiresAt = await resolveExpiry(tier)

  // Kolom slug unik. Kalau percobaan sebelumnya sempat membuat undangannya lalu
  // gagal di langkah berikutnya, create() akan melempar — jadi pakai yang ada.
  let invitation = await invitations.findBySlug(order.subdomain)

  if (!invitation) {
    invitation = await invitations.create({
      user_id: user.id,
      slug: order.subdomain,
      template_id: order.template_id,
      data: {
        groom_name: order.groom_name,
        bride_name: order.bride_name,
        groom_nickname: order.groom_nickname,
        bride_nickname: order.bride_nickname,
        groom_father: order.groom_father,
        groom_mother: order.groom_mother,
        bride_father: order.bride_father,
        bride_mother: order.bride_mother,
      } as unknown as InvitationData,
      package_tier: tier,
      is_published: false,
      is_paid: true,
      expires_at: expiresAt.toISOString(),
      referred_by: order.referred_by,
    })
  } else if (invitation.user_id !== user.id) {
    // Slug sudah dipakai orang lain — jangan pernah menyerahkan undangan milik
    // pengguna lain ke pembeli ini.
    return { status: 'invalid-tier', tier: `slug "${order.subdomain}" sudah dipakai akun lain` }
  } else {
    await invitations.update(invitation.id, { is_paid: true, expires_at: expiresAt.toISOString() })
  }

  // ── 3. Langganan ───────────────────────────────────────────────────────
  let subscription = await subscriptions.findByInvitation(invitation.id)
  if (!subscription) {
    subscription = await subscriptions.create({
      invitationId: invitation.id,
      userId: user.id,
      orderId: order.id,
      tier,
    })
  }

  // ── 4. TERAKHIR: tandai pesanan selesai ────────────────────────────────
  await orders.update(order.id, {
    status: 'approved',
    admin_notes: options.adminNotes ?? '',
    reviewed_at: new Date().toISOString(),
    invitation_id: invitation.id,
  })

  return {
    status: 'provisioned',
    invitationId: invitation.id,
    subscriptionId: subscription.id,
    userId: user.id,
    slug: order.subdomain,
    tierName: pkg.name,
    expiresAt,
    plainPassword,
  }
}
