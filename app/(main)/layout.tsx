import { Suspense } from 'react'
import Navbar from '@/components/ui/Navbar'
import Footer from '@/components/ui/Footer'
import ReferralCapture from '@/components/landing/ReferralCapture'
import { settings, articles, templateRecords } from '@/lib/db'
import { getSession } from '@/lib/session-server'
import { isAdmin } from '@/lib/auth'
import MaintenanceScreen from '@/components/ui/MaintenanceScreen'

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

  /**
   * Mode pemeliharaan.
   *
   * Sakelarnya sudah lama ada di panel admin, dan sampai 19 Sep 2026 tidak
   * ada satu baris pun di seluruh repo yang membacanya: menyalakannya tidak
   * menutup apa pun. Sakelar yang berbohong lebih berbahaya daripada tidak
   * ada sakelar, karena dipercaya justru di saat genting.
   *
   * Diperiksa di layout ini, bukan di middleware, karena middleware berjalan
   * tanpa akses database dan mengimpor Prisma ke sana akan menyeret seluruh
   * lapisan database ke bundel middleware.
   *
   * Yang ditutup hanya halaman publik. Undangan yang sudah terbit hidup di
   * luar grup rute ini dan sengaja dibiarkan terbuka: pemeliharaan kami
   * bukan alasan tamu gagal membuka undangan orang. Admin juga tetap masuk,
   * supaya bisa memeriksa hasil perbaikannya sendiri.
   */
  if (appSettings.maintenanceMode) {
    const sesi = await getSession()
    if (!isAdmin(sesi)) return <MaintenanceScreen whatsapp={whatsapp} />
  }
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
