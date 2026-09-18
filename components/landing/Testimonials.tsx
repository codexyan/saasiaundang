'use client'

import { motion } from 'framer-motion'
import { UserRound, Shield, Eye, Palette, MessageCircle, Globe } from 'lucide-react'
import { SectionContainer } from '@/components/marketing/SectionContainer'
import { EASE, VIEWPORT_ONCE } from '@/lib/motion'

interface Review {
  names: string
  date: string
  template: string
  quote: string
  initial: string
  color: string
}

const VALUE_PROPS = [
  {
    icon: Eye,
    title: 'Lihat Dulu dengan Nama Kalian',
    desc: 'Buka demo, masukkan nama kalian berdua, dan lihat hasilnya langsung. Gratis, tanpa daftar. Pemesanan baru dimulai kalau kalian memang mau melanjutkan.',
  },
  {
    icon: Palette,
    title: 'Tiga Tema, Digarap Satu per Satu',
    desc: 'Bukan katalog ratusan tema. Animasi pembuka, tipografi, dan jarak antar elemennya dikerjakan per tema, bukan hasil ganti warna.',
  },
  {
    icon: UserRound,
    title: 'Setiap Tamu Melihat Namanya',
    desc: 'Nama tamu muncul di halaman pembuka undangan, diambil dari tautan yang kalian kirim. Bukan sebaran massal yang sama untuk semua orang.',
  },
  {
    icon: Shield,
    title: 'Sekali Bayar, Tanpa Kejutan',
    desc: 'Tidak ada biaya bulanan, tidak ada upsell tersembunyi. Satu harga transparan untuk seluruh masa aktif.',
  },
  {
    icon: MessageCircle,
    title: 'Dibalas Orang, Bukan Bot',
    desc: 'Pertanyaan kalian masuk ke WhatsApp dan dijawab langsung oleh orang yang membangun iaundang.',
  },
  {
    icon: Globe,
    title: 'Buka di Semua Perangkat',
    desc: 'Undangan tampil sempurna di HP, tablet, dan laptop. Tamu cukup tap link, tanpa install apapun.',
  },
]

export default function Testimonials({ reviews: _propReviews }: { reviews?: Review[] }) {
  return (
    <SectionContainer
      id="testimoni"
      tone="ivory"
      eyebrow="Kenapa iaundang"
      title="Dibangun untuk hari spesial kalian"
      lead="Kami membangun iaundang dengan satu tujuan: membuat undangan digital yang benar-benar elegan dan personal."
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {VALUE_PROPS.map((item, i) => {
          const Icon = item.icon
          return (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={VIEWPORT_ONCE}
              transition={{ duration: 0.55, delay: i * 0.06, ease: EASE }}
              className="group relative bg-chalk rounded-card p-6 sm:p-7 border border-hairline shadow-card hover:border-ash/40 transition-colors duration-300"
            >
              <div
                aria-hidden
                className="absolute top-0 left-6 right-6 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(184,151,58,0.45), transparent)' }}
              />

              <div className="w-10 h-10 rounded-xl bg-forest-50 border border-forest-100 flex items-center justify-center mb-5">
                <Icon size={18} className="text-forest" />
              </div>

              <h3 className="text-body-lg font-semibold text-graphite mb-2 leading-snug">
                {item.title}
              </h3>
              <p className="text-body-sm text-concrete leading-[1.7]">
                {item.desc}
              </p>
            </motion.div>
          )
        })}
      </div>
    </SectionContainer>
  )
}
