'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { Check } from 'lucide-react'
import type { OpeningType } from '@/lib/types'
import { OPENING_TYPES, OPENING_META } from './constants'
import { useEditor } from '../EditorContext'

const OpeningScene = dynamic(() => import('@/components/renderer/OpeningScene'), { ssr: false })

/** Lebar kanvas undangan. Seluruh gaya opening digambar untuk ukuran ini. */
const LEBAR_KANVAS = 390
/** Ukuran panggung intip. Cukup besar untuk melihat gerakan, cukup kecil untuk menumpang di samping panel. */
const LEBAR_INTIP = 168
const TINGGI_INTIP = 292

/**
 * Pemilih gaya opening yang memperlihatkan gerakannya.
 *
 * Sebelumnya tujuh belas gaya dipilih dari grid emoji. Emoji tidak
 * memberi tahu apa pun tentang gerakan, jadi untuk memutuskan admin harus
 * memilih satu gaya, menekan Play, menunggu animasinya selesai, lalu
 * mengulang untuk gaya berikutnya. Enam belas kali.
 *
 * Sekarang kartu yang disentuh memutar gaya itu sungguhan di panggung kecil
 * di sebelahnya: komponen opening yang sama persis dengan yang dipakai tamu,
 * dengan konfigurasi dan warna tema yang sedang digarap. Bukan animasi tiruan,
 * karena tiruan akan berbohong begitu salah satu gaya diubah.
 *
 * Hanya SATU panggung hidup pada satu waktu. Merender tujuh belas opening
 * sekaligus akan menghabiskan memori peramban untuk sesuatu yang cuma dilihat
 * satu per satu.
 *
 * Emoji dibuang dari kartu. Keterangan gerakan satu baris yang sudah ditulis
 * di OPENING_META jauh lebih memberi tahu daripada gambar amplop kecil.
 */
export default function OpeningStylePicker() {
  const { cfg, previewData, previewGuestName, updateOpening, setPreviewMode, setDecorPreviewKey } = useEditor()

  const [intip, setIntip] = useState<{ tipe: OpeningType; atas: number; kiri: number } | null>(null)
  const [kurangiGerak, setKurangiGerak] = useState(false)
  const jamRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const ikut = () => setKurangiGerak(mq.matches)
    ikut()
    mq.addEventListener('change', ikut)
    return () => mq.removeEventListener('change', ikut)
  }, [])

  useEffect(() => () => { if (jamRef.current) clearTimeout(jamRef.current) }, [])

  function bukaIntip(tipe: OpeningType, el: HTMLElement) {
    if (kurangiGerak) return
    if (jamRef.current) clearTimeout(jamRef.current)
    // Jeda pendek supaya menyapu pointer melintasi grid tidak menyalakan
    // tujuh belas panggung berturut turut.
    jamRef.current = setTimeout(() => {
      const r = el.getBoundingClientRect()
      // Panggung ditempel ke viewport, bukan ke kartu, supaya tidak terpotong
      // panel kontrol yang bisa digulir.
      const atas = Math.min(Math.max(8, r.top - 40), window.innerHeight - TINGGI_INTIP - 8)
      const ruangKanan = window.innerWidth - r.right
      const kiri = ruangKanan > LEBAR_INTIP + 24
        ? r.right + 12
        : Math.max(8, r.left - LEBAR_INTIP - 12)
      setIntip({ tipe, atas, kiri })
    }, 180)
  }

  function tutupIntip() {
    if (jamRef.current) clearTimeout(jamRef.current)
    setIntip(null)
  }

  return (
    <>
      {/* Dua kolom, tidak lebih. Panel kontrol lebarnya 420 piksel dan
          sudah dipotong navigasi sub bagian, jadi tiga kolom membuat tiap
          kartu selebar 78 piksel dan keterangannya pecah jadi empat baris. */}
      <div className="grid grid-cols-2 gap-1.5">
        {OPENING_TYPES.map(ot => {
          const m = OPENING_META[ot]
          const aktif = cfg.opening.type === ot
          return (
            <button
              key={ot}
              type="button"
              onMouseEnter={e => bukaIntip(ot as OpeningType, e.currentTarget)}
              onMouseLeave={tutupIntip}
              onFocus={e => bukaIntip(ot as OpeningType, e.currentTarget)}
              onBlur={tutupIntip}
              onClick={() => {
                updateOpening({ type: ot as OpeningType })
                setPreviewMode('opening')
                setDecorPreviewKey(k => k + 1)
                tutupIntip()
              }}
              aria-pressed={aktif}
              className={`relative px-2.5 py-2 sentuh:min-h-[44px] rounded-xl text-left transition-all ${
                aktif
                  ? 'bg-indigo-50 border-2 border-indigo-500'
                  : 'bg-gray-50 border border-gray-200 hover:border-indigo-300 hover:bg-white'
              }`}
            >
              <p className={`text-[11px] font-semibold leading-tight ${aktif ? 'text-indigo-700' : 'text-gray-700'}`}>
                {m?.label ?? ot}
              </p>
              <p className="text-[9px] text-gray-500 leading-snug mt-0.5 pr-3">
                {m?.desc}
              </p>
              {aktif && (
                <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-indigo-500 flex items-center justify-center">
                  <Check className="w-2 h-2 text-white" />
                </span>
              )}
            </button>
          )
        })}
      </div>

      <p className="mt-2 text-[9px] text-gray-400 leading-relaxed">
        {kurangiGerak
          ? 'Perangkat ini meminta kurangi gerak, jadi pratinjau gerakan dimatikan. Keterangan di tiap kartu menjelaskan gerakannya.'
          : 'Arahkan pointer ke satu kartu untuk melihat gerakannya, klik untuk memakainya.'}
      </p>

      {intip && (
        <div
          // Murni tontonan: pointer tidak boleh tertangkap di sini, kalau
          // tidak kartu di bawahnya langsung kehilangan hover dan panggungnya
          // berkedip mati hidup.
          aria-hidden
          className="fixed z-[80] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-black/10 pointer-events-none bg-gray-900"
          style={{ top: intip.atas, left: intip.kiri, width: LEBAR_INTIP, height: TINGGI_INTIP }}
        >
          <div
            style={{
              width: LEBAR_KANVAS,
              zoom: LEBAR_INTIP / LEBAR_KANVAS,
              height: Math.round(TINGGI_INTIP / (LEBAR_INTIP / LEBAR_KANVAS)),
              position: 'relative',
            }}
          >
            <OpeningScene
              // Key menyertakan tipenya supaya berpindah kartu benar benar
              // memutar ulang dari awal, bukan melanjutkan animasi sebelumnya.
              key={`intip-${intip.tipe}`}
              config={{ ...cfg.opening, type: intip.tipe }}
              data={previewData}
              meta={cfg.meta}
              positionMode="absolute"
              previewGuestName={previewGuestName}
              onOpen={() => {}}
            />
          </div>
          <p className="absolute bottom-0 inset-x-0 text-center text-[9px] text-white/70 bg-black/45 py-1">
            {OPENING_META[intip.tipe]?.label}
          </p>
        </div>
      )}
    </>
  )
}
