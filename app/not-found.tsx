import Link from 'next/link'
import { ArrowLeft, Home, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-dark-gradient flex items-center justify-center p-4 relative overflow-hidden">

      {/* Ambient glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(212,175,55,0.08) 0%, transparent 65%)' }} />
        <div className="absolute -bottom-20 left-1/4 w-96 h-96 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(201,149,45,0.05) 0%, transparent 70%)' }} />
      </div>

      {/* Grid pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

      <div className="relative z-10 max-w-2xl mx-auto text-center">

        {/* 404 Number - Large & Elegant */}
        <div className="mb-8">
          <h1 className="font-sans font-bold tracking-tight mb-4"
            style={{
              fontSize: 'clamp(120px, 20vw, 200px)',
              background: 'linear-gradient(135deg, #b8860b 0%, #d4af37 45%, #c9952d 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              lineHeight: 1,
            }}>
            404
          </h1>
          <div className="h-px w-32 mx-auto bg-gradient-to-r from-transparent via-gold-400/50 to-transparent" />
        </div>

        {/* Heading */}
        <h2 className="text-white font-sans font-bold mb-4"
          style={{ fontSize: 'clamp(28px, 4vw, 40px)' }}>
          Halaman Tidak Ditemukan
        </h2>

        {/* Description */}
        <p className="text-stone-400 text-sm sm:text-base leading-relaxed mb-8 max-w-md mx-auto">
          Maaf, halaman yang Anda cari tidak ada atau telah dipindahkan. Mari kembali ke halaman utama atau cari yang lain.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Link href="/">
            <button className="flex items-center gap-2.5 px-6 py-3 rounded-xl text-stone-900 font-semibold text-sm bg-gold-gradient shadow-lg hover:shadow-xl transition-all hover:scale-105">
              <Home size={16} />
              Kembali ke Beranda
            </button>
          </Link>
          <Link href="/templates">
            <button className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium text-stone-300 border border-stone-700/50 hover:border-gold-500/50 hover:text-gold-400 transition-all">
              <Search size={16} />
              Lihat Template
            </button>
          </Link>
        </div>

        {/* Quick Links */}
        <div className="mt-12 pt-8 border-t border-stone-800/50">
          <p className="text-stone-500 text-xs mb-4">Atau coba link ini:</p>
          <div className="flex flex-wrap justify-center gap-4 text-xs">
            <Link href="/login" className="text-stone-400 hover:text-gold-400 transition-colors">
              Masuk
            </Link>
            <span className="text-stone-700">•</span>
            <Link href="/templates" className="text-stone-400 hover:text-gold-400 transition-colors">
              Buat Undangan
            </Link>
            <span className="text-stone-700">•</span>
            <Link href="/dashboard" className="text-stone-400 hover:text-gold-400 transition-colors">
              Dashboard
            </Link>
            <span className="text-stone-700">•</span>
            <Link href="/#harga" className="text-stone-400 hover:text-gold-400 transition-colors">
              Harga
            </Link>
            <span className="text-stone-700">•</span>
            <a href="mailto:halo@iaundang.online" className="text-stone-400 hover:text-gold-400 transition-colors">
              Kontak
            </a>
          </div>
        </div>

      </div>
    </div>
  )
}
