'use client'

import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import {
  Users, UserPlus, TrendingUp, DollarSign, MousePointer,
  CheckCircle, XCircle, Copy, Check, Ban, Zap,
  ArrowDownToLine, Eye, EyeOff, Mail, Lock, User,
  Loader2, Percent, ExternalLink,
} from 'lucide-react'

interface AffiliateData {
  id: string; userId: string; userEmail: string; referralCode: string
  commissionRate: number; totalEarnings: number; pendingBalance: number
  paidBalance: number; totalClicks: number; totalConversions: number
  isActive: boolean; createdAt: string
}

interface WithdrawalData {
  id: string; affiliateId: string; amount: number
  bankName: string; accountNo: string; accountName: string
  status: string; adminNotes: string; createdAt: string; processedAt: string | null
}

interface UserItem { id: string; email: string; role: string }

type CreateMode = 'existing' | 'new'

export default function AffiliatesTab() {
  const [affiliatesList, setAffiliates] = useState<AffiliateData[]>([])
  const [withdrawalsList, setWithdrawals] = useState<WithdrawalData[]>([])
  const [allUsers, setAllUsers] = useState<UserItem[]>([])
  const [subTab, setSubTab] = useState<'affiliates' | 'withdrawals'>('affiliates')
  const [showAddModal, setShowAddModal] = useState(false)
  const [copied, setCopied] = useState('')
  const [loading, setLoading] = useState(true)

  const [createMode, setCreateMode] = useState<CreateMode>('new')
  const [selectedUserId, setSelectedUserId] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newName, setNewName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [creating, setCreating] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const [affRes, usersRes] = await Promise.all([
        fetch('/api/admin/affiliates'),
        fetch('/api/admin/users'),
      ])
      if (affRes.ok) {
        const data = await affRes.json()
        setAffiliates(data.affiliates || [])
        setWithdrawals(data.withdrawals || [])
      }
      if (usersRes.ok) {
        const data = await usersRes.json()
        setAllUsers(data.users || [])
      }
    } catch { toast.error('Gagal memuat data') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  function resetForm() {
    setShowAddModal(false)
    setSelectedUserId('')
    setNewEmail('')
    setNewPassword('')
    setNewName('')
    setCreateMode('new')
  }

  async function handleAddAffiliate() {
    setCreating(true)
    try {
      const body = createMode === 'existing'
        ? { userId: selectedUserId }
        : { email: newEmail, password: newPassword, name: newName }

      const res = await fetch('/api/admin/affiliates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        toast.success('Affiliate berhasil ditambahkan!')
        resetForm()
        await fetchData()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal menambahkan')
      }
    } catch { toast.error('Ada kendala sebentar. Coba lagi ya.') }
    finally { setCreating(false) }
  }

  async function toggleActive(id: string, isActive: boolean) {
    await fetch(`/api/admin/affiliates/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive }),
    })
    toast.success(isActive ? 'Affiliate diaktifkan' : 'Affiliate dinonaktifkan')
    await fetchData()
  }

  async function handleWithdrawalAction(id: string, action: 'approve' | 'reject') {
    const adminNotes = action === 'reject' ? prompt('Alasan penolakan:') : ''
    if (action === 'reject' && !adminNotes) return
    // Hasil fetch DULU diabaikan sepenuhnya, jadi UI selalu melaporkan sukses —
    // termasuk saat server membalas 409 karena permintaannya sudah diproses
    // (mis. admin mengklik dua kali). Admin lalu mengira klik keduanya berhasil.
    const res = await fetch(`/api/admin/affiliates/withdrawals/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, adminNotes }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      toast.error(data.error || 'Gagal memproses pencairan')
      await fetchData()
      return
    }

    toast.success(action === 'approve' ? 'Pencairan disetujui' : 'Pencairan ditolak')
    await fetchData()
  }

  function copyCode(code: string) {
    const link = `${window.location.origin}/?ref=${code}`
    navigator.clipboard.writeText(link)
    setCopied(code)
    setTimeout(() => setCopied(''), 2000)
  }

  function formatRupiah(n: number) {
    return 'Rp ' + n.toLocaleString('id-ID')
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const totalEarnings = affiliatesList.reduce((s, a) => s + a.totalEarnings, 0)
  const totalClicks = affiliatesList.reduce((s, a) => s + a.totalClicks, 0)
  const totalConversions = affiliatesList.reduce((s, a) => s + a.totalConversions, 0)
  const activeCount = affiliatesList.filter(a => a.isActive).length
  const nonAffiliateUsers = allUsers.filter(u => !affiliatesList.find(a => a.userId === u.id) && u.role !== 'admin')
  const pendingWithdrawals = withdrawalsList.filter(w => w.status === 'pending')

  const canSubmit = createMode === 'existing'
    ? !!selectedUserId
    : newEmail.includes('@') && newPassword.length >= 6

  if (loading) {
    return (
      <div className="h-full flex flex-col">
        <div className="px-8 pt-6 pb-5 border-b border-gray-100 bg-white">
          <div className="h-5 w-48 bg-gray-100 rounded animate-pulse" />
          <div className="h-3 w-64 bg-gray-50 rounded animate-pulse mt-2" />
        </div>
        <div className="p-8 space-y-4">
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-white rounded-xl border border-gray-100 animate-pulse" />)}
          </div>
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-white rounded-xl border border-gray-100 animate-pulse" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-8 pt-6 pb-5 border-b border-gray-100 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900 tracking-tight">Program Afiliasi</h1>
            <p className="text-xs text-gray-400 mt-0.5">Kelola affiliate, komisi, referral, dan pencairan</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            Tambah Affiliate
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 lg:p-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Affiliate', value: `${activeCount}/${affiliatesList.length}`, sub: 'aktif', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Total Klik', value: totalClicks.toLocaleString(), sub: 'referral clicks', icon: MousePointer, color: 'text-purple-600', bg: 'bg-purple-50' },
            { label: 'Konversi', value: totalConversions.toLocaleString(), sub: totalClicks > 0 ? `${((totalConversions / totalClicks) * 100).toFixed(1)}% rate` : '0% rate', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Total Komisi', value: formatRupiah(totalEarnings), sub: 'dibayarkan', icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-50' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{s.label}</span>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.bg}`}>
                  <s.icon className={`w-4.5 h-4.5 ${s.color}`} />
                </div>
              </div>
              <p className="text-xl font-bold text-gray-900">{s.value}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Sub tabs */}
        <div className="flex items-center gap-2 mb-5">
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
            <button onClick={() => setSubTab('affiliates')}
              className={`px-4 py-2 text-xs font-medium rounded-md transition-colors ${subTab === 'affiliates' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              Affiliate ({affiliatesList.length})
            </button>
            <button onClick={() => setSubTab('withdrawals')}
              className={`px-4 py-2 text-xs font-medium rounded-md transition-colors relative ${subTab === 'withdrawals' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              Pencairan
              {pendingWithdrawals.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full">{pendingWithdrawals.length}</span>
              )}
            </button>
          </div>
        </div>

        {/* Affiliates List */}
        {subTab === 'affiliates' && (
          <div className="space-y-2">
            {affiliatesList.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-7 h-7 text-gray-300" />
                </div>
                <p className="text-gray-600 font-semibold">Belum ada affiliate</p>
                <p className="text-sm text-gray-400 mt-1 mb-5">Tambahkan affiliate untuk memulai program referral</p>
                <button onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors">
                  <UserPlus className="w-4 h-4" />Tambah Affiliate
                </button>
              </div>
            ) : (
              affiliatesList.map(a => {
                const convRate = a.totalClicks > 0 ? ((a.totalConversions / a.totalClicks) * 100).toFixed(1) : '0'
                return (
                  <div key={a.id} className={`bg-white rounded-xl border p-5 transition-all ${a.isActive ? 'border-gray-100 hover:border-gray-200' : 'border-gray-50 opacity-70'}`}>
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${a.isActive ? 'bg-emerald-50' : 'bg-gray-100'}`}>
                        <span className={`text-sm font-bold ${a.isActive ? 'text-emerald-600' : 'text-gray-400'}`}>
                          {a.userEmail.charAt(0).toUpperCase()}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900 text-sm truncate">{a.userEmail}</span>
                          {!a.isActive && (
                            <span className="text-[10px] px-2 py-0.5 bg-red-50 text-red-600 rounded-full font-medium">Nonaktif</span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-400 flex-wrap">
                          <span className="flex items-center gap-1">
                            <span className="font-mono text-gray-600 bg-gray-50 px-1.5 py-0.5 rounded">{a.referralCode}</span>
                          </span>
                          <span className="flex items-center gap-1"><Percent className="w-3 h-3" />{a.commissionRate}%</span>
                          <span>{a.totalClicks} klik</span>
                          <span>{a.totalConversions} konversi ({convRate}%)</span>
                        </div>

                        {/* Earnings row */}
                        <div className="flex items-center gap-4 mt-2.5">
                          <div className="bg-emerald-50 rounded-lg px-3 py-1.5">
                            <span className="text-[10px] text-emerald-500 font-medium">Total</span>
                            <p className="text-sm font-bold text-emerald-700">{formatRupiah(a.totalEarnings)}</p>
                          </div>
                          <div className="bg-amber-50 rounded-lg px-3 py-1.5">
                            <span className="text-[10px] text-amber-500 font-medium">Pending</span>
                            <p className="text-sm font-bold text-amber-700">{formatRupiah(a.pendingBalance)}</p>
                          </div>
                          <div className="bg-blue-50 rounded-lg px-3 py-1.5">
                            <span className="text-[10px] text-blue-500 font-medium">Dibayar</span>
                            <p className="text-sm font-bold text-blue-700">{formatRupiah(a.paidBalance)}</p>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button onClick={() => copyCode(a.referralCode)}
                          className="p-2 rounded-lg hover:bg-gray-100 transition-colors" title="Salin link referral">
                          {copied === a.referralCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-gray-400" />}
                        </button>
                        <button
                          onClick={() => toggleActive(a.id, !a.isActive)}
                          className={`p-2 rounded-lg transition-colors ${a.isActive ? 'hover:bg-red-50 text-gray-400 hover:text-red-500' : 'hover:bg-emerald-50 text-gray-400 hover:text-emerald-500'}`}
                          title={a.isActive ? 'Nonaktifkan' : 'Aktifkan'}>
                          {a.isActive ? <Ban className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* Withdrawals */}
        {subTab === 'withdrawals' && (
          <div className="space-y-2">
            {withdrawalsList.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
                  <ArrowDownToLine className="w-7 h-7 text-gray-300" />
                </div>
                <p className="text-gray-600 font-semibold">Belum ada permintaan pencairan</p>
                <p className="text-sm text-gray-400 mt-1">Affiliate bisa mengajukan pencairan dari dashboard mereka</p>
              </div>
            ) : (
              withdrawalsList.map(w => {
                const aff = affiliatesList.find(a => a.id === w.affiliateId)
                return (
                  <div key={w.id} className="bg-white rounded-xl border border-gray-100 p-5">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        w.status === 'pending' ? 'bg-amber-50' : w.status === 'approved' ? 'bg-emerald-50' : 'bg-red-50'
                      }`}>
                        <DollarSign className={`w-4.5 h-4.5 ${
                          w.status === 'pending' ? 'text-amber-600' : w.status === 'approved' ? 'text-emerald-600' : 'text-red-500'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-900">{formatRupiah(w.amount)}</p>
                          {w.status !== 'pending' && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${
                              w.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                            }`}>
                              {w.status === 'approved' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                              {w.status === 'approved' ? 'Dibayar' : 'Ditolak'}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {aff?.userEmail || 'Unknown'} &middot; {w.bankName} {w.accountNo} ({w.accountName})
                        </p>
                        <p className="text-[11px] text-gray-300 mt-0.5">{formatDate(w.createdAt)}</p>
                      </div>
                      {w.status === 'pending' && (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleWithdrawalAction(w.id, 'approve')}
                            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors">
                            <CheckCircle className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button
                            onClick={() => handleWithdrawalAction(w.id, 'reject')}
                            className="flex items-center gap-1.5 px-4 py-2 border border-red-200 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-50 transition-colors">
                            <XCircle className="w-3.5 h-3.5" /> Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>

      {/* Add Affiliate Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 pt-6 pb-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Tambah Affiliate Baru</h3>
              <p className="text-xs text-gray-400 mt-1">Pilih dari user yang ada atau buat akun baru</p>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Mode toggle */}
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
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nama (opsional)</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
                        placeholder="Nama affiliate"
                        className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-emerald-400 transition-colors" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email *</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)}
                        placeholder="affiliate@email.com"
                        className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-emerald-400 transition-colors" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Password *</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type={showPassword ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)}
                        placeholder="Minimal 6 karakter"
                        className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-emerald-400 transition-colors" />
                      <button type="button" onClick={() => setShowPassword(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">Affiliate akan login dengan email & password ini</p>
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Pilih User</label>
                  <select
                    value={selectedUserId}
                    onChange={e => setSelectedUserId(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-emerald-400 transition-colors">
                    <option value="">-- Pilih user --</option>
                    {nonAffiliateUsers.map(u => (
                      <option key={u.id} value={u.id}>{u.email} ({u.role})</option>
                    ))}
                  </select>
                  {nonAffiliateUsers.length === 0 && (
                    <p className="text-[11px] text-amber-500 mt-1.5">Semua user sudah menjadi affiliate</p>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50 justify-end">
              <button onClick={resetForm}
                className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
                Batal
              </button>
              <button
                onClick={handleAddAffiliate}
                disabled={!canSubmit || creating}
                className="flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors">
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
