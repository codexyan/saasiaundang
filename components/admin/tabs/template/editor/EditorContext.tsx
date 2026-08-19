'use client'

import { createContext, useContext } from 'react'
import type { Dispatch, SetStateAction, MutableRefObject } from 'react'
import type {
  TemplateRecord, TemplateMeta, ColorScheme, OpeningConfig, MusicConfig,
  JsonTemplateConfig, SectionConfig, NewInvitationData, TemplateCategory,
} from '@/lib/types'

export interface MusicLibraryEntry {
  id: string
  title: string
  artist: string
  category: string
  url: string
  /** Trek nonaktif tetap ditampilkan di editor — kalau disembunyikan, template
   *  yang terlanjur memakainya akan kehilangan pilihannya tanpa penjelasan.
   *  Yang dilakukan panel adalah MENANDAI, bukan menyaring. */
  is_active: boolean
  duration: number
}

export interface PaletteOption {
  name: string
  cat: string
  /** primary */ p: string
  /** accent  */ a: string
  /** text    */ t: string
  /** background */ bg: string
}

/**
 * Segala sesuatu yang dibutuhkan panel editor.
 *
 * Kenapa context dan bukan props: kelima panel dulu adalah blok JSX sepanjang
 * 200–850 baris yang menumpang di dalam satu komponen 4.000 baris, dan
 * masing-masing menyentuh 10–25 binding dari lingkup induk. Menurunkannya
 * lewat props berarti lima daftar prop panjang yang harus diperbarui serempak
 * tiap kali satu panel butuh satu binding baru — persis jenis gesekan yang
 * dulu membuat orang memilih menambah kode ke dalam berkas raksasa itu.
 *
 * Aman terhadap render: hanya SATU panel yang ter-mount pada satu waktu
 * (dipilih tab), jadi nilai context yang dibuat ulang tiap render tidak
 * menyebarkan render ke mana-mana.
 */
export interface EditorContextValue {
  //  Data template
  /** Record dari server: identitas, status, harga. Baca saja di panel. */
  record: TemplateRecord
  /** Record yang sedang digarap (identitas + config draf). */
  config: TemplateRecord
  setConfig: Dispatch<SetStateAction<TemplateRecord>>
  /** Pintasan ke `config.config` — dipakai di hampir setiap baris panel. */
  cfg: JsonTemplateConfig
  /** Seksi terurut menurut `order`. */
  sections: SectionConfig[]
  /** Config musik lengkap dengan nilai default terisi. */
  musicCfg: MusicConfig
  categories: TemplateCategory[]
  palettes: PaletteOption[]
  paletteGroups: string[]

  //  Updater config
  updateMeta: (patch: Partial<TemplateMeta>) => void
  updateColors: (key: keyof ColorScheme, val: string) => void
  updateFont: (key: 'heading' | 'body', val: string) => void
  updateOpening: (patch: Partial<OpeningConfig>) => void
  updateMusic: (patch: Partial<MusicConfig>) => void
  updateSection: (sectionId: string, patch: Record<string, unknown>) => void
  moveSection: (sectionId: string, dir: 'up' | 'down') => void
  addSection: (type: string) => void
  removeSection: (sectionId: string) => void
  handleSectionDrop: (targetId: string) => void

  //  Pratinjau
  previewMode: 'invitation' | 'opening' | 'loading'
  setPreviewMode: Dispatch<SetStateAction<'invitation' | 'opening' | 'loading'>>
  previewData: NewInvitationData
  setPreviewData: Dispatch<SetStateAction<NewInvitationData>>
  previewGuestName: string
  setPreviewGuestName: Dispatch<SetStateAction<string>>
  /** Naikkan untuk memaksa pratinjau undangan me-mount ulang. */
  setPreviewKey: Dispatch<SetStateAction<number>>
  /** Naikkan untuk memutar ulang animasi opening/dekorasi. */
  setDecorPreviewKey: Dispatch<SetStateAction<number>>
  previewKey: number
  previewPlaying: boolean
  setPreviewPlaying: Dispatch<SetStateAction<boolean>>
  previewLoading: boolean
  setPreviewLoading: Dispatch<SetStateAction<boolean>>
  decorPreviewKey: number
  showFullscreen: boolean
  setShowFullscreen: Dispatch<SetStateAction<boolean>>
  sectionReplay: { id: string; key: number } | null
  setSectionReplay: Dispatch<SetStateAction<{ id: string; key: number } | null>>

  //  Daftar seksi (tab Konten)
  expandedSectionId: string | null
  setExpandedSectionId: Dispatch<SetStateAction<string | null>>
  draggingSectionId: string | null
  setDraggingSectionId: Dispatch<SetStateAction<string | null>>
  dragOverSectionId: string | null
  setDragOverSectionId: Dispatch<SetStateAction<string | null>>
  lockedSectionIds: Set<string>
  setLockedSectionIds: Dispatch<SetStateAction<Set<string>>>
  dragModeEnabled: boolean
  setDragModeEnabled: Dispatch<SetStateAction<boolean>>

  //  Dekorasi
  decorScope: 'opening' | string
  setDecorScope: Dispatch<SetStateAction<'opening' | string>>
  decorEditMode: boolean
  setDecorEditMode: Dispatch<SetStateAction<boolean>>
  selectedAssetId: string | null
  setSelectedAssetId: Dispatch<SetStateAction<string | null>>

  //  Perpustakaan musik (dibaca dari /api/admin/music)
  musicLibrary: MusicLibraryEntry[]
  musicLibraryCats: string[]
  musicLibraryCat: string
  setMusicLibraryCat: Dispatch<SetStateAction<string>>
  musicPreviewId: string | null
  setMusicPreviewId: Dispatch<SetStateAction<string | null>>
  musicAudioRef: MutableRefObject<HTMLAudioElement | null>
  toggleMusicPreview: (songId: string, songUrl: string) => void

  //  Riwayat
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean

  /** Jalankan `fn` tanpa membuat panel melompat ke atas.
   *
   *  Mengganti varian gaya seksi mengubah tinggi isi panel, dan tanpa ini
   *  daftar seksi melompat — admin kehilangan tempat setelah tiap klik.
   *  Kontainer yang di-scroll milik kerangka editor, jadi panel tidak perlu
   *  (dan tidak bisa) memegang ref-nya sendiri. */
  withPreservedScroll: (fn: () => void) => void
}

const EditorContext = createContext<EditorContextValue | null>(null)

export const EditorProvider = EditorContext.Provider

/**
 * Melempar (bukan mengembalikan null) kalau dipakai di luar provider: panel
 * yang lupa dibungkus akan gagal seketika dengan pesan jelas, bukan menyebar
 * jadi belasan "cannot read property of null" di baris acak.
 */
export function useEditor(): EditorContextValue {
  const ctx = useContext(EditorContext)
  if (!ctx) throw new Error('Panel editor harus berada di dalam <EditorProvider>')
  return ctx
}
