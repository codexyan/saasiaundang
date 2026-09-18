'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, MessageCircle } from 'lucide-react'
import { SectionContainer } from '@/components/marketing/SectionContainer'
import { Button } from '@/components/marketing/Button'
import { EASE, VIEWPORT_ONCE } from '@/lib/motion'

const defaultFaqs = [
  { q: 'Bisa lihat hasilnya sebelum bayar?', a: 'Bisa. Di halaman demo kalian memasukkan nama sendiri dan langsung melihat hasilnya, gratis dan tanpa daftar. Untuk mengisi undangan sungguhan dan membagikannya ke tamu, pesanannya dibayar lebih dulu.' },
  { q: 'Apa tamu perlu install aplikasi?', a: 'Tidak. Tamu cukup tap link yang kalian kirim via WhatsApp, undangan langsung terbuka di browser HP mereka.' },
  { q: 'Berapa lama undangan tetap aktif?', a: 'Sesuai paket yang kalian pilih. Masa aktifnya tertera di halaman harga, dan kalian bisa memperpanjangnya.' },
  { q: 'Bisa edit setelah dipublish?', a: 'Bisa, kapan saja. Ganti foto, ubah detail acara, ganti musik. Semua tanpa biaya tambahan.' },
  { q: 'Bagaimana cara kirim undangan ke tamu?', a: 'Setelah publish, kalian dapat link unik (contoh: rizky-aulia.iaundang.online). Salin dan kirim ke tamu lewat WhatsApp atau media lainnya.' },
  { q: 'iaundang baru diluncurkan, apakah bisa dipercaya?', a: 'iaundang memang baru dan kami tidak akan mengarang testimoni untuk menutupinya. Yang bisa kalian periksa sendiri sebelum memesan: buka demo, masukkan nama kalian, dan nilai hasilnya.' },
  { q: 'Bagaimana kalau butuh bantuan?', a: 'Hubungi kami lewat WhatsApp dan pesan kalian dijawab langsung oleh orang yang membangun iaundang.' },
]

export default function FAQ({ items, whatsapp }: { items?: { q: string; a: string }[]; whatsapp?: string }) {
  const faqs = items ?? defaultFaqs
  const waNumber = whatsapp || ''
  const [open, setOpen] = useState<number | null>(null)

  return (
    <SectionContainer
      id="faq"
      tone="tint"
      title="Pertanyaan umum"
      lead="Belum menemukan jawabannya? Chat kami via WhatsApp."
    >
      <div className="max-w-2xl mx-auto">
        <div className="space-y-2">
          {faqs.map((faq, i) => {
            const isOpen = open === i
            const panelId = `faq-panel-${i}`
            const buttonId = `faq-button-${i}`
            return (
              <motion.div
                key={faq.q}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-16px' }}
                transition={{ duration: 0.45, delay: i * 0.05, ease: EASE }}
                className={`rounded-card border overflow-hidden transition-all duration-300 bg-chalk ${
                  isOpen ? 'border-gold-dark/30 shadow-card' : 'border-hairline hover:border-gold-dark/30'
                }`}
              >
                <button
                  id={buttonId}
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  className="w-full flex items-center justify-between px-5 sm:px-6 py-4 sm:py-5 text-left gap-4 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40 focus-visible:ring-inset"
                >
                  <span className={`text-body-base font-medium leading-snug transition-colors duration-200 ${
                    isOpen ? 'text-forest-deep' : 'text-carbon group-hover:text-forest-deep'
                  }`}>
                    {faq.q}
                  </span>
                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                    className="shrink-0"
                    aria-hidden
                  >
                    <ChevronDown size={16} className={`transition-colors duration-200 ${
                      isOpen ? 'text-gold-dark' : 'text-concrete group-hover:text-gold-dark'
                    }`} />
                  </motion.span>
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      id={panelId}
                      role="region"
                      aria-labelledby={buttonId}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 sm:px-6 pb-5 sm:pb-6 text-body-base text-concrete leading-[1.7]">{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VIEWPORT_ONCE}
          transition={{ duration: 0.6, delay: 0.2, ease: EASE }}
          className="mt-10 text-center bg-chalk rounded-card border border-hairline shadow-card p-6 sm:p-8"
        >
          <div className="w-10 h-10 rounded-xl bg-forest-50 flex items-center justify-center mx-auto mb-3">
            <MessageCircle size={18} className="text-forest" />
          </div>
          <p className="text-body-base font-semibold text-forest-deep mb-1">Masih ada pertanyaan?</p>
          <p className="text-body-sm text-concrete mb-5">
            {waNumber
              ? 'Pesan kalian dijawab langsung oleh orang yang membangun iaundang.'
              : 'Kirim pertanyaan kalian lewat email dan kami balas dari sana.'}
          </p>
          {waNumber ? (
            <Button href={`https://wa.me/${waNumber}`} external size="sm">
              Chat via WhatsApp
            </Button>
          ) : (
            <Button href="mailto:halo@iaundang.online" external size="sm">
              Kirim Email
            </Button>
          )}
        </motion.div>
      </div>
    </SectionContainer>
  )
}
