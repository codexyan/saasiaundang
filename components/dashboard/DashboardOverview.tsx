'use client'

import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileEdit, Images, Users, Copy, Share2,
  CheckCircle2, ExternalLink, CalendarDays,
  Heart, MessageCircle, ArrowRight,
  Zap, Globe, Eye, Music, Gift,
  Clock, MapPin, Sparkles, Link2,
  QrCode, Send, ChevronRight, BarChart3,
} from 'lucide-react'
import type { Invitation, NewInvitationData } from '@/lib/types'
import { LEGACY_TEMPLATE_IDS as LTI } from '@/lib/types'
import { useInvitationUrl } from '@/lib/use-invitation-url'
import ShareCardButton from './ShareCardButton'
import toast from 'react-hot-toast'

interface Props {
  invitation: Invitation
  onNavigate: (tab: string) => void
  onTogglePublish: () => void
  /** Tema undangan ini, dipakai kartu berbagi supaya warnanya cocok. */
  template?: import('@/lib/types').TemplateRecord | null
}

interface Stats {
  totalRsvp: number
  totalHadir: number
  totalUcapan: number
}

interface DisplayData {
  groomName: string
  brideName: string
  akadDate: string
  akadVenue: string
  resepsiDate: string
  resepsiVenue: string
  musicUrl: string
  couplePhoto: string
}

function normalizeData(inv: Invitation): DisplayData {
  const isLegacy = (LTI as string[]).includes(inv.template_id)
  if (isLegacy) {
    const d = inv.data
    return {
      groomName: d.groomName || '', brideName: d.brideName || '',
      akadDate: d.akadDate || '', akadVenue: d.akadVenue || '',
      resepsiDate: d.resepsiDate || '', resepsiVenue: d.resepsiVenue || '',
      musicUrl: d.musicUrl || '', couplePhoto: (d as unknown as Record<string, string>).couplePhotoUrl || '',
    }
  }
  const d = inv.data as unknown as NewInvitationData
  return {
    groomName: d.groom_name || '', brideName: d.bride_name || '',
    akadDate: d.akad?.date || '', akadVenue: d.akad?.venue_name || '',
    resepsiDate: d.resepsi?.date || '', resepsiVenue: d.resepsi?.venue_name || '',
    musicUrl: d.music_url || '', couplePhoto: d.couple_photo_url || '',
  }
}

function getDaysUntil(dateStr: string): number | null {
  if (!dateStr) return null
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

function formatDateLong(dateStr: string): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.25, 1, 0.5, 1] },
}

function StatCard({ label, value, icon: Icon, color, loading, delay = 0 }: {
  label: string; value: number | string; icon: React.ElementType; color: string; loading?: boolean; delay?: number
}) {
  const colorMap: Record<string, { bg: string; icon: string; ring: string }> = {
    rose: { bg: 'bg-rose-50', icon: 'text-rose-500', ring: 'ring-rose-100' },
    blue: { bg: 'bg-blue-50', icon: 'text-blue-500', ring: 'ring-blue-100' },
    violet: { bg: 'bg-violet-50', icon: 'text-violet-500', ring: 'ring-violet-100' },
    amber: { bg: 'bg-amber-50', icon: 'text-amber-500', ring: 'ring-amber-100' },
  }
  const c = colorMap[color] ?? colorMap.blue

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay, ease: [0.25, 1, 0.5, 1] }}
      className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${c.bg} ring-1 ${c.ring} flex items-center justify-center`}>
          <Icon size={18} className={c.icon} />
        </div>
      </div>
      <div>
        {loading ? (
          <div className="h-8 w-16 bg-gray-100 rounded-lg animate-pulse" />
        ) : (
          <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
        )}
        <p className="text-[11px] text-gray-400 font-medium mt-1 uppercase tracking-wider">{label}</p>
      </div>
    </motion.div>
  )
}

export default function DashboardOverview({ invitation, onNavigate, onTogglePublish, template }: Props) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [copied, setCopied] = useState(false)
  const d = normalizeData(invitation)

  useEffect(() => {
    Promise.all([
      fetch(`/api/rsvp?invitationId=${invitation.id}`).then(r => r.json()),
      fetch(`/api/wishes?invitationId=${invitation.id}`).then(r => r.json()),
    ]).then(([{ guests }, { wishes }]) => {
      const hadir = (guests || []).filter((g: { attending: boolean; total_guests: number }) => g.attending)
        .reduce((acc: number, g: { total_guests: number }) => acc + g.total_guests, 0)
      setStats({ totalRsvp: (guests || []).length, totalHadir: hadir, totalUcapan: (wishes || []).length })
    })
  }, [invitation.id])

  const daysUntil = d.akadDate ? getDaysUntil(d.akadDate) : null
  // Hook, bukan pemanggilan langsung: alamat localhost baru dipasang
  // sesudah hydration supaya render server dan klien tidak berbeda.
  const invUrl = useInvitationUrl(invitation.slug)

  const checklist = useMemo(() => [
    {
      label: 'Nama mempelai',
      done: !!(d.groomName && d.brideName),
      doneText: d.groomName && d.brideName ? `${d.groomName} & ${d.brideName}` : '',
      todoText: 'Isi nama mempelai pria & wanita',
      action: () => onNavigate('undangan'),
      icon: Heart,
    },
    {
      label: 'Detail acara',
      done: !!(d.akadDate && d.akadVenue),
      doneText: d.akadDate ? `${formatDate(d.akadDate)} · ${d.akadVenue}` : '',
      todoText: 'Isi tanggal, waktu, dan lokasi',
      action: () => onNavigate('undangan'),
      icon: CalendarDays,
    },
    {
      label: 'Foto & galeri',
      done: !!d.couplePhoto,
      doneText: 'Foto sudah diupload',
      todoText: 'Upload foto di editor undangan',
      action: () => onNavigate('undangan'),
      icon: Images,
    },
    {
      label: 'Musik latar',
      done: !!d.musicUrl,
      doneText: 'Musik terpasang',
      todoText: 'Pilih musik di editor undangan',
      action: () => onNavigate('undangan'),
      icon: Music,
    },
    {
      label: 'Publish undangan',
      done: invitation.is_published,
      doneText: invitation.is_paid ? 'Live & aktif' : 'Live (watermark)',
      todoText: 'Publish untuk mengaktifkan link',
      action: onTogglePublish,
      icon: Globe,
    },
  ], [d, invitation, onNavigate, onTogglePublish])

  const doneCount = checklist.filter(c => c.done).length
  const progress = Math.round((doneCount / checklist.length) * 100)

  function copyLink() {
    navigator.clipboard.writeText(invUrl)
    toast.success('Tautan undangan sudah disalin!')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-5">

      {/* Hero status card */}
      <motion.div {...fadeUp}>
        {invitation.is_published ? (
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 p-6 md:p-8 text-white shadow-xl shadow-emerald-500/15">
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-52 h-52 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />
            <div className="absolute top-12 right-20 w-2 h-2 bg-white/20 rounded-full" />
            <div className="absolute bottom-16 right-12 w-1.5 h-1.5 bg-white/15 rounded-full" />

            <div className="relative z-10">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="relative">
                      <div className="w-2.5 h-2.5 rounded-full bg-white" />
                      <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-white animate-ping opacity-60" />
                    </div>
                    <p className="text-emerald-100 text-[11px] font-bold uppercase tracking-[0.15em]">Undangan Aktif</p>
                  </div>

                  {(d.groomName && d.brideName) ? (
                    <h2 className="text-xl md:text-2xl font-bold mb-1 tracking-tight">{d.groomName} & {d.brideName}</h2>
                  ) : (
                    <h2 className="text-xl md:text-2xl font-bold mb-1 tracking-tight">Undangan Pernikahan</h2>
                  )}

                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-3 py-1.5 w-fit mt-2">
                    <Link2 size={12} className="text-white/70" />
                    <p className="font-mono text-sm font-medium text-white/90 truncate">{invitation.slug}.iaundang.online</p>
                  </div>

                  {invitation.expires_at && (
                    <p className="text-emerald-200/60 text-[11px] mt-2.5">
                      Aktif hingga {formatDateLong(invitation.expires_at)}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 shrink-0 flex-wrap">
                  <button onClick={copyLink}
                    className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all backdrop-blur-sm">
                    {copied ? <CheckCircle2 size={13} /> : <Copy size={13} />}
                    {copied ? 'Sudah disalin!' : 'Salin Link'}
                  </button>
                  <ShareCardButton
                    data={invitation.data as unknown as import('@/lib/types').NewInvitationData}
                    template={template ?? null}
                    alamat={invUrl}
                    slug={invitation.slug}
                  />
                  <a href={`https://wa.me/?text=Yuk lihat undangan pernikahan kami! ${invUrl}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 bg-white text-emerald-700 text-xs font-bold px-4 py-2.5 rounded-xl transition-all hover:bg-emerald-50 shadow-lg shadow-black/10">
                    <Send size={12} /> Bagikan
                  </a>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-50 via-amber-50/40 to-orange-50/30 border border-amber-200/50 p-6 md:p-8">
            <div className="absolute top-0 right-0 w-40 h-40 bg-amber-100/30 rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            <div className="absolute bottom-0 left-8 w-24 h-24 bg-orange-100/20 rounded-full translate-y-1/2 pointer-events-none" />

            <div className="relative z-10 flex items-center gap-4 flex-wrap">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
                <Sparkles size={24} className="text-white" />
              </div>
              <div className="flex-1 min-w-[200px]">
                <h3 className="text-base font-bold text-gray-900">Undangan Siap Dipublish</h3>
                <p className="text-sm text-gray-500 mt-0.5">Lengkapi data lalu publish untuk mengaktifkan link undangan kamu.</p>
              </div>
              <button onClick={onTogglePublish}
                className="shrink-0 flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold px-6 py-3 rounded-2xl hover:shadow-xl hover:shadow-amber-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all">
                <Zap size={15} /> Publish Sekarang
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Countdown"
          value={daysUntil !== null ? (daysUntil > 0 ? `${daysUntil} hari` : daysUntil === 0 ? 'Hari ini!' : 'Sudah lewat') : 'Belum diisi'}
          icon={CalendarDays} color="amber" delay={0.05}
        />
        <StatCard label="Total RSVP" value={stats?.totalRsvp ?? 0} icon={Users} color="blue" loading={!stats} delay={0.1} />
        <StatCard label="Akan Hadir" value={stats?.totalHadir ?? 0} icon={Heart} color="rose" loading={!stats} delay={0.15} />
        <StatCard label="Ucapan" value={stats?.totalUcapan ?? 0} icon={MessageCircle} color="violet" loading={!stats} delay={0.2} />
      </div>

      {/* Progress + Checklist */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
      >
        <div className="px-6 pt-5 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-900 text-[15px]">Kelengkapan Undangan</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {doneCount === checklist.length ? 'Semua lengkap! Undangan kamu sudah siap.' : `${doneCount} dari ${checklist.length} langkah selesai`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-28 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${progress === 100 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 'bg-gradient-to-r from-amber-400 to-orange-500'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.8, delay: 0.3, ease: [0.25, 1, 0.5, 1] }}
                />
              </div>
              <span className={`text-sm font-bold tabular-nums ${progress === 100 ? 'text-emerald-600' : 'text-gray-600'}`}>{progress}%</span>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-50">
          {checklist.map((item, i) => (
            <motion.button
              key={item.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.2 + i * 0.06, ease: [0.25, 1, 0.5, 1] }}
              onClick={item.action}
              className={`w-full flex items-center gap-4 px-6 py-4 text-left transition-all group border-b border-gray-50 last:border-b-0 ${
                item.done ? 'bg-emerald-50/30 hover:bg-emerald-50/50' : 'hover:bg-amber-50/30'
              }`}
            >
              <div className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                item.done
                  ? 'bg-emerald-500 shadow-sm shadow-emerald-500/20'
                  : 'bg-gray-100 group-hover:bg-amber-100 group-hover:shadow-sm'
              }`}>
                {item.done
                  ? <CheckCircle2 size={14} className="text-white" strokeWidth={2.5} />
                  : <item.icon size={14} className="text-gray-400 group-hover:text-amber-600 transition-colors" />
                }
              </div>

              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${item.done ? 'text-gray-400 line-through decoration-emerald-300' : 'text-gray-800'}`}>
                  {item.label}
                </p>
                <p className={`text-[11px] mt-0.5 truncate ${item.done ? 'text-emerald-600' : 'text-gray-400'}`}>
                  {item.done ? item.doneText : item.todoText}
                </p>
              </div>

              {!item.done && (
                <ChevronRight size={16} className="shrink-0 text-gray-300 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
              )}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Quick actions */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25, ease: [0.25, 1, 0.5, 1] }}
      >
        <h3 className="font-bold text-gray-900 text-[15px] mb-3 px-1">Akses Cepat</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { icon: FileEdit, label: 'Edit Undangan', sub: 'Konten & section', tab: 'undangan', gradient: 'from-rose-500 to-pink-600', shadow: 'shadow-rose-500/20' },
            { icon: Users, label: 'Daftar Tamu', sub: 'Kelola undangan', tab: 'guest', gradient: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/20' },
            { icon: Eye, label: 'RSVP', sub: 'Respons tamu', tab: 'rsvp', gradient: 'from-violet-500 to-purple-600', shadow: 'shadow-violet-500/20' },
            { icon: BarChart3, label: 'Analitik', sub: 'Views & engagement', tab: 'analytics', gradient: 'from-cyan-500 to-blue-600', shadow: 'shadow-cyan-500/20' },
          ].map((item, i) => (
            <motion.button
              key={item.label}
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.35, delay: 0.3 + i * 0.06, ease: [0.25, 1, 0.5, 1] }}
              onClick={() => onNavigate(item.tab)}
              className="flex items-center gap-3 bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-lg hover:border-gray-200 hover:scale-[1.02] active:scale-[0.98] transition-all text-left group"
            >
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-md ${item.shadow} group-hover:shadow-lg transition-shadow shrink-0`}>
                <item.icon size={18} className="text-white" strokeWidth={1.8} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{item.label}</p>
                <p className="text-[11px] text-gray-400 truncate">{item.sub}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Event summary */}
      {(d.akadDate || d.resepsiDate) && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35, ease: [0.25, 1, 0.5, 1] }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
        >
          <div className="px-6 py-4 flex items-center justify-between border-b border-gray-50">
            <h3 className="font-bold text-gray-900 text-[15px]">Detail Acara</h3>
            <button onClick={() => onNavigate('undangan')} className="text-xs text-rose-500 hover:text-rose-600 font-semibold flex items-center gap-1 transition-colors">
              Edit <ArrowRight size={11} />
            </button>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {d.akadDate && (
              <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-100/50">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center">
                    <Clock size={13} className="text-white" />
                  </div>
                  <span className="text-xs font-bold text-amber-700">Akad Nikah</span>
                </div>
                <p className="text-sm font-semibold text-gray-800">{formatDateLong(d.akadDate)}</p>
                {d.akadVenue && (
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                    <MapPin size={11} className="text-gray-400 shrink-0" /> {d.akadVenue}
                  </p>
                )}
              </div>
            )}
            {d.resepsiDate && (
              <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100/50">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center">
                    <MapPin size={13} className="text-white" />
                  </div>
                  <span className="text-xs font-bold text-emerald-700">Resepsi</span>
                </div>
                <p className="text-sm font-semibold text-gray-800">{formatDateLong(d.resepsiDate)}</p>
                {d.resepsiVenue && (
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                    <MapPin size={11} className="text-gray-400 shrink-0" /> {d.resepsiVenue}
                  </p>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Couple info */}
      {(d.groomName || d.brideName) && !(d.akadDate || d.resepsiDate) && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35, ease: [0.25, 1, 0.5, 1] }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 text-[15px]">Ringkasan</h3>
            <button onClick={() => onNavigate('undangan')} className="text-xs text-rose-500 hover:text-rose-600 font-semibold flex items-center gap-1 transition-colors">
              Edit <ArrowRight size={11} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Mempelai Pria', value: d.groomName },
              { label: 'Mempelai Wanita', value: d.brideName },
            ].filter(x => x.value).map(item => (
              <div key={item.label} className="bg-gray-50/80 rounded-xl px-4 py-3 border border-gray-100/60">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-0.5">{item.label}</p>
                <p className="text-sm text-gray-800 font-semibold">{item.value}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
