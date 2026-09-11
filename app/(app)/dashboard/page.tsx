import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session-server'
import { isAdmin } from '@/lib/auth'
import { invitations, templateRecords, settings } from '@/lib/db'
import DashboardClient from '@/components/dashboard/DashboardClient'

export const dynamic = 'force-dynamic'
import type { Invitation } from '@/lib/types'

interface Props {
  searchParams: Promise<{ template?: string; payment?: string; order?: string }>
}

export default async function DashboardPage(props: Props) {
  const searchParams = await props.searchParams;
  const session = await getSession()
  if (!session) redirect('/login')

  const [invitationList, activeTemplates, appSettings] = await Promise.all([
    invitations.findManyByUserId(session.userId) as Promise<Invitation[]>,
    templateRecords.findActive(),
    settings.get(),
  ])

  const allTemplates = activeTemplates.map(t => ({
    id: t.id,
    name: t.name,
    category: t.category,
    thumbnailUrl: t.thumbnail_url,
    // Halaman demo memilih tema lewat ?id=. Dulu parameternya tidak dikirim,
    // jadi setiap tombol Preview yang memakai demoUrl selalu membuka tema
    // bawaan (Javanese Gold), apa pun template yang dipilih.
    demoUrl: `/demo/renderer?id=${encodeURIComponent(t.id)}`,
    isNew: true,
  }))

  const selectedTemplateId = searchParams.template || ''
  const paymentSuccess = searchParams.payment === 'success'

  return (
    <DashboardClient
      user={{ id: session.userId, email: session.email }}
      invitations={invitationList}
      selectedTemplateId={selectedTemplateId}
      allTemplates={allTemplates}
      isAdmin={isAdmin(session)}
      paymentSuccess={paymentSuccess}
      priceTiers={appSettings.priceTiers}
    />
  )
}
