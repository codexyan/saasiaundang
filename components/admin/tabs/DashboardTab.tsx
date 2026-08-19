'use client'

import {
  Users,
  Mail,
  TrendingUp,
  Crown,
  Clock,
  UserPlus,
  AlertCircle,
  Eye,
  ChevronRight,
  ArrowUpRight,
  FileText,
  Zap,
} from 'lucide-react'
import { formatPrice } from '@/lib/utils'

//  Types 

interface AdminUserInvitation {
  id: string
  slug: string
  template_id: string
  is_published: boolean
  is_paid: boolean
  expires_at: string | null
  created_at: string
}

interface AdminUser {
  id: string
  email: string
  created_at: string
  invitations: AdminUserInvitation[]
}

interface AdminInvitation {
  id: string
  slug: string
  template_id: string
  user_id: string
  user_email: string
  is_published: boolean
  is_paid: boolean
  expires_at: string | null
  created_at: string
}

interface Stats {
  totalUsers: number
  totalInvitations: number
  totalActive: number
  totalPaid: number
  totalUnpaid: number
  totalRevenue: number
}

interface DashboardTabProps {
  stats: Stats
  users: AdminUser[]
  invitations: AdminInvitation[]
  pendingOrders: number
  onGoToTab: (tab: string) => void
}

//  Helpers 

function timeAgo(dateString: string): string {
  const now = Date.now()
  const then = new Date(dateString).getTime()
  const diff = now - then

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30)

  if (seconds < 60) return 'baru saja'
  if (minutes < 60) return `${minutes} menit lalu`
  if (hours < 24) return `${hours} jam lalu`
  if (days < 7) return `${days} hari lalu`
  if (weeks < 4) return `${weeks} minggu lalu`
  return `${months} bulan lalu`
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

//  Component 

export default function DashboardTab({
  stats,
  users,
  invitations,
  pendingOrders,
  onGoToTab,
}: DashboardTabProps) {
  // Derived data
  const conversionRate =
    stats.totalUsers > 0
      ? Math.round((stats.totalPaid / stats.totalUsers) * 100)
      : 0

  const draftCount = invitations.filter((inv) => !inv.is_published).length
  const liveCount = invitations.filter(
    (inv) => inv.is_published && inv.is_paid
  ).length

  const now = new Date()
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const expiringSoon = invitations.filter((inv) => {
    if (!inv.expires_at) return false
    const exp = new Date(inv.expires_at)
    return exp > now && exp <= sevenDaysFromNow
  })

  // Unified activity timeline
  const activityItems = [
    ...users.map((u) => ({
      type: 'user' as const,
      label: u.email,
      description: 'mendaftar sebagai pengguna baru',
      date: u.created_at,
    })),
    ...invitations.map((inv) => ({
      type: 'invitation' as const,
      label: `/${inv.slug}`,
      description: `undangan dibuat oleh ${inv.user_email}`,
      date: inv.created_at,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8)

  // Template popularity
  const templateCounts: Record<string, number> = {}
  for (const inv of invitations) {
    templateCounts[inv.template_id] = (templateCounts[inv.template_id] || 0) + 1
  }
  const topTemplates = Object.entries(templateCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  // Funnel data
  const createdCount = stats.totalInvitations
  const paidCount = stats.totalPaid
  const funnelCreatedPct =
    stats.totalUsers > 0
      ? Math.round((createdCount / stats.totalUsers) * 100)
      : 0
  const funnelPaidPct =
    createdCount > 0 ? Math.round((paidCount / createdCount) * 100) : 0
  const funnelLivePct =
    paidCount > 0 ? Math.round((liveCount / paidCount) * 100) : 0

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-stone-900">
          Selamat datang, Admin
        </h1>
        <p className="text-sm text-stone-500 mt-1">{formatDate(now.toISOString())}</p>
        <p className="text-sm text-stone-400 mt-0.5">
          {stats.totalUsers > 0
            ? `${stats.totalUsers} pengguna terdaftar, ${liveCount} undangan aktif hari ini.`
            : 'Belum ada aktivitas. Mulai promosikan platform iaundang!'}
        </p>
      </div>

      {/* Alert Banners */}
      {(pendingOrders > 0 || expiringSoon.length > 0) && (
        <div className="space-y-3">
          {pendingOrders > 0 && (
            <button
              onClick={() => onGoToTab('transaksi')}
              className="w-full flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 text-left hover:bg-amber-100 transition-colors"
            >
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-amber-100">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-amber-900">
                  {pendingOrders} pesanan menunggu verifikasi
                </p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Verifikasi pembayarannya agar akun & undangan pembeli langsung aktif.
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-amber-400 shrink-0" />
            </button>
          )}

          {expiringSoon.length > 0 && (
            <button
              onClick={() => onGoToTab('users')}
              className="w-full flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-2xl p-4 text-left hover:bg-orange-100 transition-colors"
            >
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-orange-100">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-orange-900">
                  {expiringSoon.length} undangan akan kadaluarsa dalam 7 hari
                </p>
                <p className="text-xs text-orange-700 mt-0.5">
                  Ingatkan pengguna untuk memperpanjang masa aktif.
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-orange-400 shrink-0" />
            </button>
          )}
        </div>
      )}

      {/* Primary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pengguna */}
        <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-stone-300" />
          </div>
          <p className="text-2xl font-bold text-stone-900">{stats.totalUsers}</p>
          <p className="text-sm text-stone-500 mt-0.5">Pengguna</p>
        </div>

        {/* Undangan */}
        <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-50">
              <Mail className="w-5 h-5 text-purple-500" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-stone-300" />
          </div>
          <p className="text-2xl font-bold text-stone-900">
            {stats.totalInvitations}
          </p>
          <p className="text-sm text-stone-500 mt-0.5">
            Undangan{' '}
            <span className="text-purple-500 font-medium">
              {stats.totalActive} aktif
            </span>
          </p>
        </div>

        {/* Pendapatan */}
        <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-yellow-50">
              <Crown className="w-5 h-5 text-yellow-600" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-stone-300" />
          </div>
          <p className="text-2xl font-bold text-stone-900">
            {formatPrice(stats.totalRevenue)}
          </p>
          <p className="text-sm text-stone-500 mt-0.5">
            Pendapatan{' '}
            <span className="text-yellow-600 font-medium">
              {stats.totalPaid} lunas
            </span>
          </p>
        </div>

        {/* Konversi */}
        <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-50">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-stone-300" />
          </div>
          <p className="text-2xl font-bold text-stone-900">{conversionRate}%</p>
          <p className="text-sm text-stone-500 mt-0.5">Konversi</p>
        </div>
      </div>

      {/* Quick Stats Mini Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="flex items-center gap-3 bg-white border border-stone-200 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
          <div>
            <p className="text-lg font-semibold text-stone-900">
              {stats.totalUnpaid}
            </p>
            <p className="text-xs text-stone-500">Belum bayar</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-white border border-stone-200 rounded-xl px-4 py-3">
          <FileText className="w-4 h-4 text-stone-400 shrink-0" />
          <div>
            <p className="text-lg font-semibold text-stone-900">{draftCount}</p>
            <p className="text-xs text-stone-500">Draft</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-white border border-stone-200 rounded-xl px-4 py-3">
          <Eye className="w-4 h-4 text-emerald-500 shrink-0" />
          <div>
            <p className="text-lg font-semibold text-stone-900">{liveCount}</p>
            <p className="text-xs text-stone-500">Live</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-white border border-stone-200 rounded-xl px-4 py-3">
          <Clock className="w-4 h-4 text-orange-500 shrink-0" />
          <div>
            <p className="text-lg font-semibold text-stone-900">
              {expiringSoon.length}
            </p>
            <p className="text-xs text-stone-500">Kadaluarsa segera</p>
          </div>
        </div>
      </div>

      {/* Two-column: Activity + Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Aktivitas Terbaru */}
        <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
            <h3 className="font-semibold text-stone-900 text-sm">
              Aktivitas Terbaru
            </h3>
            <Zap className="w-4 h-4 text-stone-400" />
          </div>
          <div className="divide-y divide-stone-50">
            {activityItems.length === 0 && (
              <p className="text-sm text-stone-400 text-center py-8">
                Belum ada aktivitas
              </p>
            )}
            {activityItems.map((item, i) => (
              <div key={i} className="px-5 py-3.5 flex items-start gap-3">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 mt-0.5 ${
                    item.type === 'user'
                      ? 'bg-blue-50'
                      : 'bg-purple-50'
                  }`}
                >
                  {item.type === 'user' ? (
                    <UserPlus className="w-4 h-4 text-blue-500" />
                  ) : (
                    <Mail className="w-4 h-4 text-purple-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-stone-900 font-medium truncate">
                    {item.label}
                  </p>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {item.description}
                  </p>
                </div>
                <span className="text-xs text-stone-400 shrink-0 mt-0.5">
                  {timeAgo(item.date)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Ringkasan Cepat */}
        <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
            <h3 className="font-semibold text-stone-900 text-sm">
              Ringkasan Cepat
            </h3>
            <TrendingUp className="w-4 h-4 text-stone-400" />
          </div>
          <div className="p-5 space-y-6">
            {/* Conversion Funnel */}
            <div>
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">
                Funnel Konversi
              </p>
              <div className="space-y-2.5">
                <FunnelRow
                  label="Pengguna"
                  count={stats.totalUsers}
                  percentage={100}
                  color="bg-blue-500"
                />
                <FunnelRow
                  label="Buat Undangan"
                  count={createdCount}
                  percentage={funnelCreatedPct}
                  color="bg-purple-500"
                />
                <FunnelRow
                  label="Bayar"
                  count={paidCount}
                  percentage={funnelPaidPct}
                  color="bg-yellow-500"
                />
                <FunnelRow
                  label="Live"
                  count={liveCount}
                  percentage={funnelLivePct}
                  color="bg-emerald-500"
                />
              </div>
            </div>

            {/* Template Popularity */}
            <div>
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">
                Template Populer
              </p>
              {topTemplates.length === 0 ? (
                <p className="text-sm text-stone-400">Belum ada data</p>
              ) : (
                <div className="space-y-2">
                  {topTemplates.map(([templateId, count], i) => (
                    <div
                      key={templateId}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="flex items-center justify-center w-6 h-6 rounded-md bg-stone-100 text-xs font-bold text-stone-500">
                          {i + 1}
                        </span>
                        <span className="text-sm text-stone-700 font-medium">
                          {templateId}
                        </span>
                      </div>
                      <span className="text-sm text-stone-500">
                        {count} undangan
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

//  Funnel Row 

function FunnelRow({
  label,
  count,
  percentage,
  color,
}: {
  label: string
  count: number
  percentage: number
  color: string
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-stone-500 w-24 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${Math.max(percentage, 2)}%` }}
        />
      </div>
      <span className="text-xs font-medium text-stone-700 w-16 text-right shrink-0">
        {count} ({percentage}%)
      </span>
    </div>
  )
}
