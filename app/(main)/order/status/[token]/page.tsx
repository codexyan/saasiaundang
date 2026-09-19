import { orders, settings } from '@/lib/db'
import { APP_DOMAIN } from '@/lib/subdomain'
import { readOrderStatusToken, toOrderStatusView, type OrderStatusView } from '@/lib/order-status'
import StatusClient from './StatusClient'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Status Pesanan | iaundang',
  description: 'Status pesanan undangan kalian.',
  // Tautan pribadi milik satu pembeli. Tidak boleh masuk hasil pencarian.
  robots: { index: false, follow: false },
}

/**
 * Tujuan `redirectUrl` Mayar sesudah pembeli membayar.
 *
 * Dulu Mayar mengembalikan pembeli ke /dashboard?payment=success. Pembeli baru
 * belum punya sesi di titik itu, jadi middleware melemparnya ke /login tanpa
 * password: buntu persis sesudah uang keluar. Halaman ini tidak pernah membuat
 * sesi, dan isinya ditentukan token di URL.
 */
export default async function OrderStatusPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const parsed = await readOrderStatusToken(token)

  const [appSettings, order] = await Promise.all([
    settings.get(),
    parsed.ok ? orders.findById(parsed.orderId) : Promise.resolve(null),
  ])

  const initial: OrderStatusView | null = order ? toOrderStatusView(order, appSettings) : null
  const whatsapp = appSettings.confirmationWhatsapp || appSettings.contactWhatsapp || ''

  return <StatusClient token={token} initial={initial} whatsapp={whatsapp} appDomain={APP_DOMAIN} />
}
