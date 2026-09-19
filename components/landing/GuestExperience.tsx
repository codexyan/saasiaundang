'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { Users, ClipboardCheck, ArrowRight, Check, Gift, MessageSquare } from 'lucide-react'
import { SectionContainer } from '@/components/marketing/SectionContainer'
import { Button } from '@/components/marketing/Button'
import { EASE, VIEWPORT_ONCE } from '@/lib/motion'

// Catatan ukuran teks: mini-mockup di bawah adalah ilustrasi UI dekoratif —
// arbitrary font-size < 12px diizinkan KHUSUS di dalam ilustrasi ini.

interface PersonalisasiData {
  guestName: string
  groomName: string
  brideName: string
}

function CheckItem({ children }: { children: string }) {
  return (
    <li className="flex items-center gap-2.5">
      <div className="w-[18px] h-[18px] rounded-md bg-forest-50 flex items-center justify-center shrink-0">
        <Check size={10} strokeWidth={2.5} className="text-forest" />
      </div>
      <span className="text-body-sm text-concrete leading-snug">{children}</span>
    </li>
  )
}

function CardPersonalisasi({ personalisasi }: { personalisasi?: PersonalisasiData }) {
  const groomName = personalisasi?.groomName ?? 'Rizky'
  const brideName = personalisasi?.brideName ?? 'Aulia'
  const guestName = personalisasi?.guestName ?? 'Bapak Andi & Keluarga'

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEWPORT_ONCE}
      transition={{ duration: 0.7, ease: EASE }}
      className="lg:col-span-2 rounded-card bg-forest-deep overflow-hidden group"
    >
      <div className="flex flex-col lg:flex-row h-full">
        <div className="flex-1 p-7 sm:p-9 flex flex-col justify-center">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-lg bg-gold/[0.12] flex items-center justify-center">
              <Users size={15} className="text-gold/80" />
            </div>
            <span className="text-eyebrow text-gold/70">
              Personalisasi
            </span>
          </div>

          <h3 className="font-display text-h1 text-chalk leading-snug mb-3">
            Satu link, setiap tamu disambut namanya
          </h3>
          <p className="text-body-base text-chalk/60 leading-relaxed mb-6">
            Setiap tamu melihat namanya di halaman pembuka. Terasa personal, bukan sekadar pesan yang dikirim massal.
          </p>

          <ul className="space-y-2.5">
            {[
              'Daftar tamu bisa diekspor ke CSV',
              'Nama tampil otomatis di halaman pembuka',
              'Tautan berbeda untuk tiap tamu',
            ].map(b => (
              <li key={b} className="flex items-center gap-2.5">
                <div className="w-[18px] h-[18px] rounded-md bg-gold/[0.14] flex items-center justify-center shrink-0">
                  <Check size={10} strokeWidth={2.5} className="text-gold/80" />
                </div>
                <span className="text-body-sm text-chalk/70 leading-snug">{b}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-6">
          <div className="relative w-[170px] sm:w-[190px]">
            <div
              className="relative rounded-[26px] overflow-hidden"
              style={{
                padding: 4,
                background: 'linear-gradient(145deg, #2a2a2c 0%, #1c1c1e 40%, #0a0a0a 100%)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
              }}
            >
              <div className="absolute left-1/2 -translate-x-1/2 z-30 rounded-full" style={{ top: 6, width: 48, height: 14, background: '#000' }} />
              <div className="rounded-[22px] overflow-hidden relative" style={{ aspectRatio: '9/19.5', background: '#111' }}>
                <Image src="/images/templates/wedding-bg.jpg" alt="Preview" fill className="object-cover" sizes="200px" style={{ opacity: 0.35 }} />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 15%, rgba(10,20,10,0.88) 100%)' }} />
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-4">
                  <p className="text-[7px] tracking-[0.35em] uppercase mb-3 text-gold/60">The Wedding of</p>
                  <h4 className="font-display text-[25px] leading-[0.95] text-chalk">{groomName}</h4>
                  <p className="font-display text-sm my-1 text-gold/60">&amp;</p>
                  <h4 className="font-display text-[25px] leading-[0.95] text-chalk">{brideName}</h4>
                  <div className="mt-4 px-4 py-2 rounded-xl border border-gold/[0.18] bg-gold/[0.06]">
                    <p className="text-[7px] tracking-[0.15em] uppercase text-gold/60">Kepada Yth.</p>
                    <p className="text-[11px] font-semibold text-chalk mt-0.5">{guestName}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function FeatureCard({
  icon: Icon,
  tag,
  title,
  points,
  visual,
  delay = 0,
  className = '',
}: {
  icon: typeof Users
  tag: string
  title: string
  points: string[]
  visual: React.ReactNode
  delay?: number
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEWPORT_ONCE}
      transition={{ duration: 0.6, delay, ease: EASE }}
      className={`rounded-card bg-chalk border border-hairline shadow-card overflow-hidden hover:border-ash/40 transition-colors ${className}`}
    >
      <div className="p-6">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-lg bg-forest-50 flex items-center justify-center">
            <Icon size={15} className="text-forest" />
          </div>
          <span className="text-eyebrow text-concrete">
            {tag}
          </span>
        </div>

        <h3 className="text-body-lg font-semibold text-graphite mb-3 leading-snug">
          {title}
        </h3>

        <ul className="space-y-2">
          {points.map(p => <CheckItem key={p}>{p}</CheckItem>)}
        </ul>
      </div>

      <div className="px-5 pb-5">
        {visual}
      </div>
    </motion.div>
  )
}

function MiniRSVP() {
  return (
    <div className="bg-ivory rounded-xl p-3.5 border border-hairline">
      <div className="space-y-2 mb-3">
        <div className="bg-chalk rounded-lg px-3 py-2 border border-hairline">
          <p className="text-[8px] text-ash">Nama</p>
          <p className="text-[10px] text-ash font-medium">Nama tamu kalian</p>
        </div>
        <div className="flex gap-2">
          <div className="flex-1 py-2 rounded-lg bg-forest text-chalk text-[9px] font-semibold text-center">Hadir</div>
          <div className="flex-1 py-2 rounded-lg bg-chalk border border-hairline text-concrete text-[9px] font-medium text-center">Tidak</div>
        </div>
      </div>
      <div className="space-y-1">
        {/* Nama karangan diganti penanda. Ilustrasi boleh menunjukkan bentuk
            antarmukanya, tapi tidak boleh memasang orang yang tidak ada
            seolah mereka tamu sungguhan (R-38). */}
        {[
          { name: 'Tamu 1', status: 'Hadir', ok: true },
          { name: 'Tamu 2', status: 'Hadir', ok: true },
          { name: 'Tamu 3', status: 'Tidak', ok: false },
        ].map(g => (
          <div key={g.name} className="flex items-center justify-between bg-chalk rounded-lg px-2.5 py-1.5 border border-hairline">
            <p className="text-[9px] text-concrete">{g.name}</p>
            <span className={`text-[8px] font-semibold ${g.ok ? 'text-forest' : 'text-ash'}`}>{g.status}</span>
          </div>
        ))}
      </div>
    </div>
  )
}




function MiniGift() {
  return (
    <div className="bg-ivory rounded-xl p-3.5 border border-hairline">
      <div className="space-y-2">
        <div className="bg-chalk rounded-lg px-3 py-2.5 border border-hairline flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-forest-50 flex items-center justify-center shrink-0">
            <span className="text-[8px] font-bold text-forest">BCA</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold text-ash">Nomor rekening kalian</p>
            <p className="text-[8px] text-ash">a.n. nama di rekening</p>
          </div>
          <div className="w-6 h-6 rounded-md bg-mist flex items-center justify-center shrink-0">
            <svg className="w-3 h-3 text-concrete" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
        <div className="bg-chalk rounded-lg px-3 py-2.5 border border-hairline flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-forest-50 flex items-center justify-center shrink-0">
            <span className="text-[8px] font-bold text-forest">QRIS</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold text-graphite">Scan QR Code</p>
            <p className="text-[8px] text-ash">Semua e-wallet & m-banking</p>
          </div>
        </div>
      </div>
    </div>
  )
}


function MiniWishes() {
  return (
    <div className="bg-ivory rounded-xl p-3.5 border border-hairline space-y-2">
      {/* Dulu di sini ada tiga nama lengkap dengan ucapan dan stempel waktu,
          semuanya karangan. Itu umpan aktivitas palsu yang membuat produk
          kosong tampak ramai (R-38). */}
      {[
        { id: 1, msg: 'Ucapan dari tamu muncul di sini.' },
        { id: 2, msg: 'Ucapan yang lebih panjang ikut tampil utuh, tidak dipotong di tengah.' },
        { id: 3, msg: 'Ucapan pendek pun tetap rapi.' },
      ].map(w => (
        <div key={w.id} className="bg-chalk rounded-lg px-3 py-2.5 border border-hairline">
          <p className="text-[10px] font-semibold text-ash mb-1">Nama tamu</p>
          <p className="text-[9px] text-concrete leading-relaxed">{w.msg}</p>
        </div>
      ))}
    </div>
  )
}

export default function GuestExperience({ personalisasi }: { personalisasi?: PersonalisasiData }) {
  return (
    <SectionContainer
      id="fitur"
      tone="mist"
      eyebrow="Yang dialami tamu"
      title={<>Tamu membuka tautannya,<br className="hidden sm:block" /> dan namanya sudah menunggu.</>}
      lead="Bagian ini bukan daftar fitur. Ini urutan yang benar-benar dialami tamu kalian, dari detik mereka menyentuh tautan di WhatsApp sampai mereka mengirim ucapan."
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Kartu besar. Personalisasi nama tamu yang paling membedakan
            iaundang, jadi dia yang mendapat ruang paling banyak (R-14). */}
        <CardPersonalisasi personalisasi={personalisasi} />

        <FeatureCard
          icon={ClipboardCheck}
          tag="Konfirmasi kehadiran"
          title="Tamu menjawab tanpa perlu mendaftar"
          points={[
            'Cukup buka tautannya, tidak ada akun',
            'Jawaban masuk ke dashboard kalian',
            'Batas jumlah tamu mengikuti paket',
          ]}
          visual={<MiniRSVP />}
          delay={0.08}
        />

        <FeatureCard
          icon={MessageSquare}
          tag="Ucapan dan doa"
          title="Ucapan tamu tampil di undangan"
          points={[
            'Tanpa login, langsung dari HP tamu',
            'Muncul di halaman undangan',
            'Bisa dibaca ulang kapan saja',
          ]}
          visual={<MiniWishes />}
          delay={0.14}
        />

        <FeatureCard
          icon={Gift}
          tag="Amplop digital"
          title="Hadiah tanpa amplop yang tercecer"
          points={[
            'Rekening dan QRIS kalian ditampilkan',
            'Tamu bisa mengirim bukti transfer',
            'Tersedia mulai paket Popular',
          ]}
          visual={<MiniGift />}
          delay={0.2}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={VIEWPORT_ONCE}
        transition={{ duration: 0.5, delay: 0.15, ease: EASE }}
        className="mt-12 sm:mt-16 text-center"
      >
        <p className="text-body-sm text-concrete mb-5">
          Isi tiap paket berbeda. Rinciannya ada di bagian harga.
        </p>
        <Button href="/#harga" size="lg" className="w-full sm:w-auto">
          Lihat isi tiap paket
          <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
        </Button>
      </motion.div>
    </SectionContainer>
  )
}
