'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  FileText, Plus, Edit3, Trash2, Eye, EyeOff, Search,
  Save, ExternalLink, Clock, TrendingUp, Settings2, X,
  Heart, Tag, ChevronLeft, AlertTriangle, CalendarClock,
  ChevronDown, ChevronUp, Loader2, Send,
} from 'lucide-react'
import ImagePicker from '@/components/ui/ImagePicker'
import RichTextEditor from '@/components/ui/RichTextEditor'
import { parseMarkdownPreview, slugify, wordCount, readTime } from '@/lib/article-markdown'
import { STATUS_META, statusMeta, type ArticleStatus } from '@/lib/article-status'

interface ArticleData {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  coverUrl: string
  authorId: string | null
  authorName: string
  authorAvatar: string
  isPublished: boolean
  publishedAt: string | null
  allowLikes: boolean
  allowComments: boolean
  likesCount: number
  viewsCount: number
  metaTitle: string
  metaDesc: string
  tags: string
  status: string
  submittedAt: string | null
  reviewNotes: string
  scheduledAt: string | null
  reviewedBy: string | null
  categoryId: string | null
  revisionSeenAt: string | null
  createdAt: string
  updatedAt: string
}

interface CategoryOption {
  id: string
  name: string
  slug: string
}

type View = 'list' | 'editor'
type StatusFilter = 'all' | ArticleStatus

const FILTER_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'Semua' },
  { key: 'draft', label: 'Draft' },
  { key: 'pending_review', label: 'Menunggu Review' },
  { key: 'needs_revision', label: 'Perlu Revisi' },
  { key: 'scheduled', label: 'Terjadwal' },
  { key: 'published', label: 'Published' },
  { key: 'archived', label: 'Diarsipkan' },
]

type FormValues = {
  title: string; slug: string; excerpt: string; content: string; coverUrl: string
  tags: string; categoryId: string; metaTitle: string; metaDesc: string; authorName: string
}

function formatTime(d: Date) {
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

export default function WriterDashboard() {
  const [articles, setArticles] = useState<ArticleData[]>([])
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [isTrusted, setIsTrusted] = useState(false)
  const [view, setView] = useState<View>('list')
  const [editingArticle, setEditingArticle] = useState<ArticleData | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [revisionBannerOpen, setRevisionBannerOpen] = useState(true)
  const [lastAutosavedAt, setLastAutosavedAt] = useState<Date | null>(null)

  // Editor state
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [tags, setTags] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDesc, setMetaDesc] = useState('')
  const [authorName, setAuthorName] = useState('')

  // Refs so the autosave interval reads fresh values without restarting on
  // every keystroke (it's created once per editor session, see effect below).
  const formRef = useRef<FormValues>({ title: '', slug: '', excerpt: '', content: '', coverUrl: '', tags: '', categoryId: '', metaTitle: '', metaDesc: '', authorName: '' })
  useEffect(() => {
    formRef.current = { title, slug, excerpt, content, coverUrl, tags, categoryId, metaTitle, metaDesc, authorName }
  }, [title, slug, excerpt, content, coverUrl, tags, categoryId, metaTitle, metaDesc, authorName])
  const editingArticleRef = useRef(editingArticle)
  useEffect(() => { editingArticleRef.current = editingArticle }, [editingArticle])

  const fetchArticles = useCallback(async () => {
    const res = await fetch('/api/writer/articles')
    if (res.ok) setArticles((await res.json()).articles)
  }, [])

  const fetchCategories = useCallback(async () => {
    const res = await fetch('/api/writer/article-categories')
    if (res.ok) setCategories((await res.json()).categories)
  }, [])

  const fetchProfile = useCallback(async () => {
    const res = await fetch('/api/writer/profile')
    if (res.ok) {
      const data = await res.json()
      setIsTrusted(!!data.profile?.isTrusted)
    }
  }, [])

  useEffect(() => {
    fetchArticles()
    fetchCategories()
    fetchProfile()
  }, [fetchArticles, fetchCategories, fetchProfile])

  const filtered = articles.filter(a => {
    if (statusFilter !== 'all' && a.status !== statusFilter) return false
    if (search && !a.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const statusCounts: Record<StatusFilter, number> = {
    all: articles.length, draft: 0, pending_review: 0, needs_revision: 0, scheduled: 0, published: 0, archived: 0,
  }
  for (const a of articles) {
    const key = (a.status || 'draft') as ArticleStatus
    if (key in statusCounts) statusCounts[key] += 1
  }

  const stats = {
    total: articles.length,
    published: statusCounts.published,
    drafts: statusCounts.draft,
    pendingReview: statusCounts.pending_review,
    totalViews: articles.reduce((s, a) => s + a.viewsCount, 0),
    totalLikes: articles.reduce((s, a) => s + a.likesCount, 0),
  }

  const statCards = [
    { label: 'Total', value: stats.total, icon: FileText, color: 'text-stone-600' },
    { label: 'Published', value: stats.published, icon: Eye, color: 'text-emerald-600' },
    { label: 'Draft', value: stats.drafts, icon: EyeOff, color: 'text-amber-600' },
    ...(stats.pendingReview > 0 ? [{ label: 'Menunggu Review', value: stats.pendingReview, icon: Clock, color: 'text-amber-600' }] : []),
    { label: 'Views', value: stats.totalViews, icon: TrendingUp, color: 'text-blue-600' },
    { label: 'Likes', value: stats.totalLikes, icon: Heart, color: 'text-rose-600' },
  ]

  function resetEditorFields() {
    setTitle(''); setSlug(''); setExcerpt(''); setContent(''); setCoverUrl('')
    setTags(''); setCategoryId(''); setMetaTitle(''); setMetaDesc(''); setAuthorName('')
  }

  function openEditor(article?: ArticleData) {
    if (article) {
      setEditingArticle(article)
      setTitle(article.title)
      setSlug(article.slug)
      setExcerpt(article.excerpt)
      setContent(article.content)
      setCoverUrl(article.coverUrl)
      setTags(article.tags)
      setCategoryId(article.categoryId ?? '')
      setMetaTitle(article.metaTitle)
      setMetaDesc(article.metaDesc)
      setAuthorName(article.authorName)
      if (article.status === 'needs_revision') {
        fetch(`/api/writer/articles/${article.id}/seen`, { method: 'POST' }).catch(() => {})
      }
    } else {
      setEditingArticle(null)
      resetEditorFields()
    }
    setPreviewMode(false)
    setShowSettings(false)
    setRevisionBannerOpen(true)
    setLastAutosavedAt(null)
    setView('editor')
  }

  // Saves content fields only — never touches editorial status, so this is
  // always safe to call (including from autosave) regardless of the
  // article's current status.
  async function persistContent(values: FormValues): Promise<ArticleData | null> {
    if (!values.title.trim() || !values.slug.trim()) return null
    const payload = {
      title: values.title, slug: values.slug, excerpt: values.excerpt, content: values.content,
      coverUrl: values.coverUrl, tags: values.tags, categoryId: values.categoryId || null,
      metaTitle: values.metaTitle, metaDesc: values.metaDesc, authorName: values.authorName,
    }
    const current = editingArticleRef.current
    const url = current ? `/api/writer/articles/${current.id}` : '/api/writer/articles'
    const method = current ? 'PATCH' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    if (!res.ok) return null
    const data = await res.json()
    setEditingArticle(data.article)
    return data.article as ArticleData
  }

  async function handleManualSave() {
    setSaving(true)
    try {
      const saved = await persistContent(formRef.current)
      if (saved) {
        setLastAutosavedAt(new Date())
        await fetchArticles()
      }
    } finally {
      setSaving(false)
    }
  }

  // Universal "advance" action. Saves content, then asks the backend to move
  // the article forward — the backend decides the resulting status based on
  // trust (draft/needs_revision/pending_review/scheduled/archived all funnel
  // through this same endpoint; see /api/writer/articles/[id]/submit).
  async function handleSubmit() {
    setSubmitting(true)
    try {
      const saved = await persistContent(formRef.current)
      if (!saved) return
      const res = await fetch(`/api/writer/articles/${saved.id}/submit`, { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setEditingArticle(data.article)
        setLastAutosavedAt(new Date())
        await fetchArticles()
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus artikel ini?')) return
    await fetch(`/api/writer/articles/${id}`, { method: 'DELETE' })
    await fetchArticles()
    if (editingArticle?.id === id) setView('list')
  }

  // Autosave: ticks every ~30s while editing a draft/needs_revision article,
  // and only writes if something changed since the last tick. Deliberately
  // left alone for pending_review/scheduled/published/archived so an edit in
  // progress never silently mutates an article that's live or under review.
  useEffect(() => {
    if (view !== 'editor') return
    let lastSnapshot = JSON.stringify(formRef.current)
    const interval = setInterval(async () => {
      const status = editingArticleRef.current?.status ?? 'draft'
      if (status !== 'draft' && status !== 'needs_revision') return
      const values = formRef.current
      if (!values.title.trim() || !values.slug.trim()) return
      const snapshot = JSON.stringify(values)
      if (snapshot === lastSnapshot) return
      lastSnapshot = snapshot
      const saved = await persistContent(values)
      if (saved) setLastAutosavedAt(new Date())
    }, 30000)
    return () => clearInterval(interval)
  }, [view])

  const wc = wordCount(content)
  const rt = readTime(content)
  const status = (editingArticle?.status || 'draft') as ArticleStatus
  const meta = STATUS_META[status] ?? STATUS_META.draft

  function primaryLabel(): string {
    switch (status) {
      case 'published': return 'Update'
      case 'scheduled': return isTrusted ? 'Update Jadwal' : 'Ajukan Ulang'
      case 'pending_review':
      case 'needs_revision':
      case 'archived':
        return 'Ajukan Ulang'
      default:
        return isTrusted ? 'Publish' : 'Ajukan Review'
    }
  }

  if (view === 'editor') {
    return (
      <div className="min-h-screen bg-stone-50">
        {/* Editor Header (sticky di bawah header AppShell) */}
        <header className="sticky top-14 z-30 bg-white border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center gap-3">
            <button
              onClick={() => setView('list')}
              className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-700 shrink-0"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Kembali</span>
            </button>

            <div className="flex-1 min-w-0 flex items-center gap-3">
              <p className="text-sm font-medium text-stone-700 truncate">
                {editingArticle ? 'Edit Artikel' : 'Artikel Baru'}
              </p>
              {editingArticle && (
                <span className={`hidden md:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${meta.badgeClass}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${meta.dotClass}`} />{meta.label}
                </span>
              )}
              <span className="hidden md:inline text-xs text-stone-400 whitespace-nowrap">
                {wc} kata &middot; {rt} mnt baca
              </span>
              {lastAutosavedAt && (
                <span className="hidden lg:inline text-[10px] text-stone-400 whitespace-nowrap">
                  Tersimpan otomatis pukul {formatTime(lastAutosavedAt)}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Toggle Tulis | Preview */}
              <div className="flex items-center bg-stone-100 rounded-lg p-0.5">
                <button onClick={() => setPreviewMode(false)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${!previewMode ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}>
                  Tulis
                </button>
                <button onClick={() => setPreviewMode(true)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${previewMode ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}>
                  Preview
                </button>
              </div>

              <button onClick={() => setShowSettings(true)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors">
                <Settings2 className="w-3.5 h-3.5" /><span className="hidden sm:inline">Pengaturan</span>
              </button>

              <button
                onClick={handleManualSave}
                disabled={saving || submitting || !title || !slug}
                className="px-3 py-1.5 text-xs border border-stone-200 rounded-lg hover:bg-stone-50 disabled:opacity-50 flex items-center gap-1"
              >
                <Save className="w-3.5 h-3.5" /><span className="hidden sm:inline">{saving ? 'Menyimpan...' : 'Simpan'}</span>
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving || submitting || !title || !slug}
                className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1"
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                {primaryLabel()}
              </button>
            </div>
          </div>
        </header>

        {/* AREA MENULIS */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {/* Status banners */}
          {status === 'needs_revision' && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 overflow-hidden">
              <button type="button" onClick={() => setRevisionBannerOpen(v => !v)}
                className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span className="text-sm font-semibold">Admin meminta revisi</span>
                </div>
                {revisionBannerOpen ? <ChevronUp className="w-4 h-4 text-red-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-red-400 shrink-0" />}
              </button>
              {revisionBannerOpen && (
                <div className="px-4 pb-4 text-sm text-red-700 whitespace-pre-wrap">
                  {editingArticle?.reviewNotes || 'Tidak ada catatan spesifik dari admin.'}
                </div>
              )}
            </div>
          )}

          {status === 'pending_review' && (
            <div className="mb-6 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              <Clock className="w-4 h-4 shrink-0" />
              Menunggu review admin. Kamu tetap bisa mengedit; kalau diajukan ulang, draf yang sedang direview akan diperbarui.
            </div>
          )}

          {status === 'scheduled' && editingArticle?.scheduledAt && (
            <div className="mb-6 flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              <CalendarClock className="w-4 h-4 shrink-0" />
              Terjadwal tayang: {new Date(editingArticle.scheduledAt).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}
              {!isTrusted && ' Mengajukan ulang akan membatalkan jadwal ini dan mengirimnya ke review.'}
            </div>
          )}

          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={e => {
              setTitle(e.target.value)
              if (!editingArticle) setSlug(slugify(e.target.value))
            }}
            placeholder="Judul artikel..."
            className="w-full text-2xl sm:text-3xl font-sans font-bold text-stone-900 bg-transparent border-none outline-none placeholder:text-stone-300 mb-5"
          />

          {/* Cover Image */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-stone-500 mb-1.5">Cover Image</p>
            <ImagePicker value={coverUrl} onChange={setCoverUrl} uploadUrl="/api/user/upload" folder="photos" variant="cover" />
          </div>

          {/* Content Area */}
          {previewMode ? (
            <div className="prose prose-stone max-w-none min-h-[400px] bg-white rounded-xl border border-stone-200 p-6 sm:p-8">
              <div dangerouslySetInnerHTML={{ __html: parseMarkdownPreview(content) }} />
            </div>
          ) : (
            <RichTextEditor value={content} onChange={setContent} uploadUrl="/api/user/upload" folder="photos" />
          )}

          {/* Delete button for existing articles */}
          {editingArticle && (
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => handleDelete(editingArticle.id)}
                className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                Hapus Artikel
              </button>
            </div>
          )}
        </div>

        {/* PANEL PENGATURAN (slide-over kanan) */}
        {showSettings && (
          <div className="fixed inset-0 z-[150] flex justify-end">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowSettings(false)} />
            <div className="relative w-full max-w-md bg-white shadow-2xl h-full flex flex-col">
              <div className="flex items-center justify-between px-5 py-3 border-b border-stone-100 shrink-0">
                <div className="flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-stone-500" />
                  <h3 className="text-sm font-bold text-stone-900">Pengaturan Artikel</h3>
                </div>
                <button onClick={() => setShowSettings(false)} className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"><X className="w-4 h-4" /></button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
                <div>
                  <label className="text-xs font-medium text-stone-500 mb-1 block">Slug URL</label>
                  <div className="flex items-center gap-1.5 text-sm">
                    <span className="text-stone-400 shrink-0">/blog/</span>
                    <input type="text" value={slug} onChange={e => setSlug(slugify(e.target.value))}
                      className="flex-1 min-w-0 px-3 py-2 border border-stone-200 rounded-lg text-sm outline-none focus:border-emerald-300 font-mono text-stone-600" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-stone-500 mb-1 block">Ringkasan (Excerpt)</label>
                  <textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} rows={3}
                    placeholder="Ringkasan singkat artikel (ditampilkan di kartu blog)..."
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm outline-none resize-none focus:border-emerald-300" />
                </div>
                <div>
                  <label className="text-xs font-medium text-stone-500 mb-1 block">Kategori</label>
                  <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm outline-none focus:border-emerald-300 bg-white">
                    <option value="">Tanpa kategori</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-stone-500 mb-1 block">Nama Penulis</label>
                  <input type="text" value={authorName} onChange={e => setAuthorName(e.target.value)} placeholder="Nama penulis"
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm outline-none focus:border-emerald-300" />
                </div>
                <div>
                  <label className="text-xs font-medium text-stone-500 mb-1 block">Tags (pisahkan dengan koma)</label>
                  <input type="text" value={tags} onChange={e => setTags(e.target.value)} placeholder="pernikahan, tips, undangan digital"
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm outline-none focus:border-emerald-300" />
                </div>

                <div className="pt-2 border-t border-stone-100">
                  <p className="text-xs font-semibold text-stone-600 mb-3">SEO</p>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-medium text-stone-500 mb-1 block">Meta Title</label>
                      <input type="text" value={metaTitle} onChange={e => setMetaTitle(e.target.value)} placeholder="Judul untuk SEO..."
                        className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm outline-none focus:border-emerald-300" />
                      <p className="text-xs text-stone-400 mt-1">{metaTitle.length}/60 karakter</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-stone-500 mb-1 block">Meta Description</label>
                      <textarea value={metaDesc} onChange={e => setMetaDesc(e.target.value)} placeholder="Deskripsi untuk SEO..." rows={3}
                        className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm outline-none resize-none focus:border-emerald-300" />
                      <p className="text-xs text-stone-400 mt-1">{metaDesc.length}/160 karakter</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="bg-white border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-stone-900">Writer Dashboard</h1>
              <p className="text-sm text-stone-400 mt-0.5">Kelola artikel dan konten blog</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {statCards.map(s => (
              <div key={s.label} className="bg-stone-50 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                  <span className="text-xs text-stone-400">{s.label}</span>
                </div>
                <p className="text-lg font-bold text-stone-700">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {FILTER_TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setStatusFilter(t.key)}
                className={`shrink-0 px-3 py-1.5 text-sm rounded-lg transition-colors whitespace-nowrap ${
                  statusFilter === t.key ? 'bg-stone-900 text-white' : 'text-stone-500 hover:bg-stone-100'
                }`}
              >
                {t.label} <span className="text-xs opacity-70">({statusCounts[t.key]})</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Cari artikel..."
                className="w-full pl-9 pr-3 py-2 border border-stone-200 rounded-lg text-sm outline-none focus:border-emerald-300 bg-white"
              />
            </div>
            <button
              onClick={() => openEditor()}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Tulis Artikel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Articles List */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-10">
        {filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-stone-100">
            <FileText className="w-12 h-12 text-stone-200 mx-auto mb-4" />
            <p className="text-stone-500 font-medium">Belum ada artikel</p>
            <p className="text-sm text-stone-400 mt-1 mb-6">Mulai tulis artikel pertamamu.</p>
            <button
              onClick={() => openEditor()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700"
            >
              <Plus className="w-4 h-4" />
              Tulis Artikel Baru
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(article => {
              const m = statusMeta(article.status)
              return (
                <div
                  key={article.id}
                  className="bg-white rounded-xl border border-stone-100 hover:border-stone-200 transition-all p-4 sm:p-5 flex gap-4"
                >
                  {/* Thumbnail */}
                  {article.coverUrl ? (
                    <div className="hidden sm:block w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-stone-100">
                      <img src={article.coverUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="hidden sm:flex w-24 h-24 rounded-lg bg-stone-50 items-center justify-center flex-shrink-0">
                      <FileText className="w-8 h-8 text-stone-200" />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-stone-900 truncate">{article.title}</h3>
                        <p className="text-sm text-stone-400 line-clamp-1 mt-0.5">{article.excerpt || 'Belum ada ringkasan'}</p>
                      </div>
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full whitespace-nowrap ${m.badgeClass}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${m.dotClass}`} />{m.label}
                      </span>
                    </div>

                    {article.status === 'needs_revision' && article.reviewNotes && (
                      <p className="text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg px-2.5 py-1.5 mt-2 line-clamp-2">
                        <strong>Catatan admin:</strong> {article.reviewNotes}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-stone-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(article.updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        {article.viewsCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5" />
                        {article.likesCount}
                      </span>
                      {article.tags && (
                        <span className="flex items-center gap-1">
                          <Tag className="w-3.5 h-3.5" />
                          {article.tags.split(',')[0].trim()}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={() => openEditor(article)}
                        className="text-xs px-3 py-1.5 bg-stone-100 hover:bg-stone-200 rounded-lg text-stone-600 flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      {article.isPublished && (
                        <a
                          href={`/blog/${article.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs px-3 py-1.5 bg-stone-100 hover:bg-stone-200 rounded-lg text-stone-600 flex items-center gap-1"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Lihat
                        </a>
                      )}
                      <button
                        onClick={() => handleDelete(article.id)}
                        className="text-xs px-3 py-1.5 hover:bg-red-50 rounded-lg text-red-500 flex items-center gap-1 ml-auto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
