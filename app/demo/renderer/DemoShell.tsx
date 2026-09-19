// Sengaja TANPA 'use client'. Murni presentasional (Link, Image, satu ikon,
// dan {children}) — tanpa hook maupun handler. Pengimpornya hanya page.tsx
// yang Server Component; children-nya <DemoEditorClient/> tetap Client
// Component, dan Server Component merender client children itu pola standar.

import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft } from 'lucide-react'

interface Props {
  templateName: string
  /** Dipakai tombol pesan supaya tema yang sedang dilihat ikut terbawa. */
  templateId: string
  children: React.ReactNode
}

export default function DemoShell({ templateName, templateId, children }: Props) {
  return (
    <div className="flex flex-col h-[100dvh] bg-graphite overflow-hidden">
      {/* Bar atas */}
      <div className="shrink-0 bg-chalk border-b border-hairline z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/templates"
              className="flex items-center gap-2 min-h-[44px] text-concrete hover:text-forest-deep transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40 rounded-button"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden />
              {/* Ukuran asli berkasnya 844x243. Dulu ditulis 100x28, rasio
                  3,57 lawan 3,47, dan next/image memperingatkan rasio rusak
                  di konsol setiap halaman demo dibuka. Sekarang ukuran asli
                  yang ditulis, tingginya diatur CSS, lebarnya ikut. */}
              <Image src="/logos/logo-horizontal.png" alt="iaundang" width={844} height={243} className="h-7 w-auto shrink-0" />
            </Link>
            <span className="hidden sm:block text-body-xs text-ash">|</span>
            <span className="hidden sm:block text-body-xs text-concrete truncate">
              Tema <span className="text-graphite font-medium">{templateName}</span>
            </span>
          </div>

          {/* Satu ajakan saja di bar ini, dan tujuannya tema yang sedang
              dilihat. Dulu ada tiga tombol dan ketiganya menuju /templates,
              jadi pengunjung yang sudah menemukan tema yang disukainya justru
              dikembalikan ke daftar. Ikon Sparkles ikut dibuang (R-04). */}
          <Link
            href={`/order?template=${templateId}`}
            className="flex items-center shrink-0 min-h-[44px] bg-forest hover:bg-forest-deep text-chalk text-button-sm font-semibold px-4 rounded-button transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40 focus-visible:ring-offset-2"
          >
            Pesan tema ini
          </Link>
        </div>
      </div>

      {/* Area undangan */}
      <div className="flex-1 flex justify-center overflow-hidden relative">
        {children}
      </div>

      {/* Bar bawah */}
      <div className="shrink-0 bg-chalk border-t border-hairline z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 min-h-[44px] py-1.5 flex items-center justify-between gap-3">
          <p className="text-body-xs text-concrete truncate">
            Ini pratinjau. Isinya belum tersimpan di mana pun.
          </p>
          <Link
            href="/templates"
            className="flex items-center shrink-0 min-h-[44px] text-body-xs text-concrete hover:text-forest-deep transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40 rounded-button px-1"
          >
            Lihat tema lain
          </Link>
        </div>
      </div>
    </div>
  )
}
