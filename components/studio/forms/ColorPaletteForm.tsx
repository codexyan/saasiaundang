/**
 * Layar "Tema Warna" milik pembeli.
 *
 * Yang ditawarkan hanya palet yang sudah benar benar kami render sebagai
 * tema utuh, plus jalan kembali ke warna tema yang dibeli. Sebelumnya di
 * sini ada enam palet siap pakai, dan dua hal salah dengannya:
 *
 *   1. Palet bernama "Javanese Gold" memakai #2c4a34 dan #c9a961, padahal
 *      Javanese Gold yang sungguhan #1a4a1a dan #d4af37. Namanya menjanjikan
 *      sesuatu yang tidak ia berikan.
 *   2. Lima sisanya warna Tailwind mentah (emerald 400, rose 500, blue 800,
 *      purple 600, amber 900). Belum pernah satu pun dirender sebagai
 *      undangan utuh, dan mint neon serta ungu elektrik bukan warna yang
 *      dipakai orang untuk undangan pernikahan.
 *
 * Tidak ada juga jalan pulang: sekali menekan salah satu preset, pembeli
 * tidak punya cara kembali ke warna tema yang ia beli. Sekarang ada, dan itu
 * petak pertama.
 *
 * Yang ingin warna lain tetap bisa, lewat pemilih warna di bawahnya.
 */

'use client'

import { Palette } from 'lucide-react'
import FormField from '../ui/FormField'
import { StudioInput } from '../ui/StudioInput'
import SectionCard from '../ui/SectionCard'
import { PALET_RUMAH } from '@/lib/house-palettes'
import type { ColorScheme } from '@/lib/types'

interface ColorPaletteFormProps {
  primaryColor: string
  accentColor: string
  textColor: string
  backgroundColor: string
  /** Tema yang dibeli: id-nya dipakai supaya paletnya sendiri tidak ikut
   *  ditawarkan dua kali, warnanya jadi petak "Bawaan tema". */
  temaId: string
  temaWarna: ColorScheme
  onPrimaryColorChange: (color: string) => void
  onAccentColorChange: (color: string) => void
  onTextColorChange: (color: string) => void
  onBackgroundColorChange: (color: string) => void
  onPresetApply?: (colors: { primary: string; accent: string; text: string; background: string }) => void
}

export default function ColorPaletteForm({
  primaryColor,
  accentColor,
  textColor,
  backgroundColor,
  temaId,
  temaWarna,
  onPrimaryColorChange,
  onAccentColorChange,
  onTextColorChange,
  onBackgroundColorChange,
  onPresetApply,
}: ColorPaletteFormProps) {
  /**
   * Petak pertama mengosongkan keempat warna, bukan menuliskan warna tema.
   * Kosong berarti "ikut tema", jadi undangannya tetap ikut kalau temanya
   * kelak diperbarui. Menuliskan hexnya akan membekukan warna hari ini.
   */
  const petak = [
    { id: 'bawaan', nama: 'Bawaan tema', warna: { primary: '', accent: '', text: '', background: '' }, tampil: temaWarna },
    ...PALET_RUMAH.filter(p => p.id !== temaId).map(p => ({ id: p.id, nama: p.nama, warna: p.warna, tampil: p.warna })),
  ]

  /** Sedang terpakai kalau keempat warnanya persis sama dengan yang tampil. */
  const terpakai = (t: ColorScheme) =>
    primaryColor === t.primary
    && accentColor === t.accent
    && textColor === t.text
    && backgroundColor === (t.background ?? backgroundColor)

  function pakai(w: { primary: string; accent: string; text: string; background: string }) {
    if (onPresetApply) {
      onPresetApply(w)
      return
    }
    onPrimaryColorChange(w.primary)
    onAccentColorChange(w.accent)
    onTextColorChange(w.text)
    onBackgroundColorChange(w.background)
  }

  return (
    <SectionCard
      title="Tema Warna"
      icon={Palette}
      required
      description="Pilih palet warna atau kustomisasi sendiri"
    >
      <div>
        <p className="text-ui-sm font-medium text-concrete mb-2">Palet dari tema kami</p>
        <div className="grid grid-cols-3 gap-2">
          {petak.map((p) => {
            const aktif = terpakai(p.tampil)
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => pakai(p.warna)}
                aria-pressed={aktif}
                aria-label={`Pakai palet ${p.nama}`}
                className={`group relative p-2 border rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40 ${
                  aktif
                    ? 'border-gold-dark ring-1 ring-gold/30 bg-forest-50/40'
                    : 'border-hairline hover:border-ash/50'
                }`}
              >
                <div className="flex gap-0.5 mb-1.5">
                  <div className="w-full h-5 rounded-sm border border-hairline" style={{ backgroundColor: p.tampil.primary }} />
                  <div className="w-full h-5 rounded-sm border border-hairline" style={{ backgroundColor: p.tampil.accent }} />
                </div>
                <p className="text-ui-2xs font-medium text-concrete text-center truncate">
                  {p.nama}
                </p>
                {aktif && (
                  <div className="absolute top-1 right-1 w-4 h-4 bg-forest text-chalk rounded-full flex items-center justify-center">
                    <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Custom Colors */}
      <div className="pt-3 border-t border-hairline space-y-3">
        <p className="text-ui-sm font-medium text-concrete">Kustomisasi Warna</p>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Warna Utama" hint="Warna tema utama undangan">
            <div className="flex gap-2">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => onPrimaryColorChange(e.target.value)}
                className="w-10 h-9 rounded-lg border border-hairline cursor-pointer shrink-0"
              />
              <StudioInput
                type="text"
                value={primaryColor}
                onChange={(e) => onPrimaryColorChange(e.target.value)}
                placeholder={temaWarna.primary}
              />
            </div>
          </FormField>

          <FormField label="Warna Aksen" hint="Warna untuk highlight dan tombol">
            <div className="flex gap-2">
              <input
                type="color"
                value={accentColor}
                onChange={(e) => onAccentColorChange(e.target.value)}
                className="w-10 h-9 rounded-lg border border-hairline cursor-pointer shrink-0"
              />
              <StudioInput
                type="text"
                value={accentColor}
                onChange={(e) => onAccentColorChange(e.target.value)}
                placeholder={temaWarna.accent}
              />
            </div>
          </FormField>

          <FormField label="Warna Teks" hint="Warna teks utama">
            <div className="flex gap-2">
              <input
                type="color"
                value={textColor}
                onChange={(e) => onTextColorChange(e.target.value)}
                className="w-10 h-9 rounded-lg border border-hairline cursor-pointer shrink-0"
              />
              <StudioInput
                type="text"
                value={textColor}
                onChange={(e) => onTextColorChange(e.target.value)}
                placeholder={temaWarna.text}
              />
            </div>
          </FormField>

          <FormField label="Warna Latar" hint="Warna latar belakang">
            <div className="flex gap-2">
              <input
                type="color"
                value={backgroundColor}
                onChange={(e) => onBackgroundColorChange(e.target.value)}
                className="w-10 h-9 rounded-lg border border-hairline cursor-pointer shrink-0"
              />
              <StudioInput
                type="text"
                value={backgroundColor}
                onChange={(e) => onBackgroundColorChange(e.target.value)}
                placeholder={temaWarna.background}
              />
            </div>
          </FormField>
        </div>

        {/* Color Preview */}
        <div className="p-3 rounded-lg" style={{ backgroundColor }}>
          <div
            className="p-3 rounded-md"
            style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }}
          >
            <p className="text-ui-xs font-medium text-center" style={{ color: textColor }}>
              Preview Warna
            </p>
          </div>
        </div>
      </div>
    </SectionCard>
  )
}
