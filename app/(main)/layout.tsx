import { Suspense } from 'react'
import Navbar from '@/components/ui/Navbar'
import Footer from '@/components/ui/Footer'
import ReferralCapture from '@/components/landing/ReferralCapture'
import { settings, articles, templateRecords } from '@/lib/db'

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Kontak di footer dibaca dari pengaturan admin. Kalau kosong, tautannya
  // tidak dirender sama sekali: lebih baik hilang daripada menuju nomor contoh.
  const [appSettings, jumlahArtikel, temaAktif] = await Promise.all([
    settings.get(),
    articles.countPublished(),
    templateRecords.findActive(),
  ])
  const whatsapp = appSettings.contactWhatsapp || appSettings.confirmationWhatsapp || undefined
  const adaArtikel = jumlahArtikel > 0
  const demoHref = temaAktif[0] ? `/demo/renderer?id=${temaAktif[0].id}` : undefined
  return (
    <div className="min-h-screen flex flex-col bg-ivory">
      <Suspense fallback={null}><ReferralCapture /></Suspense>
      <Navbar adaArtikel={adaArtikel} />
      <main className="flex-1">{children}</main>
      <Footer whatsapp={whatsapp} adaArtikel={adaArtikel} demoHref={demoHref} />
    </div>
  )
}
