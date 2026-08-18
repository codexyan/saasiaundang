'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import dynamic from 'next/dynamic'
import {
  LayoutDashboard, FileEdit, Users, LogOut,
  ExternalLink, Copy, Menu, X, ChevronRight, Eye, Send,
  Settings, MessageSquare, BarChart3, Gift,
  Sparkles, Crown, Globe, ArrowUpRight, ShieldCheck, MoreHorizontal,
} from 'lucide-react'
import type { Invitation, NewInvitationData } from '@/lib/types'
import { LEGACY_TEMPLATE_IDS } from '@/lib/types'
import { getInvitationUrl, isExpired } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import Logo from '@/components/ui/Logo'
import RSVPList from './RSVPList'
import DashboardOverview from './DashboardOverview'
import GuestManager from './GuestManager'
import SettingsPanel from './SettingsPanel'
import SubscriptionInfo from './SubscriptionInfo'
import TemplateModule from './TemplateModule'
import OnboardingWizard from './OnboardingWizard'
import SupportTickets from './SupportTickets'
import AnalyticsPanel from './AnalyticsPanel'
import ReferralPanel from './ReferralPanel'
import FeedbackWidget from './FeedbackWidget'

const InvitationRenderer = dynamic(() => import('@/components/renderer/InvitationRenderer'), { ssr: false })

export interface TemplateInfo {
  id: string
  name: string
  category: string
  thumbnailUrl: string
  demoUrl: string
  isNew: boolean
}

interface Props {
  user: { id: string; email: string }
  /** Semua undangan milik user, terbaru dulu. Boleh kosong (user belum punya). */
  invitations: Invitation[]
  selectedTemplateId: string
  allTemplates: TemplateInfo[]
  isAdmin?: boolean
  paymentSuccess?: boolean
}

type Tab = 'overview' | 'undangan' | 'guest' | 'rsvp' | 'analytics' | 'referral' | 'subscription' | 'support' | 'settings'

const NAV: { id: Tab; label: string; icon: React.ElementType; badge?: string }[] = [
  { id: 'overview',     label: 'Beranda',    icon: LayoutDashboard },
  { id: 'undangan',     label: 'Undangan',   icon: FileEdit },
  { id: 'guest',        label: 'Tamu',       icon: Send },
  { id: 'rsvp',         label: 'RSVP',       icon: Users },
  { id: 'analytics',    label: 'Analitik',   icon: BarChart3 },
  { id: 'referral',     label: 'Referral',   icon: Gift },
  { id: 'subscription', label: 'Langganan',  icon: ShieldCheck },
  { id: 'support',      label: 'Bantuan',    icon: MessageSquare },
  { id: 'settings',     label: 'Pengaturan', icon: Settings },
]

// Mobile bottom nav shows 4 primary tabs plus a "Lainnya" overflow sheet
const MOBILE_PRIMARY = NAV.slice(0, 4)
const MOBILE_OVERFLOW = NAV.slice(4)

function getDisplayNames(inv: Invitation): { groom: string; bride: string } {
  const isLegacy = (LEGACY_TEMPLATE_IDS as string[]).includes(inv.template_id)
  if (isLegacy) {
    return { groom: inv.data.groomName || '', bride: inv.data.brideName || '' }
  }
  const d = inv.data as unknown as NewInvitationData
  return { groom: d.groom_name || '', bride: d.bride_name || '' }
}

export default function DashboardClient({ user, invitations, selectedTemplateId, allTemplates, isAdmin, paymentSuccess }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('overview')

  // Daftar undangan + penunjuk yang sedang dibuka.
  //
  // `inv` tetap SATU objek supaya seluruh panel anak (TemplateModule,
  // GuestManager, RSVPList, AnalyticsPanel, SettingsPanel, DashboardOverview)
  // tidak perlu diubah sama sekali. Yang berubah hanya dari mana objek itu
  // berasal.
  const [list, setList] = useState<Invitation[]>(invitations)
  const [activeId, setActiveId] = useState<string | null>(invitations[0]?.id ?? null)
  // `creating` = pengguna menekan "Buat undangan baru" walau sudah punya satu.
  const [creating, setCreating] = useState(false)

  // Fallback ke list[0] disengaja: setelah sebuah undangan dihapus, dashboard
  // langsung berpindah ke undangan tersisa alih-alih menampilkan layar kosong.
  const inv = list.find(i => i.id === activeId) ?? list[0] ?? null

  /**
   * Pengganti setInv lama — sengaja bernama sama supaya ketiga pemanggil yang
   * ada (togglePublish, TemplateModule.onInvitationUpdate,
   * SettingsPanel.onDeleted) tidak perlu diubah. Bersifat UPSERT, karena
   * OnboardingWizard memakai callback yang sama untuk undangan yang BARU dibuat.
   */
  function setInv(updated: Invitation | null) {
    if (!updated) {
      const removedId = inv?.id
      setList(prev => prev.filter(i => i.id !== removedId))
      setActiveId(null)
      return
    }
    setList(prev => prev.some(i => i.id === updated.id)
      ? prev.map(i => (i.id === updated.id ? updated : i))
      : [updated, ...prev])
    setActiveId(updated.id)
    setCreating(false)
  }

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false)
  const [showFullPreview, setShowFullPreview] = useState(false)
  const [previewTemplate, setPreviewTemplate] = useState<import('@/lib/types').TemplateRecord | null>(null)

  const currentTabLabel = NAV.find(n => n.id === tab)?.label ?? 'Beranda'

  const isPaid = inv?.is_paid ?? false
  const isPublished = inv?.is_published ?? false
  const expired = isExpired(inv?.expires_at ?? null)

  const names = inv ? getDisplayNames(inv) : null

  useEffect(() => {
    if (paymentSuccess) {
      toast.success('Pembayaran berhasil! Undangan kalian sedang kami aktifkan.')
      const t = setTimeout(() => router.refresh(), 3000)
      return () => clearTimeout(t)
    }
  }, [paymentSuccess, router])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
    router.refresh()
  }

  async function togglePublish() {
    if (!inv) return
    const res = await fetch(`/api/invitations/${inv.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_published: !inv.is_published }),
    })
    if (!res.ok) { toast.error('Statusnya gagal diubah. Coba lagi ya.'); return }
    const { invitation: updated } = await res.json()
    setInv(updated)
    toast.success(updated.is_published ? 'Undangan dipublikasikan!' : 'Undangan disembunyikan')
  }

  // handleSimulatePay() DIHAPUS.
  //
  // Fungsi itu mengirim `{ is_paid: true, expires_at: <+1 tahun> }` langsung dari
  // browser ke /api/invitations/[id] — jalan pintas pengembangan yang memberi
  // paket berbayar setahun secara gratis. Servernya dulu meneruskan body mentah
  // ke invitations.update(), jadi ini benar-benar berfungsi.
  //
  // Sisi server sudah ditutup (allowlist field di route PATCH: hanya slug,
  // template_id, data, is_published). Pemanggilnya ikut dihapus supaya tidak ada
  // yang menyambungkannya kembali dan mengira endpointnya masih menerima.

  async function openFullPreview() {
    if (!inv) return
    const isLegacy = (LEGACY_TEMPLATE_IDS as string[]).includes(inv.template_id)
    if (isLegacy) {
      window.open(getInvitationUrl(inv.slug), '_blank')
      return
    }
    let tmpl = previewTemplate
    if (!tmpl) {
      try {
        const m = await import('@/lib/template-configs/javanese-gold')
        if (m.default.id === inv.template_id) {
          tmpl = m.default
          setPreviewTemplate(tmpl)
        }
      } catch { /* ignore */ }
    }
    setShowFullPreview(true)
  }

  function navTo(id: Tab) {
    setTab(id)
    // Berpindah menu membatalkan niat "buat undangan baru" — kalau tidak,
    // wizardnya akan muncul lagi diam-diam saat kembali ke Beranda.
    setCreating(false)
    setSidebarOpen(false)
    setMobileMoreOpen(false)
  }

  const statusConfig = expired
    ? { cls: 'bg-red-500/10 text-red-400 ring-red-500/20', label: 'Expired', dot: 'bg-red-400' }
    : isPublished && isPaid
    ? { cls: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20', label: 'Aktif', dot: 'bg-emerald-400' }
    : isPaid
    ? { cls: 'bg-sky-500/10 text-sky-400 ring-sky-500/20', label: 'Siap Publish', dot: 'bg-sky-400' }
    : { cls: 'bg-amber-500/10 text-amber-400 ring-amber-500/20', label: 'Free Trial', dot: 'bg-amber-400' }

  return (
    <div className="flex h-screen bg-[#f8f7f4] overflow-hidden">

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-[260px] bg-[#1a1a1a] flex flex-col
        transition-transform duration-300 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:static md:translate-x-0 md:flex
      `}>
        {/* Logo area */}
        <div className="h-16 flex items-center justify-between px-5">
          <div className="flex items-center gap-2.5">
            <Logo variant="icon-only" size="sm" />
            <span className="text-[13px] font-semibold text-white/90 tracking-tight">Dashboard</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-white/40 hover:text-white/70 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* User card */}
        <div className="mx-3 mb-3">
          <div className="bg-white/[0.06] rounded-xl p-3 border border-white/[0.06]">
            <div className="flex items-center gap-3 mb-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-lg shadow-amber-500/20">
                {user.email[0].toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-medium text-white/80 truncate">{user.email}</p>
                {inv && (
                  <div className={`inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full mt-1 ring-1 ${statusConfig.cls}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot} animate-pulse`} />
                    {statusConfig.label}
                  </div>
                )}
              </div>
            </div>
            {inv?.slug && (
              <div className="bg-white/[0.04] rounded-lg px-3 py-2 border border-white/[0.04]">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Globe size={10} className="text-white/30" />
                  <p className="text-[9px] text-white/30 uppercase tracking-[0.15em] font-medium">Link Undangan</p>
                </div>
                <p className="text-[11px] font-mono text-amber-400/90 truncate">{inv.slug}.iaundang.online</p>
                {inv.expires_at && (
                  <p className="text-[9px] text-white/25 mt-1">
                    s/d {new Date(inv.expires_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Pemilih undangan — hanya muncul kalau akun ini punya lebih dari satu */}
        {list.length > 1 && (
          <div className="mx-3 mb-3">
            <label className="block text-[9px] uppercase tracking-[0.2em] font-semibold text-white/20 mb-1.5 px-1">
              Undangan Aktif
            </label>
            <select
              value={inv?.id ?? ''}
              onChange={e => { setActiveId(e.target.value); setCreating(false) }}
              className="w-full bg-white/[0.06] border border-white/[0.08] rounded-lg px-3 py-2 text-[12px] text-white/80 outline-none focus:border-white/20 transition-colors"
            >
              {list.map(i => (
                <option key={i.id} value={i.id} className="bg-[#1a1a1a]">
                  {i.slug}
                </option>
              ))}
            </select>
          </div>
        )}

        {list.length > 0 && !creating && (
          <button
            onClick={() => { setCreating(true); setTab('overview'); setSidebarOpen(false) }}
            className="mx-3 mb-3 flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-white/15 px-3 py-2 text-[11px] text-white/50 hover:text-white/80 hover:border-white/30 transition-colors"
          >
            + Buat undangan baru
          </button>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          <p className="text-[9px] text-white/20 uppercase tracking-[0.2em] font-semibold px-3 mb-2 mt-1">Menu</p>
          {NAV.map(({ id, label, icon: Icon }) => {
            const active = tab === id
            return (
              <button
                key={id}
                onClick={() => navTo(id)}
                className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all text-left group ${
                  active
                    ? 'bg-white/[0.1] text-white shadow-sm'
                    : 'text-white/40 hover:bg-white/[0.05] hover:text-white/70'
                }`}
              >
                {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-amber-400" />}
                <Icon size={16} strokeWidth={active ? 2 : 1.5} />
                <span className="flex-1">{label}</span>
                {active && <ChevronRight size={12} className="text-white/30" />}
              </button>
            )
          })}
        </nav>

        {/* Bottom actions */}
        <div className="px-3 pb-4 pt-3 space-y-1 border-t border-white/[0.06]">
          {inv && (
            <button
              onClick={openFullPreview}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] text-white/40 hover:bg-white/[0.05] hover:text-white/70 transition-all group"
            >
              <Eye size={16} strokeWidth={1.5} />
              <span className="flex-1">Preview</span>
              <ArrowUpRight size={12} className="text-white/20 group-hover:text-white/40" />
            </button>
          )}
          {inv && (
            <button
              onClick={togglePublish}
              className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
                isPublished
                  ? 'bg-white/[0.06] text-white/50 hover:bg-white/[0.1] hover:text-white/70'
                  : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40'
              }`}
            >
              {isPublished ? 'Sembunyikan' : 'Publish Undangan'}
            </button>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] text-white/30 hover:bg-red-500/10 hover:text-red-400 transition-all"
          >
            <LogOut size={16} strokeWidth={1.5} />
            Keluar
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Mobile header */}
        <header className="md:hidden h-14 bg-white/80 backdrop-blur-xl border-b border-stone-200/50 flex items-center justify-between px-4 shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-stone-100 text-stone-500 hover:bg-stone-200 transition-colors">
            <Menu size={18} />
          </button>
          <Logo variant="icon-only" size="sm" />
          {inv ? (
            <button onClick={openFullPreview} className="w-9 h-9 flex items-center justify-center rounded-xl bg-stone-100 text-stone-500 hover:bg-stone-200 transition-colors">
              <Eye size={18} />
            </button>
          ) : <div className="w-9" />}
        </header>

        {/* Desktop breadcrumb header */}
        <div className="hidden md:flex items-center h-12 px-6 shrink-0 border-b border-stone-200/50 bg-white/60 backdrop-blur-xl">
          <p className="text-xs text-stone-400 font-medium">
            Dashboard <span className="text-stone-300 mx-1">/</span>
            <span className="text-stone-700">{currentTabLabel}</span>
          </p>
        </div>

        {/* Content area */}
        <main className={`flex-1 min-h-0 ${tab === 'undangan' ? 'overflow-hidden' : 'overflow-y-auto overflow-x-hidden'}`}>
          {tab === 'undangan' && inv ? (
            <TemplateModule
              invitation={inv}
              allTemplates={allTemplates}
              onInvitationUpdate={(updated) => setInv(updated)}
              isAdmin={isAdmin}
            />
          ) : (
            <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8">
              {(!inv || creating) && (
                <OnboardingWizard
                  invitation={null}
                  onInvitationCreated={setInv}
                  allTemplates={allTemplates}
                />
              )}

              {inv && !creating && (
                <>
                  {!isPaid && !isAdmin && tab === 'overview' && (
                    <UpgradeBanner
                      invitation={inv}
                    />
                  )}

                  {tab === 'overview' && (
                    <DashboardOverview invitation={inv} onNavigate={(t) => setTab(t as Tab)} onTogglePublish={togglePublish} />
                  )}
                  {tab === 'guest' && <GuestManager invitation={inv} />}
                  {tab === 'rsvp' && <RSVPList invitationId={inv.id} />}
                  {tab === 'analytics' && <AnalyticsPanel invitation={inv} />}
                  {tab === 'referral' && <ReferralPanel />}
                  {tab === 'subscription' && <SubscriptionInfo invitation={inv} />}
                  {tab === 'support' && <SupportTickets />}
                  {tab === 'settings' && <SettingsPanel invitation={inv} userEmail={user.email} onDeleted={() => { setInv(null); setTab('overview') }} />}
                </>
              )}
            </div>
          )}
        </main>

        {/* Mobile bottom nav */}
        {inv && (
          <nav className="md:hidden bg-white/90 backdrop-blur-xl border-t border-stone-200/50 flex shrink-0 safe-area-bottom">
            {MOBILE_PRIMARY.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => navTo(id)}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors ${
                  tab === id ? 'text-amber-600' : 'text-stone-400'
                }`}
              >
                <Icon size={18} strokeWidth={tab === id ? 2 : 1.5} />
                {label}
              </button>
            ))}
            <button
              onClick={() => setMobileMoreOpen(true)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors ${
                MOBILE_OVERFLOW.some(n => n.id === tab) ? 'text-amber-600' : 'text-stone-400'
              }`}
            >
              <MoreHorizontal size={18} strokeWidth={MOBILE_OVERFLOW.some(n => n.id === tab) ? 2 : 1.5} />
              Lainnya
            </button>
          </nav>
        )}
      </div>

      {/* Mobile overflow bottom sheet */}
      {mobileMoreOpen && inv && (
        <div className="md:hidden fixed inset-0 z-[55]">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileMoreOpen(false)} />
          <div className="absolute bottom-0 inset-x-0 bg-white rounded-t-3xl p-4 pb-6 safe-area-bottom">
            <div className="w-10 h-1 bg-stone-200 rounded-full mx-auto mb-4" />
            <p className="text-xs font-semibold text-stone-400 px-2 mb-3">Menu Lainnya</p>
            <div className="grid grid-cols-3 gap-2">
              {MOBILE_OVERFLOW.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => navTo(id)}
                  className={`flex flex-col items-center gap-1.5 py-3.5 rounded-2xl transition-colors ${
                    tab === id ? 'bg-stone-900 text-white' : 'bg-stone-50 text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  <Icon size={18} strokeWidth={tab === id ? 2 : 1.5} />
                  <span className="text-[11px] font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Full-screen preview overlay */}
      {showFullPreview && inv && (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 bg-black/90 border-b border-white/10 shrink-0 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <p className="text-white/80 text-sm font-medium">Preview Undangan</p>
              {names?.groom && (
                <span className="text-white/30 text-xs">{names.groom} & {names.bride}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {inv.is_published && (
                <button
                  onClick={() => { navigator.clipboard.writeText(getInvitationUrl(inv.slug)); toast.success('Tautan undangan sudah disalin!') }}
                  className="flex items-center gap-1.5 text-white/50 hover:text-white text-xs px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20 transition-colors"
                >
                  <Copy size={12} /> Salin Link
                </button>
              )}
              <a
                href={getInvitationUrl(inv.slug)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-white/50 hover:text-white text-xs px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20 transition-colors"
              >
                <ExternalLink size={12} /> Buka Tab Baru
              </a>
              <button
                onClick={() => setShowFullPreview(false)}
                className="w-8 h-8 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="max-w-[430px] mx-auto min-h-full bg-white">
              {previewTemplate && !(LEGACY_TEMPLATE_IDS as string[]).includes(inv.template_id) ? (
                <InvitationRenderer
                  invitationId={inv.id}
                  // id-nya asli, tapi ini panel pratinjau milik pemilik. Tanpa
                  // baris ini, mencoba form RSVP di dashboard akan memasukkan
                  // tamu palsu ke daftar tamu sungguhan.
                  mode="preview"
                  invitationData={inv.data as unknown as NewInvitationData}
                  template={previewTemplate}
                  initialWishes={[]}
                  musicUrl={(inv.data as unknown as NewInvitationData).music_url}
                />
              ) : (
                <div className="flex items-center justify-center min-h-screen text-stone-400">
                  <div className="text-center p-8">
                    <p className="text-lg mb-2">Preview tidak tersedia</p>
                    <p className="text-sm">Template belum dimuat atau tidak didukung.</p>
                    <a
                      href={getInvitationUrl(inv.slug)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 mt-4 text-sm text-amber-600 hover:text-amber-700"
                    >
                      <ExternalLink size={14} /> Buka di browser
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {inv && <FeedbackWidget />}
    </div>
  )
}

//  Upgrade Banner

function UpgradeBanner({}: {
  invitation: Invitation
}) {
  return (
    <div className="mb-6 relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#2d2d2d] p-6 text-white">
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-orange-500/5 to-transparent rounded-full translate-y-1/3 -translate-x-1/4" />
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Crown size={16} className="text-amber-400" />
            </div>
            <p className="text-sm font-bold text-white/90">Mode Free Trial</p>
          </div>
          <p className="text-white/50 text-xs leading-relaxed max-w-md">
            Anda sedang dalam mode percobaan gratis. Upgrade untuk menghapus watermark, membuka semua fitur, dan mempublikasikan undangan Anda.
          </p>
          <div className="flex items-center gap-4 mt-3">
            <span className="text-[11px] text-white/40 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> Mulai Rp 79.000
            </span>
            <span className="text-[11px] text-white/40 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" /> Transfer bank / QRIS
            </span>
            <span className="text-[11px] text-white/40 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Aktif dalam 1x24 jam
            </span>
          </div>
        </div>
        <Link
          href="/templates"
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-5 py-3 rounded-xl hover:shadow-lg hover:shadow-amber-500/25 transition-all shrink-0 no-underline"
        >
          <Sparkles size={14} />
          Pilih Template & Upgrade
        </Link>
      </div>
    </div>
  )
}
