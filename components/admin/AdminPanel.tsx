'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import toast from 'react-hot-toast'
import {
  LayoutDashboard, Users, ShoppingCart, Settings, LogOut,
  Music, Package, CreditCard, FlaskConical,
  PanelLeftClose, PanelLeftOpen, AlertTriangle, X, Megaphone,
  FileText, PenLine, Home, ExternalLink, Copy, Save,
  MessageSquarePlus, Zap, Hand,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'
import type { AdminTemplateConfig, BankAccount, PaymentProof } from '@/lib/db'
import type { TemplateRecord, TemplateCategory, ColorPalette, PriceTier, FlashSale, Coupon } from '@/lib/types'
import DashboardTab from './tabs/DashboardTab'
import UsersTab from './tabs/UsersTab'
// InvitationsTab merged into UsersTab
import TemplatesTab from './tabs/TemplatesTab'
import PaymentTab from './tabs/PaymentTab'
import TemplateLab from './tabs/TemplateLab'
import MusicLibraryTab from './tabs/MusicLibraryTab'
import ArticlesTab from './tabs/ArticlesTab'
import WriterTab from './tabs/WriterTab'
import AffiliatesTab from './tabs/AffiliatesTab'
import FeedbackTab from './tabs/FeedbackTab'
import ExperimentsTab from './tabs/ExperimentsTab'
// PackagesTab removed  tier management consolidated into TemplatesTab config drawer
import NewSettingsTab from './tabs/SettingsTab'
import type { SiteSettings } from './tabs/SettingsTab'

//  Types 

interface AdminUserInvitation {
  id: string
  slug: string
  template_id: string
  is_published: boolean
  is_paid: boolean
  package_tier: string | null
  expires_at: string | null
  created_at: string
}

interface AdminUser {
  id: string
  email: string
  role: string
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

interface AdminOrder {
  id: string
  order_number: string
  email: string
  phone: string
  groom_name: string
  bride_name: string
  groom_nickname: string
  bride_nickname: string
  subdomain: string
  template_id: string
  package_tier: string
  amount: number
  unique_code: number
  total_amount: number
  proof_url: string
  notes: string
  status: string
  admin_notes: string
  payment_method: string | null
  created_at: string
  reviewed_at: string | null
}

interface LocalAppSettings {
  price: number
  packageName: string
  packageDuration: number
  templates: AdminTemplateConfig[]
  categories: TemplateCategory[]
  colorPalettes: ColorPalette[]
  priceTiers: PriceTier[]
  flashSales: FlashSale[]
  coupons: Coupon[]
  deletedCategoryIds: string[]
  deletedTierIds: string[]
  bankAccounts: BankAccount[]
  qrisImageUrl: string
  paymentInstructions: string
  confirmationWhatsapp: string
  siteName: string
  siteTagline: string
  logoHorizontalUrl: string
  logoVerticalUrl: string
  contactEmail: string
  socialInstagram: string
  socialTwitter: string
  socialGithub: string
  appDomain: string
  demoSubdomain: string
}

interface Stats {
  totalUsers: number
  totalInvitations: number
  totalActive: number
  totalPaid: number
  totalUnpaid: number
  totalRevenue: number
}

interface Props {
  users: AdminUser[]
  invitations: AdminInvitation[]
  orders: AdminOrder[]
  proofs: PaymentProof[]
  stats: Stats
  settings: LocalAppSettings
  templateRecords: TemplateRecord[]
  adminEmail: string
}

type NavTab = 'dashboard' | 'users' | 'template' | 'lab' | 'music' | 'orders' | 'payment' | 'articles' | 'writers' | 'affiliates' | 'feedback' | 'experiments' | 'settings'

const VALID_TABS: NavTab[] = ['dashboard', 'users', 'template', 'lab', 'music', 'orders', 'payment', 'articles', 'writers', 'affiliates', 'feedback', 'experiments', 'settings']

//  Main Component 

export default function AdminPanel({
  users: initialUsers,
  invitations: initialInvitations,
  orders,
  proofs: initialProofs,
  stats: initialStats,
  settings: initialSettings,
  templateRecords: initialTemplateRecords,
  adminEmail,
}: Props) {
  const [templateRecords, setTemplateRecords] = useState<TemplateRecord[]>(initialTemplateRecords)
  const [labEditRecord, setLabEditRecord] = useState<TemplateRecord | null>(null)
  const [labDirty, setLabDirty] = useState(false)
  const labSaveDraftRef = useRef<(() => void) | null>(null)
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard')
  const [pendingTab, setPendingTab] = useState<NavTab | null>(null)
  const [transitioning, setTransitioning] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const [pendingArticles, setPendingArticles] = useState(0)
  const [articleAuthorFilter, setArticleAuthorFilter] = useState<{ id: string; name: string } | null>(null)

  // Sidebar badge: count articles awaiting review (light polling).
  const refreshPendingArticles = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/articles/pending-count')
      if (res.ok) setPendingArticles((await res.json()).count ?? 0)
    } catch { /* non-blocking */ }
  }, [])

  useEffect(() => {
    refreshPendingArticles()
    const iv = setInterval(refreshPendingArticles, 60000)
    return () => clearInterval(iv)
  }, [refreshPendingArticles])

  // Baca URL setelah hydration + sinkronisasi back/forward
  useEffect(() => {
    function syncFromUrl() {
      const p = new URLSearchParams(window.location.search).get('tab') as NavTab
      setActiveTab(VALID_TABS.includes(p) ? p : 'dashboard')
    }
    syncFromUrl()
    window.addEventListener('popstate', syncFromUrl)
    return () => window.removeEventListener('popstate', syncFromUrl)
  }, [])

  // Browser close/refresh guard
  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (labDirty) { e.preventDefault() }
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [labDirty])

  function handleTabChange(tab: NavTab) {
    if (tab === activeTab) return
    if (activeTab === 'lab' && labDirty && tab !== 'lab') {
      setPendingTab(tab)
      return
    }
    applyTabChange(tab)
  }

  function applyTabChange(tab: NavTab) {
    setTransitioning(true)
    setTimeout(() => {
      setActiveTab(tab)
      const url = new URL(window.location.href)
      url.searchParams.set('tab', tab)
      window.history.pushState({}, '', url.toString())
      requestAnimationFrame(() => setTransitioning(false))
    }, 150)
  }

  function confirmLeaveStudio() {
    setLabDirty(false)
    const tab = pendingTab!
    setPendingTab(null)
    applyTabChange(tab)
  }

  function saveAndLeaveStudio() {
    labSaveDraftRef.current?.()
    setLabDirty(false)
    const tab = pendingTab!
    setPendingTab(null)
    applyTabChange(tab)
    toast.success('Draf tersimpan')
  }
  const [users, setUsers] = useState(initialUsers)
  const [invitations, setInvitations] = useState(initialInvitations)
  const [proofs, setProofs] = useState(initialProofs)
  const [stats, setStats] = useState(initialStats)
  const [appSettings, setAppSettings] = useState(initialSettings)

  function recalc(invs: AdminInvitation[], usrs: AdminUser[]) {
    const paid = invs.filter((i) => i.is_paid)
    const totalRevenue = orders
      .filter((o) => o.status === 'approved')
      .reduce((sum, o) => sum + o.total_amount, 0)
    setStats({
      totalUsers: usrs.length,
      totalInvitations: invs.length,
      totalActive: invs.filter((i) => i.is_published && i.is_paid).length,
      totalPaid: paid.length,
      totalUnpaid: invs.filter((i) => !i.is_paid).length,
      totalRevenue,
    })
  }

  async function handleOverridePaid(invId: string, paid: boolean) {
    const expiresAt = new Date()
    expiresAt.setMonth(expiresAt.getMonth() + appSettings.packageDuration)

    const res = await fetch(`/api/admin/invitations/${invId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        is_paid: paid,
        ...(paid ? { is_published: true, expires_at: expiresAt.toISOString() } : {}),
      }),
    })
    if (!res.ok) { toast.error('Gagal update status'); return }

    const newInvs = invitations.map((i) =>
      i.id === invId
        ? { ...i, is_paid: paid, ...(paid ? { is_published: true, expires_at: expiresAt.toISOString() } : {}) }
        : i
    )
    const newUsers = users.map((u) => ({
      ...u,
      invitations: u.invitations.map((inv) =>
        inv.id === invId ? { ...inv, is_paid: paid } : inv
      ),
    }))
    setInvitations(newInvs)
    setUsers(newUsers)
    recalc(newInvs, newUsers)
    toast.success(paid ? '�� Ditandai lunas & dipublish' : 'Status direset ke belum bayar')
  }

  async function handleTogglePublished(invId: string, published: boolean) {
    const res = await fetch(`/api/admin/invitations/${invId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_published: published }),
    })
    if (!res.ok) { toast.error('Gagal update'); return }

    const newInvs = invitations.map((i) =>
      i.id === invId ? { ...i, is_published: published } : i
    )
    setInvitations(newInvs)
    recalc(newInvs, users)
    toast.success(published ? 'Undangan dipublish' : 'Undangan di-draft')
  }

  async function handleChangeRole(userId: string, role: string) {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    })
    if (!res.ok) {
      const data = await res.json()
      toast.error(data.error || 'Gagal ubah role')
      return
    }
    setUsers(users.map(u => u.id === userId ? { ...u, role } : u))
    toast.success(`Role diubah ke ${role}`)
  }

  async function handleDeleteUser(userId: string) {
    const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json()
      toast.error(data.error || 'Gagal hapus user')
      return
    }
    const newUsers = users.filter((u) => u.id !== userId)
    const newInvs = invitations.filter((i) => i.user_id !== userId)
    setUsers(newUsers)
    setInvitations(newInvs)
    recalc(newInvs, newUsers)
    toast.success('User dihapus')
  }

  async function handleSaveSettings(newSettings: LocalAppSettings) {
    const res = await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSettings),
    })
    if (!res.ok) { toast.error('Gagal simpan pengaturan'); return }
    setAppSettings(newSettings)
    recalc(invitations, users)
    toast.success('Pengaturan tersimpan!')
  }

  async function handleProofReview(proofId: string, status: 'approved' | 'rejected', notes: string) {
    const res = await fetch(`/api/admin/proofs/${proofId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, admin_notes: notes, packageDuration: appSettings.packageDuration }),
    })
    if (!res.ok) { toast.error('Gagal memproses'); return }
    const updatedProofs = proofs.map((p) => p.id === proofId ? { ...p, status, admin_notes: notes, reviewed_at: new Date().toISOString() } : p)
    setProofs(updatedProofs)
    if (status === 'approved') {
      const proof = proofs.find((p) => p.id === proofId)
      if (proof) {
        const newInvs = invitations.map((i) => i.id === proof.invitation_id ? { ...i, is_paid: true, is_published: true } : i)
        setInvitations(newInvs)
        recalc(newInvs, users)
      }
      toast.success('Transfer disetujui! Undangan langsung aktif.')
    } else {
      toast.success('Transfer ditolak. User akan diberitahu.')
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  const pendingProofs = proofs.filter((p) => p.status === 'pending').length

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        adminEmail={adminEmail}
        onLogout={handleLogout}
        stats={stats}
        pendingProofs={pendingProofs}
        pendingArticles={pendingArticles}
        siteName={appSettings.siteName ?? 'iaundang'}
        logoVerticalUrl={appSettings.logoVerticalUrl ?? '/logos/logo-vertical.png'}
      />

      <main className={`flex-1 min-h-0 ${activeTab === 'lab' || activeTab === 'settings' || activeTab === 'template' ? 'overflow-hidden flex flex-col' : 'overflow-y-auto scrollbar-hide'}`}>
        <div
          ref={contentRef}
          className={`${activeTab === 'lab' || activeTab === 'settings' || activeTab === 'template' ? 'flex-1 min-h-0' : 'h-full'} transition-opacity duration-150 ease-in-out ${transitioning ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0'}`}
          style={{ transition: 'opacity 150ms ease, transform 150ms ease' }}
        >
        {activeTab === 'dashboard' && (
          <DashboardTab stats={stats} users={users} invitations={invitations} pendingProofs={pendingProofs} onGoToTab={(t) => handleTabChange(t as NavTab)} />
        )}
        {activeTab === 'users' && (
          <UsersTab
            users={users}
            templates={appSettings.templates}
            onDelete={handleDeleteUser}
            onOverridePaid={handleOverridePaid}
            onTogglePublished={handleTogglePublished}
          />
        )}
        {activeTab === 'template' && (
          <TemplatesTab
            records={templateRecords}
            onRecordsUpdate={(recs) => setTemplateRecords(recs)}
            onGoToLab={() => handleTabChange('lab')}
            onEditInLab={(rec) => { setLabEditRecord(rec); handleTabChange('lab') }}
            categories={appSettings.categories}
            deletedCategoryIds={appSettings.deletedCategoryIds}
            deletedTierIds={appSettings.deletedTierIds}
            onCategoriesUpdate={(cats, deletedIds) => handleSaveSettings({ ...appSettings, categories: cats, deletedCategoryIds: deletedIds ?? appSettings.deletedCategoryIds })}
            priceTiers={appSettings.priceTiers}
            onPriceTiersUpdate={(tiers, deletedIds) => handleSaveSettings({ ...appSettings, priceTiers: tiers, deletedTierIds: deletedIds ?? appSettings.deletedTierIds })}
            flashSales={appSettings.flashSales}
            onFlashSalesUpdate={(sales) => handleSaveSettings({ ...appSettings, flashSales: sales })}
            coupons={appSettings.coupons}
            onCouponsUpdate={(cpns) => handleSaveSettings({ ...appSettings, coupons: cpns })}
          />
        )}
        {activeTab === 'lab' && (
          <TemplateLab
            onGoToManagement={() => handleTabChange('template')}
            editRecord={labEditRecord}
            templateRecords={templateRecords}
            onTemplateReleased={(rec) => {
              setTemplateRecords(prev => {
                const idx = prev.findIndex(r => r.id === rec.id)
                if (idx >= 0) return prev.map(r => r.id === rec.id ? rec : r)
                return [...prev, rec]
              })
              setLabEditRecord(null)
              setLabDirty(false)
              toast.success('Template berhasil disimpan!', { duration: 4000, icon: '��' })
            }}
            onDirtyChange={setLabDirty}
            onSaveDraftRef={labSaveDraftRef}
            categories={appSettings.categories}
            palettes={appSettings.colorPalettes}
          />
        )}
        {activeTab === 'music' && <MusicLibraryTab />}
        {activeTab === 'orders' && <OrdersTab orders={orders} />}
        {activeTab === 'payment' && (
          <PaymentTab
            config={{
              bankAccounts: appSettings.bankAccounts,
              qrisImageUrl: appSettings.qrisImageUrl,
              paymentInstructions: appSettings.paymentInstructions,
              confirmationWhatsapp: appSettings.confirmationWhatsapp,
            }}
            proofs={proofs}
            packageDuration={appSettings.packageDuration}
            onConfigUpdate={(cfg) => setAppSettings({ ...appSettings, ...cfg })}
            onProofReview={handleProofReview}
          />
        )}
        {activeTab === 'articles' && (
          <ArticlesTab
            authorFilter={articleAuthorFilter}
            onClearAuthorFilter={() => setArticleAuthorFilter(null)}
            onReviewed={refreshPendingArticles}
          />
        )}
        {activeTab === 'writers' && (
          <WriterTab onViewArticles={(id, name) => { setArticleAuthorFilter({ id, name }); handleTabChange('articles') }} />
        )}
        {activeTab === 'affiliates' && <AffiliatesTab />}
        {activeTab === 'feedback' && <FeedbackTab />}
        {activeTab === 'experiments' && <ExperimentsTab />}
        {activeTab === 'settings' && (
          <NewSettingsTab
            settings={{
              siteName: appSettings.siteName ?? 'iaundang',
              siteTagline: appSettings.siteTagline ?? 'Digital Wedding Invitation',
              logoHorizontalUrl: appSettings.logoHorizontalUrl ?? '/logos/logo-horizontal.png',
              logoVerticalUrl: appSettings.logoVerticalUrl ?? '/logos/logo-vertical.png',
              contactEmail: appSettings.contactEmail ?? 'halo@iaundang.online',
              contactWhatsapp: appSettings.confirmationWhatsapp ?? '628123456789',
              socialInstagram: appSettings.socialInstagram ?? 'ia.undang',
              socialTwitter: appSettings.socialTwitter ?? 'iaundang',
              socialGithub: appSettings.socialGithub ?? 'iaundang',
              appDomain: appSettings.appDomain ?? 'iaundang.online',
              demoSubdomain: appSettings.demoSubdomain ?? 'demo',
            }}
            adminEmail={adminEmail}
            onSave={async (siteSettings) => {
              await handleSaveSettings({
                ...appSettings,
                siteName: siteSettings.siteName,
                siteTagline: siteSettings.siteTagline,
                logoHorizontalUrl: siteSettings.logoHorizontalUrl,
                logoVerticalUrl: siteSettings.logoVerticalUrl,
                contactEmail: siteSettings.contactEmail,
                confirmationWhatsapp: siteSettings.contactWhatsapp,
                socialInstagram: siteSettings.socialInstagram,
                socialTwitter: siteSettings.socialTwitter,
                socialGithub: siteSettings.socialGithub,
                appDomain: siteSettings.appDomain,
                demoSubdomain: siteSettings.demoSubdomain,
              })
            }}
          />
        )}
        </div>

        {/* Unsaved changes confirmation modal */}
        {pendingTab && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[360px] mx-4 overflow-hidden">
              <div className="px-6 pt-6 pb-4 text-center">
                <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center mx-auto mb-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">Ada perubahan yang belum disimpan</h3>
                <p className="text-xs text-gray-500 leading-relaxed">Simpan sebagai draf agar bisa dilanjutkan nanti, atau tinggalkan tanpa menyimpan.</p>
              </div>
              <div className="px-5 pb-5 space-y-2">
                {labSaveDraftRef.current && (
                  <button onClick={saveAndLeaveStudio}
                    className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors">
                    <Save className="w-4 h-4" /> Simpan Draf & Pergi
                  </button>
                )}
                <button onClick={confirmLeaveStudio}
                  className="w-full py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-colors">
                  Tinggalkan tanpa menyimpan
                </button>
                <button onClick={() => setPendingTab(null)}
                  className="w-full py-2 text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors">
                  Batal, tetap di sini
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

//  Sidebar 

const NAV_GROUPS = [
  {
    label: 'Utama',
    items: [
      { id: 'dashboard'   as NavTab, label: 'Dashboard',          icon: LayoutDashboard, desc: 'Statistik & aktivitas' },
      { id: 'users'       as NavTab, label: 'Pengguna',           icon: Users,           desc: 'Kelola pengguna & undangan' },
    ],
  },
  {
    label: 'Konten',
    items: [
      { id: 'articles'    as NavTab, label: 'Artikel',            icon: FileText,        desc: 'Blog, SEO & manajemen konten' },
      { id: 'writers'     as NavTab, label: 'Writer',             icon: PenLine,         desc: 'Kelola penulis konten' },
    ],
  },
  {
    label: 'Template',
    items: [
      { id: 'lab'         as NavTab, label: 'Studio Desain',      icon: FlaskConical,    desc: 'Buat & eksperimen template' },
      { id: 'template'    as NavTab, label: 'Manajemen',          icon: Package,         desc: 'Review, harga & publikasi tema' },
      { id: 'music'       as NavTab, label: 'Musik',              icon: Music,           desc: 'Perpustakaan musik undangan' },
    ],
  },
  {
    label: 'Transaksi',
    items: [
      { id: 'payment'     as NavTab, label: 'Pembayaran',         icon: CreditCard,      desc: 'Bank, QRIS & verifikasi' },
      { id: 'orders'      as NavTab, label: 'Pesanan',            icon: ShoppingCart,    desc: 'Riwayat transaksi' },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { id: 'affiliates'  as NavTab, label: 'Afiliasi',           icon: Megaphone,       desc: 'Kelola program affiliate' },
    ],
  },
  {
    label: 'Insights',
    items: [
      { id: 'feedback'     as NavTab, label: 'Feedback',           icon: MessageSquarePlus, desc: 'NPS & feedback pengguna' },
      { id: 'experiments'  as NavTab, label: 'A/B Testing',        icon: FlaskConical,      desc: 'Eksperimen & variant test' },
    ],
  },
  {
    label: 'Sistem',
    items: [
      { id: 'settings'    as NavTab, label: 'Pengaturan',         icon: Settings,        desc: 'Branding, akun & kontak' },
    ],
  },
]

function Sidebar({
  activeTab, onTabChange, adminEmail, onLogout, stats, pendingProofs, pendingArticles, siteName, logoVerticalUrl,
}: {
  activeTab: NavTab
  onTabChange: (t: NavTab) => void
  adminEmail: string
  onLogout: () => void
  stats: Stats
  pendingProofs: number
  pendingArticles: number
  siteName: string
  logoVerticalUrl: string
}) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside className={`${collapsed ? 'w-[68px]' : 'w-56'} flex flex-col shrink-0 border-r border-gray-100 bg-white transition-all duration-200 ease-in-out`}>
      {/* Brand */}
      <div className={`${collapsed ? 'px-3' : 'px-5'} py-4 border-b border-gray-100`}>
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="w-8 h-8 rounded-xl shrink-0 overflow-hidden flex items-center justify-center">
            <Image src="/logos/icons.png" alt={siteName} width={32} height={32} className="object-contain" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="font-bold text-gray-900 text-sm leading-tight truncate">{siteName}</p>
              <p className="text-[10px] text-gray-400 leading-tight">Admin Console</p>
            </div>
          )}
        </div>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 px-2 py-3 space-y-4 overflow-y-auto scrollbar-hide overflow-x-hidden">
        {NAV_GROUPS.map(group => (
          <div key={group.label}>
            {!collapsed && (
              <p className="text-[9px] font-bold text-gray-300 uppercase tracking-[.15em] px-2 mb-1.5">
                {group.label}
              </p>
            )}
            {collapsed && <div className="h-px bg-gray-100 mx-1 mb-1.5" />}
            <div className="space-y-0.5">
              {group.items.map(({ id, label, icon: Icon, desc }) => {
                const isActive = activeTab === id
                const badge =
                  id === 'users'       ? (stats.totalUsers   > 0 ? stats.totalUsers   : null) :
                  id === 'payment'     ? (pendingProofs      > 0 ? pendingProofs      : null) :
                  id === 'articles'    ? (pendingArticles    > 0 ? pendingArticles    : null) : null
                return (
                  <button
                    key={id}
                    data-tab={id}
                    onClick={() => onTabChange(id)}
                    title={collapsed ? label : undefined}
                    className={`w-full flex items-center ${collapsed ? 'justify-center px-0 py-2.5' : 'gap-2.5 px-2.5 py-2'} rounded-xl transition-all duration-150 relative ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 shadow-sm shadow-indigo-100'
                        : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? 'text-indigo-600' : ''}`} />
                    {!collapsed && (
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-[13px] font-medium leading-tight truncate">{label}</p>
                      </div>
                    )}
                    {badge != null && (
                      <span className={`${collapsed ? 'absolute -top-0.5 -right-0.5 w-4 h-4 text-[8px] flex items-center justify-center' : 'text-[10px] px-1.5 py-0.5 min-w-[18px] text-center'} font-bold rounded-full leading-none shrink-0 ${
                        id === 'payment' || id === 'articles' ? 'bg-red-100 text-red-600 animate-pulse' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {collapsed ? '' : badge}
                        {collapsed && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Quick links */}
      <div className="px-2 py-2 border-t border-gray-100">
        {!collapsed && (
          <p className="text-[9px] font-bold text-gray-300 uppercase tracking-[.15em] px-2 mb-1.5">
            Pintasan
          </p>
        )}
        {collapsed && <div className="h-px bg-gray-100 mx-1 mb-1.5" />}
        <div className="space-y-0.5">
          {[
            { href: '/', label: 'Halaman Utama', icon: Home },
            { href: '/dashboard', label: 'Dashboard User', icon: LayoutDashboard },
            { href: '/writer', label: 'Panel Writer', icon: PenLine },
            { href: '/affiliate', label: 'Panel Affiliate', icon: Megaphone },
          ].map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={`w-full flex items-center ${collapsed ? 'justify-center px-0 py-2' : 'gap-2.5 px-2.5 py-1.5'} rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-all duration-150 group`}
            >
              <Icon className="w-[16px] h-[16px] shrink-0" />
              {!collapsed && (
                <span className="flex-1 text-[12px] font-medium leading-tight truncate">{label}</span>
              )}
              {!collapsed && (
                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* Collapse toggle */}
      <div className="px-2 py-1.5 border-t border-gray-100">
        <button
          onClick={() => setCollapsed(c => !c)}
          className="w-full flex items-center justify-center gap-2 px-2 py-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
          title={collapsed ? 'Perluas sidebar' : 'Perkecil sidebar'}
        >
          {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          {!collapsed && <span className="text-[11px] font-medium">Perkecil</span>}
        </button>
      </div>

      {/* Footer */}
      <div className={`${collapsed ? 'px-2' : 'px-3'} py-3 border-t border-gray-100`}>
        {!collapsed ? (
          <>
            <div className="flex items-center gap-2 px-2 py-2 rounded-xl bg-gray-50/80 mb-1.5">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shrink-0">
                <span className="text-[11px] font-bold text-white uppercase">
                  {adminEmail.charAt(0)}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 truncate flex-1">{adminEmail}</p>
            </div>
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 text-xs font-medium transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Keluar
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center" title={adminEmail}>
              <span className="text-[11px] font-bold text-white uppercase">{adminEmail.charAt(0)}</span>
            </div>
            <button onClick={onLogout} className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Keluar">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}

//  Page Header 

function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="px-8 py-5 border-b border-gray-100 bg-white">
      <h1 className="text-lg font-bold text-gray-900 tracking-tight">{title}</h1>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
  )
}

//  Badge 

function Badge({ variant, children }: { variant: 'green' | 'yellow' | 'red' | 'gray' | 'blue'; children: React.ReactNode }) {
  const styles = {
    green: 'bg-emerald-100 text-emerald-700',
    yellow: 'bg-amber-100 text-amber-700',
    red: 'bg-red-100 text-red-700',
    gray: 'bg-gray-100 text-gray-600',
    blue: 'bg-blue-100 text-blue-700',
  }
  return (
    <span className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full ${styles[variant]}`}>
      {children}
    </span>
  )
}

//  Orders Tab 

function OrdersTab({ orders: initialOrders }: { orders: AdminOrder[] }) {
  const [orderList, setOrderList] = useState(initialOrders)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [methodFilter, setMethodFilter] = useState<'all' | 'mayar' | 'manual'>('all')
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [processing, setProcessing] = useState(false)
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null)

  // Order lama sebelum integrasi Mayar bisa punya payment_method null, anggap manual
  const orderMethod = (o: AdminOrder): 'mayar' | 'manual' => (o.payment_method === 'mayar' ? 'mayar' : 'manual')

  const filtered = orderList.filter(o =>
    (filter === 'all' || o.status === filter) &&
    (methodFilter === 'all' || orderMethod(o) === methodFilter)
  )
  const pendingCount = orderList.filter(o => o.status === 'pending').length
  const approvedCount = orderList.filter(o => o.status === 'approved').length
  const mayarCount = orderList.filter(o => orderMethod(o) === 'mayar').length
  const usedSubdomains = orderList.filter(o => o.status !== 'rejected').map(o => o.subdomain)

  async function handleAction(action: 'approve' | 'reject') {
    if (!selectedOrder) return
    setProcessing(true)
    try {
      const res = await fetch(`/api/admin/orders/${selectedOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, admin_notes: adminNotes }),
      })
      if (!res.ok) { const err = await res.json(); toast.error(err.error || 'Gagal'); return }
      const data = await res.json()
      setOrderList(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, status: action === 'approve' ? 'approved' : 'rejected', admin_notes: adminNotes, reviewed_at: new Date().toISOString() } : o))
      if (action === 'approve' && data.credentials) {
        setCredentials(data.credentials)
      } else {
        setSelectedOrder(null)
        setAdminNotes('')
        if (action === 'approve' && data.accountAlreadyExisted) {
          // Tidak ada kredensial baru untuk diteruskan: emailnya sudah punya
          // akun, jadi password lamanya tetap berlaku.
          toast.success('Pesanan disetujui. Email ini sudah punya akun, jadi pakai password lama atau kirimkan reset password.', { duration: 8000 })
        } else {
          toast.success(action === 'approve' ? 'Pesanan disetujui!' : 'Pesanan ditolak')
        }
      }
    } catch { toast.error('Ada kendala sebentar. Coba lagi ya.') }
    finally { setProcessing(false) }
  }

  function copyCredentials() {
    if (!credentials || !selectedOrder) return
    const text = `Halo kak ${selectedOrder.groom_nickname} & ${selectedOrder.bride_nickname}! 🎉\n\nUndangan digital kalian sudah aktif!\n\n🔑 Login:\nEmail: ${credentials.email}\nPassword: ${credentials.password}\nDashboard: ${window.location.origin}/login\n\n🌐 Alamat undangan:\n${selectedOrder.subdomain}.iaundang.online\n\nSilakan login dan lengkapi detail undangan. Terima kasih! 🙏`
    navigator.clipboard.writeText(text)
    toast.success('Pesan kredensial disalin! Kirim ke user via WA.')
  }

  return (
    <div>
      <PageHeader title="Pesanan" subtitle={`${pendingCount} menunggu verifikasi · ${approvedCount} disetujui · ${usedSubdomains.length} subdomain terpakai`} />
      <div className="p-8">

        {/* Stats cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-[11px] text-gray-400 font-medium">Total Pesanan</p>
            <p className="text-2xl font-bold text-gray-900">{orderList.length}</p>
          </div>
          <div className="bg-amber-50 rounded-xl border border-amber-100 p-4">
            <p className="text-[11px] text-amber-600 font-medium">Menunggu</p>
            <p className="text-2xl font-bold text-amber-700">{pendingCount}</p>
          </div>
          <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-4">
            <p className="text-[11px] text-emerald-600 font-medium">Disetujui</p>
            <p className="text-2xl font-bold text-emerald-700">{approvedCount}</p>
          </div>
          <div className="bg-violet-50 rounded-xl border border-violet-100 p-4">
            <p className="text-[11px] text-violet-600 font-medium flex items-center gap-1"><Zap className="w-3 h-3" /> Via Mayar</p>
            <p className="text-2xl font-bold text-violet-700">{mayarCount}</p>
          </div>
          <div className="bg-blue-50 rounded-xl border border-blue-100 p-4">
            <p className="text-[11px] text-blue-600 font-medium">Subdomain Terpakai</p>
            <p className="text-2xl font-bold text-blue-700">{usedSubdomains.length}</p>
          </div>
        </div>

        {/* Filters - status */}
        <div className="flex flex-wrap gap-2 mb-2">
          {([['all', 'Semua'], ['pending', 'Menunggu'], ['approved', 'Disetujui'], ['rejected', 'Ditolak']] as const).map(([key, label]) => (
            <button key={key} onClick={() => setFilter(key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${filter === key ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'}`}>
              {label} {key === 'pending' && pendingCount > 0 && <span className="ml-1 bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{pendingCount}</span>}
            </button>
          ))}
        </div>

        {/* Filters - payment method */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-[11px] text-gray-400 font-medium mr-1">Metode:</span>
          {([['all', 'Semua'], ['mayar', 'Mayar Otomatis'], ['manual', 'Manual']] as const).map(([key, label]) => (
            <button key={key} onClick={() => setMethodFilter(key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                methodFilter === key
                  ? key === 'mayar' ? 'bg-violet-100 text-violet-700' : 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}>
              {label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">No. Pesanan</th>
                  <th className="text-left px-4 py-3 font-medium">Mempelai</th>
                  <th className="text-left px-4 py-3 font-medium">Subdomain</th>
                  <th className="text-left px-4 py-3 font-medium">Paket</th>
                  <th className="text-left px-4 py-3 font-medium">Total</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Tanggal</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(o => (
                  <tr key={o.id} className={`hover:bg-gray-50 ${o.status === 'pending' ? 'bg-amber-50/30' : ''}`}>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{o.order_number}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800 text-xs">{o.groom_nickname} & {o.bride_nickname}</p>
                      <p className="text-[11px] text-gray-400">{o.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-indigo-600">{o.subdomain}</span>
                      <span className="text-[10px] text-gray-400">.iaundang.online</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={o.package_tier === 'eksklusif' ? 'yellow' : o.package_tier === 'popular' ? 'blue' : 'gray'}>
                        {o.package_tier}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800 text-xs">Rp {o.total_amount.toLocaleString('id-ID')}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col items-start gap-1">
                        <Badge variant={o.status === 'approved' ? 'green' : o.status === 'pending' ? 'yellow' : o.status === 'rejected' ? 'red' : 'gray'}>
                          {o.status === 'pending' ? 'Menunggu' : o.status === 'approved' ? 'Disetujui' : o.status === 'rejected' ? 'Ditolak' : o.status}
                        </Badge>
                        {orderMethod(o) === 'mayar' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
                            <Zap className="w-3 h-3" /> Mayar Otomatis
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                            <Hand className="w-3 h-3" /> Manual
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{new Date(o.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => { setSelectedOrder(o); setAdminNotes(''); setCredentials(null) }}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">Detail</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-16">
              <ShoppingCart className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Belum ada pesanan{filter !== 'all' ? ` dengan status "${filter}"` : ''}</p>
            </div>
          )}
        </div>

        {/* Subdomain usage list */}
        {usedSubdomains.length > 0 && (
          <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Subdomain Terpakai ({usedSubdomains.length})</p>
            <div className="flex flex-wrap gap-2">
              {usedSubdomains.map((s, i) => {
                const order = orderList.find(o => o.subdomain === s && o.status !== 'rejected')
                return (
                  <span key={i} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono border ${
                    order?.status === 'approved' ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-amber-50 border-amber-200 text-amber-700'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${order?.status === 'approved' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    {s}
                  </span>
                )
              })}
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setSelectedOrder(null); setCredentials(null) }}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="font-semibold text-gray-900">Detail Pesanan</h3>
                    <p className="text-[11px] font-mono text-gray-400 mt-0.5">{selectedOrder.order_number}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <Badge variant={selectedOrder.status === 'approved' ? 'green' : selectedOrder.status === 'pending' ? 'yellow' : 'red'}>
                      {selectedOrder.status === 'pending' ? 'Menunggu' : selectedOrder.status === 'approved' ? 'Disetujui' : 'Ditolak'}
                    </Badge>
                    {orderMethod(selectedOrder) === 'mayar' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
                        <Zap className="w-3 h-3" /> Mayar Otomatis
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        <Hand className="w-3 h-3" /> Manual
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-4 text-sm">
                  {/* Couple info */}
                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Data Mempelai</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[11px] text-gray-400">Pria</p>
                        <p className="font-medium text-gray-800">{selectedOrder.groom_name}</p>
                        <p className="text-[11px] text-gray-500">({selectedOrder.groom_nickname})</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-gray-400">Wanita</p>
                        <p className="font-medium text-gray-800">{selectedOrder.bride_name}</p>
                        <p className="text-[11px] text-gray-500">({selectedOrder.bride_nickname})</p>
                      </div>
                    </div>
                  </div>

                  {/* Contact & subdomain */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-gray-50 p-3">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Email</p>
                      <p className="text-xs font-medium text-gray-800 break-all">{selectedOrder.email}</p>
                    </div>
                    <div className="rounded-xl bg-gray-50 p-3">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">WhatsApp</p>
                      <p className="text-xs font-medium text-gray-800">{selectedOrder.phone || '-'}</p>
                    </div>
                  </div>

                  <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-3">
                    <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-1">Subdomain</p>
                    <p className="text-sm font-mono font-bold text-indigo-700">{selectedOrder.subdomain}<span className="text-indigo-400 font-normal">.iaundang.online</span></p>
                  </div>

                  {/* Payment info */}
                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Pembayaran</p>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <p className="text-[11px] text-gray-400">Paket</p>
                        <p className="font-medium capitalize text-gray-800">{selectedOrder.package_tier}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-gray-400">Harga + Unik</p>
                        <p className="text-[11px] text-gray-600">Rp {selectedOrder.amount.toLocaleString('id-ID')} + {selectedOrder.unique_code}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-gray-400">Total</p>
                        <p className="font-bold text-indigo-700">Rp {selectedOrder.total_amount.toLocaleString('id-ID')}</p>
                      </div>
                    </div>
                  </div>

                  {selectedOrder.reviewed_at && (
                    <p className="text-[11px] text-gray-400">Diproses: {new Date(selectedOrder.reviewed_at).toLocaleString('id-ID')}</p>
                  )}
                  {selectedOrder.admin_notes && (
                    <div className="rounded-xl bg-yellow-50 border border-yellow-100 p-3">
                      <p className="text-[10px] font-bold text-yellow-600 uppercase tracking-wider mb-1">Catatan Admin</p>
                      <p className="text-xs text-yellow-800">{selectedOrder.admin_notes}</p>
                    </div>
                  )}
                </div>

                {/* Credentials display after approval */}
                {credentials && (
                  <div className="mt-4 rounded-xl bg-green-50 border border-green-200 p-4">
                    <p className="text-xs font-bold text-green-800 mb-2">Akun berhasil dibuat! Kirim kredensial ke user:</p>
                    <div className="bg-white rounded-lg p-3 font-mono text-xs space-y-1">
                      <p>Email: <strong>{credentials.email}</strong></p>
                      <p>Password: <strong>{credentials.password}</strong></p>
                      <p>Subdomain: <strong>{selectedOrder.subdomain}.iaundang.online</strong></p>
                    </div>
                    <button onClick={copyCredentials}
                      className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white text-xs font-bold rounded-xl hover:bg-green-700 transition-colors">
                      <Copy className="w-3.5 h-3.5" /> Salin Pesan (kirim via WA ke user)
                    </button>
                  </div>
                )}

                {/* Mayar orders are processed automatically via webhook, manual verification not needed */}
                {orderMethod(selectedOrder) === 'mayar' && !credentials && (
                  <div className="mt-5 rounded-xl bg-violet-50 border border-violet-100 p-4 flex items-start gap-3">
                    <Zap className="w-5 h-5 text-violet-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-violet-900">
                        {selectedOrder.status === 'approved' ? 'Sudah aktif otomatis via Mayar' : 'Diproses otomatis via Mayar'}
                      </p>
                      <p className="text-xs text-violet-600 mt-0.5">
                        Order ini dibayar via Mayar (QRIS/e-wallet) dan diaktifkan otomatis lewat webhook. Verifikasi manual tidak diperlukan.
                      </p>
                    </div>
                  </div>
                )}

                {/* Actions for pending manual orders */}
                {selectedOrder.status === 'pending' && !credentials && orderMethod(selectedOrder) !== 'mayar' && (
                  <div className="mt-5 space-y-3">
                    <div className="rounded-xl bg-amber-50 border border-amber-100 p-3">
                      <p className="text-xs text-amber-800 font-medium">Pastikan user sudah transfer Rp {selectedOrder.total_amount.toLocaleString('id-ID')} sebelum approve.</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Catatan Admin (opsional)</label>
                      <textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} rows={2} placeholder="Catatan internal..."
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 resize-none" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleAction('reject')} disabled={processing}
                        className="flex-1 px-4 py-2.5 bg-red-50 text-red-700 text-xs font-bold rounded-xl hover:bg-red-100 transition-colors border border-red-200 disabled:opacity-50">
                        Tolak Pesanan
                      </button>
                      <button onClick={() => handleAction('approve')} disabled={processing}
                        className="flex-1 px-4 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50">
                        {processing ? 'Memproses...' : 'Approve & Buat Akun'}
                      </button>
                    </div>
                  </div>
                )}

                {(selectedOrder.status !== 'pending' || orderMethod(selectedOrder) === 'mayar') && !credentials && (
                  <button onClick={() => { setSelectedOrder(null); setCredentials(null) }}
                    className="mt-4 w-full px-4 py-2.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-xl hover:bg-gray-200 transition-colors">
                    Tutup
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

