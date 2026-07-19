'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import toast from 'react-hot-toast'
import {
  Eye, Save, Loader2, Plus, Trash2,
  FileText, PenLine, ExternalLink,
  CheckCircle2, Clock, X, EyeOff,
  Heart, MessageCircle, Tag, Search,
  Settings2, ArrowLeft,
  AlertCircle, CheckCircle, XCircle,
  Megaphone as AdIcon, Link as LinkIcon,
  Star, Pin, Lock, MessageSquare, Hash, Type,
  Ban, Check, CalendarClock, Archive, RotateCcw, Layers,
} from 'lucide-react'
import ImagePicker from '@/components/ui/ImagePicker'
import RichTextEditor from '@/components/ui/RichTextEditor'
import { parseMarkdownPreview, slugify, wordCount, readTime } from '@/lib/article-markdown'
import { statusMeta, type ArticleStatus } from '@/lib/article-status'
import { SITE_DOMAIN, SITE_URL } from '@/lib/config'
import ArticleCategoriesManager from './ArticleCategoriesManager'
import BlogTypographyManager from './BlogTypographyManager'

interface CategoryOption { id: string; name: string; slug: string }

interface AuthorFilter { id: string; name: string }

// Run async work with bounded concurrency (bulk actions over many articles).
async function runLimited<T>(items: T[], limit: number, fn: (item: T) => Promise<unknown>) {
  let cursor = 0
  const worker = async () => {
    while (cursor < items.length) {
      const idx = cursor++
      await fn(items[idx])
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
}

// Legacy rows (published before the status column existed) can have
// status='draft' + isPublished=true — treat those as published for display.
function effStatus(a: { status?: string; isPublished: boolean }): ArticleStatus {
  if (a.status && a.status !== 'draft') return a.status as ArticleStatus
  if (a.isPublished) return 'published'
  return 'draft'
}

interface ArticleSettings {
  comments: {
    moderation: 'auto' | 'manual'
    bannedWords: string
    closeAfterDays: number
    requireLogin: boolean
    allowReplies: boolean
    maxLength: number
  }
  seo: {
    focusKeyword: string
    canonicalUrl: string
    ogImageUrl: string
    noIndex: boolean
  }
  ads: {
    enabled: boolean
    positions: string[]
    adCode: string
  }
  backlinks: {
    internal: string[]
    external: string[]
  }
  featured: boolean
  pinned: boolean
}

const DEFAULT_SETTINGS: ArticleSettings = {
  comments: { moderation: 'auto', bannedWords: '', closeAfterDays: 0, requireLogin: false, allowReplies: true, maxLength: 500 },
  seo: { focusKeyword: '', canonicalUrl: '', ogImageUrl: '', noIndex: false },
  ads: { enabled: false, positions: [], adCode: '' },
  backlinks: { internal: [], external: [] },
  featured: false,
  pinned: false,
}

interface ArticleData {
  id: string; title: string; slug: string; excerpt: string; content: string
  coverUrl: string; authorId: string | null; authorName: string; authorAvatar: string
  isPublished: boolean; publishedAt: string | null
  allowLikes: boolean; allowComments: boolean; likesCount: number; viewsCount: number
  metaTitle: string; metaDesc: string; tags: string; settings: ArticleSettings
  status: string; submittedAt: string | null; reviewNotes: string
  scheduledAt: string | null; reviewedBy: string | null; categoryId: string | null
  createdAt: string; updatedAt: string
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

interface SeoCheck { label: string; pass: boolean; hint: string }

function analyzeSeo(form: ArticleData): { score: number; checks: SeoCheck[]; grade: 'good' | 'ok' | 'poor' } {
  const kw = (form.settings.seo.focusKeyword || '').toLowerCase().trim()
  const title = (form.metaTitle || form.title).toLowerCase()
  const desc = (form.metaDesc || form.excerpt).toLowerCase()
  const content = form.content.toLowerCase()
  const titleLen = (form.metaTitle || form.title).length
  const descLen = (form.metaDesc || form.excerpt).length
  const wc = wordCount(form.content)
  const hasImages = /!\[.*?\]\(.*?\)/.test(form.content)
  const hasInternal = /\[.*?\]\(\//.test(form.content)
  const hasExternal = /\[.*?\]\(https?:\/\//.test(form.content)
  const firstPara = content.split('\n').find(l => l.trim() && !l.startsWith('#') && !l.startsWith('>') && !l.startsWith('-')) || ''

  const checks: SeoCheck[] = [
    { label: 'Focus keyword ditentukan', pass: !!kw, hint: 'Tentukan kata kunci utama yang ingin ditarget di halaman pencarian' },
    { label: 'Keyword ada di judul', pass: !!kw && title.includes(kw), hint: 'Pastikan kata kunci muncul di judul artikel untuk ranking lebih baik' },
    { label: 'Keyword ada di meta description', pass: !!kw && desc.includes(kw), hint: 'Meta description dengan keyword membantu click-through rate di Google' },
    { label: 'Keyword di paragraf pertama', pass: !!kw && firstPara.includes(kw), hint: 'Sebutkan keyword di 100 kata pertama agar Google memahami topik utama' },
    { label: 'Keyword di subjudul (H2/H3)', pass: !!kw && /^#{2,3}\s.*$/m.test(form.content) && form.content.split('\n').some(l => /^#{2,3}\s/.test(l) && l.toLowerCase().includes(kw)), hint: 'Gunakan keyword di minimal satu subjudul' },
    { label: `Panjang judul optimal (${titleLen}/50-60)`, pass: titleLen >= 30 && titleLen <= 65, hint: 'Judul 50-60 karakter agar tidak terpotong di hasil pencarian Google' },
    { label: `Meta description (${descLen}/150-160)`, pass: descLen >= 120 && descLen <= 165, hint: 'Deskripsi 150-160 karakter optimal untuk snippet Google' },
    { label: `Konten cukup panjang (${wc} kata)`, pass: wc >= 300, hint: 'Artikel minimal 300 kata. 1000+ kata lebih baik untuk ranking' },
    { label: 'Memiliki gambar', pass: hasImages, hint: 'Tambah minimal 1 gambar. Gambar meningkatkan engagement dan SEO' },
    { label: 'Ada internal link', pass: hasInternal, hint: 'Link ke halaman lain di website kamu (misal: /blog/artikel-lain)' },
    { label: 'Ada external link', pass: hasExternal, hint: 'Link ke sumber terpercaya meningkatkan kredibilitas artikel' },
    { label: 'Slug mengandung keyword', pass: !!kw && form.slug.includes(kw.replace(/\s+/g, '-')), hint: 'URL yang mengandung keyword membantu ranking pencarian' },
  ]

  const passed = checks.filter(c => c.pass).length
  const score = Math.round((passed / checks.length) * 100)
  const grade = score >= 75 ? 'good' : score >= 45 ? 'ok' : 'poor'
  return { score, checks, grade }
}

type ArticleTabView = 'articles' | 'categories' | 'typography'
type SortKey = 'recent' | 'views' | 'likes'

export default function ArticlesTab({ authorFilter, onClearAuthorFilter, onReviewed }: {
  authorFilter?: AuthorFilter | null
  onClearAuthorFilter?: () => void
  onReviewed?: () => void
} = {}) {
  const [view, setView] = useState<ArticleTabView>('articles')
  const [articlesList, setArticlesList] = useState<ArticleData[]>([])
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [loading, setLoading] = useState(true)
  const [editingArticle, setEditingArticle] = useState<ArticleData | null>(null)
  const [isNew, setIsNew] = useState(false)

  // Filters
  const [filterText, setFilterText] = useState('')
  const [debouncedFilter, setDebouncedFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | ArticleStatus>('all')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [authorId, setAuthorId] = useState('')
  const [dateField, setDateField] = useState<'created' | 'published'>('created')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sortBy, setSortBy] = useState<SortKey>('recent')

  // Bulk + quick actions
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [processing, setProcessing] = useState(false)
  const [rejectFor, setRejectFor] = useState<string | null>(null)
  const [scheduleFor, setScheduleFor] = useState<string | null>(null)
  const [bulkDelete, setBulkDelete] = useState(false)
  const [bulkCategory, setBulkCategory] = useState(false)

  const didAutoSelect = useRef(false)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedFilter(filterText), 250)
    return () => clearTimeout(t)
  }, [filterText])

  const fetchArticles = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/articles')
      if (!res.ok) throw new Error()
      const list: ArticleData[] = (await res.json()).articles
      setArticlesList(list)
      // On first load, jump straight to the review queue if there's work waiting.
      if (!didAutoSelect.current) {
        didAutoSelect.current = true
        if (!authorFilter && list.some(a => effStatus(a) === 'pending_review')) {
          setStatusFilter('pending_review')
        }
      }
    } catch { toast.error('Gagal memuat artikel') }
    finally { setLoading(false) }
  }, [authorFilter])

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/article-categories')
      if (res.ok) setCategories((await res.json()).categories)
    } catch { /* non-blocking */ }
  }, [])

  useEffect(() => { fetchArticles(); fetchCategories() }, [fetchArticles, fetchCategories])

  // Cross-link from the Writer tab: scope to a specific author.
  useEffect(() => {
    if (authorFilter) { setAuthorId(authorFilter.id); setView('articles'); setStatusFilter('all') }
  }, [authorFilter])

  const refreshAfterAction = async () => {
    setSelected(new Set())
    await fetchArticles()
    onReviewed?.()
  }

  async function reviewAction(id: string, action: 'approve' | 'reject' | 'schedule' | 'archive', extra?: Record<string, unknown>): Promise<boolean> {
    const res = await fetch(`/api/admin/articles/${id}/review`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...extra }),
    })
    return res.ok
  }

  async function patchArticle(id: string, data: Record<string, unknown>): Promise<boolean> {
    const res = await fetch(`/api/admin/articles/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    })
    return res.ok
  }

  // ── Quick (single-row) actions ──────────────────────────────────
  async function quickApprove(id: string) {
    setProcessing(true)
    const ok = await reviewAction(id, 'approve')
    setProcessing(false)
    if (ok) { toast.success('Artikel disetujui & dipublikaslikan'); await refreshAfterAction() }
    else toast.error('Gagal menyetujui')
  }
  async function submitReject(id: string, notes: string) {
    setProcessing(true)
    const ok = await reviewAction(id, 'reject', { notes })
    setProcessing(false); setRejectFor(null)
    if (ok) { toast.success('Revisi diminta ke penulis'); await refreshAfterAction() }
    else toast.error('Gagal meminta revisi')
  }
  async function submitSchedule(id: string, scheduledAt: string) {
    setProcessing(true)
    const ok = await reviewAction(id, 'schedule', { scheduledAt })
    setProcessing(false); setScheduleFor(null)
    if (ok) { toast.success('Artikel dijadwalkan'); await refreshAfterAction() }
    else toast.error('Gagal menjadwalkan')
  }
  // Back to draft (cancel schedule / unarchive) via the generic PATCH endpoint.
  async function backToDraft(id: string) {
    setProcessing(true)
    const ok = await patchArticle(id, { status: 'draft', isPublished: false, scheduledAt: null })
    setProcessing(false)
    if (ok) { toast.success('Dikembalikan ke draft'); await refreshAfterAction() }
    else toast.error('Gagal memproses')
  }

  // ── Bulk actions ────────────────────────────────────────────────
  const selectedIds = () => Array.from(selected)
  async function bulkApprove() {
    setProcessing(true)
    await runLimited(selectedIds(), 5, id => reviewAction(id, 'approve'))
    setProcessing(false); toast.success('Artikel terpilih disetujui'); await refreshAfterAction()
  }
  async function bulkArchive() {
    setProcessing(true)
    await runLimited(selectedIds(), 5, id => reviewAction(id, 'archive'))
    setProcessing(false); toast.success('Artikel terpilih diarsipkan'); await refreshAfterAction()
  }
  async function applyBulkCategory(categoryId: string | null) {
    setProcessing(true)
    await runLimited(selectedIds(), 5, id => patchArticle(id, { categoryId }))
    setProcessing(false); setBulkCategory(false); toast.success('Kategori diperbarui'); await refreshAfterAction()
  }
  async function applyBulkDelete() {
    setProcessing(true)
    await runLimited(selectedIds(), 5, id => fetch(`/api/admin/articles/${id}`, { method: 'DELETE' }))
    setProcessing(false); setBulkDelete(false); toast.success('Artikel terpilih dihapus'); await refreshAfterAction()
  }

  const handleNew = () => {
    setIsNew(true)
    setEditingArticle({
      id: '', title: '', slug: '', excerpt: '', content: '', coverUrl: '',
      authorId: null, authorName: 'Admin', authorAvatar: '',
      isPublished: false, publishedAt: null,
      allowLikes: true, allowComments: true, likesCount: 0, viewsCount: 0,
      metaTitle: '', metaDesc: '', tags: '',
      settings: { ...DEFAULT_SETTINGS, comments: { ...DEFAULT_SETTINGS.comments }, seo: { ...DEFAULT_SETTINGS.seo }, ads: { ...DEFAULT_SETTINGS.ads }, backlinks: { ...DEFAULT_SETTINGS.backlinks } },
      status: 'draft', submittedAt: null, reviewNotes: '', scheduledAt: null, reviewedBy: null, categoryId: null,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    })
  }

  if (editingArticle) {
    return <ArticleEditor article={editingArticle} isNew={isNew} onBack={() => { setEditingArticle(null); fetchArticles() }} />
  }

  if (loading) {
    return (
      <div className="h-full flex flex-col">
        <div className="px-8 pt-5 pb-4 border-b border-gray-100 bg-white">
          <h1 className="text-lg font-bold text-gray-900 tracking-tight">Artikel</h1>
          <p className="text-xs text-gray-400 mt-0.5">Kelola konten blog & SEO</p>
        </div>
        <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse">
              <div className="flex gap-3"><div className="w-20 h-20 rounded-lg bg-gray-100 shrink-0" /><div className="flex-1 space-y-2"><div className="h-4 w-48 bg-gray-100 rounded" /><div className="h-3 w-full bg-gray-50 rounded" /><div className="h-3 w-24 bg-gray-50 rounded" /></div></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── Derived data ────────────────────────────────────────────────
  const counts: Record<string, number> = { all: articlesList.length }
  for (const a of articlesList) { const s = effStatus(a); counts[s] = (counts[s] ?? 0) + 1 }
  const totalViews = articlesList.reduce((s, a) => s + a.viewsCount, 0)

  const authorOptions = Array.from(
    articlesList.reduce((m, a) => { if (a.authorId) m.set(a.authorId, a.authorName || 'Penulis'); return m }, new Map<string, string>())
  ).map(([id, name]) => ({ id, name }))

  const inDateRange = (a: ArticleData): boolean => {
    if (!dateFrom && !dateTo) return true
    const raw = dateField === 'published' ? a.publishedAt : a.createdAt
    if (!raw) return false
    const t = new Date(raw).getTime()
    if (dateFrom && t < new Date(dateFrom + 'T00:00:00').getTime()) return false
    if (dateTo && t > new Date(dateTo + 'T23:59:59').getTime()) return false
    return true
  }

  const filtered = articlesList
    .filter(a => {
      if (statusFilter !== 'all' && effStatus(a) !== statusFilter) return false
      if (categoryFilter && a.categoryId !== categoryFilter) return false
      if (authorId && a.authorId !== authorId) return false
      if (debouncedFilter && !a.title.toLowerCase().includes(debouncedFilter.toLowerCase())) return false
      if (!inDateRange(a)) return false
      return true
    })
    .sort((a, b) => {
      if (sortBy === 'views') return b.viewsCount - a.viewsCount
      if (sortBy === 'likes') return b.likesCount - a.likesCount
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })

  const summary = [
    { key: 'all', label: 'Total', value: articlesList.length, cls: 'text-gray-600 bg-gray-50', icon: FileText },
    { key: 'published', label: 'Published', value: counts.published ?? 0, cls: 'text-emerald-600 bg-emerald-50', icon: CheckCircle2 },
    { key: 'draft', label: 'Draft', value: counts.draft ?? 0, cls: 'text-gray-600 bg-gray-100', icon: EyeOff },
    { key: 'pending_review', label: 'Menunggu Review', value: counts.pending_review ?? 0, cls: 'text-amber-700 bg-amber-100', icon: Clock, accent: true },
    { key: 'scheduled', label: 'Terjadwal', value: counts.scheduled ?? 0, cls: 'text-blue-600 bg-blue-50', icon: CalendarClock },
    { key: 'archived', label: 'Diarsipkan', value: counts.archived ?? 0, cls: 'text-stone-600 bg-stone-100', icon: Archive },
    { key: 'views', label: 'Total Views', value: totalViews, cls: 'text-indigo-600 bg-indigo-50', icon: Eye },
  ]

  const allVisibleSelected = filtered.length > 0 && filtered.every(a => selected.has(a.id))
  const toggleAll = () => setSelected(allVisibleSelected ? new Set() : new Set(filtered.map(a => a.id)))
  const toggleOne = (id: string) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  return (
    <div className="h-full flex flex-col">
      <div className="px-8 pt-5 pb-0 border-b border-gray-100 bg-white">
        <h1 className="text-lg font-bold text-gray-900 tracking-tight">Artikel</h1>
        <p className="text-xs text-gray-400 mt-0.5 mb-3">Kelola konten blog, review & kategori</p>
        <div className="flex items-center gap-1">
          {([['articles', 'Artikel'], ['categories', 'Kategori'], ['typography', 'Tipografi']] as const).map(([id, label]) => (
            <button key={id} onClick={() => setView(id)}
              className={`px-3 py-2 text-xs font-semibold border-b-2 -mb-px transition-colors ${view === id ? 'border-forest-500 text-forest-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {view === 'categories' ? (
        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
          <ArticleCategoriesManager onChanged={fetchCategories} />
        </div>
      ) : view === 'typography' ? (
        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
          <BlogTypographyManager />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3 mb-6">
            {summary.map(stat => (
              <button key={stat.key} onClick={() => stat.key !== 'views' && setStatusFilter(stat.key as 'all' | ArticleStatus)}
                className={`text-left bg-white rounded-xl border p-3 transition-all ${stat.accent && stat.value > 0 ? 'border-amber-300 ring-1 ring-amber-200' : 'border-gray-100 hover:border-gray-200'}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${stat.cls}`}><stat.icon className="w-4 h-4" /></div>
                <p className="text-lg font-bold text-gray-900 leading-none">{stat.value}</p>
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mt-1">{stat.label}</p>
              </button>
            ))}
          </div>

          {/* Status tabs */}
          <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1">
            {(['all', 'draft', 'pending_review', 'needs_revision', 'scheduled', 'published', 'archived'] as const).map(s => {
              const label = s === 'all' ? 'Semua' : statusMeta(s).label
              const n = counts[s] ?? 0
              return (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={`shrink-0 px-3 py-1.5 text-[11px] font-medium rounded-lg transition-colors whitespace-nowrap ${statusFilter === s ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                  {label} <span className="opacity-70">({n})</span>
                </button>
              )
            })}
          </div>

          {/* Filter/sort row */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input type="text" value={filterText} onChange={e => setFilterText(e.target.value)} placeholder="Cari judul..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-forest-400" />
            </div>
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
              className="px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-forest-400 bg-white text-gray-600">
              <option value="">Semua kategori</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={authorId} onChange={e => setAuthorId(e.target.value)}
              className="px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-forest-400 bg-white text-gray-600">
              <option value="">Semua penulis</option>
              {authorOptions.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <select value={sortBy} onChange={e => setSortBy(e.target.value as SortKey)}
              className="px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-forest-400 bg-white text-gray-600">
              <option value="recent">Terbaru</option>
              <option value="views">Views terbanyak</option>
              <option value="likes">Likes terbanyak</option>
            </select>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <select value={dateField} onChange={e => setDateField(e.target.value as 'created' | 'published')}
                className="px-2 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-forest-400 bg-white text-gray-600">
                <option value="created">Dibuat</option>
                <option value="published">Publish</option>
              </select>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-forest-400 text-gray-600" />
              <span className="text-gray-300">–</span>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-forest-400 text-gray-600" />
            </div>
            <button onClick={handleNew}
              className="flex items-center gap-1.5 text-xs font-semibold bg-forest-500 text-white hover:bg-forest-600 px-4 py-2 rounded-lg transition-colors shrink-0 ml-auto">
              <Plus className="w-3.5 h-3.5" />Artikel Baru
            </button>
          </div>

          {authorFilter && (
            <div className="flex items-center gap-2 mb-3 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full">
                Penulis: {authorFilter.name}
                <button onClick={() => { setAuthorId(''); onClearAuthorFilter?.() }} className="hover:text-indigo-900"><X className="w-3 h-3" /></button>
              </span>
            </div>
          )}

          {/* Bulk toolbar */}
          {selected.size > 0 && (
            <div className="flex items-center gap-2 mb-3 p-2.5 bg-forest-50 border border-forest-200 rounded-xl flex-wrap">
              <span className="text-xs font-semibold text-forest-800 px-1">{selected.size} dipilih</span>
              <button disabled={processing} onClick={bulkApprove} className="flex items-center gap-1 text-xs font-medium text-emerald-700 bg-white border border-emerald-200 hover:bg-emerald-50 px-3 py-1.5 rounded-lg disabled:opacity-50"><Check className="w-3.5 h-3.5" />Setujui</button>
              <button disabled={processing} onClick={bulkArchive} className="flex items-center gap-1 text-xs font-medium text-stone-700 bg-white border border-stone-200 hover:bg-stone-50 px-3 py-1.5 rounded-lg disabled:opacity-50"><Archive className="w-3.5 h-3.5" />Arsipkan</button>
              <button disabled={processing} onClick={() => setBulkCategory(true)} className="flex items-center gap-1 text-xs font-medium text-indigo-700 bg-white border border-indigo-200 hover:bg-indigo-50 px-3 py-1.5 rounded-lg disabled:opacity-50"><Layers className="w-3.5 h-3.5" />Ubah Kategori</button>
              <button disabled={processing} onClick={() => setBulkDelete(true)} className="flex items-center gap-1 text-xs font-medium text-red-600 bg-white border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-lg disabled:opacity-50"><Trash2 className="w-3.5 h-3.5" />Hapus</button>
              {processing && <Loader2 className="w-4 h-4 animate-spin text-forest-500" />}
              <button onClick={() => setSelected(new Set())} className="ml-auto text-xs text-gray-500 hover:text-gray-700 px-2">Batalkan</button>
            </div>
          )}

          {/* List */}
          {filtered.length > 0 ? (
            <>
              <label className="flex items-center gap-2 mb-2 px-1 text-[11px] text-gray-400 cursor-pointer select-none">
                <input type="checkbox" checked={allVisibleSelected} onChange={toggleAll} className="w-3.5 h-3.5 rounded border-gray-300 text-forest-500 focus:ring-forest-400" />
                Pilih semua ({filtered.length})
              </label>
              <div className="space-y-2">
                {filtered.map(article => {
                  const st = effStatus(article)
                  const m = statusMeta(st)
                  const catName = categories.find(c => c.id === article.categoryId)?.name
                  return (
                    <div key={article.id} className={`bg-white rounded-xl border p-4 transition-all ${selected.has(article.id) ? 'border-forest-300 ring-1 ring-forest-200' : 'border-gray-100 hover:border-gray-200'}`}>
                      <div className="flex items-start gap-3">
                        <input type="checkbox" checked={selected.has(article.id)} onChange={() => toggleOne(article.id)}
                          className="mt-1 w-4 h-4 rounded border-gray-300 text-forest-500 focus:ring-forest-400 shrink-0" />
                        <button onClick={() => { setIsNew(false); setEditingArticle({ ...article }) }} className="flex items-start gap-4 flex-1 min-w-0 text-left group">
                          {article.coverUrl ? (
                            <img src={article.coverUrl} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0 bg-gray-100" />
                          ) : (
                            <div className="w-16 h-16 rounded-lg bg-gray-50 flex items-center justify-center shrink-0"><FileText className="w-6 h-6 text-gray-300" /></div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h3 className="text-sm font-semibold text-gray-900 truncate group-hover:text-forest-700 transition-colors">{article.title || 'Tanpa judul'}</h3>
                              {article.settings?.featured && <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />}
                              {article.settings?.pinned && <Pin className="w-3 h-3 text-indigo-400 shrink-0" />}
                              <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${m.badgeClass}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${m.dotClass}`} />{m.label}
                              </span>
                              {catName && <span className="text-[10px] font-medium bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-full shrink-0">{catName}</span>}
                            </div>
                            {st === 'needs_revision' && article.reviewNotes && (
                              <p className="text-[11px] text-red-700 bg-red-50 border border-red-100 rounded px-2 py-1 mb-1 line-clamp-1"><strong>Revisi:</strong> {article.reviewNotes}</p>
                            )}
                            {st === 'scheduled' && article.scheduledAt && (
                              <p className="text-[11px] text-blue-600 mb-1">Tayang {new Date(article.scheduledAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                            )}
                            <div className="flex items-center gap-3 text-[11px] text-gray-400 flex-wrap">
                              <span className="truncate max-w-[160px]">/blog/{article.slug}</span>
                              <span>{article.authorName}</span>
                              <span>{formatDate(article.updatedAt)}</span>
                              <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{article.viewsCount}</span>
                              <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{article.likesCount}</span>
                            </div>
                          </div>
                        </button>
                        {/* Quick actions */}
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          {st === 'pending_review' && (
                            <div className="flex items-center gap-1">
                              <button disabled={processing} onClick={() => quickApprove(article.id)} title="Setujui" className="flex items-center gap-1 text-[11px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-2.5 py-1.5 rounded-lg disabled:opacity-50"><Check className="w-3.5 h-3.5" />Setujui</button>
                              <button disabled={processing} onClick={() => setRejectFor(article.id)} title="Minta Revisi" className="p-1.5 text-red-600 border border-red-200 hover:bg-red-50 rounded-lg disabled:opacity-50"><RotateCcw className="w-3.5 h-3.5" /></button>
                              <button disabled={processing} onClick={() => setScheduleFor(article.id)} title="Jadwalkan" className="p-1.5 text-blue-600 border border-blue-200 hover:bg-blue-50 rounded-lg disabled:opacity-50"><CalendarClock className="w-3.5 h-3.5" /></button>
                            </div>
                          )}
                          {st === 'scheduled' && (
                            <button disabled={processing} onClick={() => backToDraft(article.id)} className="flex items-center gap-1 text-[11px] font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 px-2.5 py-1.5 rounded-lg disabled:opacity-50"><RotateCcw className="w-3.5 h-3.5" />Batalkan Jadwal</button>
                          )}
                          {st === 'archived' && (
                            <button disabled={processing} onClick={() => backToDraft(article.id)} className="flex items-center gap-1 text-[11px] font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 px-2.5 py-1.5 rounded-lg disabled:opacity-50"><RotateCcw className="w-3.5 h-3.5" />Pulihkan</button>
                          )}
                          {article.isPublished && (
                            <a href={`/blog/${article.slug}`} target="_blank" rel="noopener noreferrer" className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg"><ExternalLink className="w-3.5 h-3.5" /></a>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          ) : articlesList.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 py-16 text-center">
              <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-500 font-medium">Belum ada artikel</p>
              <p className="text-xs text-gray-400 mt-1 mb-4">Tulis artikel pertama untuk meningkatkan SEO dan engagement</p>
              <button onClick={handleNew} className="inline-flex items-center gap-1.5 text-xs font-semibold bg-forest-500 text-white hover:bg-forest-600 px-4 py-2 rounded-lg transition-colors"><Plus className="w-3.5 h-3.5" />Tulis Artikel</button>
            </div>
          ) : (
            <div className="text-center py-12 text-sm text-gray-400">Tidak ada artikel yang sesuai filter</div>
          )}
        </div>
      )}

      {/* Reject (request revision) modal */}
      {rejectFor && <RejectModal onCancel={() => setRejectFor(null)} onSubmit={notes => submitReject(rejectFor, notes)} processing={processing} />}
      {/* Schedule modal */}
      {scheduleFor && <ScheduleModal onCancel={() => setScheduleFor(null)} onSubmit={dt => submitSchedule(scheduleFor, dt)} processing={processing} />}
      {/* Bulk category modal */}
      {bulkCategory && <BulkCategoryModal categories={categories} onCancel={() => setBulkCategory(false)} onApply={applyBulkCategory} processing={processing} />}
      {/* Bulk delete confirm */}
      {bulkDelete && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center"><Trash2 className="w-5 h-5 text-red-500" /></div>
              <div><h3 className="text-sm font-bold text-gray-900">Hapus {selected.size} Artikel?</h3><p className="text-xs text-gray-500">Tindakan ini permanen dan tidak dapat dibatalkan.</p></div>
            </div>
            <div className="flex items-center gap-2 justify-end">
              <button onClick={() => setBulkDelete(false)} className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg">Batal</button>
              <button onClick={applyBulkDelete} disabled={processing} className="px-4 py-2 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg disabled:opacity-50">
                {processing && <Loader2 className="w-3.5 h-3.5 animate-spin inline mr-1" />}Hapus Semua
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function RejectModal({ onCancel, onSubmit, processing }: { onCancel: () => void; onSubmit: (notes: string) => void; processing: boolean }) {
  const [notes, setNotes] = useState('')
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2"><RotateCcw className="w-4 h-4 text-red-500" /><h3 className="font-bold text-gray-900 text-sm">Minta Revisi</h3></div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-700"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-5 py-4">
          <FieldLabel>Catatan untuk penulis</FieldLabel>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4} autoFocus
            placeholder="Jelaskan apa yang perlu diperbaiki sebelum artikel bisa dipublikasikan..."
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-forest-400 resize-none" />
          <p className="text-[10px] text-gray-400 mt-1">Catatan ini tampil di editor penulis (banner revisi).</p>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-100 bg-gray-50">
          <button onClick={onCancel} className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg">Batal</button>
          <button onClick={() => onSubmit(notes)} disabled={processing || !notes.trim()} className="px-4 py-2 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg disabled:opacity-50">
            {processing && <Loader2 className="w-3.5 h-3.5 animate-spin inline mr-1" />}Kirim Revisi
          </button>
        </div>
      </div>
    </div>
  )
}

function ScheduleModal({ onCancel, onSubmit, processing }: { onCancel: () => void; onSubmit: (dt: string) => void; processing: boolean }) {
  const [dt, setDt] = useState('')
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2"><CalendarClock className="w-4 h-4 text-blue-500" /><h3 className="font-bold text-gray-900 text-sm">Jadwalkan Publikasi</h3></div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-700"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-5 py-4">
          <FieldLabel>Waktu tayang</FieldLabel>
          <input type="datetime-local" value={dt} onChange={e => setDt(e.target.value)} autoFocus
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-forest-400" />
          <p className="text-[10px] text-gray-400 mt-1">Artikel otomatis dipublikasikan oleh sistem saat waktu tiba.</p>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-100 bg-gray-50">
          <button onClick={onCancel} className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg">Batal</button>
          <button onClick={() => dt && onSubmit(new Date(dt).toISOString())} disabled={processing || !dt} className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50">
            {processing && <Loader2 className="w-3.5 h-3.5 animate-spin inline mr-1" />}Jadwalkan
          </button>
        </div>
      </div>
    </div>
  )
}

function BulkCategoryModal({ categories, onCancel, onApply, processing }: { categories: CategoryOption[]; onCancel: () => void; onApply: (categoryId: string | null) => void; processing: boolean }) {
  const [cat, setCat] = useState('')
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2"><Layers className="w-4 h-4 text-indigo-500" /><h3 className="font-bold text-gray-900 text-sm">Ubah Kategori</h3></div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-700"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-5 py-4">
          <FieldLabel>Kategori baru</FieldLabel>
          <select value={cat} onChange={e => setCat(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-forest-400 bg-white">
            <option value="">— Tanpa kategori —</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-100 bg-gray-50">
          <button onClick={onCancel} className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg">Batal</button>
          <button onClick={() => onApply(cat || null)} disabled={processing} className="px-4 py-2 text-xs font-semibold text-white bg-forest-500 hover:bg-forest-600 rounded-lg disabled:opacity-50">
            {processing && <Loader2 className="w-3.5 h-3.5 animate-spin inline mr-1" />}Terapkan
          </button>
        </div>
      </div>
    </div>
  )
}

type EditorPanel = 'write' | 'preview'
type SettingsSection = 'engagement' | 'comments' | 'seo' | 'ads' | 'meta'

function ArticleEditor({ article, isNew, onBack }: { article: ArticleData; isNew: boolean; onBack: () => void }) {
  const [form, setForm] = useState(article)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [activePanel, setActivePanel] = useState<EditorPanel>('write')
  const [showSettings, setShowSettings] = useState(false)
  const [settingsSection, setSettingsSection] = useState<SettingsSection>('engagement')
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (isNew) titleRef.current?.focus() }, [isNew])

  const set = (key: keyof ArticleData, value: unknown) => {
    setForm(prev => {
      const next = { ...prev, [key]: value }
      if (key === 'title' && isNew) next.slug = slugify(value as string)
      return next
    })
  }

  const updateSettings = (path: string, value: unknown) => {
    setForm(prev => {
      const s = JSON.parse(JSON.stringify(prev.settings)) as ArticleSettings
      const keys = path.split('.')
      let obj: Record<string, unknown> = s as unknown as Record<string, unknown>
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]] as Record<string, unknown>
      obj[keys[keys.length - 1]] = value
      return { ...prev, settings: s }
    })
  }

  const handleSave = async (publish?: boolean) => {
    if (!form.title.trim()) { toast.error('Judul wajib diisi'); return }
    if (!form.slug.trim()) { toast.error('Slug wajib diisi'); return }
    setSaving(true)
    try {
      const data: Record<string, unknown> = {
        title: form.title, slug: form.slug, excerpt: form.excerpt, content: form.content,
        coverUrl: form.coverUrl, allowLikes: form.allowLikes, allowComments: form.allowComments,
        metaTitle: form.metaTitle, metaDesc: form.metaDesc, tags: form.tags, settings: form.settings,
      }
      if (publish !== undefined) {
        data.isPublished = publish
        data.publishedAt = publish ? new Date().toISOString() : null
      }
      const url = isNew ? '/api/admin/articles' : `/api/admin/articles/${form.id}`
      const res = await fetch(url, { method: isNew ? 'POST' : 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      if (!res.ok) { const err = await res.json(); toast.error(err.error || 'Gagal menyimpan'); return }
      toast.success(publish ? 'Artikel dipublikasikan!' : 'Artikel tersimpan')
      onBack()
    } catch { toast.error('Gagal menyimpan') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try { await fetch(`/api/admin/articles/${form.id}`, { method: 'DELETE' }); toast.success('Artikel dihapus'); onBack() }
    catch { toast.error('Gagal menghapus') }
    finally { setDeleting(false); setShowDeleteConfirm(false) }
  }

  const handleTogglePublish = async () => {
    if (isNew) return
    setSaving(true)
    try {
      const newState = !form.isPublished
      const res = await fetch(`/api/admin/articles/${form.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: newState, publishedAt: newState ? new Date().toISOString() : null }),
      })
      if (!res.ok) throw new Error()
      toast.success(newState ? 'Artikel dipublikasikan!' : 'Artikel dijadikan draft')
      onBack()
    } catch { toast.error('Gagal mengubah status') }
    finally { setSaving(false) }
  }

  // Auto-track links inserted from the editor into settings.backlinks (dedup).
  const addBacklink = (url: string, internal: boolean) => {
    const key = internal ? 'internal' : 'external'
    const list = form.settings.backlinks[key]
    if (!url || list.includes(url)) return
    updateSettings(`backlinks.${key}`, [...list, url])
  }

  const wc = wordCount(form.content)
  const rt = readTime(form.content)
  const seo = useMemo(() => analyzeSeo(form), [form])

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 lg:px-6 py-2.5 bg-white border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors p-1">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="h-5 w-px bg-gray-200" />
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
            {([['write', PenLine, 'Tulis'], ['preview', Eye, 'Preview']] as const).map(([id, Icon, label]) => (
              <button key={id} onClick={() => setActivePanel(id)}
                className={`px-3 py-1.5 text-[11px] font-medium rounded-md transition-colors flex items-center gap-1 ${activePanel === id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                <Icon className="w-3 h-3" />{label}
              </button>
            ))}
          </div>
          <button onClick={() => setShowSettings(true)}
            className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
            <Settings2 className="w-3 h-3" />Pengaturan
          </button>
          <button onClick={() => { setSettingsSection('seo'); setShowSettings(true) }}
            className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full transition-colors ${seo.grade === 'good' ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : seo.grade === 'ok' ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}>
            {seo.grade === 'good' ? <CheckCircle className="w-3 h-3" /> : seo.grade === 'ok' ? <AlertCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
            SEO {seo.score}%
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-400 hidden lg:inline">{wc} kata &middot; {rt} mnt baca</span>
          {!isNew && (
            <>
              <button onClick={handleTogglePublish} disabled={saving}
                className={`flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${form.isPublished ? 'text-gray-600 border-gray-200 hover:bg-gray-50' : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'}`}>
                {form.isPublished ? <><EyeOff className="w-3.5 h-3.5" />Draft</> : <><Eye className="w-3.5 h-3.5" />Publish</>}
              </button>
              {form.isPublished && (
                <a href={`/blog/${form.slug}`} target="_blank" rel="noopener noreferrer"
                  className="p-1.5 text-indigo-600 border border-indigo-200 hover:bg-indigo-50 rounded-lg transition-colors"><ExternalLink className="w-3.5 h-3.5" /></a>
              )}
              <button onClick={() => setShowDeleteConfirm(true)} className="p-1.5 text-red-500 border border-red-200 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
            </>
          )}
          <button onClick={() => handleSave(isNew ? false : undefined)} disabled={saving}
            className="flex items-center gap-1.5 text-xs font-semibold bg-forest-500 text-white hover:bg-forest-600 px-4 py-2 rounded-lg transition-colors disabled:opacity-50">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}Simpan
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activePanel === 'write' && <WritePanel form={form} set={set} titleRef={titleRef} onInsertLink={addBacklink} />}
        {activePanel === 'preview' && <PreviewPanel form={form} />}
      </div>

      {/* Slide-over Pengaturan (slug, excerpt di WritePanel; sisanya di sini) */}
      {showSettings && (
        <div className="fixed inset-0 z-[150] flex justify-end">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowSettings(false)} />
          <div className="relative w-full max-w-2xl bg-white shadow-2xl h-full flex flex-col">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-gray-500" />
                <h3 className="text-sm font-bold text-gray-900">Pengaturan Artikel</h3>
              </div>
              <button onClick={() => setShowSettings(false)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 min-h-0">
              <SettingsPanel form={form} set={set} updateSettings={updateSettings} seo={seo} isNew={isNew} settingsSection={settingsSection} setSettingsSection={setSettingsSection} onDelete={() => { setShowSettings(false); setShowDeleteConfirm(true) }} />
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center"><Trash2 className="w-5 h-5 text-red-500" /></div>
              <div><h3 className="text-sm font-bold text-gray-900">Hapus Artikel?</h3><p className="text-xs text-gray-500">Tindakan ini tidak dapat dibatalkan.</p></div>
            </div>
            <div className="flex items-center gap-2 justify-end">
              <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Batal</button>
              <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50">
                {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin inline mr-1" />}Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function WritePanel({ form, set, titleRef, onInsertLink }: {
  form: ArticleData; set: (k: keyof ArticleData, v: unknown) => void
  titleRef: React.RefObject<HTMLInputElement | null>
  onInsertLink: (url: string, internal: boolean) => void
}) {
  return (
    <div className="max-w-4xl mx-auto px-6 lg:px-8 py-6">
      <input ref={titleRef} type="text" value={form.title} onChange={e => set('title', e.target.value)}
        placeholder="Judul artikel..." className="w-full text-2xl lg:text-3xl font-bold text-gray-900 placeholder:text-gray-300 border-0 outline-none bg-transparent mb-3" />

      <div className="flex items-center gap-2 mb-6">
        <span className="text-xs text-gray-400 shrink-0">/blog/</span>
        <input type="text" value={form.slug} onChange={e => set('slug', slugify(e.target.value as string))}
          placeholder="url-slug" className="flex-1 text-sm font-mono text-gray-600 placeholder:text-gray-300 border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:border-forest-400" />
      </div>

      <div className="mb-6">
        <FieldLabel>Cover Image</FieldLabel>
        <ImagePicker value={form.coverUrl} onChange={url => set('coverUrl', url)} uploadUrl="/api/admin/upload" folder="covers" variant="cover" />
      </div>

      <div className="mb-6">
        <FieldLabel>Ringkasan</FieldLabel>
        <textarea value={form.excerpt} onChange={e => set('excerpt', e.target.value)} rows={2} placeholder="Ringkasan singkat untuk preview & SEO (150-160 karakter optimal)..."
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-forest-400 transition-colors resize-none" />
        <p className={`text-[10px] mt-1 ${form.excerpt.length > 160 ? 'text-red-400' : form.excerpt.length >= 120 ? 'text-emerald-500' : 'text-gray-400'}`}>{form.excerpt.length}/160 karakter</p>
      </div>

      <div className="mb-6">
        <FieldLabel>Konten</FieldLabel>
        <RichTextEditor value={form.content} onChange={v => set('content', v)} uploadUrl="/api/admin/upload" folder="assets" onInsertLink={info => onInsertLink(info.url, info.internal)} />
        <div className="flex items-center justify-end mt-1.5">
          <p className="text-[10px] text-gray-400">{wordCount(form.content)} kata &middot; {readTime(form.content)} mnt baca</p>
        </div>
      </div>
    </div>
  )
}

function PreviewPanel({ form }: { form: ArticleData }) {
  const html = useMemo(() => parseMarkdownPreview(form.content), [form.content])
  const rt = readTime(form.content)

  return (
    <div className="max-w-3xl mx-auto px-6 lg:px-8 py-8">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {form.coverUrl && (
          <div className="aspect-[2/1] overflow-hidden bg-gray-100">
            <img src={form.coverUrl} alt={form.title} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="px-8 py-8 sm:px-10 sm:py-10">
          <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
            {form.publishedAt && <span>{formatDate(form.publishedAt)}</span>}
            <span>{rt} menit baca</span>
            {form.tags && form.tags.split(',').filter(Boolean).map((tag, i) => (
              <span key={i} className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full text-[10px]">{tag.trim()}</span>
            ))}
          </div>
          <h1 style={{ fontFamily: "var(--font-geist-sans), sans-serif", fontSize: '2rem', fontWeight: 700, color: '#1c1917', lineHeight: 1.25, marginBottom: '0.75rem' }}>
            {form.title || 'Judul Artikel'}
          </h1>
          {form.excerpt && <p style={{ fontSize: '1.1rem', color: '#a8a29e', lineHeight: 1.6, marginBottom: '2rem' }}>{form.excerpt}</p>}

          <div className="markdown-content" dangerouslySetInnerHTML={{ __html: html }} />

          <div className="mt-10 pt-6 border-t border-gray-100 flex items-center gap-4">
            {form.allowLikes && (
              <button className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-pink-500 transition-colors">
                <Heart className="w-4 h-4" /> {form.likesCount} Suka
              </button>
            )}
            {form.allowComments && (
              <button className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-forest-600 transition-colors">
                <MessageCircle className="w-4 h-4" /> Komentar
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white rounded-xl border border-gray-100 p-5">
        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mb-3">Preview Hasil Pencarian Google</p>
        <div className="space-y-0.5">
          <p className="text-lg text-blue-700 font-medium truncate">{form.metaTitle || form.title || 'Judul Artikel'}</p>
          <p className="text-sm text-emerald-700">{SITE_DOMAIN}/blog/{form.slug || 'slug'}</p>
          <p className="text-sm text-gray-500 line-clamp-2">{form.metaDesc || form.excerpt || 'Deskripsi artikel akan muncul di sini...'}</p>
        </div>
      </div>
    </div>
  )
}

function SettingsPanel({ form, set, updateSettings, seo, isNew, settingsSection, setSettingsSection, onDelete }: {
  form: ArticleData; set: (k: keyof ArticleData, v: unknown) => void; updateSettings: (path: string, v: unknown) => void
  seo: ReturnType<typeof analyzeSeo>; isNew: boolean; settingsSection: SettingsSection; setSettingsSection: (s: SettingsSection) => void
  onDelete: () => void
}) {
  const NAV: { id: SettingsSection; icon: React.ElementType; label: string }[] = [
    { id: 'engagement', icon: Heart, label: 'Engagement' },
    { id: 'comments', icon: MessageSquare, label: 'Komentar' },
    { id: 'seo', icon: Search, label: 'SEO & Meta' },
    { id: 'ads', icon: AdIcon, label: 'Iklan & Backlink' },
    { id: 'meta', icon: Settings2, label: 'Lainnya' },
  ]

  return (
    <div className="flex h-full">
      <div className="w-48 shrink-0 border-r border-gray-100 bg-gray-50/50 py-4 px-2">
        {NAV.map(n => (
          <button key={n.id} onClick={() => setSettingsSection(n.id)}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-xs font-medium transition-colors mb-0.5 ${settingsSection === n.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-white/60'}`}>
            <n.icon className="w-3.5 h-3.5" />{n.label}
            {n.id === 'seo' && (
              <span className={`ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full ${seo.grade === 'good' ? 'bg-emerald-100 text-emerald-600' : seo.grade === 'ok' ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'}`}>{seo.score}%</span>
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="max-w-2xl">
          {settingsSection === 'engagement' && (
            <div className="space-y-5">
              <SectionHeader icon={Heart} title="Engagement" desc="Kontrol interaksi pengunjung" />
              <Card>
                <ToggleRow label="Like / Suka" desc="Pengunjung dapat memberikan like pada artikel" icon={<Heart className="w-4 h-4" />} checked={form.allowLikes} onChange={v => set('allowLikes', v)} />
                <ToggleRow label="Komentar" desc="Pengunjung dapat memberikan komentar pada artikel" icon={<MessageCircle className="w-4 h-4" />} checked={form.allowComments} onChange={v => set('allowComments', v)} />
                <ToggleRow label="Artikel Unggulan" desc="Tampilkan dengan badge bintang di daftar artikel" icon={<Star className="w-4 h-4" />} checked={form.settings.featured} onChange={v => updateSettings('featured', v)} />
                <ToggleRow label="Sematkan (Pin)" desc="Artikel akan selalu muncul di posisi teratas" icon={<Pin className="w-4 h-4" />} checked={form.settings.pinned} onChange={v => updateSettings('pinned', v)} />
              </Card>
              {!isNew && (
                <Card>
                  <p className="text-xs font-semibold text-gray-600 mb-3">Statistik</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-xl font-bold text-gray-900">{form.viewsCount}</p>
                      <p className="text-[10px] text-gray-400 font-medium uppercase">Views</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-xl font-bold text-gray-900">{form.likesCount}</p>
                      <p className="text-[10px] text-gray-400 font-medium uppercase">Likes</p>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}

          {settingsSection === 'comments' && (
            <div className="space-y-5">
              <SectionHeader icon={MessageSquare} title="Pengaturan Komentar" desc="Moderasi dan filter komentar pengunjung" />
              <Card>
                <p className="text-xs font-semibold text-gray-600 mb-3">Mode Moderasi</p>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {([['auto', 'Otomatis', 'Komentar langsung tampil tanpa persetujuan'], ['manual', 'Manual', 'Semua komentar harus disetujui admin']] as const).map(([val, label, desc]) => (
                    <button key={val} onClick={() => updateSettings('comments.moderation', val)}
                      className={`text-left p-3 rounded-lg border-2 transition-all ${form.settings.comments.moderation === val ? 'border-forest-400 bg-forest-50' : 'border-gray-100 hover:border-gray-200'}`}>
                      <p className="text-sm font-semibold text-gray-800">{label}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{desc}</p>
                    </button>
                  ))}
                </div>

                <ToggleRow label="Wajib Login" desc="Pengunjung harus login untuk berkomentar" icon={<Lock className="w-4 h-4" />} checked={form.settings.comments.requireLogin} onChange={v => updateSettings('comments.requireLogin', v)} />
                <ToggleRow label="Izinkan Balasan" desc="Pengunjung bisa membalas komentar lain" icon={<MessageCircle className="w-4 h-4" />} checked={form.settings.comments.allowReplies} onChange={v => updateSettings('comments.allowReplies', v)} />
              </Card>

              <Card>
                <div className="flex items-center gap-2 mb-3">
                  <Ban className="w-4 h-4 text-red-500" />
                  <p className="text-xs font-semibold text-gray-600">Kata-kata Terlarang</p>
                </div>
                <p className="text-[11px] text-gray-400 mb-2">Komentar yang mengandung kata-kata ini akan otomatis ditolak atau ditahan untuk review. Pisahkan dengan koma.</p>
                <textarea value={form.settings.comments.bannedWords} onChange={e => updateSettings('comments.bannedWords', e.target.value)} rows={3}
                  placeholder="spam, promosi, judi, togel, pinjol, bodong, tipu, scam"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-forest-400 transition-colors resize-none font-mono" />
                {form.settings.comments.bannedWords && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {form.settings.comments.bannedWords.split(',').map((w, i) => w.trim() && (
                      <span key={i} className="text-[10px] font-medium bg-red-50 text-red-600 border border-red-100 px-2 py-0.5 rounded-full">{w.trim()}</span>
                    ))}
                  </div>
                )}
              </Card>

              <Card>
                <p className="text-xs font-semibold text-gray-600 mb-3">Batasan</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FieldLabel>Maks. panjang komentar</FieldLabel>
                    <div className="flex items-center gap-2">
                      <input type="number" value={form.settings.comments.maxLength} onChange={e => updateSettings('comments.maxLength', parseInt(e.target.value) || 500)} min={50} max={5000}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-forest-400" />
                      <span className="text-xs text-gray-400 shrink-0">karakter</span>
                    </div>
                  </div>
                  <div>
                    <FieldLabel>Tutup komentar setelah</FieldLabel>
                    <div className="flex items-center gap-2">
                      <input type="number" value={form.settings.comments.closeAfterDays} onChange={e => updateSettings('comments.closeAfterDays', parseInt(e.target.value) || 0)} min={0} max={365}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-forest-400" />
                      <span className="text-xs text-gray-400 shrink-0">hari (0 = tidak pernah)</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {settingsSection === 'seo' && (
            <div className="space-y-5">
              <SectionHeader icon={Search} title="SEO & Meta" desc="Optimasi agar artikel muncul di halaman 1 Google" />

              <Card>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${seo.grade === 'good' ? 'bg-emerald-100 text-emerald-600' : seo.grade === 'ok' ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'}`}>
                      {seo.score}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        {seo.grade === 'good' ? 'SEO Bagus!' : seo.grade === 'ok' ? 'Perlu Perbaikan' : 'SEO Lemah'}
                      </p>
                      <p className="text-[11px] text-gray-400">{seo.checks.filter(c => c.pass).length}/{seo.checks.length} kriteria terpenuhi</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {seo.checks.map((check, i) => (
                    <div key={i} className="flex items-start gap-2 py-1.5">
                      {check.pass ? <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />}
                      <div>
                        <p className={`text-xs font-medium ${check.pass ? 'text-gray-700' : 'text-gray-900'}`}>{check.label}</p>
                        {!check.pass && <p className="text-[10px] text-gray-400 mt-0.5">{check.hint}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <div className="flex items-center gap-2 mb-3">
                  <Hash className="w-4 h-4 text-indigo-500" />
                  <p className="text-xs font-semibold text-gray-600">Focus Keyword</p>
                </div>
                <p className="text-[11px] text-gray-400 mb-2">Kata kunci utama yang ingin kamu targetkan di Google. Pilih 1 keyword per artikel.</p>
                <input type="text" value={form.settings.seo.focusKeyword} onChange={e => updateSettings('seo.focusKeyword', e.target.value)}
                  placeholder="contoh: undangan digital murah"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-forest-400 transition-colors" />
                {form.settings.seo.focusKeyword && (
                  <div className="mt-2 p-2.5 bg-blue-50 rounded-lg">
                    <p className="text-[10px] text-blue-700 font-medium">Tips penggunaan keyword:</p>
                    <ul className="text-[10px] text-blue-600 mt-1 space-y-0.5 list-disc pl-4">
                      <li>Gunakan di judul artikel (di awal lebih baik)</li>
                      <li>Sebutkan di paragraf pertama secara natural</li>
                      <li>Masukkan di minimal 1 subjudul (H2/H3)</li>
                      <li>Gunakan variasi keyword (sinonim, long-tail)</li>
                      <li>Jangan berlebihan (keyword stuffing = penalti Google)</li>
                    </ul>
                  </div>
                )}
              </Card>

              <Card>
                <p className="text-xs font-semibold text-gray-600 mb-3">Meta Tags</p>
                <div className="space-y-4">
                  <div>
                    <FieldLabel>Meta Title</FieldLabel>
                    <input type="text" value={form.metaTitle} onChange={e => set('metaTitle', e.target.value)}
                      placeholder={form.title || 'Judul untuk mesin pencari...'} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-forest-400 transition-colors" />
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-[10px] text-gray-400">Optimal: 50-60 karakter. Lebih dari 60 akan terpotong di Google.</p>
                      <p className={`text-[10px] font-medium ${(form.metaTitle || form.title).length > 65 ? 'text-red-400' : (form.metaTitle || form.title).length >= 30 ? 'text-emerald-500' : 'text-gray-400'}`}>{(form.metaTitle || form.title).length}/60</p>
                    </div>
                  </div>
                  <div>
                    <FieldLabel>Meta Description</FieldLabel>
                    <textarea value={form.metaDesc} onChange={e => set('metaDesc', e.target.value)} rows={3}
                      placeholder={form.excerpt || 'Deskripsi 150-160 karakter yang menarik pengunjung klik...'} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-forest-400 transition-colors resize-none" />
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-[10px] text-gray-400">Buat deskripsi yang menarik + mengandung keyword. Ini yang muncul di Google.</p>
                      <p className={`text-[10px] font-medium ${(form.metaDesc || form.excerpt).length > 165 ? 'text-red-400' : (form.metaDesc || form.excerpt).length >= 120 ? 'text-emerald-500' : 'text-gray-400'}`}>{(form.metaDesc || form.excerpt).length}/160</p>
                    </div>
                  </div>
                  <div>
                    <FieldLabel>Canonical URL (opsional)</FieldLabel>
                    <input type="text" value={form.settings.seo.canonicalUrl} onChange={e => updateSettings('seo.canonicalUrl', e.target.value)}
                      placeholder={`${SITE_URL}/blog/...`}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-forest-400 transition-colors" />
                    <p className="text-[10px] text-gray-400 mt-1">Isi jika konten ini duplikat dari URL lain. Biarkan kosong jika ini konten original.</p>
                  </div>
                  <div>
                    <FieldLabel>OG Image URL (opsional)</FieldLabel>
                    <input type="text" value={form.settings.seo.ogImageUrl} onChange={e => updateSettings('seo.ogImageUrl', e.target.value)}
                      placeholder={form.coverUrl || 'URL gambar untuk social share'}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-forest-400 transition-colors" />
                    <p className="text-[10px] text-gray-400 mt-1">Gambar yang muncul saat artikel di-share di sosial media. Default: cover image.</p>
                  </div>
                  <ToggleRow label="No Index" desc="Sembunyikan artikel ini dari mesin pencari" icon={<EyeOff className="w-4 h-4" />} checked={form.settings.seo.noIndex} onChange={v => updateSettings('seo.noIndex', v)} />
                </div>
              </Card>

              <Card>
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="w-4 h-4 text-indigo-500" />
                  <p className="text-xs font-semibold text-gray-600">Tags</p>
                </div>
                <input type="text" value={form.tags} onChange={e => set('tags', e.target.value)}
                  placeholder="pernikahan, tips, undangan digital (pisahkan dengan koma)"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-forest-400 transition-colors" />
                {form.tags && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {form.tags.split(',').map((tag, i) => tag.trim() && (
                      <span key={i} className="text-[10px] font-medium bg-indigo-50 text-indigo-600 border border-indigo-100 px-2 py-0.5 rounded-full">{tag.trim()}</span>
                    ))}
                  </div>
                )}
              </Card>

              <Card>
                <div className="flex items-center gap-2 mb-3">
                  <LinkIcon className="w-4 h-4 text-blue-500" />
                  <p className="text-xs font-semibold text-gray-600">Daftar Backlink</p>
                </div>
                <p className="text-[11px] text-gray-400 mb-2">Terisi otomatis saat kamu menyisipkan link di konten. Internal = navigasi & SEO on-site, Eksternal = kredibilitas.</p>
                {(form.settings.backlinks.internal.length + form.settings.backlinks.external.length) === 0 ? (
                  <p className="text-[11px] text-gray-400 italic">Belum ada backlink.</p>
                ) : (
                  <div className="space-y-1.5">
                    {form.settings.backlinks.internal.map((u, i) => (
                      <BacklinkRow key={`i-${i}`} url={u} internal onRemove={() => updateSettings('backlinks.internal', form.settings.backlinks.internal.filter((_, j) => j !== i))} />
                    ))}
                    {form.settings.backlinks.external.map((u, i) => (
                      <BacklinkRow key={`e-${i}`} url={u} internal={false} onRemove={() => updateSettings('backlinks.external', form.settings.backlinks.external.filter((_, j) => j !== i))} />
                    ))}
                  </div>
                )}
              </Card>

              <Card>
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mb-3">Preview Hasil Google</p>
                <div className="space-y-0.5 p-3 bg-white rounded-lg border border-gray-100">
                  <p className="text-lg text-blue-700 font-medium truncate">{form.metaTitle || form.title || 'Judul Artikel'}</p>
                  <p className="text-sm text-emerald-700">{SITE_DOMAIN}/blog/{form.slug || 'slug'}</p>
                  <p className="text-sm text-gray-500 line-clamp-2">{form.metaDesc || form.excerpt || 'Deskripsi artikel akan muncul di sini...'}</p>
                </div>
              </Card>
            </div>
          )}

          {settingsSection === 'ads' && (
            <div className="space-y-5">
              <SectionHeader icon={AdIcon} title="Iklan & Backlink" desc="Monetisasi dan manajemen link" />

              <Card>
                <div className="flex items-center gap-2 mb-3">
                  <AdIcon className="w-4 h-4 text-amber-500" />
                  <p className="text-xs font-semibold text-gray-600">Iklan In-Article</p>
                </div>
                <ToggleRow label="Tampilkan Iklan" desc="Sisipkan iklan di antara paragraf konten" icon={<AdIcon className="w-4 h-4" />} checked={form.settings.ads.enabled} onChange={v => updateSettings('ads.enabled', v)} />

                {form.settings.ads.enabled && (
                  <div className="mt-3 space-y-3">
                    <div>
                      <FieldLabel>Posisi Iklan</FieldLabel>
                      <p className="text-[10px] text-gray-400 mb-2">Pilih di mana iklan akan ditampilkan</p>
                      <div className="space-y-1.5">
                        {[
                          { id: 'after-p2', label: 'Setelah paragraf ke-2' },
                          { id: 'after-p4', label: 'Setelah paragraf ke-4' },
                          { id: 'middle', label: 'Tengah artikel' },
                          { id: 'end', label: 'Akhir artikel' },
                        ].map(pos => (
                          <label key={pos.id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                            <input type="checkbox" checked={form.settings.ads.positions.includes(pos.id)}
                              onChange={e => {
                                const positions = e.target.checked
                                  ? [...form.settings.ads.positions, pos.id]
                                  : form.settings.ads.positions.filter(p => p !== pos.id)
                                updateSettings('ads.positions', positions)
                              }}
                              className="w-4 h-4 rounded border-gray-300 text-forest-500 focus:ring-forest-400" />
                            {pos.label}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <FieldLabel>Kode Iklan (HTML/Script)</FieldLabel>
                      <textarea value={form.settings.ads.adCode} onChange={e => updateSettings('ads.adCode', e.target.value)} rows={4}
                        placeholder={"<!-- Google AdSense atau kode iklan lainnya -->\n<ins class=\"adsbygoogle\" ...></ins>"}
                        className="w-full px-3 py-2 text-sm font-mono border border-gray-200 rounded-lg outline-none focus:border-forest-400 transition-colors resize-none" />
                    </div>
                  </div>
                )}
              </Card>

              <Card>
                <div className="flex items-center gap-2 mb-3">
                  <LinkIcon className="w-4 h-4 text-blue-500" />
                  <p className="text-xs font-semibold text-gray-600">Internal Links (Backlink)</p>
                </div>
                <p className="text-[11px] text-gray-400 mb-3">Link ke halaman lain di website kamu. Internal link membantu SEO dan navigasi pengunjung.</p>
                <div className="space-y-2">
                  {form.settings.backlinks.internal.map((link, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input type="text" value={link} onChange={e => {
                        const links = [...form.settings.backlinks.internal]; links[i] = e.target.value; updateSettings('backlinks.internal', links)
                      }} placeholder="/blog/artikel-terkait" className="flex-1 px-3 py-1.5 text-sm font-mono border border-gray-200 rounded-lg outline-none focus:border-forest-400" />
                      <button onClick={() => updateSettings('backlinks.internal', form.settings.backlinks.internal.filter((_, j) => j !== i))} className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                  <button onClick={() => updateSettings('backlinks.internal', [...form.settings.backlinks.internal, ''])}
                    className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-forest-600 hover:text-forest-700 border border-dashed border-gray-200 hover:border-forest-300 rounded-lg py-2 transition-colors">
                    <Plus className="w-3.5 h-3.5" /> Tambah Internal Link
                  </button>
                </div>
              </Card>

              <Card>
                <div className="flex items-center gap-2 mb-3">
                  <ExternalLink className="w-4 h-4 text-violet-500" />
                  <p className="text-xs font-semibold text-gray-600">External Links</p>
                </div>
                <p className="text-[11px] text-gray-400 mb-3">Link ke sumber terpercaya (Wikipedia, studi, situs otoritas). Membangun kredibilitas artikel.</p>
                <div className="space-y-2">
                  {form.settings.backlinks.external.map((link, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input type="text" value={link} onChange={e => {
                        const links = [...form.settings.backlinks.external]; links[i] = e.target.value; updateSettings('backlinks.external', links)
                      }} placeholder="https://sumber-terpercaya.com/artikel" className="flex-1 px-3 py-1.5 text-sm font-mono border border-gray-200 rounded-lg outline-none focus:border-forest-400" />
                      <button onClick={() => updateSettings('backlinks.external', form.settings.backlinks.external.filter((_, j) => j !== i))} className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                  <button onClick={() => updateSettings('backlinks.external', [...form.settings.backlinks.external, ''])}
                    className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-violet-600 hover:text-violet-700 border border-dashed border-gray-200 hover:border-violet-300 rounded-lg py-2 transition-colors">
                    <Plus className="w-3.5 h-3.5" /> Tambah External Link
                  </button>
                </div>
              </Card>
            </div>
          )}

          {settingsSection === 'meta' && (
            <div className="space-y-5">
              <SectionHeader icon={Settings2} title="Pengaturan Lainnya" desc="Informasi tambahan dan aksi berbahaya" />

              <Card>
                <p className="text-xs font-semibold text-gray-600 mb-3">Informasi Artikel</p>
                <div className="grid grid-cols-2 gap-3 text-xs text-gray-500">
                  <div><span className="text-gray-400">Dibuat:</span> {formatDate(form.createdAt)}</div>
                  <div><span className="text-gray-400">Diperbarui:</span> {formatDate(form.updatedAt)}</div>
                  <div><span className="text-gray-400">ID:</span> <span className="font-mono text-[10px]">{form.id || '(baru)'}</span></div>
                  <div><span className="text-gray-400">Status:</span> {form.isPublished ? 'Dipublikasi' : 'Draft'}</div>
                </div>
              </Card>

              {!isNew && (
                <div className="bg-white rounded-xl border border-red-100 p-5">
                  <h3 className="text-sm font-semibold text-red-600 mb-2">Zona Bahaya</h3>
                  <p className="text-xs text-gray-500 mb-3">Tindakan di bawah ini tidak dapat dibatalkan.</p>
                  <button onClick={onDelete}
                    className="flex items-center gap-1.5 text-xs font-medium text-red-500 border border-red-200 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />Hapus Artikel
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-semibold text-gray-600 mb-1.5">{children}</label>
}

function BacklinkRow({ url, internal, onRemove }: { url: string; internal: boolean; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-2.5 py-1.5">
      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${internal ? 'bg-blue-100 text-blue-600' : 'bg-violet-100 text-violet-600'}`}>
        {internal ? 'Internal' : 'Eksternal'}
      </span>
      <span className="flex-1 min-w-0 truncate text-[11px] font-mono text-gray-600">{url}</span>
      <button onClick={onRemove} className="p-1 text-gray-400 hover:text-red-500 shrink-0"><Trash2 className="w-3 h-3" /></button>
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-white rounded-xl border border-gray-100 p-5">{children}</div>
}

function SectionHeader({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) {
  return (
    <div className="flex items-center gap-3 mb-1">
      <Icon className="w-5 h-5 text-gray-400" />
      <div><h2 className="text-sm font-bold text-gray-900">{title}</h2><p className="text-[11px] text-gray-400">{desc}</p></div>
    </div>
  )
}

function ToggleRow({ label, desc, icon, checked, onChange }: {
  label: string; desc: string; icon: React.ReactNode; checked: boolean; onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
      <div className="flex items-center gap-3">
        <div className="text-gray-400">{icon}</div>
        <div><p className="text-sm font-medium text-gray-800">{label}</p><p className="text-[11px] text-gray-400">{desc}</p></div>
      </div>
      <button type="button" onClick={() => onChange(!checked)}
        className={`relative w-10 h-6 rounded-full transition-colors shrink-0 ${checked ? 'bg-forest-500' : 'bg-gray-200'}`}>
        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
      </button>
    </div>
  )
}
