import { notFound } from 'next/navigation'
import { templateRecords, settings } from '@/lib/db'
import PratinjauTemplateClient from './PratinjauTemplateClient'

/**
 * SEMENTARA. Melihat modul Template admin tanpa sesi login, supaya perbaikan
 * tampilan bisa diperiksa langsung di browser seperti halaman publik.
 *
 * Aman: id tiap record dipalsukan, jadi setiap panggilan tulis dari editor
 * menuju record yang tidak ada. Rute tulisnya sendiri juga dijaga
 * withAdminAuth dan akan menolak dengan 401 tanpa sesi. Hapus rute ini begitu
 * pekerjaannya selesai.
 */
export const dynamic = 'force-dynamic'

export default async function PratinjauTemplate() {
  if (process.env.NODE_ENV === 'production') notFound()

  const [semua, appSettings] = await Promise.all([
    templateRecords.findAll(),
    settings.get(),
  ])

  // Data nyata supaya tata letaknya diuji dengan isi yang sebenarnya, tapi
  // dengan id yang tidak mungkin cocok dengan baris mana pun.
  const records = semua.map((r, i) => ({ ...r, id: `pratinjau-dev-${i}` }))

  return (
    <PratinjauTemplateClient
      records={records}
      categories={appSettings.categories}
      palettes={appSettings.colorPalettes}
      tiers={appSettings.priceTiers}
    />
  )
}
