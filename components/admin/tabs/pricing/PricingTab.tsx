'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import {
  Crown, Gem, Rocket, Package, Plus, Trash2, Save, Zap, Ticket, Calendar,
  Settings2, ChevronRight, ChevronLeft, ToggleLeft, ToggleRight, Copy, Check,
  Image as ImageLucide, Video, MessageSquare, QrCode, Timer,
  Gift, BookOpen, Radio, Camera, Users, CalendarDays, Quote, Heart,
  Image as ImageIcon, X, CheckCircle2,
} from 'lucide-react'
import type {
  TemplateRecord, TemplateCategory, PriceTier, TierFeatures, FlashSale, Coupon, PromoScope,
} from '@/lib/types'
import { BUILT_IN_CATEGORIES, BUILT_IN_PRICE_TIERS } from '@/lib/built-in-data'
import Drawer from '@/components/admin/ui/Drawer'
import ConfirmDialog from '@/components/admin/ui/ConfirmDialog'

type MainTab = 'harga' | 'promo'

interface Props {
  /** Hanya untuk menghitung "dipakai berapa tema" per paket. */
  records: TemplateRecord[]
  categories?: TemplateCategory[]
  priceTiers?: PriceTier[]
  flashSales?: FlashSale[]
  coupons?: Coupon[]
  deletedTierIds?: string[]
  onPriceTiersUpdate?: (tiers: PriceTier[], deletedIds?: string[]) => void
  onFlashSalesUpdate?: (sales: FlashSale[]) => void
  onCouponsUpdate?: (coupons: Coupon[]) => void
}

function formatRp(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}
function genId() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36) }

function ScopeSelector({ scope, scopeIds, tiers, categories, onChange }: {
  scope: PromoScope; scopeIds: string[]; tiers: PriceTier[]; categories: TemplateCategory[]
  onChange: (scope: PromoScope, ids: string[]) => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex gap-1.5">
        {([{ v: 'all', l: 'Semua' }, { v: 'tier', l: 'Per Tier' }, { v: 'category', l: 'Per Kategori' }] as { v: PromoScope; l: string }[]).map(o => (
          <button key={o.v} type="button" onClick={() => onChange(o.v, [])}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              scope === o.v ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-300'
            }`}>{o.l}</button>
        ))}
      </div>
      {scope === 'tier' && (
        <div className="flex flex-wrap gap-1.5">
          {tiers.map(t => (
            <button key={t.id} type="button"
              onClick={() => onChange('tier', scopeIds.includes(t.id) ? scopeIds.filter(x => x !== t.id) : [...scopeIds, t.id])}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-lg border transition-colors ${
                scopeIds.includes(t.id) ? 'bg-emerald-100 border-emerald-300 text-emerald-700' : 'bg-gray-50 border-gray-200 text-gray-500'
              }`}>{t.label}</button>
          ))}
        </div>
      )}
      {scope === 'category' && (
        <div className="flex flex-wrap gap-1.5">
          {categories.map(c => (
            <button key={c.slug} type="button"
              onClick={() => onChange('category', scopeIds.includes(c.slug) ? scopeIds.filter(x => x !== c.slug) : [...scopeIds, c.slug])}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-lg border transition-colors ${
                scopeIds.includes(c.slug) ? 'bg-violet-100 border-violet-300 text-violet-700' : 'bg-gray-50 border-gray-200 text-gray-500'
              }`}>{c.label}</button>
          ))}
        </div>
      )}
    </div>
  )
}

function ScopeBadge({ scope, scopeIds, tiers, categories }: {
  scope: PromoScope; scopeIds: string[]; tiers: PriceTier[]; categories: TemplateCategory[]
}) {
  if (scope === 'all') return <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">Semua</span>
  if (scope === 'tier') {
    const names = scopeIds.map(id => tiers.find(t => t.id === id)?.label).filter(Boolean)
    return <span className="text-[10px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded">{names.join(', ') || 'Belum dipilih'}</span>
  }
  const names = scopeIds.map(slug => categories.find(c => c.slug === slug)?.label).filter(Boolean)
  return <span className="text-[10px] bg-violet-50 text-violet-600 px-1.5 py-0.5 rounded">{names.join(', ') || 'Belum dipilih'}</span>
}

/**
 * Paket harga & promosi.
 *
 * Dipindah keluar dari modul Template. Keduanya menggerakkan PESANAN, bukan
 * desain: harga yang benar-benar ditagih diambil dari tier yang dipilih
 * pembeli di /order, bukan dari template. Menaruhnya di grup Template membuat
 * admin mengira harga tema diatur di sana — padahal tidak berpengaruh.
 */
export default function PricingTab({
  records, categories, priceTiers, flashSales, coupons,
  deletedTierIds: propDeletedTierIds,
  onPriceTiersUpdate, onFlashSalesUpdate, onCouponsUpdate,
}: Props) {
  const [mainTab, setMainTab] = useState<MainTab>('harga')
  const [showAddFlashSale, setShowAddFlashSale] = useState(false)
  const [showAddCoupon, setShowAddCoupon] = useState(false)
  const [tierEditorOpen, setTierEditorOpen] = useState(false)
  const [tierEditorId, setTierEditorId] = useState<string | null>(null)
  const [tierStep, setTierStep] = useState(0)
  const [tierDraft, setTierDraft] = useState<Partial<PriceTier>>({})
  const [pendingTierDelete, setPendingTierDelete] = useState<PriceTier | null>(null)

  const DEFAULT_FEATURES: TierFeatures = {
    max_photos: 6, max_guests: 100, music: true, custom_music: false,
    opening_animation: true, opening_styles: 'basic',
    hero: true, profiles: true, events: true, quote: true,
    countdown: true, gallery: true, rsvp: true, wishes: true,
    story: false, video: false, gift: false, gift_registry: false,
    livestream: false, ig_story: false, qrcode: false, closing: true,
    custom_domain: false, subdomain: true, remove_watermark: false,
    analytics: false, priority_support: false, validity_days: 90,
    decoration_editing: false, max_decoration_assets: 0, custom_animations: false,
  }

  const allCategories = categories ?? BUILT_IN_CATEGORIES
  const allTiers = priceTiers ?? BUILT_IN_PRICE_TIERS
  const allFlashSales = flashSales ?? []
  const allCoupons = coupons ?? []

  /** Berapa template yang menempel pada satu paket.
   *
   *  Dulu dicocokkan lewat NILAI HARGA (`r.price === t.price`) — bukan id.
   *  Akibatnya dua paket berharga sama saling mengklaim template yang sama,
   *  dan begitu harga sebuah paket diubah, seluruh template yang "miliknya"
   *  lepas diam-diam. Sekarang relasinya lewat id paket. */
  function tierUsage(tierId: string) {
    return records.filter(r => r.required_package === tierId).length
  }

  function openTierEditor(tier?: PriceTier) {
    if (tier) {
      setTierEditorId(tier.id)
      setTierDraft({ ...tier })
    } else {
      setTierEditorId(null)
      setTierDraft({ label: '', price: 0, description: '', color: '#6366f1', icon: 'rocket', features: { ...DEFAULT_FEATURES } })
    }
    setTierStep(0)
    setTierEditorOpen(true)
  }

  function saveTierEditor() {
    const d = tierDraft
    if (!d.label?.trim() || d.price == null) { toast.error('Isi nama dan harga'); return }
    if (tierEditorId) {
      onPriceTiersUpdate?.(allTiers.map(t => t.id === tierEditorId ? { ...t, ...d } as PriceTier : t))
      toast.success('Paket diperbarui')
    } else {
      const id = d.label!.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') || genId()
      if (allTiers.some(t => t.id === id)) { toast.error('Nama paket itu sudah dipakai'); return }
      onPriceTiersUpdate?.([...allTiers, { id, label: d.label!.trim(), price: d.price!, is_built_in: false, description: d.description, color: d.color, icon: d.icon, features: d.features, highlight: d.highlight } as PriceTier])
      toast.success('Paket ditambahkan')
    }
    setTierEditorOpen(false)
  }

  function removeTier(id: string) {
    const newDeleted = [...(propDeletedTierIds ?? []), id]
    onPriceTiersUpdate?.(allTiers.filter(t => t.id !== id), newDeleted)
    toast.success('Paket dihapus')
  }

  const [fsForm, setFsForm] = useState({ label: '', discount_type: 'percentage' as 'percentage' | 'fixed', discount_value: '', start_date: '', end_date: '', scope: 'all' as PromoScope, scope_ids: [] as string[] })
  const [cpForm, setCpForm] = useState({ code: '', label: '', discount_type: 'percentage' as 'percentage' | 'fixed', discount_value: '', max_uses: '', valid_from: '', valid_until: '', scope: 'all' as PromoScope, scope_ids: [] as string[] })

  function addFlashSale() {
    if (!fsForm.label.trim() || !fsForm.discount_value || !fsForm.start_date || !fsForm.end_date) { toast.error('Lengkapi field'); return }
    if (fsForm.scope !== 'all' && fsForm.scope_ids.length === 0) { toast.error('Pilih target'); return }
    if (new Date(fsForm.end_date) < new Date(fsForm.start_date)) { toast.error('Tanggal selesai mendahului tanggal mulai'); return }
    onFlashSalesUpdate?.([...allFlashSales, { id: genId(), label: fsForm.label.trim(), discount_type: fsForm.discount_type, discount_value: Number(fsForm.discount_value), start_date: fsForm.start_date, end_date: fsForm.end_date, scope: fsForm.scope, scope_ids: fsForm.scope_ids, is_active: true }])
    setFsForm({ label: '', discount_type: 'percentage', discount_value: '', start_date: '', end_date: '', scope: 'all', scope_ids: [] }); setShowAddFlashSale(false); toast.success('Flash sale dibuat')
  }
  function toggleFlashSale(id: string) { onFlashSalesUpdate?.(allFlashSales.map(s => s.id === id ? { ...s, is_active: !s.is_active } : s)) }
  function removeFlashSale(id: string) { onFlashSalesUpdate?.(allFlashSales.filter(s => s.id !== id)); toast.success('Dihapus') }
  function isLive(s: FlashSale) { const n = new Date(); return s.is_active && new Date(s.start_date) <= n && new Date(s.end_date) >= n }

  function addCoupon() {
    if (!cpForm.code.trim() || !cpForm.label.trim() || !cpForm.discount_value || !cpForm.valid_from || !cpForm.valid_until) { toast.error('Lengkapi field'); return }
    if (cpForm.scope !== 'all' && cpForm.scope_ids.length === 0) { toast.error('Pilih target'); return }
    if (new Date(cpForm.valid_until) < new Date(cpForm.valid_from)) { toast.error('Tanggal berakhir mendahului tanggal mulai'); return }
    const code = cpForm.code.trim().toUpperCase().replace(/\s+/g, '')
    if (allCoupons.some(c => c.code === code)) { toast.error('Kode sudah ada'); return }
    onCouponsUpdate?.([...allCoupons, { id: genId(), code, label: cpForm.label.trim(), discount_type: cpForm.discount_type, discount_value: Number(cpForm.discount_value), max_uses: Number(cpForm.max_uses) || 0, used_count: 0, valid_from: cpForm.valid_from, valid_until: cpForm.valid_until, scope: cpForm.scope, scope_ids: cpForm.scope_ids, is_active: true }])
    setCpForm({ code: '', label: '', discount_type: 'percentage', discount_value: '', max_uses: '', valid_from: '', valid_until: '', scope: 'all', scope_ids: [] }); setShowAddCoupon(false); toast.success('Kupon dibuat')
  }
  function toggleCoupon(id: string) { onCouponsUpdate?.(allCoupons.map(c => c.id === id ? { ...c, is_active: !c.is_active } : c)) }
  function removeCoupon(id: string) { onCouponsUpdate?.(allCoupons.filter(c => c.id !== id)); toast.success('Dihapus') }

  const MAIN_TABS: { id: MainTab; label: string; icon: typeof Crown; count: number }[] = [
    { id: 'harga', label: 'Paket Harga', icon: Crown, count: allTiers.length },
    { id: 'promo', label: 'Promosi',     icon: Zap,   count: allFlashSales.length + allCoupons.length },
  ]

  return (
    <div className="h-full flex overflow-hidden bg-gray-50/60">
      {/* Sidebar sub-tab */}
      <div className="w-56 shrink-0 border-r border-gray-200/70 bg-white px-3 py-5 space-y-1">
        <p className="px-3 pb-2 text-[10px] font-bold text-gray-300 uppercase tracking-wider">Komersial</p>
        {MAIN_TABS.map(({ id, label, icon: Icon, count }) => (
          <button
            key={id}
            onClick={() => setMainTab(id)}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-colors ${
              mainTab === id ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="flex-1 text-left">{label}</span>
            <span className={`text-[10px] ${mainTab === id ? 'text-white/50' : 'text-gray-300'}`}>{count}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="px-8 py-6">
        {/* PAKET HARGA TAB */}
        {mainTab === 'harga' && (
          <div>
            <div className="flex items-start gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center shrink-0">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-base font-bold text-gray-900">Paket Harga</h2>
                <p className="text-sm text-gray-400 mt-0.5">Kelola tier harga dan fitur per paket</p>
              </div>
              <button onClick={() => openTierEditor()}
                className="flex items-center gap-1.5 bg-gray-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors">
                <Plus className="w-4 h-4" /> Buat Paket
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {allTiers.sort((a, b) => a.price - b.price).map(t => {
                const used = tierUsage(t.id)
                const f = t.features
                const enabledCount = f ? Object.values(f).filter(v => v === true).length : 0
                const TierIcon = t.icon === 'crown' ? Crown : t.icon === 'gem' ? Gem : Rocket
                return (
                  <div key={t.id}
                    className={`bg-white rounded-2xl border overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group relative ${
                      t.highlight ? 'border-purple-200 ring-1 ring-purple-100' : 'border-gray-200/60'
                    }`}
                    onClick={() => openTierEditor(t)}>
                    {t.highlight && (
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-violet-500" />
                    )}
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${t.color || '#6366f1'}12` }}>
                            <TierIcon className="w-5 h-5" style={{ color: t.color || '#6366f1' }} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-gray-900">{t.label}</span>
                              {t.highlight && <span className="text-[9px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full font-bold">POPULER</span>}
                            </div>
                            {t.description && <p className="text-[11px] text-gray-400 mt-0.5">{t.description}</p>}
                          </div>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); if (used > 0) { toast.error(`Masih dipakai ${used} template — pindahkan dulu ke paket lain`); return } setPendingTierDelete(t) }}
                          className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-500 text-gray-300 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                          title="Hapus paket">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-2xl font-bold mb-3" style={{ color: t.color || '#6366f1' }}>
                        {t.price === 0 ? 'Gratis' : formatRp(t.price)}
                      </p>
                      <div className="flex items-center gap-3 text-[11px] text-gray-400 mb-3">
                        <span className="bg-gray-50 px-2 py-0.5 rounded-md">{used} tema</span>
                        <span className="bg-gray-50 px-2 py-0.5 rounded-md">{enabledCount} fitur</span>
                        {f && <span className="bg-gray-50 px-2 py-0.5 rounded-md">{f.validity_days} hari</span>}
                        {t.is_built_in && <span className="bg-blue-50 text-blue-500 px-2 py-0.5 rounded-md font-semibold">bawaan</span>}
                      </div>
                      {f && (
                        <div className="flex flex-wrap gap-1.5 pt-3 border-t border-gray-100">
                          {f.music && <span className="text-[10px] bg-gray-50 text-gray-500 px-2 py-0.5 rounded-md">Musik</span>}
                          {f.gallery && <span className="text-[10px] bg-gray-50 text-gray-500 px-2 py-0.5 rounded-md">Galeri {f.max_photos}</span>}
                          {f.rsvp && <span className="text-[10px] bg-gray-50 text-gray-500 px-2 py-0.5 rounded-md">RSVP</span>}
                          {f.wishes && <span className="text-[10px] bg-gray-50 text-gray-500 px-2 py-0.5 rounded-md">Ucapan</span>}
                          {f.story && <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-md">Story</span>}
                          {f.video && <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-md">Video</span>}
                          {f.gift_registry && <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-md">Gift Registry</span>}
                          {f.custom_music && <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md">Upload Musik</span>}
                          {f.remove_watermark && <span className="text-[10px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded-md">No Watermark</span>}
                          {f.custom_domain && <span className="text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-md">Custom Domain</span>}
                          {f.analytics && <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md">Analytics</span>}
                          {f.priority_support && <span className="text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-md">Priority</span>}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* PROMOSI TAB */}
        {mainTab === 'promo' && (
          <div className="space-y-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Promosi</h2>
                <p className="text-sm text-gray-400 mt-0.5">Flash sale dan kupon diskon</p>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

            {/* Flash Sale */}
            <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm shadow-amber-500/20">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Flash Sale</h3>
                    <p className="text-[11px] text-gray-400">Diskon otomatis berdasarkan periode</p>
                  </div>
                  {allFlashSales.length > 0 && <span className="text-[10px] bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full font-bold">{allFlashSales.length}</span>}
                </div>
                <button onClick={() => setShowAddFlashSale(!showAddFlashSale)}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-colors ${
                    showAddFlashSale ? 'text-gray-400 bg-gray-100' : 'text-amber-600 bg-amber-50 hover:bg-amber-100'
                  }`}>
                  {showAddFlashSale ? <><X className="w-3.5 h-3.5" /> Batal</> : <><Plus className="w-3.5 h-3.5" /> Buat</>}
                </button>
              </div>

              <div className="p-4">
                {showAddFlashSale && (
                  <div className="bg-amber-50/50 rounded-xl border border-amber-100 p-4 space-y-3 mb-4">
                    <input value={fsForm.label} onChange={e => setFsForm({ ...fsForm, label: e.target.value })} placeholder="Nama promo"
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400" />
                    <div className="flex gap-2">
                      <select value={fsForm.discount_type} onChange={e => setFsForm({ ...fsForm, discount_type: e.target.value as 'percentage' | 'fixed' })}
                        className="w-16 px-2 py-2.5 text-sm border border-gray-200 rounded-xl bg-white">
                        <option value="percentage">%</option><option value="fixed">Rp</option>
                      </select>
                      <input type="number" min={0} value={fsForm.discount_value} onChange={e => setFsForm({ ...fsForm, discount_value: e.target.value })}
                        placeholder={fsForm.discount_type === 'percentage' ? '20' : '50000'}
                        className="flex-1 px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-medium text-gray-500 mb-1">Mulai</label>
                        <input type="date" value={fsForm.start_date} onChange={e => setFsForm({ ...fsForm, start_date: e.target.value })}
                          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-gray-500 mb-1">Berakhir</label>
                        <input type="date" value={fsForm.end_date} onChange={e => setFsForm({ ...fsForm, end_date: e.target.value })}
                          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400" />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1.5">Berlaku untuk:</p>
                      <ScopeSelector scope={fsForm.scope} scopeIds={fsForm.scope_ids} tiers={allTiers} categories={allCategories}
                        onChange={(scope, ids) => setFsForm({ ...fsForm, scope, scope_ids: ids })} />
                    </div>
                    <button onClick={addFlashSale}
                      className="w-full flex items-center justify-center gap-1.5 bg-amber-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-amber-600 transition-colors">
                      <Zap className="w-3.5 h-3.5" /> Buat Flash Sale
                    </button>
                  </div>
                )}

                {allFlashSales.length > 0 ? (
                  <div className="space-y-2.5">
                    {allFlashSales.map(s => (
                      <div key={s.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm transition-colors ${
                        isLive(s) ? 'bg-amber-50/50 border-amber-200' : s.is_active ? 'bg-white border-gray-100' : 'bg-gray-50 border-gray-100 opacity-50'
                      }`}>
                        <button onClick={() => toggleFlashSale(s.id)} className="shrink-0">
                          {s.is_active ? <ToggleRight className="w-5 h-5 text-emerald-500" /> : <ToggleLeft className="w-5 h-5 text-gray-300" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-gray-800">{s.label}</span>
                            {isLive(s) && <span className="text-[9px] bg-amber-500 text-white px-1.5 py-0.5 rounded-full font-bold animate-pulse">LIVE</span>}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                            <span className="font-mono font-bold text-amber-600">{s.discount_type === 'percentage' ? `${s.discount_value}%` : formatRp(s.discount_value)}</span>
                            <ScopeBadge scope={s.scope} scopeIds={s.scope_ids} tiers={allTiers} categories={allCategories} />
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(s.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} sampai {new Date(s.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                        </div>
                        <button onClick={() => removeFlashSale(s.id)} className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-500 text-gray-300 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    ))}
                  </div>
                ) : !showAddFlashSale && (
                  <div className="text-center py-8 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                    <Zap className="w-5 h-5 text-gray-300 mx-auto mb-2" />
                    <p className="text-xs text-gray-400">Belum ada flash sale</p>
                  </div>
                )}
              </div>
            </div>

            {/* Kupon */}
            <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm shadow-violet-500/20">
                    <Ticket className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Kupon Diskon</h3>
                    <p className="text-[11px] text-gray-400">Kode promo untuk checkout</p>
                  </div>
                  {allCoupons.length > 0 && <span className="text-[10px] bg-violet-100 text-violet-600 px-2 py-0.5 rounded-full font-bold">{allCoupons.length}</span>}
                </div>
                <button onClick={() => setShowAddCoupon(!showAddCoupon)}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-colors ${
                    showAddCoupon ? 'text-gray-400 bg-gray-100' : 'text-violet-600 bg-violet-50 hover:bg-violet-100'
                  }`}>
                  {showAddCoupon ? <><X className="w-3.5 h-3.5" /> Batal</> : <><Plus className="w-3.5 h-3.5" /> Buat</>}
                </button>
              </div>

              <div className="p-4">
                {showAddCoupon && (
                  <div className="bg-violet-50/50 rounded-xl border border-violet-100 p-4 space-y-3 mb-4">
                    <div className="grid grid-cols-2 gap-2">
                      <input value={cpForm.code} onChange={e => setCpForm({ ...cpForm, code: e.target.value.toUpperCase() })} placeholder="KODE"
                        className="px-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white font-mono uppercase focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400" />
                      <input value={cpForm.label} onChange={e => setCpForm({ ...cpForm, label: e.target.value })} placeholder="Deskripsi"
                        className="px-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400" />
                    </div>
                    <div className="flex gap-2">
                      <select value={cpForm.discount_type} onChange={e => setCpForm({ ...cpForm, discount_type: e.target.value as 'percentage' | 'fixed' })}
                        className="w-16 px-2 py-2.5 text-sm border border-gray-200 rounded-xl bg-white">
                        <option value="percentage">%</option><option value="fixed">Rp</option>
                      </select>
                      <input type="number" min={0} value={cpForm.discount_value} onChange={e => setCpForm({ ...cpForm, discount_value: e.target.value })} placeholder="Diskon"
                        className="flex-1 px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400" />
                      <input type="number" min={0} value={cpForm.max_uses} onChange={e => setCpForm({ ...cpForm, max_uses: e.target.value })} placeholder="Maks (0=∞)"
                        className="flex-1 px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-medium text-gray-500 mb-1">Berlaku dari</label>
                        <input type="date" value={cpForm.valid_from} onChange={e => setCpForm({ ...cpForm, valid_from: e.target.value })}
                          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-gray-500 mb-1">Sampai</label>
                        <input type="date" value={cpForm.valid_until} onChange={e => setCpForm({ ...cpForm, valid_until: e.target.value })}
                          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400" />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1.5">Berlaku untuk:</p>
                      <ScopeSelector scope={cpForm.scope} scopeIds={cpForm.scope_ids} tiers={allTiers} categories={allCategories}
                        onChange={(scope, ids) => setCpForm({ ...cpForm, scope, scope_ids: ids })} />
                    </div>
                    <button onClick={addCoupon}
                      className="w-full flex items-center justify-center gap-1.5 bg-violet-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors">
                      <Ticket className="w-3.5 h-3.5" /> Buat Kupon
                    </button>
                  </div>
                )}

                {allCoupons.length > 0 ? (
                  <div className="space-y-2.5">
                    {allCoupons.map(c => {
                      const expired = new Date(c.valid_until) < new Date()
                      const exhausted = c.max_uses > 0 && c.used_count >= c.max_uses
                      return (
                        <div key={c.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm transition-colors ${
                          !c.is_active || expired || exhausted ? 'bg-gray-50 border-gray-100 opacity-50' : 'bg-white border-violet-100'
                        }`}>
                          <button onClick={() => toggleCoupon(c.id)} className="shrink-0">
                            {c.is_active ? <ToggleRight className="w-5 h-5 text-emerald-500" /> : <ToggleLeft className="w-5 h-5 text-gray-300" />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <button onClick={() => { navigator.clipboard.writeText(c.code); toast.success(`"${c.code}" disalin`) }}
                                className="inline-flex items-center gap-1 bg-violet-100 text-violet-700 font-mono font-bold text-xs px-2 py-0.5 rounded-lg hover:bg-violet-200 transition-colors">
                                {c.code} <Copy className="w-2.5 h-2.5 opacity-50" />
                              </button>
                              <span className="font-medium text-gray-700">{c.label}</span>
                              {expired && <span className="text-[9px] bg-red-100 text-red-500 px-1.5 py-0.5 rounded-full font-semibold">Expired</span>}
                              {exhausted && !expired && <span className="text-[9px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded-full font-semibold">Habis</span>}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                              <span className="font-mono font-bold text-violet-600">{c.discount_type === 'percentage' ? `${c.discount_value}%` : formatRp(c.discount_value)}</span>
                              <ScopeBadge scope={c.scope} scopeIds={c.scope_ids} tiers={allTiers} categories={allCategories} />
                              <span>{c.used_count}/{c.max_uses || '∞'} terpakai</span>
                            </div>
                          </div>
                          <button onClick={() => removeCoupon(c.id)} className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-500 text-gray-300 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      )
                    })}
                  </div>
                ) : !showAddCoupon && (
                  <div className="text-center py-8 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                    <Ticket className="w-5 h-5 text-gray-300 mx-auto mb-2" />
                    <p className="text-xs text-gray-400">Belum ada kupon</p>
                  </div>
                )}
              </div>
            </div>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* TIER EDITOR DRAWER */}
      <Drawer open={tierEditorOpen} onClose={() => setTierEditorOpen(false)} title={tierEditorId ? 'Edit Paket' : 'Buat Paket Baru'} width="max-w-lg">
        {(() => {
          const d = tierDraft
          const f = d.features ?? DEFAULT_FEATURES
          const setF = (patch: Partial<TierFeatures>) => setTierDraft({ ...d, features: { ...f, ...patch } })

          const STEPS = [
            { label: 'Info Paket', icon: Package },
            { label: 'Section Aktif', icon: Settings2 },
          ]

          const SECTION_FEATURES: { key: keyof TierFeatures; label: string; desc: string; icon: React.ElementType }[] = [
            { key: 'hero', label: 'Hero (Cover)', desc: 'Halaman utama dengan nama pasangan', icon: ImageIcon },
            { key: 'quote', label: 'Kutipan / Ayat', desc: 'Ayat suci atau kutipan romantis', icon: Quote },
            { key: 'profiles', label: 'Profil Pasangan', desc: 'Info mempelai & orang tua', icon: Users },
            { key: 'countdown', label: 'Countdown', desc: 'Hitung mundur ke hari H', icon: Timer },
            { key: 'events', label: 'Detail Acara', desc: 'Waktu & lokasi akad/resepsi', icon: CalendarDays },
            { key: 'story', label: 'Kisah Cinta', desc: 'Timeline perjalanan cinta', icon: BookOpen },
            { key: 'video', label: 'Video', desc: 'Embed video prewedding', icon: Video },
            { key: 'gallery', label: 'Galeri Foto', desc: 'Section galeri foto di undangan', icon: ImageLucide },
            { key: 'gift', label: 'Amplop Digital', desc: 'Transfer hadiah/angpao', icon: Gift },
            { key: 'gift_registry', label: 'Gift Registry', desc: 'Wishlist hadiah dari marketplace', icon: Gift },
            { key: 'rsvp', label: 'RSVP', desc: 'Konfirmasi kehadiran tamu', icon: CheckCircle2 },
            { key: 'wishes', label: 'Ucapan & Doa', desc: 'Kolom ucapan dari tamu', icon: MessageSquare },
            { key: 'livestream', label: 'Livestream', desc: 'Link streaming acara', icon: Radio },
            { key: 'ig_story', label: 'IG Story Filter', desc: 'Filter foto ala Instagram', icon: Camera },
            { key: 'qrcode', label: 'QR Code', desc: 'QR untuk share undangan', icon: QrCode },
            { key: 'closing', label: 'Penutup', desc: 'Ucapan terima kasih & penutup', icon: Heart },
          ]

          return (
            <div className="flex flex-col h-full">
              <div className="px-6 py-3 border-b border-gray-100 bg-gray-50/50 shrink-0">
                <div className="flex items-center gap-1">
                  {STEPS.map((s, i) => (
                    <button key={i} onClick={() => setTierStep(i)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        tierStep === i ? 'bg-indigo-600 text-white' : tierStep > i ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-400'
                      }`}>
                      <s.icon className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{s.label}</span>
                      <span className="sm:hidden">{i + 1}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {tierStep === 0 && (
                  <div className="p-6 space-y-5">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nama Paket <span className="text-red-400">*</span></label>
                      <input value={d.label ?? ''} onChange={e => setTierDraft({ ...d, label: e.target.value })}
                        placeholder="contoh: Starter, Premium, Exclusive..."
                        className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Harga <span className="text-red-400">*</span></label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400">Rp</span>
                        <input type="number" min={0} step={1000} value={d.price ?? 0} onChange={e => setTierDraft({ ...d, price: Number(e.target.value) })}
                          className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Deskripsi</label>
                      <input value={d.description ?? ''} onChange={e => setTierDraft({ ...d, description: e.target.value })}
                        placeholder="Deskripsi singkat paket ini..."
                        className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Masa Aktif (hari)</label>
                      <input type="number" min={1} value={f.validity_days} onChange={e => setF({ validity_days: Number(e.target.value) || 90 })}
                        className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Warna Aksen</label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={d.color ?? '#6366f1'} onChange={e => setTierDraft({ ...d, color: e.target.value })}
                          className="w-10 h-10 rounded-xl border border-gray-200 cursor-pointer" />
                        <input value={d.color ?? '#6366f1'} onChange={e => setTierDraft({ ...d, color: e.target.value })}
                          className="flex-1 px-3 py-2 text-sm font-mono border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Maks Tamu Blast</label>
                      <div className="flex items-center gap-2">
                        <input type="number" min={-1} value={f.max_guests} onChange={e => setF({ max_guests: Number(e.target.value) })}
                          className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400" />
                        <span className="text-[11px] text-gray-400 whitespace-nowrap">-1 = unlimited</span>
                      </div>
                    </div>
                  </div>
                )}

                {tierStep === 1 && (
                  <div className="p-6">
                    <p className="text-xs text-gray-400 mb-4">Pilih section yang aktif untuk paket ini</p>
                    <div className="space-y-1.5">
                      {SECTION_FEATURES.map(sf => {
                        const on = !!f[sf.key]
                        return (
                          <button key={sf.key} onClick={() => setF({ [sf.key]: !on } as Partial<TierFeatures>)}
                            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border text-left transition-colors ${
                              on ? 'bg-emerald-50/50 border-emerald-200' : 'bg-white border-gray-100 hover:border-gray-200'
                            }`}>
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${on ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                              <sf.icon className={`w-4 h-4 ${on ? 'text-emerald-600' : 'text-gray-400'}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium ${on ? 'text-gray-900' : 'text-gray-500'}`}>{sf.label}</p>
                              <p className="text-[11px] text-gray-400">{sf.desc}</p>
                            </div>
                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                              on ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'
                            }`}>
                              {on && <Check className="w-3 h-3 text-white" />}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

              </div>

              <div className="p-4 border-t border-gray-100 bg-gray-50/80 shrink-0">
                <div className="flex items-center gap-3">
                  {tierStep > 0 && (
                    <button onClick={() => setTierStep(tierStep - 1)}
                      className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                      <ChevronLeft className="w-4 h-4" /> Kembali
                    </button>
                  )}
                  <div className="flex-1" />
                  {tierStep < STEPS.length - 1 ? (
                    <button onClick={() => setTierStep(tierStep + 1)}
                      className="flex items-center gap-1.5 bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors">
                      Lanjut <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button onClick={saveTierEditor} disabled={!d.label?.trim()}
                      className="flex items-center gap-1.5 bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-800 disabled:opacity-40 transition-colors">
                      <Save className="w-4 h-4" /> {tierEditorId ? 'Simpan Perubahan' : 'Buat Paket'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })()}
      </Drawer>

      <ConfirmDialog
        open={!!pendingTierDelete}
        tone="danger"
        icon={Trash2}
        title="Hapus paket?"
        message={pendingTierDelete
          ? <>Paket <strong>{pendingTierDelete.label}</strong> akan dihapus. Template yang memakainya harus dipindahkan ke paket lain.</>
          : ''}
        confirmLabel="Ya, hapus"
        onConfirm={() => { if (pendingTierDelete) removeTier(pendingTierDelete.id); setPendingTierDelete(null) }}
        onCancel={() => setPendingTierDelete(null)}
      />
    </div>
  )
}