import Link from 'next/link'

/**
 * Layar yang dilihat pengunjung saat mode pemeliharaan menyala.
 *
 * Dibuat menahan diri dengan sengaja: satu pesan, satu janji, satu jalan
 * keluar. Halaman pemeliharaan yang ramai justru membuat orang mengira
 * situsnya rusak, bukan sedang dirapikan.
 *
 * Undangan yang sudah terbit TIDAK ikut ditutup, dan itu disebutkan di sini,
 * supaya tamu yang kebetulan mampir ke halaman depan tahu bahwa tautan
 * undangan yang mereka pegang tetap bisa dibuka.
 */
export default function MaintenanceScreen({ whatsapp }: { whatsapp?: string }) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-ivory px-5">
      <div className="max-w-md text-center">
        <p className="text-eyebrow text-graphite mb-4">Sebentar ya</p>

        <h1 className="font-display text-display-md text-forest-deep text-balance leading-tight">
          Kami sedang merapikan iaundang
        </h1>

        <p className="mt-5 text-body-base text-graphite leading-relaxed">
          Halaman ini ditutup sementara sambil kami memasang perbaikan.
          Undangan yang sudah terbit tetap bisa dibuka tamu seperti biasa.
        </p>

        {whatsapp && (
          <p className="mt-6 text-body-sm text-concrete">
            Ada yang mendesak?{' '}
            <a
              href={`https://wa.me/${whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-forest border-b border-forest/30 hover:border-forest transition-colors"
            >
              hubungi kami lewat WhatsApp
            </a>
          </p>
        )}

        <p className="mt-10 text-body-xs text-concrete">
          <Link href="/login" className="hover:text-graphite transition-colors">
            Masuk ke akun
          </Link>
        </p>
      </div>
    </main>
  )
}
