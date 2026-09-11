import { redirect } from 'next/navigation'
import { settings, templateRecords } from '@/lib/db'
import OrderForm from './OrderForm'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Buat Undangan | iaundang',
  description: 'Isi data pernikahan kalian, pilih paket, lalu undangan digital kalian langsung siap.',
}

export default async function OrderPage({ searchParams }: { searchParams: Promise<{ template?: string }> }) {
  const params = await searchParams

  if (!params.template) {
    redirect('/templates')
  }

  const [appSettings, allTemplates] = await Promise.all([
    settings.get(),
    templateRecords.findAll(),
  ])

  const template = allTemplates.find(t => t.id === params.template && t.status === 'active')
  if (!template) {
    redirect('/templates')
  }

  // Dulu di sini ada .filter(t => ['starter','popular','eksklusif'].includes(t.id)),
  // jadi tier kustom buatan admin lewat panel Paket & Promo tidak pernah sampai
  // ke form — tidak bisa dipilih, jadi tidak bisa dibeli. API /api/orders sendiri
  // sudah memvalidasi ke settings.priceTiers, jadi menyaring di sini justru
  // memutus jalur pembelian untuk tier yang sebenarnya sah.
  const tiers = appSettings.priceTiers
    .sort((a, b) => a.price - b.price)
    .map(t => ({
      id: t.id,
      label: t.label,
      price: t.price,
      description: t.description ?? '',
      color: t.color ?? '#6366f1',
      icon: t.icon ?? 'rocket',
      highlight: t.highlight ?? false,
      features: t.features ?? null,
    }))

  const paymentConfig = {
    bankAccounts: appSettings.bankAccounts.filter(b => b.isActive),
    qrisImageUrl: appSettings.qrisImageUrl,
    paymentInstructions: appSettings.paymentInstructions,
    confirmationWhatsapp: appSettings.confirmationWhatsapp,
  }

  return (
    <OrderForm
      templateId={template.id}
      templateName={template.name}
      // Harga khusus template (0 = ikut harga paket) dan kategorinya ikut
      // diturunkan supaya ringkasan di form memakai dasar harga YANG SAMA
      // dengan yang dipakai server saat menagih.
      templatePrice={template.price}
      templateCategory={template.category}
      flashSales={appSettings.flashSales}
      tiers={tiers}
      paymentConfig={paymentConfig}
    />
  )
}
