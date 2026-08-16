'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  Save, Image as ImageIcon, Phone, Globe2,
  Instagram, Twitter, Github, Mail,
  Shield, Key, Loader2, Check, Palette,
  PanelTop, PanelBottom, LayoutDashboard,
  Info, ChevronRight, Settings2,
  Eye, AlertTriangle, Zap,
  Copy, CheckCircle2, Server, Lock,
} from 'lucide-react'
import toast from 'react-hot-toast'
import ImageUploadField from '../ImageUploadField'

//  Types

interface LogoUsage {
  navbar: boolean
  footer: boolean
  dashboard: boolean
  favicon: boolean
}

export interface SiteSettings {
  siteName: string
  siteTagline: string
  logoHorizontalUrl: string
  logoVerticalUrl: string
  contactEmail: string
  contactWhatsapp: string
  socialInstagram: string
  socialTwitter: string
  socialGithub: string
  appDomain: string
  demoSubdomain: string
  logoUsage?: LogoUsage
}

interface Props {
  settings: SiteSettings
  adminEmail: string
  onSave: (s: SiteSettings) => Promise<void>
}

type SubTab = 'branding' | 'logo-usage' | 'account' | 'contact'

const SUB_TABS: { id: SubTab; label: string; icon: React.ElementType; desc: string }[] = [
  { id: 'branding',   label: 'Branding & Domain',   icon: Palette,   desc: 'Identitas, logo, dan konfigurasi domain' },
  { id: 'logo-usage', label: 'Penggunaan Logo',      icon: Eye,       desc: 'Kontrol visibilitas logo di setiap halaman' },
  { id: 'account',    label: 'Akun & Keamanan',      icon: Shield,    desc: 'Informasi admin, role, dan keamanan' },
  { id: 'contact',    label: 'Kontak & Sosial Media', icon: Globe2,    desc: 'Email, WhatsApp, dan akun sosial media' },
]

//  Shared UI

function SectionHeader({ title, desc, icon: Icon }: { title: string; desc: string; icon: React.ElementType }) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="w-9 h-9 rounded-xl bg-gray-900 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div>
        <h3 className="text-sm font-bold text-gray-900">{title}</h3>
        <p className="text-[11px] text-gray-400 mt-0.5">{desc}</p>
      </div>
    </div>
  )
}

function FieldGroup({ children, cols = 2 }: { children: React.ReactNode; cols?: 1 | 2 }) {
  return (
    <div className={`grid gap-4 ${cols === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
      {children}
    </div>
  )
}

function Field({
  label, hint, icon: Icon, value, onChange, placeholder, type = 'text', disabled = false, mono = false,
}: {
  label: string; hint?: string; icon?: React.ElementType; value: string
  onChange: (v: string) => void; placeholder?: string; type?: string; disabled?: boolean; mono?: boolean
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>
      <div className="relative">
        {Icon && (
          <div className="absolute left-0 top-0 bottom-0 w-10 flex items-center justify-center pointer-events-none">
            <Icon className="w-3.5 h-3.5 text-gray-400" />
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full text-[13px] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 bg-white text-gray-800 placeholder:text-gray-300 disabled:bg-gray-50 disabled:text-gray-400 transition-all ${Icon ? 'pl-10 pr-3.5' : 'px-3.5'} py-2.5 ${mono ? 'font-mono' : ''}`}
        />
      </div>
      {hint && <p className="text-[10px] text-gray-400 mt-1.5 leading-relaxed">{hint}</p>}
    </div>
  )
}

function Divider() {
  return <div className="h-px bg-gray-100 my-6" />
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 p-5 ${className}`}>
      {children}
    </div>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
      className="p-1 rounded-md hover:bg-gray-100 transition-colors"
      title="Copy"
    >
      {copied ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-gray-400" />}
    </button>
  )
}

//  Logo Usage Card (redesigned)

function LogoPlacementCard({
  icon: Icon, title, description, enabled, onToggle, preview,
}: {
  icon: React.ElementType; title: string; description: string
  enabled: boolean; onToggle: () => void; preview: React.ReactNode
}) {
  return (
    <div className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
      enabled ? 'border-gray-200 bg-white shadow-sm' : 'border-gray-100 bg-gray-50/80'
    }`}>
      <div className={`h-24 flex items-center justify-center bg-gradient-to-b from-gray-50 to-white border-b border-gray-100 transition-opacity duration-200 ${
        enabled ? 'opacity-100' : 'opacity-25'
      }`}>
        {preview}
      </div>
      <div className="p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
            enabled ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-400'
          }`}>
            <Icon className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <p className={`text-xs font-bold transition-colors ${enabled ? 'text-gray-900' : 'text-gray-400'}`}>{title}</p>
            <p className="text-[10px] text-gray-400 leading-snug mt-0.5 truncate">{description}</p>
          </div>
        </div>
        <button onClick={onToggle} type="button" className="shrink-0 relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:ring-offset-2"
          style={{ backgroundColor: enabled ? '#111' : '#e5e7eb' }}>
          <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            enabled ? 'translate-x-[22px]' : 'translate-x-0.5'
          }`} />
        </button>
      </div>
    </div>
  )
}

//  Sub-tab: Branding

function BrandingPanel({
  form, update,
}: {
  form: SiteSettings
  update: <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => void
}) {
  return (
    <div className="space-y-0">
      {/* Identity */}
      <SectionHeader icon={Settings2} title="Identitas Brand" desc="Nama dan tagline yang tampil di seluruh website" />
      <Card>
        <FieldGroup>
          <Field label="Nama Brand" value={form.siteName} onChange={(v) => update('siteName', v)} placeholder="iaundang" />
          <Field label="Tagline" value={form.siteTagline} onChange={(v) => update('siteTagline', v)} placeholder="Digital Wedding Invitation" />
        </FieldGroup>
      </Card>

      <Divider />

      {/* Domain */}
      <SectionHeader icon={Globe2} title="Domain & Routing" desc="Konfigurasi domain utama dan pola URL undangan" />
      <Card>
        <FieldGroup>
          <Field
            label="Domain Utama" icon={Globe2} value={form.appDomain ?? ''} onChange={(v) => update('appDomain', v)}
            placeholder="iaundang.online" hint="Domain utama website (tanpa http://)"
          />
          <Field
            label="Subdomain Demo" icon={Server} value={form.demoSubdomain ?? ''} onChange={(v) => update('demoSubdomain', v)}
            placeholder="demo" hint="Prefix subdomain untuk preview template gratis"
          />
        </FieldGroup>

        <div className="mt-4 bg-gray-50 rounded-xl p-4 border border-gray-100">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3">Pola URL</p>
          <div className="space-y-2">
            {[
              { label: 'Undangan', url: `nama-pasangan.${form.appDomain || 'iaundang.online'}` },
              { label: 'Demo', url: `${form.demoSubdomain || 'demo'}.${form.appDomain || 'iaundang.online'}` },
              { label: 'Lokal', url: `localhost:3000?slug=nama-pasangan` },
            ].map(({ label, url }) => (
              <div key={label} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold text-gray-400 uppercase w-14">{label}</span>
                  <code className="text-[11px] font-mono text-gray-700">{url}</code>
                </div>
                <CopyButton text={url} />
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Divider />

      {/* Logo */}
      <SectionHeader icon={ImageIcon} title="Logo" desc="Upload logo horizontal dan vertikal untuk berbagai konteks tampilan" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-bold text-gray-900">Horizontal</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Navbar, Footer, Dashboard</p>
            </div>
            <span className="text-[9px] font-mono text-gray-400 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">~4:1</span>
          </div>
          <ImageUploadField
            value={form.logoHorizontalUrl || undefined}
            onChange={(url) => update('logoHorizontalUrl', url ?? '')}
          />
        </Card>
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-bold text-gray-900">Vertikal / Ikon</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Loading screen, Favicon</p>
            </div>
            <span className="text-[9px] font-mono text-gray-400 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">1:1</span>
          </div>
          <ImageUploadField
            value={form.logoVerticalUrl || undefined}
            onChange={(url) => update('logoVerticalUrl', url ?? '')}
          />
        </Card>
      </div>

      {/* Logo Preview */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Pratinjau Terang</p>
          </div>
          <div className="bg-white p-5 flex items-center justify-center h-20">
            {form.logoHorizontalUrl ? (
              <Image src={form.logoHorizontalUrl} alt="Logo" width={140} height={40} className="object-contain max-h-10" />
            ) : (
              <span className="text-xs text-gray-300">Belum ada logo</span>
            )}
          </div>
        </div>
        <div className="rounded-2xl border border-gray-800 overflow-hidden">
          <div className="px-3 py-2 bg-gray-900 border-b border-gray-700">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Pratinjau Gelap</p>
          </div>
          <div className="bg-gray-950 p-5 flex items-center justify-center h-20">
            {form.logoHorizontalUrl ? (
              <Image src={form.logoHorizontalUrl} alt="Logo dark" width={140} height={40} className="object-contain max-h-10 brightness-110" />
            ) : (
              <span className="text-xs text-gray-600">Belum ada logo</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

//  Sub-tab: Logo Usage

function LogoUsagePanel({
  form, update,
}: {
  form: SiteSettings
  update: <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => void
}) {
  const usage: LogoUsage = form.logoUsage ?? { navbar: true, footer: true, dashboard: true, favicon: true }
  function toggleUsage(key: keyof LogoUsage) {
    update('logoUsage', { ...usage, [key]: !usage[key] })
  }

  const activeCount = Object.values(usage).filter(Boolean).length

  return (
    <div className="space-y-0">
      <SectionHeader icon={Eye} title="Kontrol Visibilitas Logo" desc="Pilih di mana logo brand ditampilkan. Logo yang dinonaktifkan diganti teks." />

      <div className="flex items-center gap-2 mb-5">
        <div className="flex items-center gap-1.5 bg-gray-900 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
          <Eye className="w-3 h-3" /> {activeCount}/4 aktif
        </div>
        <p className="text-[10px] text-gray-400">Klik toggle untuk mengaktifkan / menonaktifkan</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <LogoPlacementCard
          icon={PanelTop} title="Navbar" description="Navigasi atas semua halaman publik"
          enabled={usage.navbar} onToggle={() => toggleUsage('navbar')}
          preview={
            <div className="w-full px-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {usage.navbar && form.logoHorizontalUrl ? (
                  <Image src={form.logoHorizontalUrl} alt="" width={100} height={28} className="object-contain" />
                ) : (
                  <span className="text-sm font-bold text-gray-700">{form.siteName || 'Brand'}</span>
                )}
              </div>
              <div className="flex gap-1.5">
                {['Fitur', 'Harga'].map(t => (
                  <div key={t} className="px-2.5 py-1 bg-gray-100 rounded-md text-[9px] text-gray-500">{t}</div>
                ))}
                <div className="px-2.5 py-1 bg-gray-900 rounded-md text-[9px] text-white">Buat</div>
              </div>
            </div>
          }
        />

        <LogoPlacementCard
          icon={PanelBottom} title="Footer" description="Bagian bawah halaman utama"
          enabled={usage.footer} onToggle={() => toggleUsage('footer')}
          preview={
            <div className="w-full px-5 flex items-center gap-4">
              {usage.footer && form.logoHorizontalUrl ? (
                <Image src={form.logoHorizontalUrl} alt="" width={80} height={22} className="object-contain shrink-0" />
              ) : (
                <span className="text-xs font-bold text-gray-600 shrink-0">{form.siteName || 'Brand'}</span>
              )}
              <div className="h-5 w-px bg-gray-200" />
              <div className="space-y-1.5">
                <div className="w-20 h-1.5 bg-gray-200 rounded-full" />
                <div className="w-14 h-1.5 bg-gray-100 rounded-full" />
              </div>
            </div>
          }
        />

        <LogoPlacementCard
          icon={LayoutDashboard} title="Sidebar Admin" description="Logo/ikon di sidebar panel admin"
          enabled={usage.dashboard} onToggle={() => toggleUsage('dashboard')}
          preview={
            <div className="flex items-center gap-3 px-5">
              <div className="w-8 h-8 rounded-xl bg-gray-900 flex items-center justify-center shrink-0 overflow-hidden">
                {usage.dashboard && form.logoVerticalUrl ? (
                  <Image src={form.logoVerticalUrl} alt="" width={20} height={20} className="object-contain" />
                ) : (
                  <span className="text-[10px] font-bold text-white">{(form.siteName || 'A').charAt(0)}</span>
                )}
              </div>
              <div>
                <div className="w-16 h-2 bg-gray-800 rounded-full mb-1.5" />
                <div className="w-10 h-1.5 bg-gray-300 rounded-full" />
              </div>
            </div>
          }
        />

        <LogoPlacementCard
          icon={Globe2} title="Favicon" description="Ikon di tab browser (logo vertikal)"
          enabled={usage.favicon} onToggle={() => toggleUsage('favicon')}
          preview={
            <div className="flex items-center gap-2 px-5">
              <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-1.5 border border-gray-200 shadow-sm">
                <div className="w-4 h-4 rounded flex items-center justify-center overflow-hidden bg-gray-100">
                  {usage.favicon && form.logoVerticalUrl ? (
                    <Image src={form.logoVerticalUrl} alt="" width={14} height={14} className="object-contain" />
                  ) : (
                    <span className="text-[7px] font-bold text-gray-500">{(form.siteName || 'A').charAt(0)}</span>
                  )}
                </div>
                <span className="text-[10px] text-gray-700 font-medium">{form.siteName || 'Site'}</span>
                <span className="text-[9px] text-gray-300 ml-1">×</span>
              </div>
              <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5 border border-gray-100">
                <div className="w-4 h-4 rounded bg-gray-200" />
                <span className="text-[10px] text-gray-400">New Tab</span>
              </div>
            </div>
          }
        />
      </div>

      <div className="mt-5 flex items-start gap-2.5 bg-gray-50 rounded-xl border border-gray-100 px-4 py-3">
        <Info className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-gray-500 leading-relaxed">
          Perubahan akan terlihat setelah menyimpan dan me-refresh halaman. Tampilan otomatis menyesuaikan untuk desktop dan mobile.
        </p>
      </div>
    </div>
  )
}

//  Sub-tab: Account

function AccountPanel({ adminEmail }: { adminEmail: string }) {
  const initials = adminEmail.substring(0, 2).toUpperCase()
  const permissions = [
    { label: 'Kelola Pengguna', icon: '👥' },
    { label: 'Kelola Undangan', icon: '💌' },
    { label: 'Kelola Template', icon: '🎨' },
    { label: 'Verifikasi Pembayaran', icon: '💳' },
    { label: 'Pengaturan Sistem', icon: '⚙️' },
    { label: 'Konten Website', icon: '📝' },
  ]

  return (
    <div className="space-y-0">
      <SectionHeader icon={Shield} title="Akun Administrator" desc="Informasi dan hak akses akun yang sedang login" />

      {/* Profile Card */}
      <Card className="!p-0 overflow-hidden">
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shrink-0">
              <span className="text-lg font-bold text-white">{initials}</span>
            </div>
            <div>
              <p className="text-sm font-bold text-white">{adminEmail}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2.5 py-0.5 rounded-full border border-emerald-400/20">
                  Superadmin
                </span>
                <span className="text-[10px] text-gray-400">Akses penuh</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'Email', value: adminEmail, icon: Mail },
            { label: 'Role', value: 'Superadmin', icon: Shield },
            { label: 'Status', value: 'Aktif', icon: Zap },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className="w-3 h-3 text-gray-400" />
                <p className="text-[9px] text-gray-400 uppercase tracking-wider font-bold">{label}</p>
              </div>
              <p className="text-[12px] text-gray-800 font-medium truncate">{value}</p>
            </div>
          ))}
        </div>
      </Card>

      <Divider />

      {/* Security */}
      <SectionHeader icon={Lock} title="Keamanan" desc="Kelola password dan otentikasi akun" />
      <Card>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
              <Key className="w-4 h-4 text-gray-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900">Password</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Password disimpan teracak · Terakhir diubah: belum pernah</p>
            </div>
          </div>
          <button
            className="text-[11px] font-bold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-xl transition-colors whitespace-nowrap"
            onClick={() => toast('Fitur ganti password akan tersedia segera', { icon: '🔒' })}
          >
            Ubah Password
          </button>
        </div>
      </Card>

      <Divider />

      {/* Permissions */}
      <SectionHeader icon={CheckCircle2} title="Hak Akses" desc="Modul dan fitur yang dapat diakses oleh akun ini" />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {permissions.map(({ label, icon }) => (
          <div key={label} className="flex items-center gap-2.5 bg-white rounded-xl px-3 py-2.5 border border-gray-100">
            <span className="text-sm">{icon}</span>
            <span className="text-[11px] text-gray-700 font-medium">{label}</span>
            <Check className="w-3 h-3 text-emerald-500 ml-auto shrink-0" />
          </div>
        ))}
      </div>

      {/* Environment Note */}
      <div className="mt-5 flex items-start gap-2.5 bg-amber-50 rounded-xl border border-amber-200 px-4 py-3">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-[11px] text-amber-800 leading-relaxed">
          Email admin dikelola via environment variable <code className="text-[10px] bg-amber-100 px-1.5 py-0.5 rounded font-mono font-bold">ADMIN_EMAIL</code>. Untuk mengganti, update variabel tersebut di server.
        </p>
      </div>
    </div>
  )
}

//  Sub-tab: Contact

function ContactPanel({
  form, update,
}: {
  form: SiteSettings
  update: <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => void
}) {
  const socialLinks = [
    { label: 'Instagram', icon: Instagram, value: form.socialInstagram, key: 'socialInstagram' as const, placeholder: 'ia.undang', prefix: '@', hint: 'Username tanpa @' },
    { label: 'Twitter / X', icon: Twitter, value: form.socialTwitter, key: 'socialTwitter' as const, placeholder: 'iaundang', prefix: '@', hint: 'Username tanpa @' },
    { label: 'GitHub', icon: Github, value: form.socialGithub, key: 'socialGithub' as const, placeholder: 'iaundang', prefix: '', hint: 'Repository atau organisasi' },
  ]

  return (
    <div className="space-y-0">
      {/* Contact Info */}
      <SectionHeader icon={Phone} title="Informasi Kontak" desc="Kontak utama yang ditampilkan di landing page, footer, dan bantuan" />
      <Card>
        <FieldGroup>
          <Field label="Email Kontak" icon={Mail} value={form.contactEmail} onChange={(v) => update('contactEmail', v)} placeholder="halo@iaundang.online" type="email" hint="Ditampilkan di footer website" />
          <Field label="WhatsApp" icon={Phone} value={form.contactWhatsapp} onChange={(v) => update('contactWhatsapp', v)} placeholder="628123456789" hint="Format internasional tanpa +" />
        </FieldGroup>
      </Card>

      <Divider />

      {/* Social Media */}
      <SectionHeader icon={Globe2} title="Media Sosial" desc="Akun sosial media yang ditampilkan di footer dan halaman kontak" />
      <Card>
        <div className="space-y-4">
          {socialLinks.map(({ label, icon: Icon, value, key, placeholder, hint }) => (
            <Field key={key} label={label} icon={Icon} value={value} onChange={(v) => update(key, v)} placeholder={placeholder} hint={hint} />
          ))}
        </div>
      </Card>

      {/* Live Preview */}
      <div className="mt-5">
        <div className="rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
            <Eye className="w-3 h-3 text-gray-400" />
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Preview Footer</p>
          </div>
          <div className="bg-white p-5">
            <div className="flex flex-wrap items-center gap-4">
              {form.contactEmail && (
                <span className="inline-flex items-center gap-2 text-[11px] text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                  <Mail className="w-3 h-3 text-gray-400" /> {form.contactEmail}
                </span>
              )}
              {form.contactWhatsapp && (
                <span className="inline-flex items-center gap-2 text-[11px] text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                  <Phone className="w-3 h-3 text-gray-400" /> +{form.contactWhatsapp}
                </span>
              )}
              {form.socialInstagram && (
                <span className="inline-flex items-center gap-2 text-[11px] text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                  <Instagram className="w-3 h-3 text-gray-400" /> @{form.socialInstagram}
                </span>
              )}
              {form.socialTwitter && (
                <span className="inline-flex items-center gap-2 text-[11px] text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                  <Twitter className="w-3 h-3 text-gray-400" /> @{form.socialTwitter}
                </span>
              )}
              {form.socialGithub && (
                <span className="inline-flex items-center gap-2 text-[11px] text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                  <Github className="w-3 h-3 text-gray-400" /> {form.socialGithub}
                </span>
              )}
              {!form.contactEmail && !form.contactWhatsapp && !form.socialInstagram && !form.socialTwitter && !form.socialGithub && (
                <p className="text-[11px] text-gray-300 italic">Belum ada kontak yang diisi</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

//  Main Component

export default function SettingsTab({ settings: initial, adminEmail, onSave }: Props) {
  const [form, setForm] = useState<SiteSettings>(initial)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [subTab, setSubTab] = useState<SubTab>('branding')

  function update<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  const hasChanges = JSON.stringify(form) !== JSON.stringify(initial)

  async function handleSave() {
    setSaving(true)
    try {
      await onSave(form)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      toast.error('Gagal menyimpan pengaturan')
    } finally {
      setSaving(false)
    }
  }

  const activeTabData = SUB_TABS.find(t => t.id === subTab)!

  return (
    <div className="h-full flex overflow-hidden">

      {/* Left Sidebar Navigation */}
      <div className="w-56 shrink-0 border-r border-gray-100 bg-gray-50/50 flex flex-col">
        <div className="px-5 py-5 border-b border-gray-100">
          <h1 className="text-base font-bold text-gray-900 tracking-tight">Pengaturan</h1>
          <p className="text-[10px] text-gray-400 mt-1">Konfigurasi sistem & branding</p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {SUB_TABS.map(({ id, label, icon: Icon, desc }) => {
            const isActive = subTab === id
            return (
              <button
                key={id}
                onClick={() => setSubTab(id)}
                className={`w-full flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all ${
                  isActive
                    ? 'bg-white shadow-sm border border-gray-200 text-gray-900'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-white/60'
                }`}
              >
                <div className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mt-0.5 ${
                  isActive ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-400'
                }`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className={`text-[11px] font-bold leading-tight ${isActive ? 'text-gray-900' : ''}`}>{label}</p>
                  <p className="text-[9px] text-gray-400 leading-snug mt-0.5 line-clamp-2">{desc}</p>
                </div>
                {isActive && <ChevronRight className="w-3 h-3 text-gray-300 shrink-0 mt-1.5 ml-auto" />}
              </button>
            )
          })}
        </nav>

        {/* Save Button */}
        <div className="p-3 border-t border-gray-100">
          {hasChanges && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-[10px] text-amber-600 font-medium">Ada perubahan</span>
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className={`w-full flex items-center justify-center gap-2 text-[11px] font-bold px-4 py-2.5 rounded-xl transition-all ${
              saved
                ? 'bg-emerald-500 text-white'
                : hasChanges
                  ? 'bg-gray-900 text-white hover:bg-gray-800 shadow-sm'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            {saving ? 'Menyimpan...' : saved ? 'Sudah tersimpan!' : 'Simpan Perubahan'}
          </button>
        </div>
      </div>

      {/* Right Content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide bg-white">
        <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-gray-50/80 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center">
              <activeTabData.icon className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">{activeTabData.label}</h2>
              <p className="text-[11px] text-gray-400 mt-0.5">{activeTabData.desc}</p>
            </div>
          </div>
        </div>

        <div className="p-8 max-w-2xl">
          {subTab === 'branding' && <BrandingPanel form={form} update={update} />}
          {subTab === 'logo-usage' && <LogoUsagePanel form={form} update={update} />}
          {subTab === 'account' && <AccountPanel adminEmail={adminEmail} />}
          {subTab === 'contact' && <ContactPanel form={form} update={update} />}
        </div>
      </div>
    </div>
  )
}
