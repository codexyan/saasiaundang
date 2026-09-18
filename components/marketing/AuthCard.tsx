import Link from 'next/link'
import Image from 'next/image'
import Logo from '@/components/ui/Logo'

// Shell auth — split-screen editorial (Arah A):
// kiri = kolom form di atas ivory (logo header, konten, footer legal),
// kanan = panel brand forest-deep dengan esensi kanvas Hero (desktop saja).
// Tanpa framer: animasi masuk via CSS.

export function AuthCard({ backHref = '/', children }: { backHref?: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-ivory">

      {/* Kolom form */}
      <div className="flex flex-col min-h-screen px-5 sm:px-10">
        <header className="flex items-center justify-between pt-6">
          <Logo variant="horizontal" size="sm" />
          <Link
            href={backHref}
            className="flex items-center gap-1.5 min-h-[44px] px-3 py-2 rounded-button text-label-sm text-concrete bg-chalk border border-hairline hover:text-forest-deep hover:border-gold-dark/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40 focus-visible:ring-offset-2"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Kembali
          </Link>
        </header>

        <main className="flex-1 flex items-center py-12">
          <div className="w-full max-w-sm mx-auto animate-slide-up">
            {children}
          </div>
        </main>

        <footer className="pb-6 flex items-center justify-between text-body-xs text-concrete">
          <span>&copy; {new Date().getFullYear()} iaundang</span>
          <span className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-graphite transition-colors">Privasi</Link>
            <Link href="/terms" className="hover:text-graphite transition-colors">Syarat</Link>
          </span>
        </footer>
      </div>

      {/* Panel brand — desktop saja */}
      <div className="hidden lg:block relative overflow-hidden" aria-hidden>
        <Image
          src="/images/templates/wedding-bg.jpg"
          alt=""
          fill
          sizes="50vw"
          className="object-cover"
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(200deg, rgba(15,26,18,0.35) 0%, rgba(15,26,18,0.65) 55%, rgba(15,26,18,0.92) 100%)' }}
        />

        <div className="absolute inset-x-0 bottom-0 p-12 xl:p-16">
          <p className="text-label-sm uppercase tracking-[0.35em] text-gold mb-4">
            The Wedding of
          </p>
          <p className="font-display text-display-md text-chalk leading-tight">
            Rizky <span className="text-gold">&amp;</span> Aulia
          </p>
          <div className="w-10 h-px bg-gold/70 my-5" />
          <p className="text-body-base text-chalk/80 max-w-sm leading-relaxed">
            Setiap tamu disambut dengan namanya sendiri. Musik, konfirmasi kehadiran, dan doa, semuanya dalam satu tautan undangan.
          </p>
        </div>
      </div>
    </div>
  )
}
