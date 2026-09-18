'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/marketing/Button'
import { EASE } from '@/lib/motion'
import type { TemplateRecord } from '@/lib/types'

// Hero sinematik satu layar penuh.
//
// Keputusan besarnya, masing-masing satu baris alasan (R-31):
// - Foto memenuhi layar, bukan kartu di tengah kanvas ivory: yang dijual
//   suasana pernikahan, dan suasana butuh ruang untuk terasa.
// - Gerak hanya dari framer-motion dan transform CSS, tanpa WebGL: Three.js
//   akan menambah 150 sampai 250 kB ke halaman yang sekarang 177 kB, untuk
//   pengunjung yang sebagian besar datang dari HP dengan kuota.
// - Satu latar bergerak sangat pelan (ken burns 18 detik) dan satu kartu yang
//   naik sekali: dua gerak, bukan lima. MotionConfig di root mematikan
//   keduanya untuk yang mengaktifkan kurangi gerak.
// - Tirai gelap di atas foto minimal 55 persen di area teks: bahkan kalau
//   fotonya diganti foto terang, teks chalk tetap lolos ambang kontras (R-25).

interface HeroContent {
  headline?: string
  subheadline?: string
  ctaPrimary?: string
  ctaSecondary?: string
}

interface Props {
  content?: HeroContent
  mockup?: { groomName?: string; brideName?: string; date?: string; venue?: string }
  /** Tema pertama yang aktif, dipakai kartu undangan dan tujuan tombol coba. */
  template?: TemplateRecord
}

const CHIPS = ['Demo gratis', 'Sekali bayar', 'Tanpa biaya bulanan']

export default function HeroSection({ content, mockup, template }: Props) {
  const judul = content?.headline ?? 'Tamu buka undangannya, namanya sudah ada di sana.'
  const sub = content?.subheadline
    ?? 'Masukkan nama kalian berdua, lihat hasilnya sekarang juga. Gratis, tanpa daftar.'
  const ctaUtama = content?.ctaPrimary ?? 'Coba dengan nama kalian'
  const ctaKedua = content?.ctaSecondary ?? 'Lihat semua tema'

  const groomName = mockup?.groomName ?? 'Rizky'
  const brideName = mockup?.brideName ?? 'Aulia'
  const date = mockup?.date ?? '12 · 04 · 2026'

  // Tujuan tombol utama mengikuti tema yang benar-benar aktif. Dulu id tema
  // ditulis mati di sini, jadi tombolnya mati begitu tema itu dinonaktifkan.
  const tujuanCoba = template ? `/demo/renderer?id=${template.id}` : '/templates'
  const cs = template?.config.meta.color_scheme
  const sampul = template?.config?.opening?.cover_photo_url
    || template?.config?.opening?.background_image
    || null

  return (
    <section className="relative min-h-[100svh] flex items-end overflow-hidden bg-forest-deep">
      {/* Latar sinematik. Ken burns sangat pelan supaya terasa hidup tanpa
          pernah menarik perhatian dari teks di atasnya. */}
      <motion.div
        aria-hidden
        className="absolute inset-0"
        initial={{ scale: 1.08 }}
        animate={{ scale: 1 }}
        transition={{ duration: 18, ease: 'linear' }}
      >
        <Image
          src="/images/templates/wedding-bg.jpg"
          alt=""
          fill
          priority
          quality={80}
          sizes="100vw"
          className="object-cover"
        />
      </motion.div>

      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(15,26,18,0.35) 0%, rgba(15,26,18,0.34) 26%, rgba(15,26,18,0.70) 66%, rgba(15,26,18,0.94) 100%)',
        }}
      />

      {/* Pita gelap khusus di belakang navbar. Dihitung untuk keadaan
          TERBURUK, yaitu kalau foto latarnya diganti foto yang sangat terang:
          gabungan pita dan tirai dasar di puncak mencapai 74 persen, dan teks
          chalk di atasnya tetap lolos ambang kontras (R-25). */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-40"
        style={{ background: 'linear-gradient(180deg, rgba(15,26,18,0.60) 0%, rgba(15,26,18,0) 100%)' }}
      />

      <div className="relative z-10 w-full max-w-6xl mx-auto px-5 sm:px-8 pt-32 pb-14 sm:pb-20">
        <div className="flex flex-col lg:flex-row lg:items-end gap-12 lg:gap-16">
          <div className="max-w-2xl">
            <motion.h1
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.1, ease: EASE }}
              className="font-display text-display-xl sm:text-display-2xl text-chalk text-balance leading-[1.05]"
            >
              {judul}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.28, ease: EASE }}
              className="mt-6 text-body-lg leading-relaxed text-chalk/80 max-w-lg"
            >
              {sub}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.42, ease: EASE }}
              className="mt-9 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6"
            >
              <Button href={tujuanCoba} variant="inverse" size="lg" className="w-full sm:w-auto">
                {ctaUtama}
                <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
              </Button>
              <Link
                href="/templates"
                className="group inline-flex items-center justify-center sm:justify-start gap-2 min-h-[44px] text-button-base text-chalk/80 hover:text-chalk transition-colors"
              >
                <span className="border-b border-chalk/25 group-hover:border-gold pb-0.5 transition-colors">
                  {ctaKedua}
                </span>
                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.6, ease: EASE }}
              className="mt-8 flex flex-wrap items-center gap-y-2 gap-x-3 text-body-xs text-chalk/80"
            >
              {CHIPS.map((teks, i) => (
                <span key={teks} className="flex items-center gap-3">
                  {i > 0 && <span aria-hidden className="w-1 h-1 rounded-full bg-gold/60" />}
                  {teks}
                </span>
              ))}
            </motion.div>
          </div>

          {/* Kartu undangan: tema yang benar-benar dijual, bukan foto stok
              kedua. Hanya muncul kalau ada tema aktif. */}
          {template && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.55, ease: EASE }}
              // Hanya di layar lebar. Di HP kartunya terpotong lipatan dan
              // mengulang apa yang sudah ada di section tema tepat di bawahnya.
              className="relative hidden lg:block w-[224px] shrink-0"
            >
              <div
                className="rounded-[26px] overflow-hidden aspect-[9/16] relative shadow-float ring-1 ring-chalk/15"
                style={{ backgroundColor: cs?.primary ?? '#1a3320' }}
              >
                {sampul && (
                  <Image
                    src={sampul}
                    alt={`Tema ${template.name}`}
                    fill
                    sizes="240px"
                    className="object-cover"
                    style={{ opacity: 0.62 }}
                  />
                )}
                <div
                  aria-hidden
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(180deg, transparent 18%, ${cs?.primary ?? '#1a3320'}aa 58%, ${cs?.primary ?? '#1a3320'} 100%)`,
                  }}
                />
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-end pb-9 px-5 text-center">
                  <p
                    className="text-[8px] tracking-[0.35em] uppercase mb-3"
                    style={{ color: `${cs?.accent ?? '#d4af37'}cc` }}
                  >
                    The Wedding of
                  </p>
                  <p className="font-display text-[26px] leading-none" style={{ color: cs?.text ?? '#ffffff' }}>
                    {groomName}
                  </p>
                  <p className="font-display text-sm my-1" style={{ color: cs?.accent ?? '#d4af37' }}>
                    &amp;
                  </p>
                  <p className="font-display text-[26px] leading-none" style={{ color: cs?.text ?? '#ffffff' }}>
                    {brideName}
                  </p>
                  <div aria-hidden className="w-8 h-px my-4" style={{ backgroundColor: `${cs?.accent ?? '#d4af37'}66` }} />
                  <p className="text-[9px] tracking-[0.2em]" style={{ color: `${cs?.text ?? '#ffffff'}99` }}>
                    {date}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Petunjuk gulir: satu garis yang turun pelan, bukan ikon panah
          berdenyut tanpa henti. */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.1 }}
        className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 hidden sm:block"
      >
        <div className="h-10 w-px bg-chalk/25 overflow-hidden">
          <motion.div
            className="h-4 w-px bg-gold"
            initial={{ y: -16 }}
            animate={{ y: 40 }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', repeatDelay: 0.6 }}
          />
        </div>
      </motion.div>
    </section>
  )
}
