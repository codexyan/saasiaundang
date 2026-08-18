import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session-server'
import { isAdmin, getAdminEmail } from '@/lib/auth'
import { invitations, orders, users, settings, paymentProofs, templateRecords } from '@/lib/db'
import AdminPanel from '@/components/admin/AdminPanel'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const session = await getSession()
  if (!session || !isAdmin(session)) redirect('/dashboard')

  const adminEmail = getAdminEmail()
  const allUsers = await users.findAll()
  const allInvitations = await invitations.findAll()
  const allOrders = await orders.findAll()
  const allProofs = await paymentProofs.findAll()
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
      proofs={allProofs}
      stats={{
        totalUsers: regularUsers.length,
        totalInvitations: allInvitations.length,
        totalActive: allInvitations.filter((i) => i.is_published && i.is_paid).length,
        totalPaid: paidCount,
        totalUnpaid: allInvitations.filter((i) => !i.is_paid).length,
        totalRevenue: paidCount * appSettings.price,
      }}
      settings={{
        price: appSettings.price,
        packageName: appSettings.packageName,
        packageDuration: appSettings.packageDuration,
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
