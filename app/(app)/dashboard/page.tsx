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
  /**
   * Sesi null tapi cookienya masih ada berarti tokennya sudah dicabut
   * (epoch naik karena reset password atau ganti role). Dilempar ke rute
   * keluar, BUKAN langsung ke /login, supaya cookie beracunnya dibuang.
   * Langsung ke /login membuat orangnya memantul terus tanpa penjelasan.
   */
  if (!session) redirect('/api/auth/logout?alasan=sesi-berakhir')

  const [invitationList, activeTemplates, appSettings] = await Promise.all([
    invitations.findManyByUserId(session.userId) as Promise<Invitation[]>,
    templateRecords.findActive(),
    settings.get(),
  ])

  /**
   * Tema yang benar benar dipakai undangan milik pengguna ini, lengkap
   * dengan config-nya.
   *
   * Dulu dashboard memuat tema untuk pratinjau penuh dari modul yang ditulis
   * mati di lib/template-configs/javanese-gold, dan hanya dipakai kalau id-nya
   * kebetulan cocok. Akibatnya tombol Preview diam saja untuk undangan bertema
   * Rose Garden atau Midnight Luxe. Dikirim dari server saja: jumlahnya
   * sebanyak tema yang dipakai pengguna, biasanya satu.
   */
  const idTemaDipakai = [...new Set(invitationList.map(i => i.template_id))]
  const temaUndangan = (
    await Promise.all(idTemaDipakai.map(id => templateRecords.findById(id)))
  ).filter((t): t is NonNullable<typeof t> => t !== null)

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
      invitationTemplates={temaUndangan}
    />
  )
}
