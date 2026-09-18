'use client'

import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { Loader2, Save, Type } from 'lucide-react'

interface BlogTypography {
  headingFont: string
  bodyFont: string
  bodySize: number
  h2Scale: number
  h3Scale: number
  lineHeight: number
}

const DEFAULTS: BlogTypography = {
  headingFont: 'var(--font-sans), system-ui, sans-serif',
  bodyFont: 'var(--font-sans), system-ui, sans-serif',
  bodySize: 17, h2Scale: 1.6, h3Scale: 1.3, lineHeight: 1.75,
}

// Only fonts already available to the app (no new @font-face imports).
const FONTS = [
  { label: 'Plus Jakarta Sans (bawaan)', value: 'var(--font-sans), system-ui, sans-serif' },
  // Tetap ditawarkan karena pengaturan blog yang sudah tersimpan bisa memakai
  // nilai ini, dan fontnya masih dimuat di app/layout.tsx.
  { label: 'Geist Sans', value: 'var(--font-geist-sans), system-ui, sans-serif' },
  { label: 'Serif Klasik', value: 'Georgia, Cambria, "Times New Roman", serif' },
  { label: 'System Sans', value: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' },
  { label: 'Monospace', value: 'ui-monospace, SFMono-Regular, Menlo, monospace' },
]

function Slider({ label, value, min, max, step, suffix, onChange }: {
  label: string; value: number; min: number; max: number; step: number; suffix?: string; onChange: (v: number) => void
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-medium text-gray-600">{label}</label>
        <span className="text-xs font-mono text-gray-500">{value}{suffix}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-forest-500" />
    </div>
  )
}

export default function BlogTypographyManager() {
  const [t, setT] = useState<BlogTypography>(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchIt = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/blog-typography')
      if (res.ok) setT({ ...DEFAULTS, ...(await res.json()).typography })
    } catch { /* keep defaults */ }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { fetchIt() }, [fetchIt])

  const set = <K extends keyof BlogTypography>(k: K, v: BlogTypography[K]) => setT(prev => ({ ...prev, [k]: v }))

  async function save() {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/blog-typography', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(t),
      })
      if (!res.ok) throw new Error()
      toast.success('Tipografi blog disimpan. Halaman /blog akan memakai gaya baru.')
    } catch { toast.error('Gagal menyimpan tipografi') }
    finally { setSaving(false) }
  }

  if (loading) return <div className="max-w-3xl h-64 bg-white rounded-xl border border-gray-100 animate-pulse" />

  return (
    <div className="max-w-3xl grid md:grid-cols-2 gap-4">
      {/* Controls */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Type className="w-4 h-4 text-forest-600" />
          <p className="text-sm font-bold text-gray-900">Pengaturan Tipografi</p>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Font Heading</label>
          <select value={t.headingFont} onChange={e => set('headingFont', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-forest-400 bg-white">
            {FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Font Body</label>
          <select value={t.bodyFont} onChange={e => set('bodyFont', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-forest-400 bg-white">
            {FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>
        <Slider label="Ukuran Body" value={t.bodySize} min={14} max={22} step={1} suffix="px" onChange={v => set('bodySize', v)} />
        <Slider label="Skala H2" value={t.h2Scale} min={1.2} max={2.4} step={0.1} suffix="×" onChange={v => set('h2Scale', v)} />
        <Slider label="Skala H3" value={t.h3Scale} min={1.1} max={2.0} step={0.1} suffix="×" onChange={v => set('h3Scale', v)} />
        <Slider label="Line-height Paragraf" value={t.lineHeight} min={1.4} max={2.1} step={0.05} onChange={v => set('lineHeight', v)} />

        <div className="flex items-center gap-2 pt-2">
          <button onClick={save} disabled={saving}
            className="flex items-center gap-1.5 text-xs font-semibold bg-forest-500 text-white hover:bg-forest-600 px-4 py-2 rounded-lg transition-colors disabled:opacity-50">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}Simpan
          </button>
          <button onClick={() => setT(DEFAULTS)} className="text-xs font-medium text-gray-500 hover:text-gray-700 px-3 py-2">Reset default</button>
        </div>
      </div>

      {/* Live preview */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mb-3">Live Preview</p>
        <div style={{ fontFamily: t.bodyFont, fontSize: `${t.bodySize}px`, lineHeight: t.lineHeight, color: '#44403c' }}>
          <h2 style={{ fontFamily: t.headingFont, fontSize: `${(t.bodySize * t.h2Scale).toFixed(1)}px`, fontWeight: 700, color: '#1c1917', marginBottom: '0.4em', lineHeight: 1.25 }}>
            Judul Bagian (H2)
          </h2>
          <p style={{ marginBottom: '0.8em' }}>
            Ini contoh paragraf artikel blog. Perhatikan bagaimana ukuran, jarak baris, dan font terasa saat dibaca dalam beberapa kalimat berturut-turut yang cukup panjang.
          </p>
          <h3 style={{ fontFamily: t.headingFont, fontSize: `${(t.bodySize * t.h3Scale).toFixed(1)}px`, fontWeight: 700, color: '#1c1917', marginBottom: '0.4em', lineHeight: 1.3 }}>
            Sub-bagian (H3)
          </h3>
          <p>
            Paragraf kedua untuk memastikan <strong>teks tebal</strong> dan <em>miring</em> tetap nyaman dibaca dengan pengaturan yang dipilih.
          </p>
        </div>
      </div>
    </div>
  )
}
