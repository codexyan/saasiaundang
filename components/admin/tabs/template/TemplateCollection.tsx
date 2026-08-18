'use client'

import { useMemo, useState } from 'react'
import {
  Plus, Search, Tag, LayoutGrid, Rocket, PenLine, Archive, Users, X, Sparkles,
} from 'lucide-react'
import type { TemplateRecord, TemplateCategory, PriceTier } from '@/lib/types'
import TemplateCard, { type TemplateCardActions } from './TemplateCard'

type StatusFilter = 'all' | 'active' | 'draft' | 'archived'
type SortKey = 'order' | 'updated' | 'usage' | 'name'

interface Props extends TemplateCardActions {
  records: TemplateRecord[]
  categories: TemplateCategory[]
  tiers: PriceTier[]
  busyId?: string | null
  onCreate: () => void
  onManageCategories: () => void
}

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'order',   label: 'Urutan galeri' },
  { key: 'updated', label: 'Terakhir diubah' },
  { key: 'usage',   label: 'Paling banyak dipakai' },
  { key: 'name',    label: 'Nama A–Z' },
]

function Stat({ icon: Icon, label, value, tone }: {
  icon: React.ElementType; label: string; value: number; tone: string
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white border border-gray-200/70">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${tone}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-lg font-bold text-gray-900 leading-none">{value}</p>
        <p className="text-[11px] text-gray-400 mt-1 truncate">{label}</p>
      </div>
    </div>
  )
}

export default function TemplateCollection({
  records, categories, tiers, busyId, onCreate, onManageCategories, ...actions
}: Props) {
  const [status, setStatus] = useState<StatusFilter>('all')
  const [category, setCategory] = useState<string>('all')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortKey>('order')

  const counts = useMemo(() => ({
    all: records.length,
    active: records.filter(r => r.status === 'active').length,
    draft: records.filter(r => r.status === 'draft').length,
    archived: records.filter(r => r.status === 'archived').length,
    usage: records.reduce((s, r) => s + r.usage_count, 0),
  }), [records])

  const categoryLabel = useMemo(() => {
    const m = new Map(categories.map(c => [c.slug, c.label]))
    return (slug: string) => m.get(slug) ?? slug
  }, [categories])

  const tierLabel = useMemo(() => {
    const m = new Map(tiers.map(t => [t.id, t.label]))
    return (id: string) => (id === 'all' ? null : m.get(id) ?? null)
  }, [tiers])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = records.filter(r => {
      if (status !== 'all' && r.status !== status) return false
      if (category !== 'all' && r.category !== category) return false
      if (q && !`${r.name} ${r.slug} ${r.description}`.toLowerCase().includes(q)) return false
      return true
    })
    const sorted = [...filtered]
    switch (sort) {
      case 'updated': sorted.sort((a, b) => (b.updated_at ?? '').localeCompare(a.updated_at ?? '')); break
      case 'usage':   sorted.sort((a, b) => b.usage_count - a.usage_count); break
      case 'name':    sorted.sort((a, b) => a.name.localeCompare(b.name, 'id')); break
      default:        sorted.sort((a, b) => a.sort_order - b.sort_order)
    }
    return sorted
  }, [records, status, category, query, sort])

  const filtersActive = status !== 'all' || category !== 'all' || query.trim() !== ''

  const STATUS_CHIPS: { key: StatusFilter; label: string; count: number }[] = [
    { key: 'all',      label: 'Semua',  count: counts.all },
    { key: 'active',   label: 'Terbit', count: counts.active },
    { key: 'draft',    label: 'Draft',  count: counts.draft },
    { key: 'archived', label: 'Arsip',  count: counts.archived },
  ]

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50/60">
      {/* Header */}
      <div className="bg-white border-b border-gray-200/70 shrink-0">
        <div className="px-8 py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center shrink-0">
              <LayoutGrid className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-bold text-gray-900">Template</h1>
              <p className="text-[11px] text-gray-400 truncate">
                Rancang, atur harga, dan terbitkan tema undangan
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onManageCategories}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <Tag className="w-4 h-4" /> Kategori
            </button>
            <button
              onClick={onCreate}
              className="inline-flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors"
            >
              <Plus className="w-4 h-4" /> Buat Template
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="px-8 py-6 space-y-5">
          {/* Ringkasan */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat icon={Rocket}  label="Terbit di galeri"      value={counts.active}   tone="bg-emerald-50 text-emerald-600" />
            <Stat icon={PenLine} label="Draft"                 value={counts.draft}    tone="bg-amber-50 text-amber-600" />
            <Stat icon={Archive} label="Diarsipkan"            value={counts.archived} tone="bg-gray-100 text-gray-400" />
            <Stat icon={Users}   label="Undangan memakai tema" value={counts.usage}    tone="bg-indigo-50 text-indigo-600" />
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 p-1 bg-white rounded-xl border border-gray-200/70">
              {STATUS_CHIPS.map(chip => (
                <button
                  key={chip.key}
                  onClick={() => setStatus(chip.key)}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors ${
                    status === chip.key ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {chip.label}
                  <span className={`ml-1.5 text-[10px] ${status === chip.key ? 'text-white/60' : 'text-gray-300'}`}>
                    {chip.count}
                  </span>
                </button>
              ))}
            </div>

            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Cari nama atau slug..."
                className="w-full pl-9 pr-8 py-2.5 text-sm bg-white border border-gray-200/70 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  aria-label="Hapus pencarian"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-gray-300 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="px-3 py-2.5 text-sm bg-white border border-gray-200/70 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/10"
            >
              <option value="all">Semua kategori</option>
              {categories.map(c => <option key={c.slug} value={c.slug}>{c.label}</option>)}
            </select>

            <select
              value={sort}
              onChange={e => setSort(e.target.value as SortKey)}
              className="px-3 py-2.5 text-sm bg-white border border-gray-200/70 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/10"
            >
              {SORTS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>

          {/* Grid */}
          {records.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-5">
                <LayoutGrid className="w-7 h-7 text-gray-300" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">Belum ada template</h2>
              <p className="text-sm text-gray-400 mb-6 max-w-xs mx-auto">
                Buat tema pertama, atur harganya, lalu terbitkan ke galeri.
              </p>
              <button
                onClick={onCreate}
                className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors"
              >
                <Sparkles className="w-4 h-4" /> Buat Template Pertama
              </button>
            </div>
          ) : visible.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm font-semibold text-gray-700">Tidak ada template yang cocok</p>
              <p className="text-[12px] text-gray-400 mt-1">Coba longgarkan filternya.</p>
              {filtersActive && (
                <button
                  onClick={() => { setStatus('all'); setCategory('all'); setQuery('') }}
                  className="mt-4 px-4 py-2 text-[12px] font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Reset filter
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 pb-4">
              {visible.map(rec => (
                <TemplateCard
                  key={rec.id}
                  record={rec}
                  categoryLabel={rec.category ? categoryLabel(rec.category) : undefined}
                  tierLabel={tierLabel(rec.required_package)}
                  busy={busyId === rec.id}
                  {...actions}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
