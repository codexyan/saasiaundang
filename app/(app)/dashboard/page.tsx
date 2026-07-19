import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session-server'
import { isAdmin } from '@/lib/auth'
import { invitations, templateRecords } from '@/lib/db'
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

  const invitation = await invitations.findByUserId(session.userId) as Invitation | null

  const allTemplates = (await templateRecords.findActive()).map(t => ({
    id: t.id,
    name: t.name,
    category: t.category,
    thumbnailUrl: t.thumbnail_url,
    demoUrl: `/demo/renderer`,
    isNew: true,
  }))

  const selectedTemplateId = searchParams.template || ''
  const paymentSuccess = searchParams.payment === 'success'

  return (
    <DashboardClient
      user={{ id: session.userId, email: session.email }}
      invitation={invitation}
      selectedTemplateId={selectedTemplateId}
      allTemplates={allTemplates}
      isAdmin={isAdmin(session)}
      paymentSuccess={paymentSuccess}
    />
  )
}
