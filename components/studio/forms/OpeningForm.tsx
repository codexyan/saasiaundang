'use client'

import { DoorOpen, Check, Lock} from 'lucide-react'
import FormField from '../ui/FormField'
import { StudioInput, StudioTextarea } from '../ui/StudioInput'
import SectionCard from '../ui/SectionCard'
import type { OpeningType } from '@/lib/types'
import { GAYA_PEMBUKA, KATEGORI_PEMBUKA, type KategoriPembuka } from '@/lib/opening-styles'

/**
 * Gaya yang termasuk paket dasar.
 *
 * `opening_styles: 'basic'` sudah lama ada di definisi paket dan diiklankan
 * sebagai pembeda, tapi tidak pernah dibaca di mana pun: paket termurah
 * mendapat ketujuh belas gaya, sama dengan yang termahal. Kategori Klasik
 * dipilih sebagai isi paket dasar karena paling netral dan paling aman untuk
 * tema apa pun.
 */
const GAYA_DASAR = new Set<OpeningType>(['fade-reveal', 'envelope', 'scroll-reveal', 'book-open'])

interface OpeningFormProps {
  openingType: OpeningType
  openingGreeting: string
  openingSubtitle: string
  /** Teks sapaan milik tema. Dipakai sebagai placeholder dan sebagai isi
   *  pratinjau selama pembeli belum menulis miliknya sendiri, supaya kotak
   *  kosong tidak terbaca sebagai "tidak ada sapaan". */
  greetingTema: string
  subtitleTema: string
  groomName: string
  brideName: string
  onOpeningTypeChange: (value: OpeningType) => void
  onOpeningGreetingChange: (value: string) => void
  onOpeningSubtitleChange: (value: string) => void
  /** Paket pembeli membuka semua gaya pembuka. */
  semuaGaya: boolean
  /** Paket termurah yang membuka sisanya. */
  paketPembuka?: string
}

/**
 * Warna kartu contoh, satu satunya hal yang khas layar ini.
 *
 * Id, nama, keterangan, dan kategorinya diambil dari lib/opening-styles.ts,
 * daftar yang sama dengan yang dipakai panel admin. Dulu keduanya punya
 * daftar sendiri sendiri, dan enam belas dari tujuh belas gaya bernama beda
 * di dua layar untuk barang yang sama persis.
 */
const SWATCH: Record<string, React.CSSProperties> = {
  'fade-reveal':    { background: 'linear-gradient(135deg, #1a1a1a 0%, #3a3a3a 100%)' },
  'envelope':       { background: 'linear-gradient(135deg, #f5f0eb 0%, #e8ddd0 100%)' },
  'scroll-reveal':  { background: 'linear-gradient(135deg, #f5f0e0 0%, #e8ddbf 100%)' },
  'book-open':      { background: 'linear-gradient(135deg, #1a1a0a 0%, #3a3a1a 100%)' },
  'flower-bloom':   { background: 'linear-gradient(135deg, #3a1a1a 0%, #6b3a3a 100%)' },
  'petal-fall':     { background: 'linear-gradient(135deg, #2a1a2a 0%, #4a2a4a 100%)' },
  'veil-lift':      { background: 'linear-gradient(135deg, #f0ebe5 0%, #ddd5c8 100%)' },
  'lantern-rise':   { background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3a 100%)' },
  'ring-zoom':      { background: 'linear-gradient(135deg, #1a1a2a 0%, #2a2a4a 100%)' },
  'diamond-split':  { background: 'linear-gradient(135deg, #0a1a2a 0%, #1a3a4a 100%)' },
  'mosaic-reveal':  { background: 'linear-gradient(135deg, #0a0a0a 0%, #2a2a2a 100%)' },
  'typewriter':     { background: 'linear-gradient(135deg, #050505 0%, #1a1a1a 100%)' },
  'gold-shimmer':   { background: 'linear-gradient(135deg, #0a0500 0%, #1a0f00 100%)' },
  'frosted-blur':   { background: 'linear-gradient(135deg, #f0f0f0 0%, #d8d8d8 100%)' },
  'curtain':        { background: 'linear-gradient(135deg, #0f0f0f 0%, #2a2a2a 100%)' },
  'gate-open':      { background: 'linear-gradient(135deg, #1a2a1a 0%, #2c4a2c 100%)' },
  'parallax-split': { background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3a 100%)' },
}

const OPENING_STYLES: {
  id: OpeningType
  name: string
  desc: string
  category: KategoriPembuka
  preview: React.CSSProperties
}[] = GAYA_PEMBUKA.map(g => ({
  id: g.id,
  name: g.nama,
  desc: g.desc,
  category: g.kategori,
  preview: SWATCH[g.id] ?? { background: 'linear-gradient(135deg, #1a1a1a 0%, #3a3a3a 100%)' },
}))


/** Urutan dan labelnya dari sumber bersama, sama dengan panel admin. */
const CATEGORIES = KATEGORI_PEMBUKA

export default function OpeningForm({
  openingType,
  openingGreeting,
  openingSubtitle,
  greetingTema,
  subtitleTema,
  groomName,
  brideName,
  onOpeningTypeChange,
  onOpeningGreetingChange,
  onOpeningSubtitleChange,
  semuaGaya,
  paketPembuka,
}: OpeningFormProps) {
  return (
    <SectionCard
      title="Pembuka Undangan"
      icon={DoorOpen}
      description="Gaya animasi dan teks pembuka saat tamu membuka undangan"
    >
      {/* Opening Style Selector */}
      <div className="space-y-1">
        <p className="text-sm font-semibold text-graphite">Gaya Pembuka</p>
        <p className="text-xs text-concrete">Pilih animasi pembuka yang tampil pertama kali saat tamu membuka undangan</p>
        {!semuaGaya && (
          <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-card border border-hairline bg-ivory">
            <Lock size={14} className="text-concrete shrink-0 mt-0.5" />
            <p className="text-ui-xs text-graphite leading-relaxed">
              Paket kalian memuat {GAYA_DASAR.size} gaya pembuka.
              {paketPembuka ? ` Gaya lainnya terbuka di paket ${paketPembuka}.` : ''}
            </p>
          </div>
        )}
        {CATEGORIES.map((cat) => {
          const styles = OPENING_STYLES.filter((s) => s.category === cat.id)
            // Gaya yang sedang dipakai tetap ditampilkan walau di luar paket:
            // pilihannya datang dari tema, bukan dari pembeli, dan
            // menyembunyikannya membuat layar berbohong soal apa yang tampil.
            .filter((s) => semuaGaya || GAYA_DASAR.has(s.id) || s.id === openingType)
          if (styles.length === 0) return null
          return (
            <div key={cat.id}>
              <p className="text-ui-2xs font-bold tracking-[0.1em] uppercase text-concrete mb-2 mt-4">
                {cat.label}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {styles.map((style) => {
                  const isSelected = openingType === style.id
                  return (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => onOpeningTypeChange(style.id)}
                      className={`relative p-3 rounded-xl text-left transition-all ${
                        isSelected
                          ? 'ring-2 ring-forest-500 ring-offset-1 bg-forest-50/40'
                          : 'border border-hairline hover:border-ash/50 hover:bg-mist'
                      }`}
                    >
                      {/* Mini CSS preview */}
                      <div className="w-full h-10 rounded-lg mb-2 overflow-hidden relative" style={style.preview}>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-8 h-px" style={{ background: 'rgba(255,255,255,0.3)' }} />
                        </div>
                      </div>
                      <p className={`text-ui-xs font-semibold leading-tight ${isSelected ? 'text-forest-700' : 'text-graphite'}`}>
                        {style.name}
                      </p>
                      <p className="text-ui-2xs text-concrete mt-0.5 leading-tight">{style.desc}</p>
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-forest-500 flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Greeting Text */}
      <FormField
        label="Salam Pembuka"
        hint="Sapaan formal untuk tamu undangan"
      >
        <StudioInput
          type="text"
          value={openingGreeting}
          onChange={(e) => onOpeningGreetingChange(e.target.value)}
          placeholder={greetingTema}
        />
      </FormField>

      {/* Subtitle */}
      <FormField
        label="Kalimat Pembuka"
        hint="Teks formal di bawah salam pembuka"
      >
        <StudioTextarea
          rows={3}
          value={openingSubtitle}
          onChange={(e) => onOpeningSubtitleChange(e.target.value)}
          placeholder={subtitleTema}
        />
      </FormField>

      {/* Quick Select */}
      <div className="space-y-2">
        <p className="text-sm font-semibold text-graphite">Pilih Cepat:</p>
        <div className="grid grid-cols-1 gap-2">
          <button
            type="button"
            onClick={() => {
              onOpeningGreetingChange('Assalamualaikum Warahmatullahi Wabarakatuh')
              onOpeningSubtitleChange('Tanpa mengurangi rasa hormat, kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri acara pernikahan kami.')
            }}
            className="p-3 border border-hairline rounded-lg hover:border-gold-dark/50 hover:bg-forest-50 transition-all text-left"
          >
            <p className="text-xs font-semibold text-graphite">☪️ Muslim (Formal)</p>
            <p className="text-xs text-concrete mt-1">Assalamualaikum Warahmatullahi Wabarakatuh</p>
          </button>
          <button
            type="button"
            onClick={() => {
              onOpeningGreetingChange('Dengan Memohon Rahmat dan Ridho Tuhan Yang Maha Esa')
              onOpeningSubtitleChange('Kami mengundang Bapak/Ibu/Saudara/i untuk hadir dan memberikan doa restu pada acara pernikahan kami.')
            }}
            className="p-3 border border-hairline rounded-lg hover:border-gold-dark/50 hover:bg-forest-50 transition-all text-left"
          >
            <p className="text-xs font-semibold text-graphite">🙏 Umum (Formal)</p>
            <p className="text-xs text-concrete mt-1">Dengan Memohon Rahmat dan Ridho Tuhan Yang Maha Esa</p>
          </button>
          <button
            type="button"
            onClick={() => {
              onOpeningGreetingChange('We Are Getting Married!')
              onOpeningSubtitleChange('You are invited to celebrate our special day. Join us as we begin our journey together.')
            }}
            className="p-3 border border-hairline rounded-lg hover:border-gold-dark/50 hover:bg-forest-50 transition-all text-left"
          >
            <p className="text-xs font-semibold text-graphite">💑 Modern (Casual)</p>
            <p className="text-xs text-concrete mt-1">We Are Getting Married!</p>
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className="p-6 rounded-xl bg-ivory border border-hairline">
        <div className="text-center space-y-3">
          <p className="text-xs font-semibold text-forest uppercase tracking-wider">
            Preview Pembuka
          </p>
          <p className="text-xs text-concrete">
            Gaya: {OPENING_STYLES.find(s => s.id === openingType)?.name}
          </p>
          <p className="text-sm font-sans text-graphite leading-relaxed">
            {openingGreeting || greetingTema || 'Salam pembuka...'}
          </p>
          <div className="w-12 h-px bg-gold-dark mx-auto" />
          <p className="text-xs text-concrete leading-relaxed max-w-xs mx-auto">
            {openingSubtitle || subtitleTema || 'Kalimat pembuka...'}
          </p>
          <div className="mt-3 space-y-1" style={{ lineHeight: 1.2 }}>
            <p className="text-lg font-bold text-graphite uppercase tracking-wider">
              {groomName || 'Nama Pria'}
            </p>
            <p className="text-sm text-gold-dark">
              &amp;
            </p>
            <p className="text-lg font-bold text-graphite uppercase tracking-wider">
              {brideName || 'Nama Wanita'}
            </p>
          </div>
        </div>
      </div>
    </SectionCard>
  )
}
