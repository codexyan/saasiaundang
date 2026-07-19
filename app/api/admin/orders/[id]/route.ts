import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getSession } from '@/lib/session-server'
import { isAdmin } from '@/lib/auth'
import { orders, users, invitations } from '@/lib/db'
import { subscriptions } from '@/lib/subscription'
import { PACKAGES, type PackageTier } from '@/lib/packages'
import { notifyUser } from '@/lib/notifications'
import { runAfterResponse } from '@/lib/after-response'
import { randomString } from '@/lib/random'
import { readJsonBody } from '@/lib/request-body'

export const dynamic = 'force-dynamic'

// Math.random() BUKAN CSPRNG — kredensial pelanggan tidak boleh dibuat darinya.
// randomString() memakai Web Crypto. Panjang dinaikkan 8 -> 12.
const PASSWORD_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789'

function generatePassword(length = 12): string {
  return randomString(length, PASSWORD_ALPHABET)
}

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
      if (order.status === 'approved') {
        return NextResponse.json({ error: 'Pesanan sudah diapprove' }, { status: 409 })
      }

      const tier = order.package_tier as PackageTier
      const pkg = PACKAGES[tier] ?? PACKAGES.popular
      const packageDuration = pkg.activeMonths

      const plainPassword = generatePassword()
      const passwordHash = await bcrypt.hash(plainPassword, 10)

      let user = await users.findByEmail(order.email)
      const isNewAccount = !user
      if (!user) {
        user = await users.create({
          email: order.email,
          password_hash: passwordHash,
          role: 'user',
        })
      }

      const expiresAt = new Date()
      expiresAt.setMonth(expiresAt.getMonth() + packageDuration)

      const invitationData = {
        groom_name: order.groom_name,
        bride_name: order.bride_name,
        groom_nickname: order.groom_nickname,
        bride_nickname: order.bride_nickname,
        groom_father: order.groom_father,
        groom_mother: order.groom_mother,
        bride_father: order.bride_father,
        bride_mother: order.bride_mother,
      }

      const inv = await invitations.create({
        user_id: user.id,
        slug: order.subdomain,
        template_id: order.template_id,
        data: invitationData as unknown as import('@/lib/types').InvitationData,
        package_tier: order.package_tier as import('@/lib/packages').PackageTier,
        is_published: false,
        is_paid: true,
        expires_at: expiresAt.toISOString(),
        referred_by: order.referred_by,
      })

      const subscription = await subscriptions.create({
        invitationId: inv.id,
        userId: user.id,
        orderId: id,
        tier: order.package_tier as PackageTier,
      })

      await orders.update(id, {
        status: 'approved',
        admin_notes: admin_notes || '',
        reviewed_at: new Date().toISOString(),
        invitation_id: inv.id,
      })

      runAfterResponse(
        notifyUser('order_approved', order.email, {
          orderNumber: order.order_number,
          slug: order.subdomain,
          email: order.email,
          tierName: pkg.name,
          expiresAt: expiresAt.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
        }),
        `notifyUser(order_approved) order=${order.order_number}`
      )

      return NextResponse.json({
        success: true,
        // Password hanya dikirim balik kalau akunnya memang BARU dibuat.
        // Dulu selalu dikirim: kalau emailnya sudah punya akun, password baru
        // digenerate tapi tidak pernah disimpan — admin meneruskan kredensial
        // yang tidak bisa dipakai login.
        credentials: isNewAccount
          ? { email: order.email, password: plainPassword }
          : null,
        accountAlreadyExisted: !isNewAccount,
        invitation_id: inv.id,
        slug: order.subdomain,
        subscription_id: subscription.id,
      })
    }

    return NextResponse.json({ error: 'Action tidak valid' }, { status: 400 })
  } catch (error) {
    console.error('Order PATCH error:', error)
    return NextResponse.json({ error: 'Gagal memproses pesanan' }, { status: 500 })
  }
}
