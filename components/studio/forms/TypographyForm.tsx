'use client'

import { useEffect } from 'react'
import { Type } from 'lucide-react'
import SectionCard from '../ui/SectionCard'
import { FONT_PAIRS, cariPasangan } from '@/lib/font-pairs'

interface Props {
  /** Font tema, dipakai kalau pembeli belum memilih apa apa. */
  headingTema: string
  bodyTema: string
  heading?: string
  body?: string
  onChange: (patch: { font_heading?: string; font_body?: string }) => void
  /** Warna tema untuk latar contoh, supaya contohnya jujur. */
  warnaLatar: string
  warnaTeks: string
}

/**
 * Pemilih pasangan font untuk pembeli.
 *
 * Daftarnya sama persis dengan yang dipakai admin (lib/font-pairs.ts), dan
 * pilihannya terbatas pada pasangan terkurasi, bukan dua dropdown berisi
 * ratusan nama font. Alasannya satu baris: dua font yang dipilih terpisah
 * hampir selalu bertabrakan, dan yang dijual di sini adalah rupa.
 *
 * Contohnya digambar dengan warna tema yang sedang dipakai, bukan hitam di
 * atas putih, supaya yang terlihat di kartu sama dengan yang terlihat di
 * undangan.
 */
export default function TypographyForm({
  headingTema, bodyTema, heading, body, onChange, warnaLatar, warnaTeks,
}: Props) {
  const aktifHeading = heading || headingTema
  const aktifBody = body || bodyTema
  const terpilih = cariPasangan(aktifHeading, aktifBody)
  const ikutTema = !heading && !body

  // Memuat font contoh. Renderer memuat font undangannya sendiri; kartu di
  // panel ini butuh semuanya sekaligus, jadi tautannya dipasang di sini dan
  // dicabut saat panel ditutup.
  useEffect(() => {
    const keluarga = Array.from(new Set(FONT_PAIRS.flatMap(p => [p.heading, p.body])))
      .map(f => `family=${f.replace(/ /g, '+')}:wght@400;600;700`)
      .join('&')
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = `https://fonts.googleapis.com/css2?${keluarga}&display=swap`
    link.setAttribute('data-font-contoh', 'studio')
    document.head.appendChild(link)
    return () => { link.remove() }
  }, [])

  return (
    <SectionCard
      title="Huruf"
      description="Pilih pasangan huruf untuk nama kalian dan isi undangan. Semua paket bisa mengubah ini."
      icon={Type}
    >
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => onChange({ font_heading: undefined, font_body: undefined })}
          className={`w-full text-left px-3.5 py-3 sentuh:min-h-[44px] rounded-card border transition-colors ${
            ikutTema
              ? 'border-forest bg-forest-50'
              : 'border-hairline bg-chalk hover:border-concrete'
          }`}
        >
          <p className="text-ui-sm font-semibold text-carbon">Ikut tema</p>
          <p className="text-ui-xs text-graphite mt-0.5">
            {headingTema} dan {bodyTema}, pilihan perancang tema ini
          </p>
        </button>

        {FONT_PAIRS.map(pair => {
          const aktif = !ikutTema && terpilih?.name === pair.name
          return (
            <button
              key={pair.name}
              type="button"
              onClick={() => onChange({ font_heading: pair.heading, font_body: pair.body })}
              className={`w-full text-left rounded-card border overflow-hidden transition-colors ${
                aktif ? 'border-forest' : 'border-hairline hover:border-concrete'
              }`}
            >
              <div className="flex items-baseline justify-between gap-3 px-3.5 pt-3">
                <p className="text-ui-sm font-semibold text-carbon">{pair.name}</p>
                <p className="text-ui-xs text-graphite shrink-0">{pair.desc}</p>
              </div>
              <div
                className="mt-2.5 px-3.5 py-4"
                style={{ backgroundColor: warnaLatar }}
              >
                <p
                  style={{ fontFamily: `'${pair.heading}', serif`, color: warnaTeks, fontSize: 22, lineHeight: 1.2 }}
                >
                  Ikhwal &amp; Fani
                </p>
                <p
                  style={{ fontFamily: `'${pair.body}', sans-serif`, color: `${warnaTeks}b3`, fontSize: 11, marginTop: 6, lineHeight: 1.5 }}
                >
                  Dengan memohon rahmat Allah, kami mengundang kehadiran Bapak, Ibu, Saudara/i
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </SectionCard>
  )
}
