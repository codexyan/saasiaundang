import { notFound } from 'next/navigation'
import { TEMPLATES, type Template } from '@/lib/types'
import { DEMO_INVITATION, DEMO_GALLERIES, DEMO_WISHES, DEMO_GUESTS } from '@/lib/demo-data'
import DemoPreviewClient from './DemoPreviewClient'

interface Props {
  params: Promise<{ template: string }>
}

export function generateStaticParams() {
  return TEMPLATES.map((t) => ({ template: t.id }))
}

export async function generateMetadata(props: Props) {
  const params = await props.params;
  const tpl = TEMPLATES.find((t) => t.id === params.template)
  if (!tpl) return {}
  return {
    title: `Coba Template ${tpl.name} · iaundang`,
    description: `Preview undangan digital dengan template ${tpl.name}. Masukkan nama kamu dan lihat hasilnya langsung.`,
  }
}

export default async function DemoPage(props: Props) {
  const params = await props.params;
  if (!TEMPLATES.find((t) => t.id === params.template)) notFound()

  return (
    <DemoPreviewClient
      templateId={params.template as Template}
      defaultInvitation={DEMO_INVITATION}
      galleries={DEMO_GALLERIES}
      wishes={DEMO_WISHES}
      guests={DEMO_GUESTS}
    />
  )
}
