'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { RefreshCw, Home, AlertTriangle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to monitoring service
    console.error('Error boundary caught:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-dark-gradient flex items-center justify-center p-4 relative overflow-hidden">

      {/* Ambient glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(244,63,94,0.06) 0%, transparent 65%)' }} />
        <div className="absolute -bottom-20 right-1/4 w-96 h-96 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.05) 0%, transparent 70%)' }} />
      </div>

      {/* Grid pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

      <div className="relative z-10 max-w-2xl mx-auto text-center">

        {/* Error Icon */}
        <div className="mb-8 inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/10 border border-red-500/20">
          <AlertTriangle className="w-12 h-12 text-red-400" />
        </div>

        {/* Heading */}
        <h1 className="text-white font-sans font-bold mb-4"
          style={{ fontSize: 'clamp(28px, 4vw, 40px)' }}>
          Oops! Terjadi Kesalahan
        </h1>

        {/* Description */}
        <p className="text-stone-400 text-sm sm:text-base leading-relaxed mb-2 max-w-md mx-auto">
          Maaf, ada yang tidak beres. Tim kami sudah diberitahu dan akan segera memperbaikinya.
        </p>

        {/* Error details (development only) */}
        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="mt-4 mb-8 p-4 rounded-lg bg-red-950/20 border border-red-900/30 max-w-md mx-auto">
            <p className="text-red-400 text-xs font-mono break-all">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-red-500/50 text-[10px] font-mono mt-2">
                Digest: {error.digest}
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mt-8">
          <button
            onClick={reset}
            className="flex items-center gap-2.5 px-6 py-3 rounded-xl text-stone-900 font-semibold text-sm bg-gold-gradient shadow-lg hover:shadow-xl transition-all hover:scale-105"
          >
            <RefreshCw size={16} />
            Coba Lagi
          </button>
          <Link href="/">
            <button className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium text-stone-300 border border-stone-700/50 hover:border-gold-500/50 hover:text-gold-400 transition-all">
              <Home size={16} />
              Kembali ke Beranda
            </button>
          </Link>
        </div>

        {/* Contact Support */}
        <div className="mt-12 pt-8 border-t border-stone-800/50">
          <p className="text-stone-500 text-xs mb-3">Masih bermasalah?</p>
          {/* Halaman error tidak bisa membaca pengaturan admin, jadi kontaknya
              memakai email yang memang dimiliki. Dulu di sini ada nomor contoh
              628123456789 yang tidak menuju siapa pun. */}
          <a
            href="mailto:halo@iaundang.online"
            className="inline-flex items-center gap-2 text-sm text-gold-400 hover:text-gold-300 transition-colors"
          >
            halo@iaundang.online
          </a>
        </div>

      </div>
    </div>
  )
}
