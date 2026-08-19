'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import toast from 'react-hot-toast'
import {
  LayoutDashboard, Users, ShoppingCart, Settings, LogOut,
  Music, Package, CreditCard, Crown,
  PanelLeftClose, PanelLeftOpen, Megaphone,
  FileText, PenLine, Home, ExternalLink,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import type { BankAccount } from '@/lib/db'
import type { TemplateRecord, TemplateCategory, ColorPalette, PriceTier, FlashSale, Coupon } from '@/lib/types'
import DashboardTab from './tabs/DashboardTab'
import type { SiteSettings } from './tabs/SettingsTab'
import type { AdminOrder } from './types'

// Tab selain Dashboard (yang selalu terbuka duluan) di-lazy-load: admin yang
// cuma buka satu-dua tab tidak perlu mengunduh semuanya sekaligus, terutama
// editor template yang sendirian ~4000 baris. Perilaku sama persis, cuma
// waktu muat awal panel admin yang berubah.
const TAB_LOADING = <div className="flex items-center justify-center py-24 text-sm text-gray-400">Memuat...</div>

const UsersTab = dynamic(() => import('./tabs/UsersTab'), { loading: () => TAB_LOADING, ssr: false })
// InvitationsTab merged into UsersTab
const TemplateModule = dynamic(() => import('./tabs/template/TemplateModule'), { loading: () => TAB_LOADING, ssr: false })
const MusicLibraryTab = dynamic(() => import('./tabs/music/MusicModule'), { loading: () => TAB_LOADING, ssr: false })
const TransaksiModule = dynamic(() => import('./tabs/transaksi/TransaksiModule'), { loading: () => TAB_LOADING, ssr: false })
const PricingTab = dynamic(() => import('./tabs/pricing/PricingTab'), { loading: () => TAB_LOADING, ssr: false })
const ArticlesTab = dynamic(() => import('./tabs/ArticlesTab'), { loading: () => TAB_LOADING, ssr: false })
const WriterTab = dynamic(() => import('./tabs/WriterTab'), { loading: () => TAB_LOADING, ssr: false })
const AffiliatesTab = dynamic(() => import('./tabs/AffiliatesTab'), { loading: () => TAB_LOADING, ssr: false })
// PackagesTab removed  tier management consolidated into TemplatesTab config drawer
const NewSettingsTab = dynamic(() => import('./tabs/SettingsTab'), { loading: () => TAB_LOADING, ssr: false })

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


interface LocalAppSettings {
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
  stats: Stats
  settings: LocalAppSettings
  templateRecords: TemplateRecord[]
  adminEmail: string
}

type NavTab = 'dashboard' | 'users' | 'template' | 'music' | 'pricing' | 'transaksi' | 'articles' | 'writers' | 'affiliates' | 'settings'

const VALID_TABS: NavTab[] = ['dashboard', 'users', 'template', 'music', 'pricing', 'transaksi', 'articles', 'writers', 'affiliates', 'settings']

/** Tab yang mengelola tinggi layarnya sendiri (punya panel/scroll internal).
 *  Sisanya dibiarkan halaman yang men-scroll. */
const FULL_HEIGHT_TABS = new Set<NavTab>(['template', 'music', 'pricing', 'transaksi', 'settings'])

/** Tab lama -> tab baru. Tautan/bookmark ke ?tab=lab masih beredar di riwayat
 *  browser admin; tanpa peta ini mereka mendarat di Dashboard tanpa penjelasan. */
const LEGACY_TAB_ALIASES: Record<string, NavTab> = {
  lab: 'template', packages: 'pricing',
  // Pembayaran + Pesanan digabung jadi satu modul.
  payment: 'transaksi', orders: 'transaksi',
}

//  Main Component 

export default function AdminPanel({
  users: initialUsers,
  invitations: initialInvitations,
  orders: initialOrders,
  stats: initialStats,
  settings: initialSettings,
  templateRecords: initialTemplateRecords,
  adminEmail,
}: Props) {
  const [templateRecords, setTemplateRecords] = useState<TemplateRecord[]>(initialTemplateRecords)
  // Pesanan jadi state supaya verifikasi di modul Transaksi langsung terlihat
  // di lencana sidebar dan ringkasan dashboard tanpa reload halaman.
  const [orders, setOrders] = useState(initialOrders)
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard')
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
      const raw = new URLSearchParams(window.location.search).get('tab') ?? ''
      const p = (LEGACY_TAB_ALIASES[raw] ?? raw) as NavTab
      setActiveTab(VALID_TABS.includes(p) ? p : 'dashboard')
    }
    syncFromUrl()
    window.addEventListener('popstate', syncFromUrl)
    return () => window.removeEventListener('popstate', syncFromUrl)
  }, [])

  // Penjaga "perubahan belum disimpan" saat pindah tab sudah dibuang bersama
  // sumber masalahnya. Editor template kini autosave ke kolom draft_config di
  // database, jadi berpindah tab tidak bisa lagi menghilangkan pekerjaan —
  // dan tombol "Simpan Draf & Pergi" yang dulu ada di sini justru TIDAK
  // menyimpan apa pun saat mode edit, lalu menampilkan toast "Draf tersimpan".
  function handleTabChange(tab: NavTab) {
    if (tab === activeTab) return
    setTransitioning(true)
    setTimeout(() => {
      setActiveTab(tab)
      const url = new URL(window.location.href)
      url.searchParams.set('tab', tab)
      window.history.pushState({}, '', url.toString())
      requestAnimationFrame(() => setTransitioning(false))
    }, 150)
  }
  const [users, setUsers] = useState(initialUsers)
  const [invitations, setInvitations] = useState(initialInvitations)
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
    // Masa aktif TIDAK lagi dihitung di sini. Server yang menentukannya dari
    // paket undangan bersangkutan — panel dulu memakai satu angka global
    // (settings.packageDuration) untuk semua paket, sehingga tombol ini dan
    // approval bukti pembayaran memberi masa aktif berbeda untuk paket sama.
    const res = await fetch(`/api/admin/invitations/${invId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_paid: paid, ...(paid ? { is_published: true } : {}) }),
    })
    const data = await res.json().catch(() => null)
    if (!res.ok) { toast.error(data?.error || 'Gagal update status'); return }

    const expiresAt = data?.invitation?.expires_at ?? null
    const newInvs = invitations.map((i) =>
      i.id === invId
        ? { ...i, is_paid: paid, ...(paid ? { is_published: true, expires_at: expiresAt } : {}) }
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

  /** Kirim HANYA kunci yang berubah.
   *
   *  Dulu seluruh objek pengaturan dikirim setiap kali, dan karena endpoint
   *  menimpa satu baris utuh, tiap penyimpanan mengembalikan pengaturan ke
   *  kondisi saat halaman dibuka — menghapus kategori/palet yang dibuat lewat
   *  endpoint lain atau oleh admin kedua. */
  async function handleSaveSettings(patch: Partial<LocalAppSettings>) {
    const res = await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    if (!res.ok) { toast.error('Gagal simpan pengaturan'); return }
    const newSettings = { ...appSettings, ...patch } as LocalAppSettings
    setAppSettings(newSettings)
    recalc(invitations, users)
    toast.success('Pengaturan tersimpan!')
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  // Lencana sidebar sekarang menghitung PESANAN yang menunggu — dulu
  // menghitung bukti pembayaran, antrean yang tidak pernah terisi sama sekali.
  const pendingOrders = orders.filter((o) => o.status === 'pending').length

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        adminEmail={adminEmail}
        onLogout={handleLogout}
        stats={stats}
        pendingOrders={pendingOrders}
        pendingArticles={pendingArticles}
        siteName={appSettings.siteName ?? 'iaundang'}
        logoVerticalUrl={appSettings.logoVerticalUrl ?? '/logos/logo-vertical.png'}
      />

      <main className={`flex-1 min-h-0 ${FULL_HEIGHT_TABS.has(activeTab) ? 'overflow-hidden flex flex-col' : 'overflow-y-auto scrollbar-hide'}`}>
        <div
          ref={contentRef}
          className={`${FULL_HEIGHT_TABS.has(activeTab) ? 'flex-1 min-h-0' : 'h-full'} transition-opacity duration-150 ease-in-out ${transitioning ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0'}`}
          style={{ transition: 'opacity 150ms ease, transform 150ms ease' }}
        >
        {activeTab === 'dashboard' && (
          <DashboardTab stats={stats} users={users} invitations={invitations} pendingOrders={pendingOrders} onGoToTab={(t) => handleTabChange(t as NavTab)} />
        )}
        {activeTab === 'users' && (
          <UsersTab
            users={users}
            templates={templateRecords}
            onDelete={handleDeleteUser}
            onOverridePaid={handleOverridePaid}
            onTogglePublished={handleTogglePublished}
          />
        )}
        {activeTab === 'template' && (
          <TemplateModule
            records={templateRecords}
            categories={appSettings.categories}
            palettes={appSettings.colorPalettes}
            tiers={appSettings.priceTiers}
            onRecordsUpdate={setTemplateRecords}
            // Kategori HANYA lewat REST /api/admin/categories (dilakukan di dalam
            // modul). Di sini cuma menyelaraskan salinan di memori — kalau ikut
            // menulis blob settings, kategori yang baru dibuat lewat REST akan
            // ditimpa balik oleh salinan lama yang dipegang panel ini.
            onCategoriesUpdate={(cats) => setAppSettings(s => ({ ...s, categories: cats }))}
          />
        )}
        {activeTab === 'pricing' && (
          <PricingTab
            records={templateRecords}
            categories={appSettings.categories}
            priceTiers={appSettings.priceTiers}
            deletedTierIds={appSettings.deletedTierIds}
            onPriceTiersUpdate={(tiers, deletedIds) => handleSaveSettings({ priceTiers: tiers, deletedTierIds: deletedIds ?? appSettings.deletedTierIds })}
            flashSales={appSettings.flashSales}
            onFlashSalesUpdate={(sales) => handleSaveSettings({ flashSales: sales })}
            coupons={appSettings.coupons}
            onCouponsUpdate={(cpns) => handleSaveSettings({ coupons: cpns })}
          />
        )}
        {activeTab === 'music' && <MusicLibraryTab />}
        {activeTab === 'transaksi' && (
          <TransaksiModule
            orders={orders}
            onOrdersChange={setOrders}
            paymentConfig={{
              bankAccounts: appSettings.bankAccounts,
              qrisImageUrl: appSettings.qrisImageUrl,
              paymentInstructions: appSettings.paymentInstructions,
              confirmationWhatsapp: appSettings.confirmationWhatsapp,
            }}
            onPaymentConfigChange={(cfg) => setAppSettings({ ...appSettings, ...cfg })}
            appDomain={appSettings.appDomain ?? 'iaundang.online'}
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
              // Kirim hanya field yang memang diubah panel ini. Menyertakan
              // `...appSettings` akan ikut menuliskan salinan lama seluruh
              // pengaturan — termasuk kategori dan palet yang barangkali sudah
              // berubah lewat endpoint lain sejak halaman dibuka.
              await handleSaveSettings({
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
      { id: 'template'    as NavTab, label: 'Template',           icon: Package,         desc: 'Desain, kategori & publikasi tema' },
      { id: 'music'       as NavTab, label: 'Musik',              icon: Music,           desc: 'Perpustakaan musik undangan' },
    ],
  },
  {
    label: 'Transaksi',
    items: [
      { id: 'transaksi'   as NavTab, label: 'Transaksi',          icon: CreditCard,      desc: 'Verifikasi pesanan & metode bayar' },
      { id: 'pricing'     as NavTab, label: 'Paket & Promo',      icon: Crown,           desc: 'Tier harga, flash sale & kupon' },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { id: 'affiliates'  as NavTab, label: 'Afiliasi',           icon: Megaphone,       desc: 'Kelola program affiliate' },
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
  activeTab, onTabChange, adminEmail, onLogout, stats, pendingOrders, pendingArticles, siteName, logoVerticalUrl,
}: {
  activeTab: NavTab
  onTabChange: (t: NavTab) => void
  adminEmail: string
  onLogout: () => void
  stats: Stats
  pendingOrders: number
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
                  id === 'transaksi'   ? (pendingOrders      > 0 ? pendingOrders      : null) :
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
                        id === 'transaksi' || id === 'articles' ? 'bg-red-100 text-red-600 animate-pulse' :
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
