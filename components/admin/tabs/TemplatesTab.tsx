'use client'

import { useState, useRef, useEffect } from 'react'
import toast from 'react-hot-toast'
import {
  FlaskConical, ExternalLink, Eye, EyeOff, Save, Trash2,
  Crown, Archive, Package, CheckCircle2, Clock, Upload, ImageIcon, Tag,
  X, Plus, Zap, Ticket, Calendar, Pencil, Check, Settings2,
  ToggleLeft, ToggleRight, Copy, ChevronRight, ChevronLeft,
  Rocket, Gem, Music, Image as ImageLucide, Video, MessageSquare,
  QrCode, Headphones, Timer, Gift, BookOpen, Radio, Camera,
  Layers, Search, Users, CalendarDays, Quote, Heart,
} from 'lucide-react'
import type { TemplateRecord, TemplateCategory, PriceTier, TierFeatures, FlashSale, Coupon, PromoScope } from '@/lib/types'
import { BUILT_IN_CATEGORIES, BUILT_IN_PRICE_TIERS } from '@/lib/built-in-data'
import { countActiveSections } from '@/lib/packages'
import type { PackageTier } from '@/lib/packages'

interface Props {
  records: TemplateRecord[]
  categories?: TemplateCategory[]
  priceTiers?: PriceTier[]
  flashSales?: FlashSale[]
  coupons?: Coupon[]
  deletedCategoryIds?: string[]
  deletedTierIds?: string[]
  onRecordsUpdate: (records: TemplateRecord[]) => void
  onGoToLab?: () => void
  onEditInLab?: (record: TemplateRecord) => void
  onCategoriesUpdate?: (cats: TemplateCategory[], deletedIds?: string[]) => void
  onPriceTiersUpdate?: (tiers: PriceTier[], deletedIds?: string[]) => void
  onFlashSalesUpdate?: (sales: FlashSale[]) => void
  onCouponsUpdate?: (coupons: Coupon[]) => void
}

type MainTab = 'tema' | 'kategori' | 'harga' | 'promo'
type Filter = 'all' | 'draft' | 'active' | 'archived'


function formatRp(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}
function genId() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36) }

function Drawer({ open, onClose, title, width = 'max-w-md', children }: {
  open: boolean; onClose: () => void; title: string; width?: string; children: React.ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  return (
    <div className={`fixed inset-0 z-50 transition-all duration-300 ${open ? 'visible' : 'invisible pointer-events-none'}`}>
      <div className={`absolute inset-0 bg-black/25 backdrop-blur-[3px] transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />
      <div className={`absolute inset-y-0 right-0 w-full ${width} bg-white shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200/60 shrink-0">
          <h2 className="text-sm font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'active') return (
    <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Aktif
    </span>
  )
  if (status === 'draft') return (
    <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full font-semibold bg-amber-50 text-amber-600 border border-amber-100">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />Draft
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full font-semibold bg-gray-50 text-gray-400 border border-gray-100">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />Arsip
    </span>
  )
}

function TemplateThumbnail({ rec }: { rec: TemplateRecord }) {
  const { primary, accent, text } = rec.config.meta.color_scheme
  const opening = rec.config?.opening
  const coverPhoto = opening?.cover_photo_url || opening?.background_image

  if (coverPhoto) {
    return (
      <div className="w-full h-full relative" style={{ background: primary }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={coverPhoto} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${primary}dd 20%, ${primary}40 50%, transparent 80%)` }} />
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-4 px-3">
          <p style={{ fontSize: 7, color: `${text}bb`, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Undangan Pernikahan</p>
          <p style={{ fontSize: 16, fontWeight: 700, color: text, lineHeight: 1.3, textAlign: 'center', marginTop: 2 }}>{rec.name}</p>
          <div className="mt-1.5 px-3 py-0.5 rounded-sm" style={{ border: `0.5px solid ${accent}80`, fontSize: 6, color: text, letterSpacing: '0.1em' }}>BUKA UNDANGAN</div>
        </div>
      </div>
    )
  }
  if (rec.thumbnail_url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={rec.thumbnail_url} alt="" className="w-full h-full object-cover" />
  }
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-3" style={{ background: primary }}>
      <div className="w-8 h-0.5 rounded mb-2" style={{ backgroundColor: `${accent}66` }} />
      <p style={{ fontSize: 7, color: `${text}99`, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Undangan</p>
      <p style={{ fontSize: 18, fontWeight: 700, color: text, lineHeight: 1.2, textAlign: 'center' }}>{rec.name}</p>
      <div className="mt-2 px-3 py-1 rounded-sm" style={{ border: `0.5px solid ${accent}60`, fontSize: 6, color: text, letterSpacing: '0.1em' }}>BUKA</div>
    </div>
  )
}

function ConfirmModal({ open, icon, iconColor, title, message, confirmLabel, confirmColor, onConfirm, onCancel }: {
  open: boolean; icon: React.ReactNode; iconColor: string; title: string; message: string
  confirmLabel: string; confirmColor: string; onConfirm: () => void; onCancel: () => void
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="px-6 pt-6 pb-4 text-center">
          <div className={`w-12 h-12 rounded-2xl ${iconColor} flex items-center justify-center mx-auto mb-4`}>{icon}</div>
          <h3 className="font-bold text-gray-900 text-base mb-1">{title}</h3>
          <p className="text-sm text-gray-500 leading-relaxed">{message}</p>
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onCancel} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">Batal</button>
          <button onClick={onConfirm} className={`flex-1 px-4 py-2.5 text-sm font-semibold text-white rounded-xl transition-colors ${confirmColor}`}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}

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

export default function TemplatesTab({
  records, categories, priceTiers, flashSales, coupons,
  deletedCategoryIds: propDeletedCatIds, deletedTierIds: propDeletedTierIds,
  onRecordsUpdate, onGoToLab, onEditInLab,
  onCategoriesUpdate, onPriceTiersUpdate, onFlashSalesUpdate, onCouponsUpdate,
}: Props) {
  const [mainTab, setMainTab] = useState<MainTab>('tema')
  const [filter, setFilter] = useState<Filter>('all')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<TemplateRecord>>({})
  const [saving, setSaving] = useState(false)
  const [uploadingThumb, setUploadingThumb] = useState(false)
  const [showAddFlashSale, setShowAddFlashSale] = useState(false)
  const [showAddCoupon, setShowAddCoupon] = useState(false)
  const thumbInputRef = useRef<HTMLInputElement>(null)

  const [newCatLabel, setNewCatLabel] = useState('')
  const [editingCatSlug, setEditingCatSlug] = useState<string | null>(null)
  const [editingCatLabel, setEditingCatLabel] = useState('')

  const [newTierLabel, setNewTierLabel] = useState('')
  const [newTierPrice, setNewTierPrice] = useState('')
  const [editingTierId, setEditingTierId] = useState<string | null>(null)
  const [editingTierLabel, setEditingTierLabel] = useState('')
  const [editingTierPrice, setEditingTierPrice] = useState('')
  const [tierEditorOpen, setTierEditorOpen] = useState(false)
  const [tierEditorId, setTierEditorId] = useState<string | null>(null)
  const [tierStep, setTierStep] = useState(0)
  const [tierDraft, setTierDraft] = useState<Partial<PriceTier>>({})
  const [searchQuery, setSearchQuery] = useState('')

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
      toast.success('Tier diperbarui')
    } else {
      const id = d.label!.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') || genId()
      if (allTiers.some(t => t.id === id)) { toast.error('ID sudah ada'); return }
      onPriceTiersUpdate?.([...allTiers, { id, label: d.label!.trim(), price: d.price!, is_built_in: false, description: d.description, color: d.color, icon: d.icon, features: d.features, highlight: d.highlight } as PriceTier])
      toast.success('Tier ditambahkan')
    }
    setTierEditorOpen(false)
  }

  const [fsForm, setFsForm] = useState({ label: '', discount_type: 'percentage' as 'percentage' | 'fixed', discount_value: '', start_date: '', end_date: '', scope: 'all' as PromoScope, scope_ids: [] as string[] })
  const [cpForm, setCpForm] = useState({ code: '', label: '', discount_type: 'percentage' as 'percentage' | 'fixed', discount_value: '', max_uses: '', valid_from: '', valid_until: '', scope: 'all' as PromoScope, scope_ids: [] as string[] })

  const [confirmModal, setConfirmModal] = useState<{
    open: boolean; action: 'archive' | 'delete'; targetId: string; targetName: string
  }>({ open: false, action: 'delete', targetId: '', targetName: '' })

  const allCategories = categories ?? BUILT_IN_CATEGORIES
  const allTiers = priceTiers ?? BUILT_IN_PRICE_TIERS
  const allFlashSales = flashSales ?? []
  const allCoupons = coupons ?? []

  const sorted = [...records].sort((a, b) => a.sort_order - b.sort_order)
  const counts = { all: sorted.length, active: sorted.filter(r => r.status === 'active').length, draft: sorted.filter(r => r.status === 'draft').length, archived: sorted.filter(r => r.status === 'archived').length }
  const searched = searchQuery ? sorted.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase())) : sorted
  const filtered = filter === 'all' ? searched : searched.filter(r => r.status === filter)

  const editingRec = editingId ? records.find(r => r.id === editingId) : null

  function findTierLabel(price: number) { return allTiers.find(t => t.price === price)?.label ?? null }

  function openEdit(rec: TemplateRecord) {
    setEditingId(rec.id)
    setEditData({ name: rec.name, category: rec.category, thumbnail_url: rec.thumbnail_url, price: rec.price, required_package: rec.required_package, sort_order: rec.sort_order })
  }
  async function handleThumbUpload(file: File) {
    if (!editingId) return
    setUploadingThumb(true)
    const form = new FormData(); form.append('file', file); form.append('folder', 'thumbnails')
    const res = await fetch('/api/admin/upload', { method: 'POST', body: form })
    setUploadingThumb(false)
    if (!res.ok) { toast.error('Gagal upload'); return }
    const { url } = await res.json()
    setEditData(d => ({ ...d, thumbnail_url: url })); toast.success('Thumbnail terupload')
  }
  async function toggleStatus(rec: TemplateRecord) {
    const next = rec.status === 'active' ? 'draft' : 'active'
    const res = await fetch(`/api/admin/template-records/${rec.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: next }) })
    if (!res.ok) { toast.error('Gagal'); return }
    onRecordsUpdate(records.map(r => r.id === rec.id ? { ...r, status: next } : r))
    toast.success(next === 'active' ? 'Dipublikasi' : 'Ditarik ke draft')
  }
  function requestArchive(rec: TemplateRecord) { setConfirmModal({ open: true, action: 'archive', targetId: rec.id, targetName: rec.name }) }
  function requestDelete(rec: TemplateRecord) { setConfirmModal({ open: true, action: 'delete', targetId: rec.id, targetName: rec.name }) }
  async function executeConfirm() {
    const { action, targetId } = confirmModal; setConfirmModal(m => ({ ...m, open: false }))
    if (action === 'archive') {
      const res = await fetch(`/api/admin/template-records/${targetId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'archived' }) })
      if (!res.ok) { toast.error('Gagal'); return }
      onRecordsUpdate(records.map(r => r.id === targetId ? { ...r, status: 'archived' } : r)); toast.success('Diarsipkan')
    } else {
      const res = await fetch(`/api/admin/template-records/${targetId}`, { method: 'DELETE' })
      if (!res.ok) { toast.error('Gagal'); return }
      onRecordsUpdate(records.filter(r => r.id !== targetId)); toast.success('Dihapus')
    }
  }
  async function saveEdit() {
    if (!editingId) return; setSaving(true)
    const res = await fetch(`/api/admin/template-records/${editingId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editData) })
    setSaving(false)
    if (!res.ok) { toast.error('Gagal'); return }
    onRecordsUpdate(records.map(r => r.id === editingId ? { ...r, ...editData } : r)); setEditingId(null); toast.success('Tersimpan')
  }

  function addCategory() {
    const label = newCatLabel.trim(); if (!label) return
    const slug = label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
    if (allCategories.some(c => c.slug === slug)) { toast.error('Sudah ada'); return }
    onCategoriesUpdate?.([...allCategories, { slug, label, is_built_in: false }]); setNewCatLabel(''); toast.success(`"${label}" ditambahkan`)
  }
  function startEditCategory(c: TemplateCategory) { setEditingCatSlug(c.slug); setEditingCatLabel(c.label) }
  function saveEditCategory() {
    if (!editingCatSlug || !editingCatLabel.trim()) return
    onCategoriesUpdate?.(allCategories.map(c => c.slug === editingCatSlug ? { ...c, label: editingCatLabel.trim() } : c)); setEditingCatSlug(null); toast.success('Diperbarui')
  }
  function removeCategory(slug: string) {
    if (records.some(r => r.category === slug)) { toast.error('Masih dipakai template'); return }
    const newDeleted = [...(propDeletedCatIds ?? []), slug]
    onCategoriesUpdate?.(allCategories.filter(c => c.slug !== slug), newDeleted); toast.success('Dihapus')
  }

  function addTier() {
    const label = newTierLabel.trim(); const price = Number(newTierPrice)
    if (!label || isNaN(price) || price < 0) { toast.error('Isi nama dan harga'); return }
    if (allTiers.some(t => t.price === price)) { toast.error('Harga sudah ada'); return }
    const id = label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') || genId()
    onPriceTiersUpdate?.([...allTiers, { id, label, price, is_built_in: false }]); setNewTierLabel(''); setNewTierPrice(''); toast.success(`"${label}" ditambahkan`)
  }
  function removeTier(id: string) {
    const tier = allTiers.find(t => t.id === id)
    if (tier && records.some(r => r.price === tier.price)) { toast.error('Masih dipakai'); return }
    const newDeleted = [...(propDeletedTierIds ?? []), id]
    onPriceTiersUpdate?.(allTiers.filter(t => t.id !== id), newDeleted); toast.success('Dihapus')
  }

  function addFlashSale() {
    if (!fsForm.label.trim() || !fsForm.discount_value || !fsForm.start_date || !fsForm.end_date) { toast.error('Lengkapi field'); return }
    if (fsForm.scope !== 'all' && fsForm.scope_ids.length === 0) { toast.error('Pilih target'); return }
    onFlashSalesUpdate?.([...allFlashSales, { id: genId(), label: fsForm.label.trim(), discount_type: fsForm.discount_type, discount_value: Number(fsForm.discount_value), start_date: fsForm.start_date, end_date: fsForm.end_date, scope: fsForm.scope, scope_ids: fsForm.scope_ids, is_active: true }])
    setFsForm({ label: '', discount_type: 'percentage', discount_value: '', start_date: '', end_date: '', scope: 'all', scope_ids: [] }); setShowAddFlashSale(false); toast.success('Dibuat')
  }
  function toggleFlashSale(id: string) { onFlashSalesUpdate?.(allFlashSales.map(s => s.id === id ? { ...s, is_active: !s.is_active } : s)) }
  function removeFlashSale(id: string) { onFlashSalesUpdate?.(allFlashSales.filter(s => s.id !== id)); toast.success('Dihapus') }
  function isLive(s: FlashSale) { const n = new Date(); return s.is_active && new Date(s.start_date) <= n && new Date(s.end_date) >= n }

  function addCoupon() {
    if (!cpForm.code.trim() || !cpForm.label.trim() || !cpForm.discount_value || !cpForm.valid_from || !cpForm.valid_until) { toast.error('Lengkapi field'); return }
    if (cpForm.scope !== 'all' && cpForm.scope_ids.length === 0) { toast.error('Pilih target'); return }
    const code = cpForm.code.trim().toUpperCase().replace(/\s+/g, '')
    if (allCoupons.some(c => c.code === code)) { toast.error('Kode sudah ada'); return }
    onCouponsUpdate?.([...allCoupons, { id: genId(), code, label: cpForm.label.trim(), discount_type: cpForm.discount_type, discount_value: Number(cpForm.discount_value), max_uses: Number(cpForm.max_uses) || 0, used_count: 0, valid_from: cpForm.valid_from, valid_until: cpForm.valid_until, scope: cpForm.scope, scope_ids: cpForm.scope_ids, is_active: true }])
    setCpForm({ code: '', label: '', discount_type: 'percentage', discount_value: '', max_uses: '', valid_from: '', valid_until: '', scope: 'all', scope_ids: [] }); setShowAddCoupon(false); toast.success('Dibuat')
  }
  function toggleCoupon(id: string) { onCouponsUpdate?.(allCoupons.map(c => c.id === id ? { ...c, is_active: !c.is_active } : c)) }
  function removeCoupon(id: string) { onCouponsUpdate?.(allCoupons.filter(c => c.id !== id)); toast.success('Dihapus') }

  const MAIN_TABS: { id: MainTab; label: string; icon: typeof Layers; count?: number }[] = [
    { id: 'tema', label: 'Tema', icon: Layers, count: counts.all },
    { id: 'kategori', label: 'Kategori', icon: Tag, count: allCategories.length },
    { id: 'harga', label: 'Paket Harga', icon: Crown, count: allTiers.length },
    { id: 'promo', label: 'Promosi', icon: Zap, count: allFlashSales.length + allCoupons.length },
  ]

  return (
    <div className="h-full flex overflow-hidden">

      {/* Sidebar */}
      <div className="w-[240px] shrink-0 bg-white border-r border-gray-200/60 flex flex-col overflow-hidden">
        <div className="px-5 py-5 shrink-0 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900">Manajemen</h1>
              <p className="text-[11px] text-gray-400">Template & promosi</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto scrollbar-hide">
          {MAIN_TABS.map(tab => (
            <button key={tab.id} onClick={() => setMainTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                mainTab === tab.id
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              }`}>
              <tab.icon className={`w-4 h-4 shrink-0 ${mainTab === tab.id ? 'text-white' : 'text-gray-400'}`} />
              <span className="text-sm font-medium flex-1">{tab.label}</span>
              {tab.count != null && tab.count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  mainTab === tab.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400'
                }`}>{tab.count}</span>
              )}
            </button>
          ))}
        </nav>

        {onGoToLab && (
          <div className="px-3 pb-4 pt-2 shrink-0 border-t border-gray-100">
            <button onClick={onGoToLab}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-indigo-500/25 transition-all">
              <FlaskConical className="w-4 h-4" /> Studio Desain
            </button>
          </div>
        )}
      </div>

      {/* Content panel */}
      <div className="flex-1 min-w-0 overflow-y-auto scrollbar-hide bg-gray-50/50">
        <div className="p-6 lg:p-8">

        {/* TEMA TAB */}
        {mainTab === 'tema' && (
          <div>
            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              {([
                { label: 'Total', count: counts.all, color: 'text-gray-700', bg: 'bg-white' },
                { label: 'Aktif', count: counts.active, color: 'text-emerald-600', bg: 'bg-emerald-50/50' },
                { label: 'Draft', count: counts.draft, color: 'text-amber-600', bg: 'bg-amber-50/50' },
                { label: 'Arsip', count: counts.archived, color: 'text-gray-400', bg: 'bg-gray-50' },
              ]).map(s => (
                <div key={s.label} className={`${s.bg} rounded-xl border border-gray-200/60 px-4 py-3`}>
                  <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">{s.label}</p>
                  <p className={`text-2xl font-bold ${s.color} mt-0.5`}>{s.count}</p>
                </div>
              ))}
            </div>

            {/* Filter + Search */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-1 bg-white border border-gray-200/60 rounded-xl p-1 shadow-sm">
                {([
                  { f: 'all' as Filter, label: 'Semua' },
                  { f: 'active' as Filter, label: 'Aktif' },
                  { f: 'draft' as Filter, label: 'Draft' },
                  { f: 'archived' as Filter, label: 'Arsip' },
                ]).map(({ f, label }) => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      filter === f ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'
                    }`}>
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex-1" />
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Cari tema..."
                  className="pl-9 pr-4 py-2 text-sm border border-gray-200/60 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 w-56 shadow-sm" />
              </div>
            </div>

            {/* Template grid */}
            {filtered.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-gray-200/60 p-16 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
                  {searchQuery ? <Search className="w-6 h-6 text-gray-200" /> : <FlaskConical className="w-7 h-7 text-gray-200" />}
                </div>
                <p className="text-base font-semibold text-gray-400 mb-1">
                  {searchQuery ? `Tidak ditemukan "${searchQuery}"` : filter === 'all' ? 'Belum ada tema' : `Tidak ada tema ${filter === 'draft' ? 'draft' : filter === 'active' ? 'aktif' : 'arsip'}`}
                </p>
                <p className="text-sm text-gray-300 mb-5">
                  {searchQuery ? 'Coba kata kunci lain.' : filter === 'all' ? 'Buat desain pertama di Studio Desain.' : 'Ubah filter atau buat tema baru.'}
                </p>
                {!searchQuery && filter === 'all' && onGoToLab && (
                  <button onClick={onGoToLab}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-indigo-500/25 transition-all">
                    <FlaskConical className="w-4 h-4" /> Mulai Desain
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-8">
                {(() => {
                  const catGroups = allCategories
                    .map(cat => ({ cat, items: filtered.filter(r => r.category === cat.slug) }))
                    .filter(g => g.items.length > 0)
                  const uncategorized = filtered.filter(r => !allCategories.some(c => c.slug === r.category))
                  if (uncategorized.length > 0) catGroups.push({ cat: { slug: '_other', label: 'Lainnya', is_built_in: false }, items: uncategorized })

                  return catGroups.map(({ cat, items }) => (
                    <div key={cat.slug}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-1 h-5 rounded-full bg-gradient-to-b from-indigo-500 to-violet-500" />
                        <h3 className="text-sm font-bold text-gray-800">{cat.label}</h3>
                        <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-semibold">{items.length} tema</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {items.map(rec => {
                          const cs = rec.config.meta.color_scheme
                          const tierLabel = findTierLabel(rec.price)
                          return (
                            <div key={rec.id} className="bg-white rounded-2xl border border-gray-200/60 overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 group">
                              <div className="relative aspect-[3/4] overflow-hidden cursor-pointer" onClick={() => openEdit(rec)}
                                style={{ background: `linear-gradient(135deg, ${cs.primary} 0%, ${cs.background} 100%)` }}>
                                <div className="absolute inset-0">
                                  <TemplateThumbnail rec={rec} />
                                </div>
                                <div className="absolute top-3 left-3">
                                  <StatusBadge status={rec.status} />
                                </div>
                                {rec.price > 0 && (
                                  <div className="absolute bottom-3 right-3">
                                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white/90 text-gray-800 backdrop-blur-sm shadow-sm">
                                      {tierLabel ?? formatRp(rec.price)}
                                    </span>
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <span className="text-white text-xs font-semibold bg-black/40 px-4 py-2 rounded-xl backdrop-blur-sm translate-y-2 group-hover:translate-y-0 transition-transform">
                                    Pengaturan
                                  </span>
                                </div>
                              </div>

                              <div className="p-4">
                                <div className="flex items-start justify-between gap-2 mb-3">
                                  <div className="min-w-0 flex-1">
                                    <h4 className="font-bold text-gray-900 text-sm truncate">{rec.name}</h4>
                                    <p className="text-[11px] text-gray-400 mt-0.5">
                                      {countActiveSections(rec.config.sections, (rec.required_package === 'all' ? 'starter' : rec.required_package) as PackageTier)} section aktif
                                    </p>
                                  </div>
                                  <a href={`/demo/renderer?id=${rec.id}`} target="_blank" rel="noopener noreferrer" title="Preview"
                                    className="p-1.5 text-gray-300 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors shrink-0">
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                </div>

                                <div className="flex gap-2">
                                  {onEditInLab && (
                                    <button onClick={() => onEditInLab(rec)}
                                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors">
                                      <FlaskConical className="w-3.5 h-3.5" /> Desain
                                    </button>
                                  )}
                                  <button onClick={() => openEdit(rec)}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-gray-600 border border-gray-200/60 hover:bg-gray-50 transition-colors">
                                    <Settings2 className="w-3.5 h-3.5" /> Atur
                                  </button>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))
                })()}
              </div>
            )}
          </div>
        )}

        {/* KATEGORI TAB */}
        {mainTab === 'kategori' && (
          <div>
            <div className="flex items-start gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center shrink-0">
                <Tag className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-base font-bold text-gray-900">Kategori Tema</h2>
                <p className="text-sm text-gray-400 mt-0.5">Kelompokkan tema berdasarkan gaya visual</p>
              </div>
              <span className="text-[11px] font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-lg">{allCategories.length}</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
              {allCategories.map(c => {
                const count = records.filter(r => r.category === c.slug).length
                const isEd = editingCatSlug === c.slug
                return isEd ? (
                  <div key={c.slug} className="bg-indigo-50/50 border border-indigo-200 rounded-xl px-4 py-3 flex items-center gap-2">
                    <input value={editingCatLabel} onChange={e => setEditingCatLabel(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveEditCategory(); if (e.key === 'Escape') setEditingCatSlug(null) }}
                      autoFocus className="flex-1 px-3 py-1.5 text-sm bg-white border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
                    <button onClick={saveEditCategory} className="p-1.5 text-indigo-600 hover:bg-indigo-100 rounded-lg"><Check className="w-4 h-4" /></button>
                    <button onClick={() => setEditingCatSlug(null)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <div key={c.slug} className="bg-white rounded-xl border border-gray-200/60 px-4 py-3.5 flex items-center gap-3 hover:shadow-md hover:-translate-y-px transition-all group">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${count > 0 ? 'bg-indigo-50' : 'bg-gray-50'}`}>
                      <Tag className={`w-4 h-4 ${count > 0 ? 'text-indigo-500' : 'text-gray-300'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-800">{c.label}</span>
                        {c.is_built_in && <span className="text-[9px] text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded-full font-bold">bawaan</span>}
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5">{count} tema menggunakan kategori ini</p>
                    </div>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => startEditCategory(c)} className="p-1.5 text-gray-300 hover:text-indigo-500 rounded-lg hover:bg-indigo-50"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => removeCategory(c.slug)} disabled={count > 0}
                        className="p-1.5 text-gray-300 hover:text-red-500 disabled:opacity-20 disabled:cursor-not-allowed rounded-lg hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="bg-white rounded-xl border border-gray-200/60 px-4 py-3.5">
              <div className="flex gap-2">
                <input value={newCatLabel} onChange={e => setNewCatLabel(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addCategory() }}
                  placeholder="Nama kategori baru..."
                  className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 bg-white" />
                <button onClick={addCategory} disabled={!newCatLabel.trim()}
                  className="flex items-center gap-1.5 bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-800 disabled:opacity-40 transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Tambah
                </button>
              </div>
            </div>
            <p className="text-[11px] text-gray-400 mt-2.5 ml-1">Kategori yang masih dipakai oleh tema tidak bisa dihapus.</p>
          </div>
        )}

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
                const used = records.filter(r => r.price === t.price).length
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
                          onClick={(e) => { e.stopPropagation(); if (used > 0) { toast.error('Masih dipakai template'); return } if (confirm(`Hapus paket "${t.label}"?`)) removeTier(t.id) }}
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

      {/* EDIT DRAWER */}
      <Drawer open={!!editingId} onClose={() => setEditingId(null)} title="Pengaturan Tema" width="max-w-md">
        {editingRec && (() => {
          const isActive = editingRec.status === 'active'
          const selectedTier = allTiers.find(t => t.price === (editData.price ?? editingRec.price))
          const selectedCat = allCategories.find(c => c.slug === (editData.category ?? editingRec.category))

          return (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto scrollbar-hide">

              {/* 1. Thumbnail + Nama */}
              <div className="p-5 pb-4">
                <div className="flex gap-4 items-start">
                  <div className="shrink-0">
                    <input ref={thumbInputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleThumbUpload(f) }} />
                    <button type="button" onClick={() => thumbInputRef.current?.click()} disabled={uploadingThumb}
                      className="w-[64px] h-[86px] rounded-xl overflow-hidden border-2 border-gray-200 relative group focus:outline-none focus:border-indigo-400">
                      {editData.thumbnail_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={editData.thumbnail_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <TemplateThumbnail rec={editingRec} />
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                        <Upload className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </button>
                    <p className="text-[9px] text-gray-400 text-center mt-1">Klik ganti</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Nama Tema</label>
                    <input value={editData.name ?? ''} onChange={e => setEditData({ ...editData, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm font-medium border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 bg-white"
                      placeholder="Nama tema" />
                    <div className="flex items-center gap-3 mt-2.5">
                      <div className="flex items-center gap-1">
                        {[editingRec.config.meta.color_scheme.primary, editingRec.config.meta.color_scheme.accent, editingRec.config.meta.color_scheme.text, editingRec.config.meta.color_scheme.background].map((c, i) => (
                          <div key={i} className="w-3 h-3 rounded-full border border-white shadow-sm" style={{ backgroundColor: c }} />
                        ))}
                      </div>
                      <span className="text-[10px] text-gray-400">{countActiveSections(editingRec.config.sections, (editingRec.required_package === 'all' ? 'starter' : editingRec.required_package) as PackageTier)} section</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mx-5 border-t border-gray-100" />

              {/* 2. Status Publikasi — toggle switch */}
              <div className="px-5 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Tampilkan ke pengguna</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {isActive ? 'Tema ini terlihat di katalog pengguna' : 'Tema ini tersembunyi dari pengguna'}
                    </p>
                  </div>
                  <button onClick={() => toggleStatus(editingRec)}
                    className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                      isActive ? 'bg-emerald-500' : 'bg-gray-200'
                    }`}>
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                      isActive ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              </div>

              <div className="mx-5 border-t border-gray-100" />

              {/* 3. Kategori */}
              <div className="px-5 py-4">
                <div className="flex items-center justify-between mb-2.5">
                  <p className="text-sm font-semibold text-gray-800">Kategori</p>
                  {selectedCat && <span className="text-[10px] text-indigo-600 font-semibold">{selectedCat.label}</span>}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {allCategories.map(c => {
                    const sel = (editData.category ?? editingRec.category) === c.slug
                    const count = records.filter(r => r.category === c.slug).length
                    return (
                      <button key={c.slug} onClick={() => setEditData({ ...editData, category: c.slug })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          sel
                            ? 'bg-gray-900 text-white border-gray-900'
                            : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700'
                        }`}>
                        {c.label}
                        {!sel && count > 0 && <span className="ml-1 text-gray-300">{count}</span>}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="mx-5 border-t border-gray-100" />

              {/* 4. Paket Harga */}
              <div className="px-5 py-4">
                <div className="flex items-center justify-between mb-2.5">
                  <p className="text-sm font-semibold text-gray-800">Paket Harga</p>
                  {selectedTier && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md" style={{ backgroundColor: `${selectedTier.color || '#6366f1'}15`, color: selectedTier.color || '#6366f1' }}>
                      {selectedTier.price === 0 ? 'Gratis' : formatRp(selectedTier.price)}
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  {allTiers.sort((a, b) => a.price - b.price).map(t => {
                    const sel = (editData.price ?? editingRec.price) === t.price
                    return (
                      <button key={t.id} onClick={() => setEditData({ ...editData, price: t.price })}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                          sel ? 'bg-gray-900' : 'hover:bg-gray-50'
                        }`}>
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                          sel ? 'bg-white border-white' : 'border-gray-300'
                        }`}>
                          {sel && <div className="w-2 h-2 rounded-full bg-gray-900" />}
                        </div>
                        <span className={`text-sm font-medium flex-1 ${sel ? 'text-white' : 'text-gray-700'}`}>{t.label}</span>
                        <span className={`text-xs font-semibold ${sel ? 'text-white/70' : 'text-gray-400'}`}>
                          {t.price === 0 ? 'Gratis' : formatRp(t.price)}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="mx-5 border-t border-gray-100" />

              {/* 5. Aksi */}
              <div className="px-5 py-4">
                <div className="flex gap-2">
                  <a href={`/demo/renderer?id=${editingRec.id}`} target="_blank" rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 transition-colors">
                    <ExternalLink className="w-3.5 h-3.5" /> Lihat Preview
                  </a>
                  {editingRec.status !== 'archived' ? (
                    <button onClick={() => requestArchive(editingRec)}
                      className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold border border-gray-200 text-amber-600 bg-white hover:bg-amber-50 hover:border-amber-200 transition-colors">
                      <Archive className="w-3.5 h-3.5" /> Arsipkan
                    </button>
                  ) : (
                    <button onClick={() => requestDelete(editingRec)}
                      className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold border border-gray-200 text-red-500 bg-white hover:bg-red-50 hover:border-red-200 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" /> Hapus
                    </button>
                  )}
                </div>
              </div>

            </div>

            {/* Footer simpan */}
            <div className="p-4 border-t border-gray-200/60 bg-white shrink-0">
              <button onClick={saveEdit} disabled={saving}
                className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 transition-colors">
                <Save className="w-4 h-4" /> {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
          )
        })()}
      </Drawer>

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
                      className="flex items-center gap-1.5 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors">
                      Lanjut <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button onClick={saveTierEditor} disabled={!d.label?.trim()}
                      className="flex items-center gap-1.5 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-40 transition-colors">
                      <Save className="w-4 h-4" /> {tierEditorId ? 'Simpan Perubahan' : 'Buat Paket'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })()}
      </Drawer>

      <ConfirmModal
        open={confirmModal.open}
        icon={confirmModal.action === 'delete' ? <Trash2 className="w-5 h-5 text-red-600" /> : <Archive className="w-5 h-5 text-amber-600" />}
        iconColor={confirmModal.action === 'delete' ? 'bg-red-100' : 'bg-amber-100'}
        title={confirmModal.action === 'delete' ? 'Hapus Permanen' : 'Arsipkan Tema'}
        message={confirmModal.action === 'delete'
          ? `"${confirmModal.targetName}" akan dihapus permanen dan tidak bisa dipulihkan.`
          : `"${confirmModal.targetName}" akan diarsipkan. Bisa diaktifkan kembali nanti.`}
        confirmLabel={confirmModal.action === 'delete' ? 'Ya, Hapus' : 'Ya, Arsipkan'}
        confirmColor={confirmModal.action === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700'}
        onConfirm={executeConfirm}
        onCancel={() => setConfirmModal(m => ({ ...m, open: false }))}
      />
    </div>
  )
}
