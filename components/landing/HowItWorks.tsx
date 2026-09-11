'use client'

import { motion } from 'framer-motion'
import { Check, ArrowRight } from 'lucide-react'
import { SectionContainer } from '@/components/marketing/SectionContainer'
import { Button } from '@/components/marketing/Button'
import { EASE, VIEWPORT_ONCE } from '@/lib/motion'

// Redesign total (Arah A): proses editorial bernomor pada satu garis —
// tiga kolom dengan hairline + titik gold di desktop, rail vertikal di mobile.
// Nomor memang informasi (urutan proses nyata), bukan dekorasi.

const defaultSteps = [
  {
    title: 'Pilih desain & coba gratis',
    description: 'Pilih template yang kalian suka, masukkan nama pasangan, dan lihat hasilnya langsung. Tanpa registrasi, tanpa bayar.',
  },
  {
    title: 'Bayar sekali, langsung aktif',
    description: 'Sudah cocok? Pilih paket mulai Rp 79.000, sekali bayar, tanpa langganan. Transfer bank atau QRIS, aktif dalam 1x24 jam.',
  },
  {
    title: 'Lengkapi & bagikan ke tamu',
    description: 'Isi detail acara, upload foto, pilih musik. Salin link undangan dan kirim ke tamu lewat WhatsApp. Setiap tamu dapat undangan personal.',
  },
]

const HIGHLIGHTS = ['Gratis, tanpa registrasi', 'Tanpa biaya bulanan', 'Setiap tamu dapat link unik']

export default function HowItWorks({ steps: propSteps }: { steps?: { title: string; description: string }[] }) {
  const steps = (propSteps ?? defaultSteps).map((s, i) => ({
    title: s.title,
    desc: s.description,
    highlight: HIGHLIGHTS[i] ?? '',
  }))

  return (
    <SectionContainer
      id="cara-kerja"
      tone="chalk"
      eyebrow="Cara Kerja"
      title="Tiga langkah. Lima menit. Selesai."
      lead="Tanpa skill desain, tanpa download aplikasi. Semua lewat browser."
    >
      <div className="relative">
        {/* Garis proses — desktop: horizontal menghubungkan titik antar kolom */}
        <div
          aria-hidden
          className="hidden md:block absolute top-[5px] h-px bg-hairline"
          style={{ left: 'calc(100% / 6)', right: 'calc(100% / 6)' }}
        />

        <ol className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-8 list-none m-0 p-0">
          {steps.map((step, i) => (
            <motion.li
              key={step.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={VIEWPORT_ONCE}
              transition={{ duration: 0.6, delay: i * 0.12, ease: EASE }}
              className="relative flex md:block gap-5 md:text-center"
            >
              {/* Rail vertikal — mobile */}
              <div aria-hidden className="md:hidden flex flex-col items-center pt-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-gold shrink-0" />
                {i < steps.length - 1 && <span className="w-px flex-1 bg-hairline mt-1.5" />}
              </div>

              <div className="flex-1 pb-10 md:pb-0">
                {/* Titik pada garis — desktop */}
                <span aria-hidden className="hidden md:block relative z-10 w-2.5 h-2.5 rounded-full bg-gold ring-4 ring-chalk mx-auto mb-7" />

                <p aria-hidden className="font-display text-display-md text-forest-200 leading-none mb-3 md:mb-4">
                  0{i + 1}
                </p>

                <h3 className="font-display text-h2 text-graphite mb-2.5">
                  {step.title}
                </h3>
                <p className="text-body-base text-concrete leading-relaxed md:max-w-[300px] md:mx-auto">
                  {step.desc}
                </p>

                {step.highlight && (
                  <span className="inline-flex items-center gap-1.5 text-label-sm text-forest bg-forest-50 border border-forest-100 px-3 py-1 rounded-pill mt-4">
                    <Check size={11} strokeWidth={2.5} />
                    {step.highlight}
                  </span>
                )}
              </div>
            </motion.li>
          ))}
        </ol>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2, ease: EASE }}
        className="mt-8 md:mt-16 flex flex-col items-center gap-3"
      >
        <Button href="/templates" size="lg" className="w-full sm:w-auto">
          Mulai buat undangan
          <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
        </Button>
        {/* Dulu "Coba gratis, bayar saat siap publish." Sekarang pembayaran
            terjadi saat memesan, sebelum editor terbuka, dan yang gratis
            adalah demo di galeri. */}
        <p className="text-body-xs text-concrete">Coba gratis di demo, bayar saat memesan.</p>
      </motion.div>
    </SectionContainer>
  )
}
