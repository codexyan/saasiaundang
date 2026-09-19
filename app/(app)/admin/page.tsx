import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session-server'
import { isAdmin, getAdminEmail } from '@/lib/auth'
import { invitations, orders, users, settings, templateRecords } from '@/lib/db'
import AdminPanel from '@/components/admin/AdminPanel'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const session = await getSession()
  /**
   * Sesi null tapi cookienya masih ada berarti tokennya sudah dicabut
   * (epoch naik karena reset password atau ganti role). Dilempar ke rute
   * keluar, BUKAN langsung ke /login, supaya cookie beracunnya dibuang.
   * Langsung ke /login membuat orangnya memantul terus tanpa penjelasan.
   */
  if (!session) redirect('/api/auth/logout?alasan=sesi-berakhir')
  // Sesi sah tapi bukan admin: itu bukan sesi basi, jadi cukup
  // dipulangkan ke dashboardnya sendiri.
  if (!isAdmin(session)) redirect('/dashboard')

  const adminEmail = getAdminEmail()
  const allUsers = await users.findAll()
  const allInvitations = await invitations.findAll()
  const allOrders = await orders.findAll()
  const appSettings = await settings.get()
  // findAllWithUsage(): koleksi template di panel admin menampilkan "dipakai N
  // undangan", dan angkanya dihitung dari tabel undangan — bukan dari kolom
  // usage_count yang tidak pernah diisi siapa pun.
  const allTemplateRecords = await templateRecords.findAllWithUsage()

  const regularUsers = allUsers.filter((u) => u.role !== 'admin' && u.email !== adminEmail)

  const usersWithInvitations = regularUsers.map((u) => {
    const userInvs = allInvitations.filter((i) => i.user_id === u.id)
    return {
      id: u.id,
      email: u.email,
      role: u.role || 'user',
      created_at: u.created_at,
      invitations: userInvs.map((inv) => ({
        id: inv.id,
        slug: inv.slug,
        template_id: inv.template_id,
        is_published: inv.is_published,
        is_paid: inv.is_paid,
        package_tier: inv.package_tier ?? null,
        expires_at: inv.expires_at,
        created_at: inv.created_at,
      })),
    }
  })

  const invitationsWithUsers = allInvitations.map((inv) => ({
    ...inv,
    user_email: allUsers.find((u) => u.id === inv.user_id)?.email ?? '',
  }))

  const paidCount = allInvitations.filter((i) => i.is_paid).length

  return (
    <AdminPanel
      users={usersWithInvitations}
      invitations={invitationsWithUsers}
      orders={allOrders}
      stats={{
        totalUsers: regularUsers.length,
        totalInvitations: allInvitations.length,
        totalActive: allInvitations.filter((i) => i.is_published && i.is_paid).length,
        totalPaid: paidCount,
        totalUnpaid: allInvitations.filter((i) => !i.is_paid).length,
        // Dijumlahkan dari pesanan yang benar-benar disetujui. Dulu
        // `paidCount * appSettings.price` — mengalikan jumlah undangan lunas
        // dengan SATU harga global, padahal pelanggan membayar tarif paket
        // yang berbeda-beda dan kini bisa berdiskon.
        totalRevenue: allOrders
          .filter((o) => o.status === 'approved')
          .reduce((sum, o) => sum + o.total_amount, 0),
      }}
      settings={{
        categories: appSettings.categories,
        colorPalettes: appSettings.colorPalettes,
        priceTiers: appSettings.priceTiers,
        flashSales: appSettings.flashSales,
        coupons: appSettings.coupons,
        deletedCategoryIds: appSettings.deletedCategoryIds ?? [],
        deletedTierIds: appSettings.deletedTierIds ?? [],
        bankAccounts: appSettings.bankAccounts,
        qrisImageUrl: appSettings.qrisImageUrl,
        paymentInstructions: appSettings.paymentInstructions,
        confirmationWhatsapp: appSettings.confirmationWhatsapp,
        siteName: appSettings.siteName ?? 'iaundang',
        siteTagline: appSettings.siteTagline ?? 'Digital Wedding Invitation',
        logoHorizontalUrl: appSettings.logoHorizontalUrl ?? '/logos/logo-horizontal.png',
        logoVerticalUrl: appSettings.logoVerticalUrl ?? '/logos/logo-vertical.png',
        contactEmail: appSettings.contactEmail ?? 'halo@iaundang.online',
        socialInstagram: appSettings.socialInstagram ?? 'ia.undang',
        socialTwitter: appSettings.socialTwitter ?? 'iaundang',
        socialGithub: appSettings.socialGithub ?? 'iaundang',
        appDomain: appSettings.appDomain ?? 'iaundang.online',
        demoSubdomain: appSettings.demoSubdomain ?? 'demo',
      }}
      templateRecords={allTemplateRecords}
      adminEmail={session.email}
    />
  )
}
