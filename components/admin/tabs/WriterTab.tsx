'use client'

import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import {
  PenLine, UserPlus, Mail, Lock, Eye, EyeOff,
  Loader2, FileText, Trash2, ShieldCheck,
  BarChart3, ArrowRight, Clock, CheckCircle2, ShieldAlert,
} from 'lucide-react'

interface WriterCounts {
  draft: number
  pending_review: number
  needs_revision: number
  scheduled: number
  published: number
  archived: number
  total: number
}

interface WriterRow {
  id: string
  email: string
  createdAt: string
  isTrusted: boolean
  counts: WriterCounts
}

interface SimpleUser {
  id: string
  email: string
  role: string
}

export default function WriterTab({ onViewArticles }: { onViewArticles?: (userId: string, name: string) => void } = {}) {
  const [writers, setWriters] = useState<WriterRow[]>([])
  const [allUsers, setAllUsers] = useState<SimpleUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [createMode, setCreateMode] = useState<'new' | 'existing'>('new')
  const [selectedUserId, setSelectedUserId] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [creating, setCreating] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const fetchWriters = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/writers')
      if (res.ok) setWriters((await res.json()).writers)
    } catch { toast.error('Gagal memuat writer') }
    finally { setLoading(false) }
  }, [])

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/users')
      if (res.ok) {
        const data = await res.json()
        setAllUsers((data.users || []).map((u: SimpleUser) => ({ id: u.id, email: u.email, role: u.role })))
      }
    } catch { /* non-blocking; only used for the "existing user" dropdown */ }
  }, [])

  useEffect(() => { fetchWriters(); fetchUsers() }, [fetchWriters, fetchUsers])

  function resetForm() {
    setShowAddModal(false)
    setSelectedUserId('')
    setNewEmail('')
    setNewPassword('')
    setCreateMode('new')
  }

  async function handleAddWriter() {
    setCreating(true)
    try {
      if (createMode === 'existing') {
        if (!selectedUserId) return
        const res = await fetch(`/api/admin/users/${selectedUserId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: 'content_writer' }),
        })
        if (!res.ok) {
          const data = await res.json()
          toast.error(data.error || 'Gagal mengubah role')
          return
        }
      } else {
        if (!newEmail.includes('@') || newPassword.length < 6) return
        const res = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: newEmail, password: newPassword, role: 'content_writer' }),
        })
        if (!res.ok) {
          const data = await res.json()
          toast.error(data.error || 'Gagal membuat akun')
          return
        }
      }
      toast.success('Writer berhasil ditambahkan!')
      resetForm()
      await Promise.all([fetchWriters(), fetchUsers()])
    } catch { toast.error('Ada kendala sebentar. Coba lagi ya.') }
    finally { setCreating(false) }
  }

  async function handleRemoveWriter(userId: string) {
    if (!confirm('Hapus role writer dari user ini? User akan menjadi role biasa.')) return
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'user' }),
    })
    if (res.ok) {
      toast.success('Writer dihapus')
      await Promise.all([fetchWriters(), fetchUsers()])
    } else {
      toast.error('Gagal menghapus writer')
    }
  }

  async function handleToggleTrust(userId: string, next: boolean) {
    setTogglingId(userId)
    // Optimistic update
    setWriters(prev => prev.map(w => w.id === userId ? { ...w, isTrusted: next } : w))
    try {
      const res = await fetch(`/api/admin/writers/${userId}/trust`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isTrusted: next }),
      })
      if (!res.ok) throw new Error()
      toast.success(next ? 'Writer dijadikan trusted' : 'Status trusted dicabut')
    } catch {
      setWriters(prev => prev.map(w => w.id === userId ? { ...w, isTrusted: !next } : w)) // revert
      toast.error('Gagal mengubah status trusted')
    } finally {
      setTogglingId(null)
    }
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const nonWriterUsers = allUsers.filter(u => u.role !== 'content_writer' && u.role !== 'admin')
  const totalArticles = writers.reduce((s, w) => s + w.counts.total, 0)
  const totalPending = writers.reduce((s, w) => s + w.counts.pending_review, 0)
  const canSubmit = createMode === 'existing' ? !!selectedUserId : newEmail.includes('@') && newPassword.length >= 6

  if (loading) {
    return (
      <div className="h-full flex flex-col">
        <div className="px-8 pt-6 pb-5 border-b border-gray-100 bg-white">
          <div className="h-5 w-48 bg-gray-100 rounded animate-pulse" />
          <div className="h-3 w-64 bg-gray-50 rounded animate-pulse mt-2" />
        </div>
        <div className="p-8 space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-white rounded-xl border border-gray-100 animate-pulse" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-8 pt-6 pb-5 border-b border-gray-100 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900 tracking-tight">Content Writer</h1>
            <p className="text-xs text-gray-400 mt-0.5">Kelola penulis konten & hak publikasi</p>
          </div>
          <button onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-forest-500 text-white rounded-xl text-sm font-semibold hover:bg-forest-600 transition-colors shadow-sm">
            <UserPlus className="w-4 h-4" />
            Tambah Writer
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 lg:p-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Writer', value: writers.length.toString(), icon: PenLine, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { label: 'Total Artikel', value: totalArticles.toString(), icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Menunggu Review', value: totalPending.toString(), icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Rata-rata/Writer', value: writers.length > 0 ? (totalArticles / writers.length).toFixed(1) : '0', icon: BarChart3, color: 'text-blue-600', bg: 'bg-blue-50' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{s.label}</span>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.bg}`}>
                  <s.icon className={`w-4.5 h-4.5 ${s.color}`} />
                </div>
              </div>
              <p className="text-xl font-bold text-gray-900">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Writers list */}
        {writers.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
              <PenLine className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-gray-600 font-semibold">Belum ada content writer</p>
            <p className="text-sm text-gray-400 mt-1 mb-5">Tambahkan writer untuk mulai membuat konten blog</p>
            <button onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-forest-500 text-white rounded-xl text-sm font-semibold hover:bg-forest-600 transition-colors">
              <UserPlus className="w-4 h-4" />Tambah Writer
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {writers.map(w => (
              <div key={w.id} className="bg-white rounded-xl border border-gray-100 hover:border-gray-200 p-5 transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-indigo-600">{w.email.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-semibold text-gray-900 text-sm truncate">{w.email}</span>
                      {w.isTrusted ? (
                        <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full font-medium flex items-center gap-1"><ShieldCheck className="w-2.5 h-2.5" />Trusted</span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full font-medium flex items-center gap-1"><ShieldAlert className="w-2.5 h-2.5" />Perlu Review</span>
                      )}
                    </div>
                    {/* Per-status counts */}
                    <div className="flex items-center gap-3 text-[11px] text-gray-400 flex-wrap">
                      <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{w.counts.total} artikel</span>
                      <span className="text-gray-300">·</span>
                      <span>{w.counts.draft} draft</span>
                      <span className={w.counts.pending_review > 0 ? 'text-amber-600 font-semibold' : ''}>{w.counts.pending_review} menunggu</span>
                      <span className="flex items-center gap-1 text-emerald-600"><CheckCircle2 className="w-3 h-3" />{w.counts.published} published</span>
                      <span className="text-gray-300">·</span>
                      <span>Bergabung {formatDate(w.createdAt)}</span>
                    </div>
                    {onViewArticles && (
                      <button onClick={() => onViewArticles(w.id, w.email)}
                        className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-forest-600 hover:text-forest-700">
                        Lihat artikel penulis ini <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Trusted toggle + remove */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex flex-col items-end">
                      <button
                        type="button"
                        onClick={() => handleToggleTrust(w.id, !w.isTrusted)}
                        disabled={togglingId === w.id}
                        title="Trusted writer bisa publish langsung tanpa review admin"
                        className={`relative w-10 h-6 rounded-full transition-colors shrink-0 disabled:opacity-50 ${w.isTrusted ? 'bg-emerald-500' : 'bg-gray-200'}`}
                      >
                        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${w.isTrusted ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
                      </button>
                      <span className="text-[9px] text-gray-400 mt-1">Trusted</span>
                    </div>
                    <button onClick={() => handleRemoveWriter(w.id)}
                      className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                      title="Hapus role writer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info */}
        <div className="mt-6 bg-indigo-50 rounded-xl p-4 flex items-start gap-3">
          <ShieldCheck className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
          <div className="text-xs text-indigo-700">
            <p className="font-semibold mb-1">Tentang Role & Trusted Writer</p>
            <ul className="space-y-0.5 list-disc pl-4 text-indigo-600">
              <li><strong>Trusted writer</strong> bisa mempublikasikan artikel langsung tanpa review admin.</li>
              <li>Writer biasa (tidak trusted) wajib melewati status &quot;Menunggu Review&quot; sebelum artikel tayang.</li>
              <li>Writer hanya bisa mengelola artikel miliknya sendiri; admin tetap bisa mengedit & menghapus semua artikel.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Add Writer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 pt-6 pb-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Tambah Content Writer</h3>
              <p className="text-xs text-gray-400 mt-1">Buat akun baru atau ubah role user yang sudah ada</p>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                <button onClick={() => setCreateMode('new')}
                  className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors ${createMode === 'new' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
                  Buat Akun Baru
                </button>
                <button onClick={() => setCreateMode('existing')}
                  className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors ${createMode === 'existing' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
                  Dari User Existing
                </button>
              </div>

              {createMode === 'new' ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email *</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)}
                        placeholder="writer@email.com"
                        className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-forest-400 transition-colors" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Password *</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type={showPassword ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)}
                        placeholder="Minimal 6 karakter"
                        className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-forest-400 transition-colors" />
                      <button type="button" onClick={() => setShowPassword(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  {(newEmail.length > 0 || newPassword.length > 0) && !canSubmit && (
                    <p className="text-[11px] text-amber-600">Email harus valid dan password minimal 6 karakter.</p>
                  )}
                </>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Pilih User</label>
                  <select value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-forest-400 transition-colors">
                    <option value="">-- Pilih user --</option>
                    {nonWriterUsers.map(u => (
                      <option key={u.id} value={u.id}>{u.email} ({u.role})</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50 justify-end">
              <button onClick={resetForm} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
                Batal
              </button>
              <button onClick={handleAddWriter} disabled={!canSubmit || creating}
                className="flex items-center gap-2 px-5 py-2 bg-forest-500 text-white text-sm font-semibold rounded-lg hover:bg-forest-600 disabled:opacity-50 transition-colors">
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                Tambahkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
