'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { ImageIcon, Loader2, Upload, Check, Crown, Tag, Rocket, EyeOff, Archive } from 'lucide-react'
import type { TemplateRecord, TemplateCategory, PriceTier, TemplatePackageRequirement } from '@/lib/types'
import { slugify, TEMPLATE_SLUG } from '@/lib/schemas/template-record'
import Drawer from '@/components/admin/ui/Drawer'
import { statusMeta } from '@/components/admin/ui/StatusBadge'
import TemplateThumb from './TemplateThumb'

interface Props {
  record: TemplateRecord | null
  categories: TemplateCategory[]
  tiers: PriceTier[]
  saving: boolean
  onClose: () => void
  onSave: (id: string, patch: Partial<TemplateRecord>) => Promise<boolean>
  onManageCategories: () => void
}

function formatRp(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

const STATUSES: { value: TemplateRecord['status']; icon: React.ElementType; hint: string }[] = [
  { value: 'draft',    icon: EyeOff,  hint: 'Hanya terlihat di panel admin' },
  { value: 'active',   icon: Rocket,  hint: 'Tampil di galeri dan bisa dipilih user' },
  { value: 'archived', icon: Archive, hint: 'Disembunyikan; undangan lama tetap hidup' },
]

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="px-6 py-5 border-b border-gray-100 last:border-b-0">
      <p className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">{title}</p>
      {hint && <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">{hint}</p>}
      <div className="mt-3">{children}</div>
    </div>
  )
}

const inputCls = 'w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-shadow'

/**
 * Semua atribut non-desain sebuah template, dalam satu panel.
 *
 * Dulu tersebar: nama & slug diketik di Studio Desain, harga & kategori diatur
 * di modul Manajemen, dan deskripsi diminta di Studio tapi tidak pernah
 * disimpan ke mana pun. Satu template = satu tempat pengaturan.
 */
export default function TemplateSettingsDrawer({
  record, categories, tiers, saving, onClose, onSave, onManageCategories,
}: Props) {
  const [form, setForm] = useState<Partial<TemplateRecord>>({})
  const [slugTouched, setSlugTouched] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [priceOverride, setPriceOverride] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!record) return
    setForm({
      name: record.name,
      slug: record.slug,
      description: record.description,
      category: record.category,
      thumbnail_url: record.thumbnail_url,
      status: record.status,
      price: record.price,
      required_package: record.required_package,
      sort_order: record.sort_order,
    })
    setSlugTouched(true) // template yang sudah ada: jangan pernah ubah slug diam-diam
    setPriceOverride(record.price > 0)
  }, [record])

  const selectedTier = useMemo(
    () => tiers.find(t => t.id === form.required_package),
    [tiers, form.required_package],
  )

  // Harga efektif: override kalau diisi, kalau tidak ikut harga tier.
  const effectivePrice = priceOverride ? (form.price ?? 0) : (selectedTier?.price ?? 0)

  const slugValue = form.slug ?? ''
  const slugError = slugValue.length > 0 && !TEMPLATE_SLUG.test(slugValue)
    ? 'Hanya huruf kecil, angka, dan strip di antara kata'
    : slugValue.length > 0 && slugValue.length < 3
      ? 'Minimal 3 karakter'
      : null

  function set(patch: Partial<TemplateRecord>) { setForm(f => ({ ...f, ...patch })) }

  function setName(name: string) {
    // Slug ikut nama hanya selama admin belum menyentuh slug sendiri —
    // mengubah slug template yang sudah terbit akan mematahkan tautan lama.
    set(slugTouched ? { name } : { name, slug: slugify(name) })
  }

  async function handleThumbUpload(file: File) {
    setUploading(true)
    try {
      const body = new FormData()
      body.append('file', file)
      body.append('folder', 'thumbnails')
      const res = await fetch('/api/admin/upload', { method: 'POST', body })
      const data = await res.json().catch(() => null)
      if (!res.ok) { toast.error(data?.error || 'Thumbnail gagal diunggah'); return }
      set({ thumbnail_url: data.url })
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function submit() {
    if (!record) return
    if (!form.name?.trim()) { toast.error('Nama template wajib diisi'); return }
    if (slugError) { toast.error(`Slug tidak valid: ${slugError}`); return }

    const ok = await onSave(record.id, {
      ...form,
      name: form.name.trim(),
      description: (form.description ?? '').trim(),
      // Harga 0 berarti "ikut harga paket". Menyimpan salinan harga tier ke
      // sini akan basi diam-diam begitu harga paketnya diubah.
      price: priceOverride ? Math.max(0, Math.round(form.price ?? 0)) : 0,
    })
    if (ok) onClose()
  }

  return (
    <Drawer
      open={!!record}
      onClose={onClose}
      title="Pengaturan template"
      subtitle={record?.name}
      width="max-w-lg"
      footer={
        <div className="flex gap-3">
          <button onClick={onClose} className="px-4 min-h-[44px] text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
            Batal
          </button>
          <button
            onClick={submit}
            disabled={saving || !!slugError}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 min-h-[44px] text-sm font-semibold text-white bg-gray-900 rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Simpan pengaturan
          </button>
        </div>
      }
    >
      {record && (
        <>
          <Section title="Identitas" hint="Yang dilihat calon pembeli di galeri template.">
            <div className="flex gap-4">
              <div className="w-24 shrink-0">
                <div className="aspect-[9/16] rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                  <TemplateThumb record={{ ...record, ...form } as TemplateRecord} />
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleThumbUpload(f) }}
                />
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="mt-2 w-full inline-flex items-center justify-center gap-1.5 px-2 py-1.5 sentuh:min-h-[44px] text-[11px] font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
                >
                  {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                  Thumbnail
                </button>
                <p className="mt-1 text-[9px] text-gray-400 leading-tight text-center">
                  Opsional — kalau kosong, foto sampul desain yang dipakai
                </p>
              </div>

              <div className="flex-1 min-w-0 space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Nama</label>
                  <input value={form.name ?? ''} onChange={e => setName(e.target.value)} className={inputCls} placeholder="Modern Sage" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Slug</label>
                  <input
                    value={slugValue}
                    onChange={e => { setSlugTouched(true); set({ slug: e.target.value.toLowerCase() }) }}
                    className={`${inputCls} font-mono ${slugError ? 'border-red-300 focus:ring-red-500/10' : ''}`}
                    placeholder="modern-sage"
                  />
                  <p className={`mt-1 text-[10px] ${slugError ? 'text-red-500' : 'text-gray-400'}`}>
                    {slugError ?? 'Dipakai di alamat publik. Hindari mengubahnya setelah template terbit.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-3">
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">Deskripsi</label>
              <textarea
                value={form.description ?? ''}
                onChange={e => set({ description: e.target.value })}
                rows={2}
                maxLength={500}
                className={`${inputCls} resize-none`}
                placeholder="Satu-dua kalimat tentang suasana tema ini..."
              />
              <p className="mt-1 text-[10px] text-gray-400">{(form.description ?? '').length}/500</p>
            </div>
          </Section>

          <Section title="Kategori" hint="Menentukan template ini muncul di filter mana pada galeri publik.">
            <div className="flex flex-wrap gap-1.5">
              {categories.map(c => {
                const sel = form.category === c.slug
                return (
                  <button
                    key={c.slug}
                    onClick={() => set({ category: c.slug })}
                    className={`px-3 py-1.5 sentuh:min-h-[44px] rounded-lg text-[12px] font-semibold border transition-colors ${
                      sel ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    {c.label}
                  </button>
                )
              })}
              <button
                onClick={onManageCategories}
                className="px-3 py-1.5 sentuh:min-h-[44px] rounded-lg text-[12px] font-semibold border border-dashed border-gray-300 text-gray-400 hover:text-gray-700 hover:border-gray-400 transition-colors inline-flex items-center gap-1.5"
              >
                <Tag className="w-3 h-3" /> Kelola
              </button>
            </div>
          </Section>

          <Section title="Paket & harga" hint="Paket menentukan fitur apa saja yang aktif untuk pembeli template ini.">
            <div className="space-y-1.5">
              {([{ id: 'all', label: 'Semua paket (gratis / ikut harga global)', price: 0 }, ...tiers] as { id: string; label: string; price: number }[]).map(t => {
                const sel = (form.required_package ?? 'all') === t.id
                return (
                  <button
                    key={t.id}
                    onClick={() => set({ required_package: t.id as TemplatePackageRequirement })}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 sentuh:min-h-[44px] rounded-xl border text-left transition-colors ${
                      sel ? 'bg-gray-900 text-white border-gray-900' : 'bg-white border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <Crown className={`w-3.5 h-3.5 shrink-0 ${sel ? 'text-white' : 'text-gray-300'}`} />
                    <span className="flex-1 text-[12px] font-semibold truncate">{t.label}</span>
                    {t.id !== 'all' && (
                      <span className={`text-[11px] font-bold shrink-0 ${sel ? 'text-white/80' : 'text-gray-400'}`}>
                        {formatRp(t.price)}
                      </span>
                    )}
                    {sel && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                )
              })}
            </div>

            <label className="mt-3 flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={priceOverride}
                onChange={e => { setPriceOverride(e.target.checked); if (!e.target.checked) set({ price: 0 }) }}
                className="mt-0.5 w-3.5 h-3.5 rounded accent-gray-900"
              />
              <span className="text-[12px] text-gray-600 leading-snug">
                Harga khusus untuk template ini
                <span className="block text-[10px] text-gray-400">
                  Kalau tidak dicentang, harga mengikuti paket di atas dan otomatis ikut berubah saat harga paket diubah.
                </span>
              </span>
            </label>

            {priceOverride && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-[12px] font-semibold text-gray-400">Rp</span>
                <input
                  type="number"
                  min={0}
                  value={form.price ?? 0}
                  onChange={e => set({ price: Number(e.target.value) })}
                  className={`${inputCls} max-w-[180px]`}
                />
              </div>
            )}

            <p className="mt-3 text-[11px] text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
              Harga yang ditampilkan di galeri: <strong className="text-gray-800">{effectivePrice > 0 ? formatRp(effectivePrice) : 'Gratis'}</strong>
            </p>
          </Section>

          <Section title="Publikasi">
            <div className="grid grid-cols-3 gap-1.5">
              {STATUSES.map(({ value, icon: Icon, hint }) => {
                const sel = form.status === value
                const m = statusMeta(value)
                return (
                  <button
                    key={value}
                    onClick={() => set({ status: value })}
                    title={hint}
                    className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl border text-[11px] font-semibold transition-colors ${
                      sel ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {m.label}
                  </button>
                )
              })}
            </div>
            <p className="mt-2 text-[11px] text-gray-400 leading-relaxed">
              {STATUSES.find(s => s.value === form.status)?.hint}
            </p>
          </Section>

          <Section title="Urutan tampil" hint="Angka lebih kecil tampil lebih dulu di galeri.">
            <input
              type="number"
              min={0}
              value={form.sort_order ?? 0}
              onChange={e => set({ sort_order: Number(e.target.value) })}
              className={`${inputCls} max-w-[120px]`}
            />
          </Section>

          <Section title="Pemakaian">
            <div className="flex items-center gap-2 text-[12px] text-gray-600">
              <ImageIcon className="w-3.5 h-3.5 text-gray-300" />
              Dipakai oleh <strong className="text-gray-900">{record.usage_count}</strong> undangan.
              {record.usage_count > 0 && (
                <span className="text-gray-400">Template ini tidak bisa dihapus — arsipkan saja.</span>
              )}
            </div>
          </Section>
        </>
      )}
    </Drawer>
  )
}
