'use client'

import type { TemplateRecord } from '@/lib/types'

/**
 * Miniatur sampul template.
 *
 * Satu komponen untuk SEMUA tempat yang menampilkan template di panel admin.
 * Sebelumnya markup ini ada dua kali dengan ukuran font dan urutan lapisan
 * yang berbeda tipis — Studio Desain dan Manajemen menampilkan template yang
 * sama dengan rupa yang tidak sama, sehingga admin sempat mengira keduanya
 * adalah dua objek berbeda.
 *
 * Urutan sumber gambar sengaja: foto sampul dari desain dulu (itulah yang
 * benar-benar dilihat tamu), baru thumbnail unggahan manual, baru kartu warna.
 */
export default function TemplateThumb({ record, config }: {
  record: TemplateRecord
  /** Pakai draft kalau ada, supaya kartu mencerminkan yang sedang digarap. */
  config?: TemplateRecord['config']
}) {
  const cfg = config ?? record.draft_config ?? record.config
  const scheme = cfg?.meta?.color_scheme
  const primary = scheme?.primary ?? '#1a1a2e'
  const accent = scheme?.accent ?? '#d4a574'
  const text = scheme?.text ?? '#ffffff'
  const cover = cfg?.opening?.cover_photo_url || cfg?.opening?.background_image || ''

  return (
    <div className="w-full h-full relative overflow-hidden" style={{ background: primary }}>
      {cover ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cover} alt="" loading="lazy" className="w-full h-full object-cover" />
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(to top, ${primary}dd 20%, ${primary}40 50%, transparent 80%)` }}
          />
        </>
      ) : record.thumbnail_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={record.thumbnail_url} alt="" loading="lazy" className="w-full h-full object-cover" />
      ) : null}

      <div className="absolute inset-0 flex flex-col items-center justify-end pb-5 px-4 pointer-events-none">
        <p className="text-[8px] tracking-[0.2em] uppercase opacity-70" style={{ color: text }}>
          Undangan Pernikahan
        </p>
        <p className="text-sm font-bold text-center mt-1 leading-tight line-clamp-2" style={{ color: text }}>
          {record.name}
        </p>
        <div
          className="mt-2 px-3.5 py-1 rounded-sm"
          style={{ border: `1px solid ${accent}60`, fontSize: 8, color: text, letterSpacing: '0.15em' }}
        >
          BUKA UNDANGAN
        </div>
      </div>
    </div>
  )
}
