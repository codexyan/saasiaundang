'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { Users, ClipboardCheck, Music2, Globe, ImageIcon, ArrowRight, Check, Gift, BookOpen, MessageSquare } from 'lucide-react'
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
              'Import daftar tamu via spreadsheet',
              'Nama tampil otomatis di halaman pembuka',
              'Link unik per tamu, tidak bisa di-forward',
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
          <p className="text-[10px] text-graphite font-medium">Bapak Andi Sanjaya</p>
        </div>
        <div className="flex gap-2">
          <div className="flex-1 py-2 rounded-lg bg-forest text-chalk text-[9px] font-semibold text-center">Hadir</div>
          <div className="flex-1 py-2 rounded-lg bg-chalk border border-hairline text-concrete text-[9px] font-medium text-center">Tidak</div>
        </div>
      </div>
      <div className="space-y-1">
        {[
          { name: 'Andi S.', status: 'Hadir', ok: true },
          { name: 'Sinta R.', status: 'Hadir', ok: true },
          { name: 'Hendra', status: 'Tidak', ok: false },
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

function MiniMusic() {
  return (
    <div className="bg-forest-deep rounded-xl p-3.5">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-lg bg-gold/[0.12] flex items-center justify-center shrink-0">
          <Music2 size={14} className="text-gold/70" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-chalk font-semibold truncate">A Thousand Years</p>
          <p className="text-[9px] text-chalk/40">Christina Perri</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[8px] text-chalk/30">1:24</span>
        <div className="flex-1 h-1 bg-chalk/[0.08] rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-gold/50" style={{ width: '42%' }} />
        </div>
        <span className="text-[8px] text-chalk/30">4:45</span>
      </div>
      <div className="mt-3 flex gap-1.5">
        {['Perfect', 'All of Me', '+Upload'].map((s, i) => (
          <span key={s} className={`text-[8px] px-2 py-1 rounded-md ${
            i === 2
              ? 'border border-dashed border-chalk/15 text-chalk/30'
              : 'bg-chalk/[0.08] text-chalk/45'
          }`}>
            {s}
          </span>
        ))}
      </div>
    </div>
  )
}

function MiniDomain() {
  return (
    <div className="bg-ivory rounded-xl overflow-hidden border border-hairline">
      <div className="bg-mist px-3 py-2 flex items-center gap-2">
        <div className="flex gap-1">
          {['#d9d4c9', '#c5bfae', '#a8a294'].map(c => (
            <div key={c} className="w-2 h-2 rounded-full" style={{ backgroundColor: c }} />
          ))}
        </div>
        <div className="flex-1 bg-chalk rounded-md px-2.5 py-0.5 flex items-center gap-1 border border-hairline">
          <svg className="w-2 h-2 text-concrete shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
          </svg>
          <span className="text-[8px] text-ash font-mono">
            <span className="text-graphite font-semibold">rizky-aulia</span>.iaundang.online
          </span>
        </div>
      </div>
      <div className="bg-chalk p-3">
        <div className="flex items-start gap-2">
          <div className="w-8 h-10 rounded bg-ivory border border-hairline shrink-0" />
          <div className="flex-1 space-y-1 pt-0.5">
            <div className="h-1.5 bg-mist rounded-full w-3/4" />
            <div className="h-1.5 bg-mist rounded-full w-1/2" />
          </div>
        </div>
        <div className="mt-2 flex gap-1.5">
          <div className="flex-1 h-5 bg-forest rounded flex items-center justify-center">
            <div className="h-1 bg-white/30 rounded-full w-8" />
          </div>
          <div className="flex-1 h-5 bg-mist rounded" />
        </div>
      </div>
    </div>
  )
}

function MiniGallery() {
  const shades = ['#e8e3d7', '#dbd4c4', '#cec6b3', '#e2dccd', '#d5cdbb', '#c8bfaa']
  return (
    <div className="bg-ivory rounded-xl p-3 border border-hairline">
      <div className="grid grid-cols-3 gap-1.5">
        {shades.map((c, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.85 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.04, duration: 0.3, ease: EASE }}
            className="rounded-lg overflow-hidden"
            style={{ aspectRatio: '1', backgroundColor: c }}
          >
            {i === 2 && (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-3 h-3 rounded-full border border-forest/25 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-forest/25" />
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-1.5 px-0.5">
        <ImageIcon size={10} className="text-ash shrink-0" />
        <p className="text-[8px] text-concrete">Tap foto untuk tampilan penuh</p>
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
            <p className="text-[10px] font-semibold text-graphite">8230 4567 890</p>
            <p className="text-[8px] text-ash">a.n. Rizky Pratama</p>
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

function MiniStory() {
  return (
    <div className="bg-ivory rounded-xl p-3.5 border border-hairline">
      <div className="flex gap-3">
        <div className="flex flex-col items-center">
          <div className="w-2 h-2 rounded-full bg-forest" />
          <div className="w-px flex-1 bg-hairline" />
          <div className="w-2 h-2 rounded-full bg-gold" />
          <div className="w-px flex-1 bg-hairline" />
          <div className="w-2 h-2 rounded-full bg-smoke" />
        </div>
        <div className="flex-1 space-y-3">
          {[
            { year: '2020', title: 'Pertama Bertemu', color: 'text-forest' },
            { year: '2023', title: 'Lamaran', color: 'text-gold-700' },
            { year: '2026', title: 'Hari Bahagia', color: 'text-ash' },
          ].map(s => (
            <div key={s.year}>
              <p className={`text-[8px] font-bold ${s.color}`}>{s.year}</p>
              <p className="text-[10px] text-concrete">{s.title}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function MiniWishes() {
  return (
    <div className="bg-ivory rounded-xl p-3.5 border border-hairline space-y-2">
      {[
        { name: 'Sinta Rahayu', msg: 'Semoga bahagia selalu ya! 🤍', time: '2 menit lalu' },
        { name: 'Hendra Wijaya', msg: 'Selamat menempuh hidup baru, semoga sakinah mawaddah warahmah.', time: '5 menit lalu' },
        { name: 'Dian Pratiwi', msg: 'Barakallah! Happy wedding 🎉', time: '12 menit lalu' },
      ].map(w => (
        <div key={w.name} className="bg-chalk rounded-lg px-3 py-2.5 border border-hairline">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-semibold text-graphite">{w.name}</p>
            <p className="text-[8px] text-ash">{w.time}</p>
          </div>
          <p className="text-[9px] text-concrete leading-relaxed">{w.msg}</p>
        </div>
      ))}
    </div>
  )
}

export default function FeatureShowcase({ personalisasi }: { personalisasi?: PersonalisasiData }) {
  return (
    <SectionContainer
      id="fitur"
      tone="ivory"
      eyebrow="Fitur Unggulan"
      title={<>Semua yang kalian butuhkan,<br className="hidden sm:block" /> dalam satu undangan.</>}
      lead="Nama tamu yang tersapa satu per satu, konfirmasi kehadiran otomatis, musik pengiring, dan galeri foto. Semua bisa diatur langsung dari HP kalian."
    >
      {/* Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

        {/* Card 1: Personalisasi — large featured card */}
        <CardPersonalisasi personalisasi={personalisasi} />

        {/* Card 2: RSVP */}
        <FeatureCard
          icon={ClipboardCheck}
          tag="RSVP Digital"
          title="Konfirmasi kehadiran dalam 10 detik"
          points={[
            'Hingga 500 tamu per undangan',
            'Rekap otomatis di dashboard',
            'Export ke spreadsheet',
          ]}
          visual={<MiniRSVP />}
          delay={0.08}
        />

        {/* Card 3: Musik */}
        <FeatureCard
          icon={Music2}
          tag="Musik Pengiring"
          title="Lagu favorit menyambut setiap tamu"
          points={[
            'Upload MP3 atau pilih koleksi',
            'Play otomatis saat dibuka',
            'Volume diatur oleh tamu',
          ]}
          visual={<MiniMusic />}
          delay={0.16}
        />

        {/* Card 4: Link */}
        <FeatureCard
          icon={Globe}
          tag="Link Undangan"
          title="Alamat undangan atas nama kalian"
          points={[
            'Format: nama.iaundang.online',
            'Bagikan langsung via WhatsApp',
            'Aktif hingga 6 bulan',
          ]}
          visual={<MiniDomain />}
          delay={0.1}
        />

        {/* Card 5: Galeri */}
        <FeatureCard
          icon={ImageIcon}
          tag="Galeri Foto"
          title="Ceritakan kisah lewat galeri foto"
          points={[
            'Grid rapi & lightbox fullscreen',
            'Upload hingga 20 foto',
            'Optimasi otomatis',
          ]}
          visual={<MiniGallery />}
          delay={0.14}
        />

        {/* Card 6: Amplop Digital */}
        <FeatureCard
          icon={Gift}
          tag="Amplop Digital"
          title="Terima hadiah & angpao secara digital"
          points={[
            'Rekening bank & e-wallet',
            'QR Code QRIS langsung',
            'Konfirmasi bukti transfer',
          ]}
          visual={<MiniGift />}
          delay={0.18}
        />

        {/* Card 7: Kisah Cinta */}
        <FeatureCard
          icon={BookOpen}
          tag="Kisah Cinta"
          title="Timeline perjalanan cinta kalian"
          points={[
            'Ceritakan momen penting',
            'Timeline interaktif',
            'Foto per chapter',
          ]}
          visual={<MiniStory />}
          delay={0.22}
        />

        {/* Card 8: Ucapan & Doa */}
        <FeatureCard
          icon={MessageSquare}
          tag="Ucapan & Doa"
          title="Terima ucapan langsung dari tamu"
          points={[
            'Form ucapan tanpa login',
            'Tampil real-time di undangan',
            'Moderasi dari dashboard',
          ]}
          visual={<MiniWishes />}
          delay={0.26}
        />
      </div>

      {/* Bottom CTA */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="mt-12 sm:mt-16 text-center"
      >
        <p className="text-body-sm text-concrete mb-5">
          Semua fitur tersedia mulai paket Starter.
        </p>
        <Button href="/templates" size="lg" className="w-full sm:w-auto">
          Lihat semua template
          <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
        </Button>
      </motion.div>
    </SectionContainer>
  )
}
