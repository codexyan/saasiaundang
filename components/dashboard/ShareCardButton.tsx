'use client'

import { useState } from 'react'
import { ImageDown, Loader2, X, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import type { NewInvitationData, TemplateRecord } from '@/lib/types'
import { buatKartuBagikan } from '@/lib/kartu-bagikan'

interface Props {
  data: NewInvitationData
  template: TemplateRecord | null
  alamat: string
  slug: string
  /**
   * Latar tempat tombolnya duduk. 'gelap' untuk kartu hero dashboard yang
   * hijau, 'terang' untuk panel preview studio yang ivory. Dipisah karena
   * tombol putih transparan hilang sama sekali di atas ivory, dan itu
   * melanggar ambang kontras (R-25).
   */
  gaya?: 'gelap' | 'terang'
  /** Melebar penuh mengikuti wadahnya. Dipakai di panel studio yang sempit. */
  penuh?: boolean
}

const GAYA = {
  gelap: 'bg-white/15 hover:bg-white/25 text-white backdrop-blur-sm',
  terang: 'bg-chalk hover:bg-mist text-carbon border border-hairline',
} as const

/**
 * Membuat kartu 1080x1920 untuk status WhatsApp dan Instagram.
 *
 * Dasarnya pembacaan pasar: undangan digital ditemukan orang lewat
 * rekomendasi di media sosial, bukan lewat pencarian, dan yang disebarkan di
 * sana adalah gambar. Sekarang pasangan membuat gambarnya sendiri di aplikasi
 * lain, lalu menempel tautannya terpisah.
 *
 * Tombolnya hanya muncul kalau temanya sudah diketahui. Membuat kartu dengan
 * warna tebakan akan menghasilkan gambar yang tidak mirip undangannya, dan
 * itu lebih buruk daripada tidak ada tombol.
 *
 * Dipakai di dua tempat: kartu hero dashboard, dan panel preview studio.
 * Di studio `data` yang dioper adalah state yang sedang disunting, belum
 * tentu yang tersimpan, jadi kartunya mengikuti warna dan huruf yang baru
 * saja diganti pembeli. Itu justru inti gunanya ada di sana.
 */
export default function ShareCardButton({ data, template, alamat, slug, gaya = 'gelap', penuh = false }: Props) {
  const [sibuk, setSibuk] = useState(false)
  const [kartu, setKartu] = useState<{ blob: Blob; pratinjau: string } | null>(null)

  if (!template) return null

  async function buat() {
    setSibuk(true)
    try {
      const hasil = await buatKartuBagikan(data, template!, alamat)
      setKartu(hasil)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Kartunya gagal dibuat')
    } finally {
      setSibuk(false)
    }
  }

  function unduh() {
    if (!kartu) return
    const url = URL.createObjectURL(kartu.blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `undangan-${slug}.png`
    a.click()
    URL.revokeObjectURL(url)
  }

  /** Berbagi langsung ke aplikasi lain, kalau perambannya mendukung. */
  async function bagikan() {
    if (!kartu) return
    const berkas = new File([kartu.blob], `undangan-${slug}.png`, { type: 'image/png' })
    const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean }
    if (nav.share && nav.canShare?.({ files: [berkas] })) {
      try {
        await nav.share({ files: [berkas], text: alamat })
      } catch { /* pengguna membatalkan, bukan kegagalan */ }
      return
    }
    unduh()
  }

  return (
    <>
      <button
        onClick={buat}
        disabled={sibuk}
        className={`flex items-center ${penuh ? 'w-full justify-center' : ''} gap-1.5 disabled:opacity-60 text-xs font-semibold px-4 py-2.5 sentuh:min-h-[44px] rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40 ${GAYA[gaya]}`}
      >
        {sibuk ? <Loader2 size={13} className="animate-spin" /> : <ImageDown size={13} />}
        {sibuk ? 'Membuat...' : 'Kartu untuk status'}
      </button>

      {kartu && (
        <div
          className="fixed inset-0 z-[90] bg-black/70 flex items-center justify-center p-4"
          onClick={() => setKartu(null)}
        >
          <div
            className="bg-chalk rounded-card max-w-sm w-full overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-hairline">
              <p className="text-ui-sm font-bold text-carbon">Kartu untuk status</p>
              <button
                onClick={() => setKartu(null)}
                aria-label="Tutup"
                className="inline-flex items-center justify-center w-9 h-9 sentuh:w-11 sentuh:h-11 rounded-lg text-graphite hover:text-carbon"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={kartu.pratinjau}
                alt="Pratinjau kartu undangan untuk dibagikan"
                className="w-full rounded-card border border-hairline"
              />
              <p className="mt-3 text-ui-xs text-graphite leading-relaxed">
                Ukurannya 1080 x 1920, pas untuk status WhatsApp dan Instagram.
                Tautan undangannya sudah tercetak di bawah gambar.
              </p>
              <button
                onClick={bagikan}
                className="mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 sentuh:min-h-[44px] rounded-card bg-forest text-chalk text-ui-sm font-semibold hover:bg-forest-deep transition-colors"
              >
                <Download size={15} /> Simpan gambar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
