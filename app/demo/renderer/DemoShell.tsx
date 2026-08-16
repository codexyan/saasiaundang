// Sengaja TANPA 'use client'. Murni presentasional (Link, Image, dua ikon,
// dan {children}) — tanpa hook maupun handler. Pengimpornya hanya page.tsx
// yang Server Component; children-nya <DemoEditorClient/> tetap Client
// Component, dan Server Component merender client children itu pola standar.

import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Sparkles } from 'lucide-react'

interface Props {
  templateName: string
  children: React.ReactNode
}

export default function DemoShell({ templateName, children }: Props) {
  return (
    <div className="flex flex-col h-[100dvh] bg-[#0a0a0a] overflow-hidden">
      {/* Top navbar */}
      <div className="shrink-0 bg-white/95 backdrop-blur-xl border-b border-stone-200/60 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 text-stone-500 hover:text-stone-700 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <Image src="/logos/logo-horizontal.png" alt="iaundang" width={100} height={28} className="object-contain" />
            </Link>
            <span className="hidden sm:block text-xs text-stone-300">|</span>
            <span className="hidden sm:block text-xs text-stone-500 font-medium">
              Preview: <span className="text-stone-700">{templateName}</span>
            </span>
          </div>
          <Link
            href="/templates"
            className="flex items-center gap-1.5 bg-forest-500 hover:bg-forest-600 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-colors shadow-sm"
          >
            <Sparkles className="w-3 h-3" /> Buat Undangan
          </Link>
        </div>
      </div>

      {/* Invitation renderer area */}
      <div className="flex-1 flex justify-center overflow-hidden relative">
        {children}
      </div>

      {/* Bottom watermark bar */}
      <div className="shrink-0 bg-white/95 backdrop-blur-xl border-t border-stone-200/60 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-10 flex items-center justify-between">
          <p className="text-[11px] text-stone-400">
            Dibuat dengan <span className="font-semibold text-stone-600">iaundang</span> · Platform undangan digital premium
          </p>
          <div className="flex items-center gap-4">
            <Link href="/templates" className="text-[11px] text-stone-400 hover:text-forest-500 transition-colors font-medium">
              Lihat Template
            </Link>
            <Link href="/templates" className="text-[11px] text-forest-600 hover:text-forest-700 transition-colors font-semibold">
              Buat Undangan
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
