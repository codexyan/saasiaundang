'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { Plus, Trash2, Palette, Check, X, Pencil, Save } from 'lucide-react'
import type { ColorPalette } from '@/lib/types'

interface Props {
  palettes: ColorPalette[]
  onUpdate: (palettes: ColorPalette[]) => void
}

const HEX_RE = /^#[0-9a-fA-F]{6}$/

interface FormState {
  id?: string
  name: string
  group: string
  primary: string
  accent: string
  text: string
  background: string
}

const EMPTY_FORM: FormState = {
  name: '',
  group: 'Custom',
  primary: '#1a1a1a',
  accent: '#d4af37',
  text: '#ffffff',
  background: '#0f0f0f',
}

export default function PalettesManager({ palettes, onUpdate }: Props) {
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const groups = Array.from(new Set(palettes.map((p) => p.group)))

  function validate(): string | null {
    if (!form.name.trim()) return 'Nama palet wajib diisi'
    if (!form.group.trim()) return 'Grup wajib diisi'
    for (const k of ['primary', 'accent', 'text', 'background'] as const) {
      if (!HEX_RE.test(form[k])) return `Warna ${k} harus format #RRGGBB`
    }
    return null
  }

  async function submitAdd() {
    const err = validate()
    if (err) { toast.error(err); return }
    setBusy(true)
    const res = await fetch('/api/admin/palettes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setBusy(false)
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      toast.error(data.error || 'Gagal menambah palet')
      return
    }
    const { palette } = await res.json()
    onUpdate([...palettes, palette])
    setForm(EMPTY_FORM)
    setShowAdd(false)
    toast.success('Palet ditambahkan')
  }

  function startEdit(p: ColorPalette) {
    setEditingId(p.id)
    setForm({ id: p.id, name: p.name, group: p.group, primary: p.primary, accent: p.accent, text: p.text, background: p.background })
  }

  async function saveEdit() {
    if (!editingId) return
    const err = validate()
    if (err) { toast.error(err); return }
    setBusy(true)
    const res = await fetch(`/api/admin/palettes/${editingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setBusy(false)
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      toast.error(data.error || 'Perubahannya gagal disimpan. Coba lagi ya.')
      return
    }
    onUpdate(palettes.map((p) => p.id === editingId ? { ...p, ...form } as ColorPalette : p))
    setEditingId(null)
    setForm(EMPTY_FORM)
    toast.success('Palet diperbarui')
  }

  async function deletePalette(id: string) {
    if (!confirm('Hapus palet ini?')) return
    const res = await fetch(`/api/admin/palettes/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      toast.error(data.error || 'Gagal dihapus. Coba lagi ya.')
      return
    }
    onUpdate(palettes.filter((p) => p.id !== id))
    toast.success('Palet dihapus')
  }

  function ColorRow({ label, hint, color, onChange }: { label: string; hint: string; color: string; onChange: (v: string) => void }) {
    return (
      <div>
        <label className="text-[10px] font-semibold text-gray-600 mb-1 block">{label}</label>
        <div className="flex items-center gap-2">
          <input type="color" value={color} onChange={(e) => onChange(e.target.value)}
            className="w-9 h-9 rounded cursor-pointer border border-gray-200" />
          <input value={color} onChange={(e) => onChange(e.target.value)}
            className="flex-1 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-400 font-mono" />
        </div>
        <p className="text-[9px] text-gray-400 mt-0.5">{hint}</p>
      </div>
    )
  }

  function Form() {
    return (
      <div className="space-y-3 p-4 rounded-xl border border-indigo-100 bg-indigo-50/40 mb-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-semibold text-gray-600 mb-1 block">Nama Palet</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="contoh: Senja Bali"
              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-400" />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-gray-600 mb-1 block">Grup</label>
            <input value={form.group} onChange={(e) => setForm({ ...form, group: e.target.value })}
              list="palette-groups"
              placeholder="Nusantara / Modern / dst."
              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-400" />
            <datalist id="palette-groups">
              {groups.map((g) => <option key={g} value={g} />)}
            </datalist>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2.5">
          <ColorRow label="Primary" hint="Latar utama" color={form.primary} onChange={(v) => setForm({ ...form, primary: v })} />
          <ColorRow label="Accent" hint="Ornamen" color={form.accent} onChange={(v) => setForm({ ...form, accent: v })} />
          <ColorRow label="Text" hint="Teks utama" color={form.text} onChange={(v) => setForm({ ...form, text: v })} />
          <ColorRow label="Background" hint="Latar kedua" color={form.background} onChange={(v) => setForm({ ...form, background: v })} />
        </div>

        {/* Preview */}
        <div className="rounded-lg overflow-hidden border border-gray-200">
          <div className="px-4 py-3" style={{ backgroundColor: form.primary, color: form.text }}>
            <p className="text-[10px] opacity-60">Bismillahirrahmanirrahim</p>
            <p className="font-bold text-base">Ikhwal &amp; Fani</p>
            <div className="h-0.5 w-10 rounded mt-1.5" style={{ backgroundColor: form.accent }} />
          </div>
          <div className="px-4 py-2 text-xs" style={{ backgroundColor: form.background, color: form.text, opacity: 0.85 }}>
            Dengan penuh kebahagiaan kami mengundang...
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={editingId ? saveEdit : submitAdd} disabled={busy}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
            <Save className="w-4 h-4" />
            {busy ? 'Menyimpan...' : (editingId ? 'Simpan Perubahan' : 'Tambah Palet')}
          </button>
          <button onClick={() => { setShowAdd(false); setEditingId(null); setForm(EMPTY_FORM) }}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Batal</button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Palette className="w-4 h-4 text-indigo-500" />
            Palet Warna
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Preset palet yang muncul di Studio Desain. Bawaan tidak bisa diedit/dihapus.
          </p>
        </div>
        {!showAdd && !editingId && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 bg-indigo-600 text-white px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Tambah Palet
          </button>
        )}
      </div>

      {(showAdd || editingId) && <Form />}

      {/* Grouped list */}
      <div className="space-y-4">
        {groups.map((group) => (
          <div key={group}>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{group}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {palettes.filter((p) => p.group === group).map((p) => (
                <div key={p.id} className="group relative rounded-xl border border-gray-200 overflow-hidden bg-white">
                  <div className="flex h-12">
                    <div style={{ backgroundColor: p.primary, flex: 3 }} />
                    <div style={{ backgroundColor: p.accent, flex: 1 }} />
                    <div style={{ backgroundColor: p.background, flex: 1 }} />
                  </div>
                  <div className="px-2.5 py-1.5 flex items-center justify-between gap-1">
                    <p className="text-[11px] font-semibold text-gray-700 truncate" title={p.name}>{p.name}</p>
                    {p.is_built_in ? (
                      <span className="text-[8px] text-blue-500 bg-blue-50 px-1 py-0.5 rounded shrink-0">bawaan</span>
                    ) : (
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => startEdit(p)} className="p-0.5 text-gray-400 hover:text-indigo-600">
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button onClick={() => deletePalette(p.id)} className="p-0.5 text-gray-400 hover:text-red-500">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
