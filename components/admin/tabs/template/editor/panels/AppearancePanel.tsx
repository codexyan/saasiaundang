'use client'

import toast from 'react-hot-toast'
import { ChevronDown, X, Check, Upload } from 'lucide-react'
import { checkColorScheme, autoFixColorScheme, contrastRatio, wcagLevel, wcagLevelLarge } from '@/lib/color-contrast'
import { getComponentStyle, btnStyle, cardRadius, inputBorderStyle } from '@/lib/component-styles'
import { inputCls } from '../parts/fields'
import { HEADING_FONTS, BODY_FONTS } from '../parts/constants'
import { useEditor } from '../EditorContext'

/**
 * Tab "Tampilan" — warna, palet, tipografi, dan gaya komponen.
 *
 * Termasuk pemeriksa kontras WCAG: kombinasi warna yang gagal ditandai di sini
 * supaya tidak lolos ke undangan yang sudah dicetak jadi tautan ke tamu.
 */
export default function AppearancePanel() {
  const {
    cfg, palettes: paletteList, paletteGroups, previewMode, setPreviewMode, previewData,
    setPreviewKey, setDecorPreviewKey, updateMeta, updateColors, updateFont,
  } = useEditor()

  const _a = cfg.meta.color_scheme.accent
  const _t = cfg.meta.color_scheme.text
  const _p = cfg.meta.color_scheme.primary
  const _cs = cfg.meta.component_style
  const _brd = _cs?.border ?? 'sharp'
  const _br = _brd === 'pill' ? 999 : _brd === 'rounded' ? 10 : 2
  const _updateStyle = (patch: Record<string, string>) => {
    updateMeta({ component_style: { button: _cs?.button ?? 'outlined', border: _cs?.border ?? 'sharp', ornament: _cs?.ornament ?? 'classic', ...patch } as any })
    setPreviewKey(k => k + 1)
    setDecorPreviewKey(k => k + 1)
  }

  return (
    <div className="space-y-5">

      {/* Diagram visual: warna dipakai di mana */}
      <div>
        <p className="text-[10px] font-semibold text-gray-500 mb-2">Penerapan Warna</p>
        <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
          {/* Header = primary */}
          <div className="relative px-4 pt-4 pb-3"
            style={{ backgroundColor: cfg.meta.color_scheme.primary, color: cfg.meta.color_scheme.text }}>
            <div className="absolute top-1.5 right-2 text-[8px] font-bold px-1.5 py-0.5 rounded"
              style={{ backgroundColor: `${cfg.meta.color_scheme.accent}33`, color: cfg.meta.color_scheme.accent }}>
              PRIMER
            </div>
            <p className="text-[9px] opacity-60 mb-0.5" style={{ fontFamily: `'${cfg.meta.font.body}', serif` }}>
              Bismillahirrahmanirrahim
            </p>
            <p className="text-lg font-bold leading-tight" style={{ fontFamily: `'${cfg.meta.font.heading}', serif` }}>
              Ikhwal &amp; Fani
            </p>
            {/* Accent line */}
            <div className="mt-2 h-0.5 w-12 rounded" style={{ backgroundColor: cfg.meta.color_scheme.accent }}>
            </div>
            <div className="absolute bottom-2 right-2 text-[8px] font-bold px-1.5 py-0.5 rounded"
              style={{ backgroundColor: `${cfg.meta.color_scheme.accent}33`, color: cfg.meta.color_scheme.accent }}>
              AKSEN ↑
            </div>
          </div>
          {/* Secondary section = background */}
          <div className="relative px-4 py-3"
            style={{ backgroundColor: cfg.meta.color_scheme.background ?? cfg.meta.color_scheme.primary }}>
            <div className="absolute top-1.5 right-2 text-[8px] font-bold px-1.5 py-0.5 rounded"
              style={{ backgroundColor: `${cfg.meta.color_scheme.accent}33`, color: cfg.meta.color_scheme.accent }}>
              BACKGROUND
            </div>
            <p className="text-xs leading-relaxed" style={{ color: cfg.meta.color_scheme.text, opacity: 0.8, fontFamily: `'${cfg.meta.font.body}', serif` }}>
              Dengan penuh kebahagiaan kami mengundang...
            </p>
            <div className="absolute bottom-2 right-2 text-[8px] font-bold px-1.5 py-0.5 rounded"
              style={{ backgroundColor: `${cfg.meta.color_scheme.text}22`, color: cfg.meta.color_scheme.text, opacity: 0.7 }}>
              TEKS ↑
            </div>
          </div>
          {/* Footer legend */}
          <div className="bg-gray-50 px-3 py-2 flex flex-wrap gap-3">
            {([
              ['primary', 'Latar utama & cover'],
              ['accent', 'Ornamen & dekorasi'],
              ['text', 'Semua teks'],
              ['background', 'Latar section ke-2'],
            ] as [keyof typeof cfg.meta.color_scheme, string][]).map(([k, desc]) => (
              <div key={k} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full border border-gray-200 shrink-0"
                  style={{ backgroundColor: cfg.meta.color_scheme[k] }} />
                <p className="text-[9px] text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Palette presets */}
      <div>
        <div className="mb-2.5">
          <p className="text-[10px] font-semibold text-gray-500">
            Palet Tema Siap Pakai
          </p>
        </div>
        {/* Group by category   sumber dari props server (CRUD admin) atau fallback hardcoded */}
        {paletteGroups.map(cat => (
          <div key={cat} className="mb-3">
            <p className="text-[9px] font-semibold text-gray-300 uppercase tracking-widest mb-1.5">{cat}</p>
            <div className="grid grid-cols-2 gap-1.5">
              {paletteList.filter(p => p.cat === cat).map(pal => {
                const isActive = cfg.meta.color_scheme.primary === pal.p && cfg.meta.color_scheme.accent === pal.a
                return (
                  <button key={pal.name}
                    onClick={() => {
                      updateColors('primary', pal.p)
                      updateColors('accent', pal.a)
                      updateColors('text', pal.t)
                      updateColors('background', pal.bg)
                    }}
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl border text-left transition-all ${
                      isActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    {/* Mini color bars */}
                    <div className="flex gap-0.5 shrink-0">
                      <div style={{ width: 12, height: 28, backgroundColor: pal.p, borderRadius: '3px 0 0 3px' }} />
                      <div style={{ width: 6, height: 28, backgroundColor: pal.a }} />
                      <div style={{ width: 6, height: 28, backgroundColor: pal.bg, borderRadius: '0 3px 3px 0' }} />
                    </div>
                    <span className={`text-[10px] font-semibold truncate ${isActive ? 'text-indigo-700' : 'text-gray-600'}`}>
                      {pal.name}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Custom color pickers */}
      <div>
        <p className="text-[10px] font-semibold text-gray-500 mb-2.5">Custom Warna</p>
        <div className="space-y-3">
          {([
            ['primary',    'Latar Utama',   'Background cover & section utama'],
            ['accent',     'Aksen',         'Ornamen, garis, border, tombol'],
            ['text',       'Warna Teks',    'Semua tulisan di atas latar primer'],
            ['background', 'Latar Kedua',   'Background section selang-seling'],
          ] as [keyof typeof cfg.meta.color_scheme, string, string][]).map(([key, label, hint]) => {
            // Inline contrast warning for text/accent against primary
            let inlineWarning: { ratio: number; level: string } | null = null
            if (key === 'text') {
              const r = contrastRatio(cfg.meta.color_scheme.text, cfg.meta.color_scheme.primary)
              const lv = wcagLevel(r)
              if (lv === 'FAIL') inlineWarning = { ratio: r, level: lv }
            } else if (key === 'accent') {
              const r = contrastRatio(cfg.meta.color_scheme.accent, cfg.meta.color_scheme.primary)
              const lv = wcagLevelLarge(r)
              if (lv === 'FAIL') inlineWarning = { ratio: r, level: lv }
            }

            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold text-gray-600">{label}</p>
                  <p className="text-[9px] text-gray-400">{hint}</p>
                </div>
                <div className="flex items-center gap-2">
                  <input type="color"
                    value={cfg.meta.color_scheme[key]}
                    onChange={e => updateColors(key, e.target.value)}
                    className={`w-10 h-9 rounded-lg cursor-pointer border shrink-0 ${inlineWarning ? 'border-red-400 ring-2 ring-red-200' : 'border-gray-200'}`}
                  />
                  <input
                    value={cfg.meta.color_scheme[key]}
                    onChange={e => updateColors(key, e.target.value)}
                    className={inputCls + ' font-mono flex-1 text-xs'}
                    placeholder="#000000"
                  />
                </div>
                {inlineWarning && (
                  <p className="text-[9px] text-red-500 mt-1 font-medium">
                    Kontras {inlineWarning.ratio.toFixed(1)}:1 · tidak terbaca di atas latar utama
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/*  Live Contrast Checker  */}
      {(() => {
        const checks = checkColorScheme(cfg.meta.color_scheme)
        const hasFailure = checks.some(c => c.level === 'FAIL')
        const allAAA = checks.every(c => c.level === 'AAA')

        return (
          <div className={`rounded-2xl border-2 overflow-hidden ${
            hasFailure ? 'border-red-300 bg-red-50/50' : allAAA ? 'border-emerald-300 bg-emerald-50/50' : 'border-amber-300 bg-amber-50/50'
          }`}>
            <div className={`px-4 py-2.5 flex items-center justify-between ${
              hasFailure ? 'bg-red-100' : allAAA ? 'bg-emerald-100' : 'bg-amber-100'
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-sm">
                  {hasFailure ? '⚠️' : allAAA ? '✅' : '🔶'}
                </span>
                <div>
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${
                    hasFailure ? 'text-red-700' : allAAA ? 'text-emerald-700' : 'text-amber-700'
                  }`}>
                    Contrast Check
                  </p>
                  <p className={`text-[9px] ${
                    hasFailure ? 'text-red-600' : allAAA ? 'text-emerald-600' : 'text-amber-600'
                  }`}>
                    {hasFailure ? 'Ada warna tidak terbaca, perlu diperbaiki' : allAAA ? 'Semua warna lolos AAA, sempurna!' : 'Lolos AA, cukup baik'}
                  </p>
                </div>
              </div>
              {hasFailure && (
                <button
                  onClick={() => {
                    const fixed = autoFixColorScheme(cfg.meta.color_scheme)
                    updateColors('text', fixed.text)
                    updateColors('accent', fixed.accent)
                  }}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold rounded-lg transition-colors shrink-0"
                >
                  Auto-Fix
                </button>
              )}
            </div>

            <div className="px-4 py-3 space-y-2">
              {checks.map(c => {
                const ratioStr = c.ratio.toFixed(1)
                return (
                  <div key={c.pair} className="flex items-center gap-2.5">
                    {/* Color pair preview */}
                    <div className="w-10 h-6 rounded-md shrink-0 flex items-center justify-center border border-gray-200"
                      style={{ backgroundColor: c.bg }}>
                      <span style={{ color: c.fg, fontSize: 10, fontWeight: 700, lineHeight: 1 }}>Aa</span>
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-medium text-gray-700 truncate">{c.pair}</p>
                      <p className="text-[9px] text-gray-400">{ratioStr}:1</p>
                    </div>
                    {/* Badges */}
                    <div className="flex gap-1 shrink-0">
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                        c.level === 'AAA' ? 'bg-emerald-100 text-emerald-700'
                        : c.level === 'AA' ? 'bg-amber-100 text-amber-700'
                        : 'bg-red-100 text-red-700'
                      }`}>
                        {c.level === 'FAIL' ? 'GAGAL' : c.level}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                        c.levelLarge === 'AAA' ? 'bg-emerald-100 text-emerald-700'
                        : c.levelLarge === 'AA' ? 'bg-amber-100 text-amber-700'
                        : 'bg-red-100 text-red-700'
                      }`}>
                        {c.levelLarge === 'FAIL' ? '-' : c.levelLarge} lg
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="px-4 py-2 bg-white/50 border-t border-gray-100">
              <p className="text-[8px] text-gray-400 leading-relaxed">
                AA = rasio 4.5:1 (standar minimum) · AAA = rasio 7:1 (ideal) · lg = teks besar (heading)
              </p>
            </div>
          </div>
        )
      })()}

      {/* Preview mode toggle */}
      <div className="flex gap-1.5">
        {([
          { mode: 'opening' as const, label: 'Preview Opening' },
          { mode: 'invitation' as const, label: 'Preview Undangan' },
        ] as const).map(pm => (
          <button key={pm.mode}
            onClick={() => { setPreviewMode(pm.mode); setPreviewKey(k => k + 1); setDecorPreviewKey(k => k + 1) }}
            className={`flex-1 py-2 rounded-lg text-[10px] font-semibold transition-all ${
              previewMode === pm.mode
                ? 'bg-indigo-50 border-2 border-indigo-500 text-indigo-700'
                : 'bg-gray-50 border border-gray-200 text-gray-500 hover:border-gray-300'
            }`}
          >
            {pm.label}
          </button>
        ))}
      </div>

      {/* Live mini preview   pakai fungsi asli (btnStyle/cardRadius/inputBorderStyle)
          supaya selalu sinkron dengan render sesungguhnya, tidak duplikat logic */}
      <div className="rounded-2xl overflow-hidden" style={{ background: _p, padding: '20px 16px' }}>
        <p className="text-center mb-3" style={{ fontSize: 8, color: `${_t}60`, letterSpacing: '0.2em', textTransform: 'uppercase' }}>Live Preview</p>
        <div className="flex flex-col items-center gap-3">
          {/* Button with MailOpen icon   opening CTA */}
          <div style={{
            ...btnStyle(getComponentStyle(_cs).button, getComponentStyle(_cs).border, _a, _t, { size: 'sm', icon: true }),
            cursor: 'default',
          }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21.2 8.4c.5.38.8.97.8 1.6v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V10a2 2 0 0 1 .8-1.6l8-6a2 2 0 0 1 2.4 0l8 6Z"/><path d="m22 10-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 10"/></svg>
            BUKA UNDANGAN
          </div>
          {/* Button with Send icon   form submit */}
          <div style={{
            ...btnStyle(getComponentStyle(_cs).button, getComponentStyle(_cs).border, _a, _t, { size: 'sm', icon: true }),
            cursor: 'default',
          }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            KIRIM UCAPAN
          </div>
          {/* Input field preview */}
          <div style={{
            width: '80%',
            fontSize: 8, color: `${_t}50`, fontStyle: 'italic',
            background: 'transparent', transition: 'all 0.25s',
            ...inputBorderStyle(getComponentStyle(_cs).border, _a),
          }}>
            Nama Anda...
          </div>
          {/* Card preview */}
          <div style={{
            width: '80%', padding: '10px 14px',
            background: `${_a}08`, border: `1px solid ${_a}20`,
            borderRadius: cardRadius(getComponentStyle(_cs).border),
            fontSize: 7.5, color: `${_t}70`, lineHeight: 1.6,
          }}>
            Contoh card container untuk RSVP / ucapan section.
          </div>
        </div>
      </div>

      {/*  Font Pairing  */}
      <details className="group">
        <summary className="flex items-center justify-between cursor-pointer select-none py-1 list-none [&::-webkit-details-marker]:hidden">
          <div>
            <p className="text-[10px] font-semibold text-gray-500">Pasangan Font</p>
            <p className="text-[9px] text-gray-400 mt-0.5">Kombinasi heading + body terkurasi   klik untuk buka</p>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400 transition-transform group-open:rotate-180 shrink-0" />
        </summary>
        <div className="grid grid-cols-1 gap-2 mt-3 mb-4">
          {([
            { heading: 'Geist', body: 'Geist',                name: 'Clean Swiss',   desc: 'Sans-serif monokromatik bersih' },
            { heading: 'Cinzel',           body: 'Raleway',             name: 'Royal Formal',       desc: 'Romawi agung + modern ringan' },
            { heading: 'Cormorant Garamond', body: 'Montserrat',        name: 'Refined Modern',     desc: 'Garamond halus + geometris tegas' },
            { heading: 'Great Vibes',      body: 'Lato',                name: 'Romantic Script',    desc: 'Kaligrafi romantis + body netral' },
            { heading: 'Bodoni Moda',      body: 'DM Sans',             name: 'High Fashion',       desc: 'Editorial mode + sans-serif kontemporer' },
            { heading: 'Cinzel Decorative', body: 'EB Garamond',        name: 'Grand Luxury',       desc: 'Dekoratif megah + serif klasik' },
            { heading: 'Alex Brush',       body: 'Cormorant Garamond',  name: 'Calligraphy Suite',  desc: 'Kaligrafi anggun + serif elegan' },
            { heading: 'Italiana',         body: 'Spectral',            name: 'Italian Romance',    desc: 'Italia dramatis + serif hangat' },
            { heading: 'Marcellus',        body: 'Lora',                name: 'Timeless Grace',     desc: 'Serif klasik + serif lembut' },
            { heading: 'Prata',            body: 'Josefin Sans',        name: 'Chic Contrast',      desc: 'Didone tajam + sans geometris' },
            { heading: 'Sacramento',       body: 'Work Sans',           name: 'Garden Party',       desc: 'Script kasual elegan + sans modern' },
            { heading: 'Allura',           body: 'Crimson Text',        name: 'Dreamy Vintage',     desc: 'Script bermimpi + serif klasik' },
            { heading: 'Gilda Display',    body: 'Nunito',              name: 'Art Deco',           desc: 'Display 1920-an + sans-serif lunak' },
            { heading: 'Tenor Sans',       body: 'Gentium Book Plus',   name: 'Understated Luxe',   desc: 'Sans elegan + serif sastra' },
            { heading: 'Cormorant SC',     body: 'Raleway',             name: 'Monumental',         desc: 'Small caps formal + sans ringan' },
            { heading: 'Philosopher',      body: 'Source Serif 4',      name: 'Intellectual',       desc: 'Unik intelektual + serif modern' },
          ] as const).map(pair => {
            const active = cfg.meta.font.heading === pair.heading && cfg.meta.font.body === pair.body
            return (
              <button key={pair.name} type="button"
                onClick={() => {
                  updateFont('heading', pair.heading)
                  updateFont('body', pair.body)
                  setPreviewKey(k => k + 1)
                  setDecorPreviewKey(k => k + 1)
                }}
                className={`relative text-left p-3 rounded-xl transition-all border ${
                  active
                    ? 'bg-indigo-50 border-indigo-300 ring-1 ring-indigo-300/30 shadow-sm'
                    : 'bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className={`text-[10px] font-bold ${active ? 'text-indigo-700' : 'text-gray-600'}`}>{pair.name}</p>
                    <p className="text-[8px] text-gray-400 mt-0.5">{pair.desc}</p>
                  </div>
                  {active && (
                    <div className="w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </div>
                <div className="mt-2 px-2 py-1.5 rounded-lg" style={{ backgroundColor: _p }}>
                  <p style={{ fontFamily: `'${pair.heading}', serif`, color: _t, fontSize: 16, fontWeight: 700, lineHeight: 1.2 }}>
                    {previewData.groom_name} &amp; {previewData.bride_name}
                  </p>
                  <p style={{ fontFamily: `'${pair.body}', sans-serif`, color: `${_t}99`, fontSize: 9, marginTop: 3, lineHeight: 1.5 }}>
                    Dengan memohon rahmat dan ridho Allah SWT
                  </p>
                </div>
                <div className="flex gap-1 mt-1.5">
                  <span className="text-[7px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-mono">{pair.heading}</span>
                  <span className="text-[7px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-mono">{pair.body}</span>
                </div>
              </button>
            )
          })}
        </div>
      </details>

      {/*  Custom Font Override  */}
      <div className="pt-4 border-t border-gray-100">
        <p className="text-[10px] font-semibold text-gray-500 mb-1">
          Pilih &amp; Atur Font
        </p>
        <p className="text-[9px] text-gray-400 mb-3">
          Pilih dari daftar, atau tambahkan font sendiri via Google Fonts / upload file
        </p>
        <div className="space-y-4">

          {/*  Font Judul  */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold text-gray-600">Font Judul</p>
              <span className="text-[10px] italic" style={{ fontFamily: `'${cfg.meta.font.heading}', serif`, color: _a }}>{cfg.meta.font.heading}</span>
            </div>
            <select value={cfg.meta.font.heading} onChange={e => { updateFont('heading', e.target.value); setPreviewKey(k => k + 1); setDecorPreviewKey(k => k + 1) }} className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white">
              {(cfg.meta.font.custom_fonts ?? []).map(f => <option key={`c-${f.name}`} value={f.name}>★ {f.name}</option>)}
              {HEADING_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>

            <div className="flex items-center gap-2">
              <p className="text-[9px] text-gray-500 shrink-0 w-12">Skala</p>
              <input type="range" min={0.6} max={2.0} step={0.05}
                value={cfg.meta.font.heading_scale ?? 1.0}
                onChange={e => updateMeta({ font: { ...cfg.meta.font, heading_scale: Number(e.target.value) } })}
                className="flex-1 accent-indigo-600 h-1.5" />
              <div className="flex items-center gap-0.5 shrink-0">
                <input type="number" min={60} max={200} step={5}
                  value={Math.round((cfg.meta.font.heading_scale ?? 1.0) * 100)}
                  onChange={e => { const v = Number(e.target.value) / 100; if (v >= 0.6 && v <= 2.0) updateMeta({ font: { ...cfg.meta.font, heading_scale: v } }) }}
                  className="w-14 px-1 py-0.5 text-[10px] text-center border border-gray-200 rounded-md focus:border-indigo-400 focus:outline-none font-mono" />
                <span className="text-[8px] text-gray-400">%</span>
              </div>
              {(cfg.meta.font.heading_scale ?? 1.0) !== 1.0 && (
                <button onClick={() => updateMeta({ font: { ...cfg.meta.font, heading_scale: 1.0 } })}
                  className="text-[9px] text-gray-400 hover:text-indigo-500 shrink-0">↺</button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <p className="text-[9px] text-gray-500 shrink-0 w-12">Tinggi</p>
              <input type="range" min={0.8} max={2.0} step={0.05}
                value={cfg.meta.font.heading_line_height ?? 1.15}
                onChange={e => updateMeta({ font: { ...cfg.meta.font, heading_line_height: Number(e.target.value) } })}
                className="flex-1 accent-indigo-600 h-1.5" />
              <div className="flex items-center gap-0.5 shrink-0">
                <input type="number" min={0.8} max={2.0} step={0.05}
                  value={cfg.meta.font.heading_line_height ?? 1.15}
                  onChange={e => { const v = Number(e.target.value); if (v >= 0.8 && v <= 2.0) updateMeta({ font: { ...cfg.meta.font, heading_line_height: v } }) }}
                  className="w-14 px-1 py-0.5 text-[10px] text-center border border-gray-200 rounded-md focus:border-indigo-400 focus:outline-none font-mono" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-[9px] text-gray-500 shrink-0 w-12">Spasi</p>
              <input type="range" min={-0.05} max={0.3} step={0.01}
                value={cfg.meta.font.heading_letter_spacing ?? 0}
                onChange={e => updateMeta({ font: { ...cfg.meta.font, heading_letter_spacing: Number(e.target.value) } })}
                className="flex-1 accent-indigo-600 h-1.5" />
              <div className="flex items-center gap-0.5 shrink-0">
                <input type="number" min={-0.05} max={0.3} step={0.01}
                  value={cfg.meta.font.heading_letter_spacing ?? 0}
                  onChange={e => { const v = Number(e.target.value); if (v >= -0.05 && v <= 0.3) updateMeta({ font: { ...cfg.meta.font, heading_letter_spacing: v } }) }}
                  className="w-14 px-1 py-0.5 text-[10px] text-center border border-gray-200 rounded-md focus:border-indigo-400 focus:outline-none font-mono" />
                <span className="text-[8px] text-gray-400">em</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-[9px] text-gray-500 shrink-0 w-12">Kata</p>
              <input type="range" min={-0.05} max={0.5} step={0.01}
                value={cfg.meta.font.heading_word_spacing ?? 0}
                onChange={e => updateMeta({ font: { ...cfg.meta.font, heading_word_spacing: Number(e.target.value) } })}
                className="flex-1 accent-indigo-600 h-1.5" />
              <div className="flex items-center gap-0.5 shrink-0">
                <input type="number" min={-0.05} max={0.5} step={0.01}
                  value={cfg.meta.font.heading_word_spacing ?? 0}
                  onChange={e => { const v = Number(e.target.value); if (v >= -0.05 && v <= 0.5) updateMeta({ font: { ...cfg.meta.font, heading_word_spacing: v } }) }}
                  className="w-14 px-1 py-0.5 text-[10px] text-center border border-gray-200 rounded-md focus:border-indigo-400 focus:outline-none font-mono" />
                <span className="text-[8px] text-gray-400">em</span>
              </div>
            </div>
          </div>

          {/*  Font Teks  */}
          <div className="space-y-2 pt-3 border-t border-gray-50">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold text-gray-600">Font Teks</p>
              <span className="text-[10px]" style={{ fontFamily: `'${cfg.meta.font.body}', sans-serif`, color: '#666' }}>{cfg.meta.font.body}</span>
            </div>
            <select value={cfg.meta.font.body} onChange={e => { updateFont('body', e.target.value); setPreviewKey(k => k + 1); setDecorPreviewKey(k => k + 1) }} className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white">
              {(cfg.meta.font.custom_fonts ?? []).map(f => <option key={`c-${f.name}`} value={f.name}>★ {f.name}</option>)}
              {BODY_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>

            <div className="flex items-center gap-2">
              <p className="text-[9px] text-gray-500 shrink-0 w-12">Skala</p>
              <input type="range" min={0.6} max={1.6} step={0.05}
                value={cfg.meta.font.body_scale ?? 1.0}
                onChange={e => updateMeta({ font: { ...cfg.meta.font, body_scale: Number(e.target.value) } })}
                className="flex-1 accent-indigo-600 h-1.5" />
              <div className="flex items-center gap-0.5 shrink-0">
                <input type="number" min={60} max={160} step={5}
                  value={Math.round((cfg.meta.font.body_scale ?? 1.0) * 100)}
                  onChange={e => { const v = Number(e.target.value) / 100; if (v >= 0.6 && v <= 1.6) updateMeta({ font: { ...cfg.meta.font, body_scale: v } }) }}
                  className="w-14 px-1 py-0.5 text-[10px] text-center border border-gray-200 rounded-md focus:border-indigo-400 focus:outline-none font-mono" />
                <span className="text-[8px] text-gray-400">%</span>
              </div>
              {(cfg.meta.font.body_scale ?? 1.0) !== 1.0 && (
                <button onClick={() => updateMeta({ font: { ...cfg.meta.font, body_scale: 1.0 } })}
                  className="text-[9px] text-gray-400 hover:text-indigo-500 shrink-0">↺</button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <p className="text-[9px] text-gray-500 shrink-0 w-12">Tinggi</p>
              <input type="range" min={1.0} max={2.5} step={0.05}
                value={cfg.meta.font.body_line_height ?? 1.65}
                onChange={e => updateMeta({ font: { ...cfg.meta.font, body_line_height: Number(e.target.value) } })}
                className="flex-1 accent-indigo-600 h-1.5" />
              <div className="flex items-center gap-0.5 shrink-0">
                <input type="number" min={1.0} max={2.5} step={0.05}
                  value={cfg.meta.font.body_line_height ?? 1.65}
                  onChange={e => { const v = Number(e.target.value); if (v >= 1.0 && v <= 2.5) updateMeta({ font: { ...cfg.meta.font, body_line_height: v } }) }}
                  className="w-14 px-1 py-0.5 text-[10px] text-center border border-gray-200 rounded-md focus:border-indigo-400 focus:outline-none font-mono" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-[9px] text-gray-500 shrink-0 w-12">Spasi</p>
              <input type="range" min={-0.02} max={0.15} step={0.005}
                value={cfg.meta.font.body_letter_spacing ?? 0}
                onChange={e => updateMeta({ font: { ...cfg.meta.font, body_letter_spacing: Number(e.target.value) } })}
                className="flex-1 accent-indigo-600 h-1.5" />
              <div className="flex items-center gap-0.5 shrink-0">
                <input type="number" min={-0.02} max={0.15} step={0.005}
                  value={cfg.meta.font.body_letter_spacing ?? 0}
                  onChange={e => { const v = Number(e.target.value); if (v >= -0.02 && v <= 0.15) updateMeta({ font: { ...cfg.meta.font, body_letter_spacing: v } }) }}
                  className="w-14 px-1 py-0.5 text-[10px] text-center border border-gray-200 rounded-md focus:border-indigo-400 focus:outline-none font-mono" />
                <span className="text-[8px] text-gray-400">em</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-[9px] text-gray-500 shrink-0 w-12">Kata</p>
              <input type="range" min={-0.02} max={0.3} step={0.01}
                value={cfg.meta.font.body_word_spacing ?? 0}
                onChange={e => updateMeta({ font: { ...cfg.meta.font, body_word_spacing: Number(e.target.value) } })}
                className="flex-1 accent-indigo-600 h-1.5" />
              <div className="flex items-center gap-0.5 shrink-0">
                <input type="number" min={-0.02} max={0.3} step={0.01}
                  value={cfg.meta.font.body_word_spacing ?? 0}
                  onChange={e => { const v = Number(e.target.value); if (v >= -0.02 && v <= 0.3) updateMeta({ font: { ...cfg.meta.font, body_word_spacing: v } }) }}
                  className="w-14 px-1 py-0.5 text-[10px] text-center border border-gray-200 rounded-md focus:border-indigo-400 focus:outline-none font-mono" />
                <span className="text-[8px] text-gray-400">em</span>
              </div>
            </div>
          </div>

          {/* Live preview with all typography settings */}
          <div className="px-3 py-3 rounded-xl border border-gray-100" style={{ backgroundColor: _p }}>
            <p style={{
              fontFamily: `'${cfg.meta.font.heading}', serif`,
              color: _t,
              fontSize: `calc(18px * ${cfg.meta.font.heading_scale ?? 1.0})`,
              fontWeight: 700,
              lineHeight: cfg.meta.font.heading_line_height ?? 1.15,
              letterSpacing: `${cfg.meta.font.heading_letter_spacing ?? 0}em`,
              wordSpacing: `${cfg.meta.font.heading_word_spacing ?? 0}em`,
              marginBottom: 6,
            }}>
              {previewData.groom_name} &amp; {previewData.bride_name}
            </p>
            <p style={{
              fontFamily: `'${cfg.meta.font.body}', sans-serif`,
              color: `${_t}88`,
              fontSize: `calc(10px * ${cfg.meta.font.body_scale ?? 1.0})`,
              lineHeight: cfg.meta.font.body_line_height ?? 1.65,
              letterSpacing: `${cfg.meta.font.body_letter_spacing ?? 0}em`,
              wordSpacing: `${cfg.meta.font.body_word_spacing ?? 0}em`,
            }}>
              Dengan memohon rahmat dan ridho Allah SWT, kami mengundang Bapak/Ibu/Saudara/i untuk hadir.
            </p>
          </div>

          {/*  Tambah Font Custom  */}
          <div className="pt-3 border-t border-gray-50">
            <p className="text-[10px] font-semibold text-gray-600 mb-2">Tambah Font Sendiri</p>

            {/* Method 1: Google Fonts name */}
            <div className="space-y-2 mb-3">
              <p className="text-[9px] text-gray-400">Ketik nama font dari Google Fonts lalu klik tambah</p>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  id="gf-font-input"
                  placeholder="Nama font, cth: Abril Fatface"
                  className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                />
                <button
                  type="button"
                  onClick={() => {
                    const input = document.getElementById('gf-font-input') as HTMLInputElement
                    const name = input?.value?.trim()
                    if (!name) { toast.error('Ketik nama font'); return }
                    const existing = cfg.meta.font.custom_fonts ?? []
                    if (existing.some(f => f.name === name) || HEADING_FONTS.includes(name) || BODY_FONTS.includes(name)) {
                      toast.error('Font sudah ada di daftar'); return
                    }
                    const encoded = name.replace(/ /g, '+')
                    const url = `https://fonts.googleapis.com/css2?family=${encoded}:wght@300;400;600;700&display=swap`
                    const link = document.createElement('link')
                    link.rel = 'stylesheet'
                    link.href = url
                    link.setAttribute('data-gf-custom', name)
                    document.head.appendChild(link)
                    const updated = [...existing, { name, url, weight: '300;400;600;700' }]
                    updateMeta({ font: { ...cfg.meta.font, custom_fonts: updated } })
                    input.value = ''
                    toast.success(`Font "${name}" ditambahkan!`)
                  }}
                  className="px-3 py-2 bg-indigo-600 text-white text-[10px] font-semibold rounded-lg hover:bg-indigo-700 transition-colors shrink-0"
                >
                  + Tambah
                </button>
              </div>
            </div>

            {/* Method 2: Upload font file */}
            <div className="space-y-2 mb-3">
              <p className="text-[9px] text-gray-400">Atau upload file font (.woff2, .ttf, .otf) maks 5MB</p>
              <label className="flex items-center justify-center gap-2 px-3 py-2.5 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors">
                <Upload className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-[10px] text-gray-500 font-medium">Upload File Font</span>
                <input
                  type="file"
                  accept=".woff2,.woff,.ttf,.otf"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    e.target.value = ''
                    const ext = file.name.split('.').pop()?.toLowerCase()
                    if (!['woff2', 'woff', 'ttf', 'otf'].includes(ext ?? '')) {
                      toast.error('Format tidak didukung. Gunakan .woff2, .ttf, atau .otf'); return
                    }
                    if (file.size > 5 * 1024 * 1024) { toast.error('File terlalu besar (maks 5MB)'); return }
                    const fontName = file.name.replace(/\.(woff2?|ttf|otf)$/i, '').replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                    const toastId = toast.loading(`Uploading ${fontName}...`)
                    try {
                      const formData = new FormData()
                      formData.append('file', file)
                      formData.append('folder', 'fonts')
                      const res = await fetch('/api/admin/upload', { method: 'POST', body: formData })
                      const data = await res.json()
                      if (!res.ok) throw new Error(data.error ?? 'Upload gagal')
                      const fontUrl = data.url as string
                      const format = ext === 'woff2' ? 'woff2' : ext === 'woff' ? 'woff' : ext === 'ttf' ? 'truetype' : 'opentype'
                      const style = document.createElement('style')
                      style.textContent = `@font-face { font-family: '${fontName}'; src: url('${fontUrl}') format('${format}'); font-display: swap; }`
                      document.head.appendChild(style)
                      const existing = cfg.meta.font.custom_fonts ?? []
                      const updated = [...existing, { name: fontName, url: fontUrl }]
                      updateMeta({ font: { ...cfg.meta.font, custom_fonts: updated } })
                      toast.success(`Font "${fontName}" berhasil diupload!`, { id: toastId })
                    } catch (err) {
                      toast.error((err as Error).message, { id: toastId })
                    }
                  }}
                />
              </label>
            </div>

            {/* List custom fonts */}
            {(cfg.meta.font.custom_fonts ?? []).length > 0 && (
              <div className="space-y-1">
                <p className="text-[9px] text-gray-400 mb-1">Font yang ditambahkan:</p>
                {(cfg.meta.font.custom_fonts ?? []).map((cf, i) => (
                  <div key={i} className="flex items-center justify-between px-2.5 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[9px] text-amber-500 shrink-0">★</span>
                      <span className="text-[10px] font-medium text-gray-700 truncate" style={{ fontFamily: `'${cf.name}', serif` }}>{cf.name}</span>
                      <span className="text-[8px] text-gray-400 shrink-0">{cf.url.includes('googleapis') ? 'Google' : 'Upload'}</span>
                    </div>
                    <button
                      onClick={() => {
                        const updated = (cfg.meta.font.custom_fonts ?? []).filter((_, j) => j !== i)
                        updateMeta({ font: { ...cfg.meta.font, custom_fonts: updated } })
                        toast.success(`Font "${cf.name}" dihapus`)
                      }}
                      className="text-gray-300 hover:text-red-400 shrink-0 ml-2"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Button Variant */}
      <div className="pt-4 border-t border-gray-100">
        <p className="text-[10px] font-semibold text-gray-500 mb-1">
          Gaya Tombol
        </p>
        <p className="text-[9px] text-gray-400 mb-3">
          Berlaku untuk semua tombol: RSVP, ucapan, maps, transfer, opening, dsb
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {([
            { id: 'outlined',  label: 'Outlined',  desc: 'Garis tepi' },
            { id: 'filled',    label: 'Filled',    desc: 'Solid penuh' },
            { id: 'pill',      label: 'Pill',      desc: 'Kapsul blur' },
            { id: 'ghost',     label: 'Ghost',     desc: 'Transparan' },
            { id: 'underline', label: 'Underline', desc: 'Garis bawah' },
          ] as const).map(bv => {
            const active = (_cs?.button ?? 'outlined') === bv.id
            const _iconSvg = <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21.2 8.4c.5.38.8.97.8 1.6v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V10a2 2 0 0 1 .8-1.6l8-6a2 2 0 0 1 2.4 0l8 6Z"/><path d="m22 10-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 10"/></svg>
            const _swatchStyle: React.CSSProperties =
              bv.id === 'filled' ? { padding: '5px 12px', background: _a, borderRadius: _br, fontSize: 7.5, color: _t, letterSpacing: '0.12em' }
              // borderRadius ikut _br (Gaya Sudut/Border)   jangan hardcode 999, biar swatch sinkron dengan btnStyle()
              : bv.id === 'pill' ? { padding: '5px 12px', border: `1.5px solid ${_a}80`, borderRadius: _br, fontSize: 7.5, color: _t, letterSpacing: '0.12em', background: `${_a}20` }
              : bv.id === 'ghost' ? { padding: '5px 12px', fontSize: 7.5, color: _a, letterSpacing: '0.12em' }
              // underline juga ikut _br (visual radius-nya subtle karena cuma ada borderBottom, tapi tetap konsisten)
              : bv.id === 'underline' ? { padding: '5px 6px', borderBottom: `2px solid ${_a}`, borderRadius: _br, fontSize: 7.5, color: _t, letterSpacing: '0.12em' }
              : { padding: '5px 12px', border: `1.5px solid ${_a}`, borderRadius: _br, fontSize: 7.5, color: _t, letterSpacing: '0.12em' }
            return (
              <button key={bv.id} type="button"
                onClick={() => _updateStyle({ button: bv.id })}
                className={`relative p-3 rounded-xl text-center transition-all ${
                  active
                    ? 'bg-indigo-50 border-2 border-indigo-500 ring-1 ring-indigo-500/20'
                    : 'bg-gray-50 border border-gray-200 hover:border-gray-300 hover:bg-gray-100'
                }`}
              >
                <div className="mx-auto mb-2 flex items-center justify-center" style={{ height: 32, background: _p, borderRadius: 8, padding: '0 6px' }}>
                  <div className="flex items-center gap-1.5" style={_swatchStyle}>
                    {_iconSvg}
                    <span>BUKA</span>
                  </div>
                </div>
                <p className={`text-[10px] font-semibold leading-tight ${active ? 'text-indigo-700' : 'text-gray-600'}`}>
                  {bv.label}
                </p>
                <p className="text-[8px] text-gray-400 mt-0.5">{bv.desc}</p>
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

      {/* Border Variant */}
      <div className="pt-4 border-t border-gray-100">
        <p className="text-[10px] font-semibold text-gray-500 mb-1">
          Gaya Sudut / Border
        </p>
        <p className="text-[9px] text-gray-400 mb-3">
          Pengaruh pada tombol, kartu, input, dan container
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {([
            { id: 'sharp',   label: 'Sharp',   desc: 'Sudut tajam', r: '2px', cr: '0px' },
            { id: 'rounded', label: 'Rounded', desc: 'Sudut bulat', r: '10px', cr: '12px' },
            { id: 'pill',    label: 'Pill',    desc: 'Super bulat', r: '999px', cr: '20px' },
          ] as const).map(brd => {
            const active = (_cs?.border ?? 'sharp') === brd.id
            return (
              <button key={brd.id} type="button"
                onClick={() => _updateStyle({ border: brd.id })}
                className={`relative p-3 rounded-xl text-center transition-all ${
                  active
                    ? 'bg-indigo-50 border-2 border-indigo-500 ring-1 ring-indigo-500/20'
                    : 'bg-gray-50 border border-gray-200 hover:border-gray-300 hover:bg-gray-100'
                }`}
              >
                <div className="mx-auto mb-2 flex flex-col items-center gap-1.5" style={{ height: 68 }}>
                  {/* BTN swatch   tinggi 30px (setengah=15px) agar radius 'rounded' (10px) jelas di bawah cap, tidak mepet jadi stadium seperti 'pill' (999px) */}
                  <div style={{
                    width: 48, height: 30,
                    border: `1.5px solid ${_a}`,
                    borderRadius: brd.r,
                    background: `${_a}15`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 5.5, color: _t, letterSpacing: '0.1em',
                  }}>BTN</div>
                  {/* Card swatch   tinggi 32px agar radius 'rounded' (12px) masih terlihat medium, bukan full-round seperti 'pill' (20px) */}
                  <div style={{
                    width: 48, height: 32,
                    border: `1px solid ${_a}30`,
                    borderRadius: brd.cr,
                    background: `${_a}08`,
                  }} />
                </div>
                <p className={`text-[10px] font-semibold leading-tight ${active ? 'text-indigo-700' : 'text-gray-600'}`}>
                  {brd.label}
                </p>
                <p className="text-[8px] text-gray-400 mt-0.5">{brd.desc}</p>
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

      {/* Ornament Variant */}
      <div className="pt-4 border-t border-gray-100">
        <p className="text-[10px] font-semibold text-gray-500 mb-1">
          Gaya Ornamen
        </p>
        <p className="text-[9px] text-gray-400 mb-3">
          Ornamen dekoratif pada section undangan
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {([
            { id: 'classic',   label: 'Classic',   desc: 'Klasik elegan' },
            { id: 'minimal',   label: 'Minimal',   desc: 'Bersih simple' },
            { id: 'floral',    label: 'Floral',    desc: 'Motif bunga' },
            { id: 'geometric', label: 'Geometric', desc: 'Bentuk geometri' },
            { id: 'none',      label: 'Tanpa',     desc: 'Tanpa ornamen' },
          ] as const).map(orn => {
            const active = (_cs?.ornament ?? 'classic') === orn.id
            return (
              <button key={orn.id} type="button"
                onClick={() => _updateStyle({ ornament: orn.id })}
                className={`relative p-3 rounded-xl text-center transition-all ${
                  active
                    ? 'bg-indigo-50 border-2 border-indigo-500 ring-1 ring-indigo-500/20'
                    : 'bg-gray-50 border border-gray-200 hover:border-gray-300 hover:bg-gray-100'
                }`}
              >
                <p className={`text-[10px] font-semibold leading-tight ${active ? 'text-indigo-700' : 'text-gray-600'}`}>
                  {orn.label}
                </p>
                <p className="text-[8px] text-gray-400 mt-0.5">{orn.desc}</p>
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

      {/* Info */}
      <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
        <p className="text-[10px] text-blue-700 leading-relaxed">
          <strong>Info:</strong> Gaya komponen berlaku secara global untuk seluruh section undangan termasuk tombol RSVP, ucapan, maps, transfer, opening, dan download IG Story.
          Lihat perubahan langsung di mockup preview.
        </p>
      </div>

    </div>
  )
}
