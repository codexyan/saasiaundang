import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Fraunces, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { MotionProvider } from '@/components/marketing/MotionProvider'
import { SessionProvider } from '@/components/ui/SessionProvider'

// Font display serif (Arah A — Elegant Editorial): hanya untuk heading via
// utility .font-display, bukan body text. Subset latin, weight 500/600 saja.
const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['500', '600'],
  style: ['normal'],
  display: 'swap',
  variable: '--font-display',
  preload: true,
})

// Sans produk, dari DESIGN.md. Dipilih karena bentuk hurufnya yang hangat dan
// agak membulat menemani serif Fraunces tanpa ikut berebut perhatian, dan
// karena angkanya terbaca jelas di ukuran kecil, tempat harga dan tanggal acara
// hidup. Geist Sans tetap dimuat sampai pengaturan tipografi blog dipastikan
// tidak lagi menyimpan nilai lamanya.
const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-sans',
  preload: true,
})

export const metadata: Metadata = {
  title: {
    default: 'iaundang: Buat Undangan Digital Premium, Tanpa Coding, Tanpa Ribet',
    template: '%s | iaundang',
  },
  description:
    'Platform self-service untuk pasangan: pilih template undangan sinematik, kustomisasi langsung dari dashboard, kirim link personal ke setiap tamu. Tanpa skill desain, tanpa coding.',
  keywords: ['undangan digital', 'undangan pernikahan premium', 'template undangan', 'wedding invitation', 'iaundang'],
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
  openGraph: {
    title: 'iaundang: Undangan Digital Premium Tanpa Coding',
    description: 'Pilih template sinematik, kustomisasi dari dashboard, bagikan link personal ke tamu. Tanpa ribet.',
    url: 'https://iaundang.online',
    siteName: 'iaundang',
    locale: 'id_ID',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" className={`${jakarta.variable} ${GeistSans.variable} ${GeistMono.variable} ${fraunces.variable}`}>
      <body>
        <SessionProvider>
          <MotionProvider>{children}</MotionProvider>
        </SessionProvider>
        <Toaster position="top-center" />
      </body>
    </html>
  )
}
