import { Suspense } from 'react'
import Navbar from '@/components/ui/Navbar'
import Footer from '@/components/ui/Footer'
import ReferralCapture from '@/components/landing/ReferralCapture'
import { settings } from '@/lib/db'

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Kontak di footer dibaca dari pengaturan admin. Kalau kosong, tautannya
  // tidak dirender sama sekali: lebih baik hilang daripada menuju nomor contoh.
  const appSettings = await settings.get()
  const whatsapp = appSettings.contactWhatsapp || appSettings.confirmationWhatsapp || undefined
  return (
    <div className="min-h-screen flex flex-col bg-ivory">
      <Suspense fallback={null}><ReferralCapture /></Suspense>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer whatsapp={whatsapp} />
    </div>
  )
}
