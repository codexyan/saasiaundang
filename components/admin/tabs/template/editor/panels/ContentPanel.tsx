'use client'

import {
  ChevronUp, ChevronDown, Palette, Layers, Sparkles, Plus, Trash2,
  GripVertical, Play, Check, Lock, Unlock, ImageIcon, Type,
} from 'lucide-react'
import ImageUploadField from '@/components/admin/ImageUploadField'
import SectionBackgroundControl from '@/components/controls/SectionBackgroundControl'
import SectionTransitionControl from '@/components/controls/SectionTransitionControl'
import VariantThumb from '../parts/VariantThumb'
import { SectionField, miniInput } from '../parts/fields'
import {
  SECTION_TYPES, SECTION_VARIANTS, SECTION_LABELS, GIFT_LAB_BRANDS, makeGiftAccount,
  HEADING_FONTS, BODY_FONTS,
} from '../parts/constants'
import { useEditor } from '../EditorContext'

/**
 * Tab "Konten" — daftar seksi undangan: urutan, aktif/nonaktif, varian gaya,
 * latar, transisi, dan field per jenis seksi.
 *
 * Panel terbesar, dan memang seharusnya: satu tempat untuk mengatur ke-16
 * jenis seksi yang bisa muncul di undangan.
 */
export default function ContentPanel() {
  const {
    cfg, sections, setPreviewMode, previewData, setPreviewData,
    sectionReplay, setSectionReplay, expandedSectionId, setExpandedSectionId,
    draggingSectionId, setDraggingSectionId, dragOverSectionId, setDragOverSectionId,
    lockedSectionIds, setLockedSectionIds, dragModeEnabled, setDragModeEnabled,
    updateSection, moveSection, addSection, removeSection, handleSectionDrop,
    withPreservedScroll,
  } = useEditor()

  return (
    <div className="space-y-2">
      {/* Section manager header */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">Atur section yang tampil, urutan, dan warna latar.</p>
        <button
          onClick={() => { setDragModeEnabled(!dragModeEnabled); if (dragModeEnabled) { setDraggingSectionId(null); setDragOverSectionId(null) } }}
          className={`flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg transition-all ${
            dragModeEnabled
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <GripVertical className="w-3 h-3" />
          {dragModeEnabled ? 'Selesai' : 'Susun Urutan'}
        </button>
      </div>

      {/* Section count summary */}
      <div className="flex items-center gap-3 px-3 py-2 bg-gray-50/80 rounded-lg border border-gray-100">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-[10px] text-gray-500">{sections.filter(s => s.enabled).length} aktif</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
          <span className="text-[10px] text-gray-500">{sections.filter(s => !s.enabled).length} nonaktif</span>
        </div>
        <span className="text-[10px] text-gray-300 ml-auto">{sections.length} total</span>
      </div>

      {sections.map((s, idx) => (
        <div
          key={s.id}
          draggable={dragModeEnabled && !lockedSectionIds.has(s.id)}
          onDragStart={() => { if (dragModeEnabled && !lockedSectionIds.has(s.id)) setDraggingSectionId(s.id) }}
          onDragOver={e => { e.preventDefault(); if (dragModeEnabled && !lockedSectionIds.has(s.id)) setDragOverSectionId(s.id) }}
          onDrop={() => handleSectionDrop(s.id)}
          onDragEnd={() => { setDraggingSectionId(null); setDragOverSectionId(null) }}
          className={`rounded-xl overflow-hidden transition-all ${
            !s.enabled ? 'opacity-50' : ''
          } ${
            draggingSectionId === s.id
              ? 'opacity-40 scale-[0.98] ring-2 ring-indigo-300 border border-indigo-200'
              : dragOverSectionId === s.id && draggingSectionId !== s.id
              ? 'ring-2 ring-indigo-200 border border-indigo-300'
              : expandedSectionId === s.id
              ? 'border border-indigo-200 shadow-sm'
              : 'border border-gray-100 hover:border-gray-200'
          }`}
        >
          {/* Section row header */}
          <div className={`flex items-center gap-2 px-3 py-2 transition-colors ${
            expandedSectionId === s.id ? 'bg-indigo-50/50' : 'bg-white hover:bg-gray-50/60'
          }`}>
            {/* Drag handle — only visible in drag mode */}
            {dragModeEnabled && (
              <div className={`shrink-0 transition-colors ${
                lockedSectionIds.has(s.id)
                  ? 'text-yellow-400 cursor-not-allowed'
                  : 'cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500'
              }`}>
                {lockedSectionIds.has(s.id)
                  ? <Lock className="w-3.5 h-3.5" />
                  : <GripVertical className="w-3.5 h-3.5" />
                }
              </div>
            )}

            {/* Order number badge */}
            <span className="shrink-0 w-5 h-5 rounded-md bg-gray-100 flex items-center justify-center text-[9px] font-bold text-gray-400 tabular-nums">
              {idx + 1}
            </span>

            {/* Background color swatch */}
            {s.background.type === 'color' ? (
              <input
                type="color"
                value={s.background.value ?? cfg.meta.color_scheme.primary}
                onChange={e => updateSection(s.id, { background: { ...s.background, value: e.target.value } })}
                className="w-5 h-5 rounded-md cursor-pointer border border-gray-200 shrink-0 p-0"
                title="Warna latar"
              />
            ) : (
              <div className="w-5 h-5 rounded-md border border-gray-200 shrink-0 flex items-center justify-center bg-gray-100"
                title={s.background.type === 'image' ? 'Latar: gambar' : 'Latar: video'}>
                <span className="text-[7px]">{s.background.type === 'image' ? '🖼' : '🎬'}</span>
              </div>
            )}

            {/* Section label */}
            <button
              onClick={() => setExpandedSectionId(expandedSectionId === s.id ? null : s.id)}
              className="flex-1 text-left min-w-0"
            >
              <span className={`text-[11px] font-semibold truncate block ${s.enabled ? 'text-gray-700' : 'text-gray-400'}`}>
                {SECTION_LABELS[s.type] ?? s.type}
              </span>
            </button>

            {/* Reorder arrows + lock — only in drag mode */}
            {dragModeEnabled && (
              <div className="flex items-center gap-0.5 shrink-0">
                <button onClick={() => moveSection(s.id, 'up')}
                  disabled={idx === 0 || lockedSectionIds.has(s.id) || (idx > 0 && lockedSectionIds.has(sections[idx - 1].id))}
                  className="p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-20 rounded">
                  <ChevronUp className="w-3 h-3" />
                </button>
                <button onClick={() => moveSection(s.id, 'down')}
                  disabled={idx === sections.length - 1 || lockedSectionIds.has(s.id) || (idx < sections.length - 1 && lockedSectionIds.has(sections[idx + 1].id))}
                  className="p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-20 rounded">
                  <ChevronDown className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setLockedSectionIds(prev => {
                    const next = new Set(prev)
                    next.has(s.id) ? next.delete(s.id) : next.add(s.id)
                    return next
                  })}
                  className={`p-0.5 rounded transition-colors ${lockedSectionIds.has(s.id) ? 'text-yellow-500' : 'text-gray-300 hover:text-gray-500'}`}
                  title={lockedSectionIds.has(s.id) ? 'Unlock posisi' : 'Lock posisi'}
                >
                  {lockedSectionIds.has(s.id) ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                </button>
              </div>
            )}

            {/* Visibility toggle switch */}
            <button
              onClick={() => updateSection(s.id, { enabled: !s.enabled })}
              className={`shrink-0 relative w-8 h-[18px] rounded-full transition-colors ${
                s.enabled ? 'bg-emerald-500' : 'bg-gray-200'
              }`}
              title={s.enabled ? 'Nonaktifkan' : 'Aktifkan'}
            >
              <span className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow-sm transition-transform ${
                s.enabled ? 'left-[16px]' : 'left-[2px]'
              }`} />
            </button>

            {/* Expand/collapse */}
            <button
              onClick={() => setExpandedSectionId(expandedSectionId === s.id ? null : s.id)}
              className={`shrink-0 p-1 rounded-lg transition-all ${
                expandedSectionId === s.id ? 'text-indigo-500 bg-indigo-100' : 'text-gray-300 hover:text-gray-500'
              }`}
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${expandedSectionId === s.id ? 'rotate-180' : ''}`} />
            </button>

            {/* Delete */}
            {s.type !== 'hero' && (
              <button onClick={() => removeSection(s.id)}
                className="shrink-0 p-1 text-gray-200 hover:text-red-400 rounded-lg transition-colors">
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Expanded controls */}
          {s.enabled && expandedSectionId === s.id && (
            <div className="bg-gray-50/30 border-t border-gray-100">

              {/* ── Gaya Tampilan ── */}
              {SECTION_VARIANTS[s.type] && (
                <div className="px-3.5 py-3 border-b border-gray-100">
                  <div className="flex items-center gap-1.5 mb-3">
                    <Palette className="w-3 h-3 text-indigo-400" />
                    <p className="text-[10px] font-bold text-gray-600">Gaya Tampilan</p>
                    <span className="text-[9px] text-gray-300 ml-auto">{SECTION_VARIANTS[s.type].length} varian</span>
                  </div>
                  <div className={`grid gap-2 ${s.type === 'hero' ? 'grid-cols-4' : 'grid-cols-3'}`}>
                    {SECTION_VARIANTS[s.type].map(v => {
                      const active = (s.style_variant ?? 'default') === v.value
                      return (
                        <button key={v.value}
                          onClick={() => withPreservedScroll(() => {
                            updateSection(s.id, { style_variant: v.value })
                            setPreviewMode('invitation')
                            setSectionReplay(p => ({ id: s.id, key: (p?.id === s.id ? p.key + 1 : 0) }))
                          })}
                          className={`group flex flex-col items-center gap-1.5 p-1.5 rounded-xl transition-all ${
                            active
                              ? 'bg-white border-2 border-indigo-500 shadow-sm shadow-indigo-100'
                              : 'bg-white/60 border-2 border-transparent hover:border-gray-200 hover:bg-white'
                          }`}
                          title={v.desc}
                        >
                          <div className={`overflow-hidden rounded-lg transition-all ${active ? 'ring-2 ring-indigo-200 ring-offset-1' : 'group-hover:ring-1 group-hover:ring-gray-200'}`}>
                            <VariantThumb type={s.type} variant={v.value} p={cfg.meta.color_scheme.primary} a={cfg.meta.color_scheme.accent} t={cfg.meta.color_scheme.text} />
                          </div>
                          <div className="text-center">
                            <p className={`text-[8px] font-bold ${active ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'}`}>{v.label}</p>
                          </div>
                          {active && (
                            <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-indigo-500 flex items-center justify-center">
                              <Check className="w-2 h-2 text-white" />
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* ── Latar Belakang ── */}
              <div className="px-3.5 py-3 border-b border-gray-100">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <ImageIcon className="w-3 h-3 text-indigo-400" />
                  <p className="text-[10px] font-bold text-gray-600">Latar Belakang</p>
                </div>
                <SectionBackgroundControl
                  value={s.background}
                  onChange={bg => updateSection(s.id, { background: bg })}
                  defaultColor={cfg.meta.color_scheme.primary}
                />
              </div>

              {/* ── Animasi Transisi ── */}
              <div className="px-3.5 py-3 border-b border-gray-100">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-indigo-400" />
                    <p className="text-[10px] font-bold text-gray-600">Animasi Transisi</p>
                  </div>
                  <button
                    onClick={() => { setPreviewMode('invitation'); setSectionReplay(p => ({ id: s.id, key: (p?.id === s.id ? p.key + 1 : 0) })) }}
                    className="flex items-center gap-1 text-[9px] font-semibold text-indigo-500 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-md transition-colors"
                  >
                    <Play className="w-2.5 h-2.5 fill-current" /> Preview
                  </button>
                </div>
                <SectionTransitionControl
                  valueIn={s.transition_in}
                  valueOut={s.transition_out}
                  onChangeIn={t => updateSection(s.id, { transition_in: t })}
                  onChangeOut={t => updateSection(s.id, { transition_out: t })}
                />
                {sectionReplay?.id === s.id && (
                  <p className="text-[9px] text-indigo-500 font-medium mt-2 flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                    Scroll di preview untuk lihat animasi
                  </p>
                )}
              </div>

              {/* Tipografi & Tata Letak.
                  Delapan field ini SUDAH dibaca SectionWrapper dan dipakai
                  template bawaan, tapi sebelumnya tidak punya satu pun kontrol:
                  admin bisa melihat efeknya di preview tanpa bisa mengubahnya. */}
              <div className="px-3.5 py-3 border-b border-gray-100">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <Type className="w-3 h-3 text-indigo-400" />
                  <p className="text-[10px] font-bold text-gray-600">Tipografi & Tata Letak</p>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-2.5">
                  <div>
                    <p className="text-[9px] font-semibold text-gray-400 mb-1">Rata Teks</p>
                    <div className="flex gap-1">
                      {([
                        { v: 'left',   label: 'Kiri' },
                        { v: 'center', label: 'Tengah' },
                        { v: 'right',  label: 'Kanan' },
                      ] as const).map(o => {
                        const on = (s.text_align ?? 'center') === o.v
                        return (
                          <button key={o.v}
                            onClick={() => updateSection(s.id, { text_align: o.v })}
                            className={`flex-1 py-1.5 rounded-lg text-[9px] font-semibold transition-colors ${
                              on ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}>
                            {o.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  <div>
                    <p className="text-[9px] font-semibold text-gray-400 mb-1">Tata Letak</p>
                    <select
                      value={s.content_layout ?? 'default'}
                      onChange={e => updateSection(s.id, { content_layout: e.target.value })}
                      className="w-full px-2 py-1.5 text-[10px] border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-gray-400"
                    >
                      <option value="default">Normal (terpusat)</option>
                      <option value="full-bleed">Full-bleed (tanpa margin)</option>
                      <option value="split-left">Split - konten kiri</option>
                      <option value="split-right">Split - konten kanan</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-2.5">
                  <div>
                    <p className="text-[9px] font-semibold text-gray-400 mb-1">Font Judul</p>
                    <select
                      value={s.font_heading ?? ''}
                      onChange={e => updateSection(s.id, { font_heading: e.target.value || undefined })}
                      className="w-full px-2 py-1.5 text-[10px] border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-gray-400"
                    >
                      <option value="">Ikut template ({cfg.meta.font.heading})</option>
                      {HEADING_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div>
                    <p className="text-[9px] font-semibold text-gray-400 mb-1">Font Teks</p>
                    <select
                      value={s.font_body ?? ''}
                      onChange={e => updateSection(s.id, { font_body: e.target.value || undefined })}
                      className="w-full px-2 py-1.5 text-[10px] border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-gray-400"
                    >
                      <option value="">Ikut template ({cfg.meta.font.body})</option>
                      {BODY_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                </div>

                {([
                  { key: 'heading_scale', label: 'Ukuran Judul', min: 0.7, max: 1.8, step: 0.05, def: 1 },
                  { key: 'body_scale',    label: 'Ukuran Teks',  min: 0.7, max: 1.5, step: 0.05, def: 1 },
                ] as const).map(r => (
                  <div key={r.key} className="flex items-center gap-2 mb-1.5">
                    <span className="text-[9px] font-semibold text-gray-400 w-20 shrink-0">{r.label}</span>
                    <input type="range" min={r.min} max={r.max} step={r.step}
                      value={s[r.key] ?? r.def}
                      onChange={e => updateSection(s.id, { [r.key]: Number(e.target.value) })}
                      className="flex-1 h-1.5 bg-gray-200 rounded-full accent-gray-900 cursor-pointer" />
                    <span className="text-[9px] font-mono text-gray-500 w-8 text-right shrink-0">
                      {(s[r.key] ?? r.def).toFixed(2)}
                    </span>
                  </div>
                ))}

                <div className="grid grid-cols-2 gap-2 mt-2.5">
                  {([
                    { key: 'heading_weight', label: 'Tebal Judul', opts: [300, 400, 500, 600, 700, 800, 900], def: 700 },
                    { key: 'body_weight',    label: 'Tebal Teks',  opts: [300, 400, 500, 600, 700],           def: 400 },
                  ] as const).map(w => (
                    <div key={w.key}>
                      <p className="text-[9px] font-semibold text-gray-400 mb-1">{w.label}</p>
                      <select
                        value={s[w.key] ?? w.def}
                        onChange={e => updateSection(s.id, { [w.key]: Number(e.target.value) })}
                        className="w-full px-2 py-1.5 text-[10px] border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-gray-400"
                      >
                        {w.opts.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Konten Section ── */}
              <div className="px-3.5 py-3">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Layers className="w-3 h-3 text-indigo-400" />
                  <p className="text-[10px] font-bold text-gray-600">Konten & Foto</p>
                </div>
                {/* Peringatan yang selama ini tidak ada.
                    Sebagian besar isian di bawah menulis ke `previewData` —
                    data contoh untuk mockup — BUKAN ke konfigurasi template,
                    dan tidak pernah ikut tersimpan. Tanpa keterangan ini
                    labelnya ("Nama Lengkap Pria", "Tanggal", "Alamat") terbaca
                    seolah sedang menyetel nilai bawaan template. */}
                <p className="text-[9px] text-gray-400 leading-relaxed mb-2.5 bg-gray-50 border border-gray-100 rounded-lg px-2 py-1.5">
                  Isian di bawah hanya <strong className="text-gray-500">data contoh untuk pratinjau</strong> —
                  tidak ikut tersimpan ke template. Yang tersimpan adalah pengaturan
                  gaya, latar, animasi, dan tipografi di atas.
                </p>

                {/* HERO */}
                {s.type === 'hero' && (
                  <div className="space-y-4">

                    {/* Brand mark iaundang   otomatis, tidak bisa diupload */}
                    <div className="bg-white rounded-xl border border-gray-200 p-3 space-y-2.5">
                      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Logo iaundang</p>
                      <div className="flex items-center gap-3">
                        <div className="shrink-0 w-12 h-12 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                          <img src="/logos/icons.png" alt="logo iaundang" className="w-9 h-9 object-contain" />
                        </div>
                        <p className="text-[9px] text-gray-500 leading-relaxed flex-1">
                          Logo iaundang ditampilkan otomatis di Hero. Tidak bisa diganti dengan upload sendiri.
                        </p>
                      </div>
                      {/* Ukuran brand mark tetap bisa diatur */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-[9px] text-gray-400 font-medium">Ukuran</p>
                          <span className="text-[9px] font-bold text-gray-600 tabular-nums">{s.hero_icon_size ?? 40}px</span>
                        </div>
                        <input type="range" min={20} max={80} step={2}
                          value={s.hero_icon_size ?? 40}
                          onChange={e => updateSection(s.id, { hero_icon_size: Number(e.target.value) })}
                          className="w-full h-1.5 accent-indigo-500 rounded-full" />
                      </div>
                    </div>

                    {/* Nama & konten */}
                    <div className="bg-white rounded-xl border border-gray-200 p-3 space-y-2.5">
                      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Data Utama</p>
                      <div className="grid grid-cols-2 gap-2">
                        <SectionField label="Nama Lengkap Pria">
                          <input className={miniInput} value={previewData.groom_name} onChange={e => setPreviewData(d => ({ ...d, groom_name: e.target.value }))} />
                        </SectionField>
                        <SectionField label="Nama Lengkap Wanita">
                          <input className={miniInput} value={previewData.bride_name} onChange={e => setPreviewData(d => ({ ...d, bride_name: e.target.value }))} />
                        </SectionField>
                      </div>
                      <SectionField label="Tagline / Ayat">
                        <textarea className={miniInput + ' resize-none'} rows={2} value={previewData.tagline ?? ''} onChange={e => setPreviewData(d => ({ ...d, tagline: e.target.value }))} />
                      </SectionField>
                      <SectionField label="Foto Background">
                        <ImageUploadField value={previewData.couple_photo_url} onChange={url => setPreviewData(d => ({ ...d, couple_photo_url: url }))} />
                      </SectionField>
                    </div>

                    {/* Bismillah */}
                    <div className="bg-white rounded-xl border border-gray-200 p-3 space-y-2">
                      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Bismillah</p>
                      <div className="flex gap-1 bg-gray-100 p-0.5 rounded-lg">
                        {([['none','Tanpa'],['text','Teks'],['arabic','Arab']] as const).map(([v,lbl]) => (
                          <button key={v} type="button"
                            onClick={() => updateSection(s.id, { hero_bismillah: v })}
                            className={`flex-1 py-1.5 rounded-md text-[10px] font-semibold transition-all ${(s.hero_bismillah ?? 'text') === v ? 'bg-white text-gray-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                            {lbl}
                          </button>
                        ))}
                      </div>
                      {(s.hero_bismillah === 'text' || !s.hero_bismillah) && (
                        <SectionField label="Teks Kustom (kosong = default)">
                          <input className={miniInput} value={s.hero_bismillah_custom ?? ''} placeholder="Bismillahirrahmanirrahim"
                            onChange={e => updateSection(s.id, { hero_bismillah_custom: e.target.value || undefined })} />
                        </SectionField>
                      )}
                      {s.hero_bismillah === 'arabic' && (
                        <p className="text-[9px] text-gray-400 italic">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ + transliterasi</p>
                      )}
                    </div>

                    {/* Tipografi */}
                    <div className="bg-white rounded-xl border border-gray-200 p-3">
                      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-2">Ukuran Font (px)</p>
                      <div className="grid grid-cols-4 gap-2">
                        {([
                          ['Nama', 'hero_title_size', 36],
                          ['&', 'hero_and_size', 22],
                          ['Tagline', 'hero_tagline_size', 11],
                          ['Label', 'hero_label_size', 9],
                        ] as const).map(([lbl, key, def]) => (
                          <div key={key}>
                            <p className="text-[8px] text-gray-400 text-center mb-1">{lbl}</p>
                            <input type="number" min={6} max={120} step={1}
                              className="w-full text-[11px] text-center px-1.5 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 bg-white font-mono"
                              value={s[key] ?? def}
                              onChange={e => updateSection(s.id, { [key]: Number(e.target.value) })} />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Animasi Hero */}
                    <div className="bg-white rounded-xl border border-gray-200 p-3">
                      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-2">Animasi</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-[9px] text-gray-400 font-medium">Durasi</p>
                            <span className="text-[9px] font-bold text-gray-600 tabular-nums">{s.hero_anim_duration ?? 0.8}s</span>
                          </div>
                          <input type="range" min={0.2} max={2.0} step={0.1}
                            value={s.hero_anim_duration ?? 0.8}
                            onChange={e => updateSection(s.id, { hero_anim_duration: Number(e.target.value) })}
                            className="w-full h-1.5 accent-indigo-500 rounded-full" />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-[9px] text-gray-400 font-medium">Jeda</p>
                            <span className="text-[9px] font-bold text-gray-600 tabular-nums">{s.hero_anim_stagger ?? 0.15}s</span>
                          </div>
                          <input type="range" min={0} max={0.5} step={0.05}
                            value={s.hero_anim_stagger ?? 0.15}
                            onChange={e => updateSection(s.id, { hero_anim_stagger: Number(e.target.value) })}
                            className="w-full h-1.5 accent-indigo-500 rounded-full" />
                        </div>
                      </div>
                    </div>

                    {/* Layout Hero */}
                    <div className="bg-white rounded-xl border border-gray-200 p-3">
                      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-2">Layout</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-[9px] text-gray-400 font-medium mb-1">Padding Atas</p>
                          <input type="number" min={0} max={200} step={4}
                            className="w-full text-[11px] text-center px-2 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 bg-white font-mono"
                            value={s.hero_padding_top ?? 0}
                            onChange={e => updateSection(s.id, { hero_padding_top: Number(e.target.value) })} />
                        </div>
                        <div>
                          <p className="text-[9px] text-gray-400 font-medium mb-1">Padding Bawah</p>
                          <input type="number" min={0} max={200} step={4}
                            className="w-full text-[11px] text-center px-2 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 bg-white font-mono"
                            value={s.hero_padding_bottom ?? 0}
                            onChange={e => updateSection(s.id, { hero_padding_bottom: Number(e.target.value) })} />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-[9px] text-gray-400 font-medium">Overlay</p>
                            <span className="text-[9px] font-bold text-gray-600 tabular-nums">{Math.round((s.hero_overlay ?? 0.52) * 100)}%</span>
                          </div>
                          <input type="range" min={0} max={0.95} step={0.05}
                            value={s.hero_overlay ?? 0.52}
                            onChange={e => updateSection(s.id, { hero_overlay: Number(e.target.value) })}
                            className="w-full h-1.5 accent-indigo-500 rounded-full" />
                        </div>
                        <div className="flex flex-col gap-2 pt-0.5">
                          <label className="flex items-center gap-2 cursor-pointer group">
                            <span className={`relative w-7 h-4 rounded-full transition-colors ${s.hero_show_scroll !== false ? 'bg-indigo-500' : 'bg-gray-200'}`}>
                              <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-transform ${s.hero_show_scroll !== false ? 'left-[14px]' : 'left-0.5'}`} />
                            </span>
                            <input type="checkbox" className="sr-only" checked={s.hero_show_scroll !== false}
                              onChange={e => updateSection(s.id, { hero_show_scroll: e.target.checked })} />
                            <span className="text-[9px] text-gray-500 group-hover:text-gray-700">Scroll indicator</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer group">
                            <span className={`relative w-7 h-4 rounded-full transition-colors ${s.hero_text_shadow !== false ? 'bg-indigo-500' : 'bg-gray-200'}`}>
                              <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-transform ${s.hero_text_shadow !== false ? 'left-[14px]' : 'left-0.5'}`} />
                            </span>
                            <input type="checkbox" className="sr-only" checked={s.hero_text_shadow !== false}
                              onChange={e => updateSection(s.id, { hero_text_shadow: e.target.checked })} />
                            <span className="text-[9px] text-gray-500 group-hover:text-gray-700">Text shadow</span>
                          </label>
                        </div>
                      </div>
                    </div>

                  </div>
                )}

                {/* PROFILES */}
                {s.type === 'profiles' && (
                  <div className="space-y-3">
                    <div className="bg-white rounded-xl border border-indigo-100 p-3 space-y-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-blue-100 flex items-center justify-center text-[9px] font-bold text-blue-600">P</span>
                        <p className="text-[10px] font-bold text-gray-600">Mempelai Pria</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <SectionField label="Nama Lengkap"><input className={miniInput} value={previewData.groom_name} onChange={e => setPreviewData(d => ({ ...d, groom_name: e.target.value }))} /></SectionField>
                        <SectionField label="Panggilan"><input className={miniInput} value={previewData.groom_nickname ?? ''} placeholder="Opsional" onChange={e => setPreviewData(d => ({ ...d, groom_nickname: e.target.value || undefined }))} /></SectionField>
                      </div>
                      <SectionField label="Orang Tua"><input className={miniInput} value={previewData.groom_parents ?? ''} placeholder="Bpk. ... & Ibu ..." onChange={e => setPreviewData(d => ({ ...d, groom_parents: e.target.value }))} /></SectionField>
                      <SectionField label="Bio Singkat"><input className={miniInput} value={previewData.groom_bio ?? ''} placeholder="Profesi, usia, dll" onChange={e => setPreviewData(d => ({ ...d, groom_bio: e.target.value }))} /></SectionField>
                      <SectionField label="Foto Profil"><ImageUploadField value={previewData.groom_photo_url} onChange={url => setPreviewData(d => ({ ...d, groom_photo_url: url }))} /></SectionField>
                    </div>
                    <div className="bg-white rounded-xl border border-indigo-100 p-3 space-y-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-rose-100 flex items-center justify-center text-[9px] font-bold text-rose-600">W</span>
                        <p className="text-[10px] font-bold text-gray-600">Mempelai Wanita</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <SectionField label="Nama Lengkap"><input className={miniInput} value={previewData.bride_name} onChange={e => setPreviewData(d => ({ ...d, bride_name: e.target.value }))} /></SectionField>
                        <SectionField label="Panggilan"><input className={miniInput} value={previewData.bride_nickname ?? ''} placeholder="Opsional" onChange={e => setPreviewData(d => ({ ...d, bride_nickname: e.target.value || undefined }))} /></SectionField>
                      </div>
                      <SectionField label="Orang Tua"><input className={miniInput} value={previewData.bride_parents ?? ''} placeholder="Bpk. ... & Ibu ..." onChange={e => setPreviewData(d => ({ ...d, bride_parents: e.target.value }))} /></SectionField>
                      <SectionField label="Bio Singkat"><input className={miniInput} value={previewData.bride_bio ?? ''} placeholder="Profesi, usia, dll" onChange={e => setPreviewData(d => ({ ...d, bride_bio: e.target.value }))} /></SectionField>
                      <SectionField label="Foto Profil"><ImageUploadField value={previewData.bride_photo_url} onChange={url => setPreviewData(d => ({ ...d, bride_photo_url: url }))} /></SectionField>
                    </div>
                  </div>
                )}

                {/* STORY */}
                {s.type === 'story' && (
                  <div className="bg-white rounded-xl border border-gray-200 p-3 space-y-2.5">
                    <SectionField label="Judul Kisah"><input className={miniInput} value={previewData.story_title ?? ''} onChange={e => setPreviewData(d => ({ ...d, story_title: e.target.value }))} /></SectionField>
                    <SectionField label="Teks Kisah"><textarea className={miniInput + ' resize-none'} rows={3} value={previewData.story_text ?? ''} onChange={e => setPreviewData(d => ({ ...d, story_text: e.target.value }))} /></SectionField>
                    <SectionField label="Foto"><ImageUploadField value={previewData.couple_photo_url} onChange={url => setPreviewData(d => ({ ...d, couple_photo_url: url }))} /></SectionField>
                  </div>
                )}

                {/* EVENTS */}
                {s.type === 'events' && (
                  <div className="space-y-3">
                    <div className="bg-white rounded-xl border border-indigo-100 p-3 space-y-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-amber-100 flex items-center justify-center text-[9px] font-bold text-amber-700">A</span>
                        <p className="text-[10px] font-bold text-gray-600">Akad Nikah</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <SectionField label="Tanggal">
                          <input type="date" className={miniInput} value={previewData.akad?.date ?? ''}
                            onChange={e => setPreviewData(d => ({ ...d, akad: { ...d.akad!, date: e.target.value } }))} />
                        </SectionField>
                        <SectionField label="Jam">
                          <input type="time" className={miniInput} value={previewData.akad?.time ?? ''}
                            onChange={e => setPreviewData(d => ({ ...d, akad: { ...d.akad!, time: e.target.value } }))} />
                        </SectionField>
                      </div>
                      <SectionField label="Nama Tempat">
                        <input className={miniInput} placeholder="Masjid Al-Ikhlas" value={previewData.akad?.venue_name ?? ''}
                          onChange={e => setPreviewData(d => ({ ...d, akad: { ...d.akad!, venue_name: e.target.value } }))} />
                      </SectionField>
                      <SectionField label="Alamat">
                        <textarea className={miniInput + ' resize-none'} rows={2} placeholder="Jl. Mawar No. 12..."
                          value={previewData.akad?.venue_address ?? ''}
                          onChange={e => setPreviewData(d => ({ ...d, akad: { ...d.akad!, venue_address: e.target.value } }))} />
                      </SectionField>
                      <SectionField label="Google Maps URL">
                        <input className={miniInput} placeholder="https://maps.app.goo.gl/..."
                          value={previewData.akad?.maps_url ?? ''}
                          onChange={e => setPreviewData(d => ({ ...d, akad: { ...d.akad!, maps_url: e.target.value || undefined } }))} />
                      </SectionField>
                      <SectionField label="Foto Lokasi">
                        <ImageUploadField value={previewData.akad?.venue_photo_url}
                          onChange={url => setPreviewData(d => ({ ...d, akad: { ...d.akad!, venue_photo_url: url } }))} hint="Foto masjid/gedung" />
                      </SectionField>
                    </div>

                    <div className="bg-white rounded-xl border border-indigo-100 p-3 space-y-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-emerald-100 flex items-center justify-center text-[9px] font-bold text-emerald-700">R</span>
                        <p className="text-[10px] font-bold text-gray-600">Resepsi</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <SectionField label="Tanggal">
                          <input type="date" className={miniInput} value={previewData.resepsi?.date ?? ''}
                            onChange={e => setPreviewData(d => ({ ...d, resepsi: { ...d.resepsi!, date: e.target.value } }))} />
                        </SectionField>
                        <SectionField label="Jam">
                          <input type="time" className={miniInput} value={previewData.resepsi?.time ?? ''}
                            onChange={e => setPreviewData(d => ({ ...d, resepsi: { ...d.resepsi!, time: e.target.value } }))} />
                        </SectionField>
                      </div>
                      <SectionField label="Nama Tempat">
                        <input className={miniInput} placeholder="Ballroom Grand Hotel" value={previewData.resepsi?.venue_name ?? ''}
                          onChange={e => setPreviewData(d => ({ ...d, resepsi: { ...d.resepsi!, venue_name: e.target.value } }))} />
                      </SectionField>
                      <SectionField label="Alamat">
                        <textarea className={miniInput + ' resize-none'} rows={2} placeholder="Jl. Sudirman No. 86..."
                          value={previewData.resepsi?.venue_address ?? ''}
                          onChange={e => setPreviewData(d => ({ ...d, resepsi: { ...d.resepsi!, venue_address: e.target.value } }))} />
                      </SectionField>
                      <SectionField label="Google Maps URL">
                        <input className={miniInput} placeholder="https://maps.app.goo.gl/..."
                          value={previewData.resepsi?.maps_url ?? ''}
                          onChange={e => setPreviewData(d => ({ ...d, resepsi: { ...d.resepsi!, maps_url: e.target.value || undefined } }))} />
                      </SectionField>
                      <SectionField label="Foto Lokasi">
                        <ImageUploadField value={previewData.resepsi?.venue_photo_url}
                          onChange={url => setPreviewData(d => ({ ...d, resepsi: { ...d.resepsi!, venue_photo_url: url } }))} hint="Foto ballroom/gedung" />
                      </SectionField>
                    </div>
                  </div>
                )}

                {/* COUNTDOWN */}
                {s.type === 'countdown' && (
                  <div className="bg-white rounded-xl border border-gray-200 p-3 space-y-2.5">
                    <div className="grid grid-cols-2 gap-2">
                      <SectionField label="Tanggal Akad"><input type="date" className={miniInput} value={previewData.akad?.date ?? ''} onChange={e => setPreviewData(d => ({ ...d, akad: { ...d.akad!, date: e.target.value } }))} /></SectionField>
                      <SectionField label="Jam"><input className={miniInput} placeholder="08:00" value={previewData.akad?.time ?? ''} onChange={e => setPreviewData(d => ({ ...d, akad: { ...d.akad!, time: e.target.value } }))} /></SectionField>
                    </div>
                  </div>
                )}

                {/* CLOSING */}
                {s.type === 'closing' && (
                  <div className="bg-white rounded-xl border border-gray-200 p-3 space-y-2.5">
                    <SectionField label="Teks Penutup"><textarea className={miniInput + ' resize-none'} rows={3} value={previewData.closing_text ?? ''} onChange={e => setPreviewData(d => ({ ...d, closing_text: e.target.value }))} /></SectionField>
                    <SectionField label="Ucapan Terima Kasih"><input className={miniInput} value={previewData.thank_you_message ?? ''} onChange={e => setPreviewData(d => ({ ...d, thank_you_message: e.target.value }))} /></SectionField>
                  </div>
                )}

                {/* GIFT */}
                {s.type === 'gift' && (() => {
                  const activeSet = new Set(
                    (previewData.gift_accounts ?? []).map(a => a.type === 'bank' ? a.bank : a.platform)
                  )
                  const MAX_GIFT = 3
                  function toggleProvider(name: string) {
                    const b = GIFT_LAB_BRANDS[name]; if (!b) return
                    const cur = previewData.gift_accounts ?? []
                    if (activeSet.has(name)) {
                      setPreviewData(d => ({ ...d, gift_accounts: cur.filter(a => (a.type === 'bank' ? a.bank : a.platform) !== name) }))
                    } else {
                      if (cur.length >= MAX_GIFT) return
                      setPreviewData(d => ({ ...d, gift_accounts: [...cur, makeGiftAccount(name, b)] }))
                    }
                  }
                  return (
                    <div className="space-y-3">

                      {/* Provider preview picker */}
                      <div className="bg-white rounded-xl border border-gray-200 p-3 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Provider</p>
                          <div className="flex gap-2">
                            <button type="button"
                              onClick={() => setPreviewData(d => ({ ...d, gift_accounts: Object.entries(GIFT_LAB_BRANDS).slice(0, MAX_GIFT).map(([n, b]) => makeGiftAccount(n, b)) }))}
                              className="text-[8px] font-semibold text-indigo-500 hover:text-indigo-700 transition-colors">
                              Maks 3
                            </button>
                            <button type="button"
                              onClick={() => setPreviewData(d => ({ ...d, gift_accounts: [] }))}
                              className="text-[8px] font-semibold text-gray-400 hover:text-red-400 transition-colors">
                              Reset
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-5 gap-1.5">
                          {Object.entries(GIFT_LAB_BRANDS).map(([name, b]) => {
                            const active = activeSet.has(name)
                            const atMax = !active && activeSet.size >= MAX_GIFT
                            return (
                              <button key={name} type="button" onClick={() => toggleProvider(name)}
                                title={atMax ? `Maks ${MAX_GIFT} provider` : name}
                                disabled={atMax}
                                className="relative overflow-hidden rounded-lg transition-all disabled:cursor-not-allowed"
                                style={{
                                  background: `linear-gradient(135deg, ${b.g[0]}, ${b.g[1]})`,
                                  aspectRatio: '1 / 1',
                                  boxShadow: active ? `0 0 0 2px white, 0 0 0 3.5px ${b.g[0]}` : `0 1px 4px ${b.g[0]}44`,
                                  opacity: active ? 1 : atMax ? 0.2 : 0.45,
                                  transform: active ? 'scale(1)' : 'scale(0.93)',
                                  transition: 'all 0.15s ease',
                                }}>
                                <div className="absolute inset-0 flex items-center justify-center p-1">
                                  <img src={b.logo} alt={name}
                                    style={{ height: 13, width: 'auto', maxWidth: '90%', objectFit: 'contain', filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.35))' }} />
                                </div>
                                {active && (
                                  <div className="absolute top-0.5 right-0.5 w-3 h-3 rounded-full bg-white flex items-center justify-center">
                                    <svg width="6" height="6" viewBox="0 0 10 10" fill="none">
                                      <path d="M2 5l2.5 2.5L8 2.5" stroke={b.g[0]} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  </div>
                                )}
                              </button>
                            )
                          })}
                        </div>
                        <p className="text-[7px] text-gray-400">Klik untuk tampilkan / sembunyikan di preview (maks {MAX_GIFT})</p>
                      </div>

                      {/* Toggles */}
                      <div className="bg-white rounded-xl border border-gray-200 p-3 space-y-2.5">
                        {([
                          ['gift_show_logo',    'Logo Brand',           'Tampilkan logo pada kartu'],
                          ['gift_proof_enabled','Upload Bukti Transfer', 'Tombol & form kirim bukti'],
                        ] as const).map(([key, label, desc]) => (
                          <div key={key} className="flex items-center justify-between">
                            <div>
                              <p className="text-[10px] font-semibold text-gray-600">{label}</p>
                              <p className="text-[8px] text-gray-400">{desc}</p>
                            </div>
                            <button type="button"
                              onClick={() => updateSection(s.id, { [key]: !(s[key] ?? true) })}
                              className={`relative w-8 h-[18px] rounded-full transition-colors ${(s[key] ?? true) ? 'bg-indigo-500' : 'bg-gray-200'}`}>
                              <span className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow-sm transition-transform ${(s[key] ?? true) ? 'left-[16px]' : 'left-[2px]'}`} />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Thank you text */}
                      {(s.gift_proof_enabled ?? true) && (
                        <div className="bg-white rounded-xl border border-gray-200 p-3 space-y-1.5">
                          <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Pesan Terima Kasih</p>
                          <textarea
                            value={s.gift_thankyou_text ?? ''}
                            onChange={e => updateSection(s.id, { gift_thankyou_text: e.target.value || undefined })}
                            className={miniInput + ' resize-none'}
                            rows={3}
                            placeholder="Terima kasih telah memberikan hadiah... (kosong = pesan default)" />
                        </div>
                      )}

                    </div>
                  )
                })()}

                {!['hero','profiles','story','events','countdown','closing','gift'].includes(s.type) && (
                  <div className="bg-white rounded-xl border border-gray-200 p-3">
                    <p className="text-[9px] text-gray-400">Konten section ini diisi oleh user saat membuat undangan.</p>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      ))}

      {/* Add section */}
      <div className="pt-3 mt-1 border-t border-gray-100">
        <div className="flex items-center gap-1.5 mb-2.5">
          <Plus className="w-3 h-3 text-gray-400" />
          <p className="text-[10px] font-bold text-gray-500">Tambah Section</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {SECTION_TYPES.filter(t => !sections.find(s => s.type === t)).map(t => (
            <button
              key={t}
              onClick={() => addSection(t)}
              className="flex items-center gap-1 text-[10px] font-medium bg-white border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 text-gray-500 px-2.5 py-1.5 rounded-lg transition-all"
            >
              <Plus className="w-2.5 h-2.5" />
              {SECTION_LABELS[t] ?? t}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
