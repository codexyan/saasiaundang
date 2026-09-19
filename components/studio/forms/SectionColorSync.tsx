'use client'

import { Paintbrush } from 'lucide-react'
import type { NewInvitationData, SectionConfig, BackgroundConfig } from '@/lib/types'
import SectionCard from '../ui/SectionCard'

interface Props {
  sections: SectionConfig[]
  data: NewInvitationData
  onUpdate: (patch: Partial<NewInvitationData>) => void
  /** Warna yang akan diterapkan, biasanya warna primer pilihan pembeli. */
  warna: string
}

/**
 * Menyamakan latar tiap bagian dengan warna pilihan pembeli.
 *
 * Kenapa ini perlu ada sebagai tombol, bukan otomatis: latar tiap seksi
 * disimpan sebagai nilai hex sendiri di konfigurasi tema, dan nilainya tidak
 * harus berhubungan dengan `meta.color_scheme`. Javanese Gold contohnya
 * menyimpan skema merah tua sementara latar seksinya hijau. Akibatnya pembeli
 * yang mengganti warna primer melihat sampulnya berubah dan badan undangannya
 * tetap warna lama.
 *
 * Menyamakannya diam diam juga salah: perancang tema kadang sengaja memberi
 * beberapa seksi warna lepas sebagai ritme. Jadi keputusannya diserahkan ke
 * pembeli, dengan satu tombol untuk menerapkan dan satu untuk mengembalikan.
 *
 * Bagian yang latarnya foto atau video tidak disentuh sama sekali.
 */
export default function SectionColorSync({ sections, data, onUpdate, warna }: Props) {
  const aktif = sections.filter(s => s.enabled)
  const berwarna = aktif.filter(s => s.background?.type === 'color')
  const timpa = data.section_background_overrides ?? {}
  const jumlahDitimpa = Object.keys(timpa).length

  function terapkan() {
    const next: Record<string, BackgroundConfig> = { ...timpa }
    for (const s of berwarna) {
      next[s.id] = { ...(s.background as BackgroundConfig), type: 'color', value: warna }
    }
    onUpdate({ section_background_overrides: next })
  }

  function kembalikan() {
    onUpdate({ section_background_overrides: {} })
  }

  if (berwarna.length === 0) return null

  return (
    <SectionCard
      title="Warna tiap bagian"
      description="Sampul dan aksen sudah ikut warna kalian. Bagian isi undangan punya warnanya sendiri dari tema."
      icon={Paintbrush}
    >
      <div className="space-y-3">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="w-9 h-9 rounded-card border border-hairline shrink-0"
            style={{ backgroundColor: warna }}
          />
          <p className="text-ui-xs text-graphite leading-snug">
            {berwarna.length} bagian memakai warna polos dan bisa disamakan.
            {aktif.length - berwarna.length > 0
              ? ` ${aktif.length - berwarna.length} bagian berlatar foto atau video, itu tidak disentuh.`
              : ''}
          </p>
        </div>

        <button
          type="button"
          onClick={terapkan}
          className="w-full px-4 py-2.5 sentuh:min-h-[44px] rounded-card bg-forest text-chalk text-ui-sm font-semibold hover:bg-forest-700 transition-colors"
        >
          Terapkan warna ini ke {berwarna.length} bagian
        </button>

        {jumlahDitimpa > 0 && (
          <button
            type="button"
            onClick={kembalikan}
            className="w-full px-4 py-2.5 sentuh:min-h-[44px] rounded-card border border-hairline text-ui-sm font-medium text-graphite hover:text-carbon hover:border-concrete transition-colors"
          >
            Kembalikan semua bagian ke warna tema
          </button>
        )}
      </div>
    </SectionCard>
  )
}
