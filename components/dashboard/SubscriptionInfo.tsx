'use client'

import { useState, useEffect } from 'react'
import {
  Crown, Rocket, Gem, CheckCircle2, Clock, AlertTriangle,
  Shield, Zap, ExternalLink, MessageSquare,
  Loader2, Receipt,
} from 'lucide-react'
import Link from 'next/link'
import type { Invitation } from '@/lib/types'

interface Props {
  invitation: Invitation
  /** Membuka tab Bantuan di dashboard. Dipakai blok "belum dibayar" di bawah. */
  onOpenSupport: () => void
}

/**
 * Riwayat pembayaran dibaca dari PESANAN, bukan dari bukti transfer.
 *
 * Sebelumnya komponen ini menarik /api/payment/proof, yang membaca tabel
 * payment_proofs. Tabel itu nol baris sepanjang sejarah aplikasi karena tidak
 * pernah ada UI untuk mengunggah bukti — jadi bagian "Riwayat Pembayaran" ini
 * selalu kosong dan banner "sedang diverifikasi" tidak pernah muncul, bahkan
 * untuk pembeli yang pesanannya betul-betul sedang menunggu verifikasi.
 */
interface UserOrder {
  id: string
  order_number: string
  total_amount: number
  status: 'pending' | 'approved' | 'rejected'
  payment_method: string | null
  created_at: string
}

const TIER_MAP: Record<string, { label: string; icon: React.ElementType; color: string; gradient: string; price: number; features: string[] }> = {
  starter: {
    label: 'Starter',
    icon: Rocket,
    color: '#3b82f6',
    gradient: 'from-blue-500 to-cyan-500',
    price: 79000,
    features: ['Maks 6 foto galeri', 'RSVP & ucapan', '100 tamu blast', 'Aktif 30 hari'],
  },
  popular: {
    label: 'Popular',
    icon: Crown,
    color: '#8b5cf6',
    gradient: 'from-violet-500 to-purple-600',
    price: 149000,
    features: ['20 foto galeri', 'Video highlight', '500 tamu blast', 'Aktif 90 hari', 'Tanpa watermark'],
  },
  eksklusif: {
    label: 'Eksklusif',
    icon: Gem,
    color: '#d97706',
    gradient: 'from-amber-500 to-orange-500',
    price: 249000,
    features: ['Foto unlimited', 'Livestream & QR', 'Tamu unlimited', 'Aktif 180 hari', 'Custom domain'],
  },
}

function getDaysRemaining(expiresAt: string | null | undefined): number | null {
  if (!expiresAt) return null
  const diff = new Date(expiresAt).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

function getExpiryStatus(days: number | null): { label: string; cls: string; icon: React.ElementType } {
  if (days === null) return { label: 'Tidak diketahui', cls: 'text-stone-500 bg-stone-50 border-stone-200', icon: Clock }
  if (days === 0) return { label: 'Kedaluwarsa', cls: 'text-red-700 bg-red-50 border-red-200', icon: AlertTriangle }
  if (days <= 7) return { label: `${days} hari lagi`, cls: 'text-red-700 bg-red-50 border-red-200', icon: AlertTriangle }
  if (days <= 30) return { label: `${days} hari lagi`, cls: 'text-amber-700 bg-amber-50 border-amber-200', icon: Clock }
  return { label: `${days} hari lagi`, cls: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: Shield }
}

interface SubRecord {
  id: string
  tier: string
  tierName: string
  status: string
  startsAt: string
  expiresAt: string
  daysRemaining: number
}

export default function SubscriptionInfo({ invitation, onOpenSupport }: Props) {
  const [orders, setOrders] = useState<UserOrder[]>([])
  const [sub, setSub] = useState<SubRecord | null>(null)
  const [loading, setLoading] = useState(true)

  const isPaid = invitation.is_paid

  useEffect(() => {
    Promise.all([
      fetch('/api/user/orders').then(r => r.json()).catch(() => ({ orders: [] })),
      fetch('/api/user/subscription').then(r => r.json()).catch(() => ({ subscriptions: [] })),
    ]).then(([orderData, subData]) => {
      setOrders(orderData.orders ?? [])
      const active = (subData.subscriptions ?? []).find(
        (s: SubRecord) => s.status === 'active' || s.status === 'expiring_soon'
      ) ?? (subData.subscriptions ?? [])[0] ?? null
      setSub(active)
    }).finally(() => setLoading(false))
  }, [])

  const tierKey = sub?.tier
    ?? ((invitation as unknown as Record<string, unknown>).package_tier as string | undefined)
  const tier = TIER_MAP[tierKey?.toLowerCase() ?? ''] ?? TIER_MAP.popular
  const TierIcon = tier.icon
  const daysLeft = sub ? sub.daysRemaining : getDaysRemaining(invitation.expires_at)
  const expiry = getExpiryStatus(daysLeft)
  const ExpiryIcon = expiry.icon
  const expiresAtDisplay = sub?.expiresAt ?? invitation.expires_at

  const hasPending = orders.some(o => o.status === 'pending')

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-stone-300" />
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Pending verification banner */}
      {hasPending && !isPaid && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
          <Clock size={20} className="text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Pembayaran sedang diverifikasi</p>
            <p className="text-xs text-amber-600 mt-0.5">Tim kami akan mengecek bukti transfer Anda. Biasanya membutuhkan waktu 1x24 jam.</p>
          </div>
        </div>
      )}

      {/* ACTIVE SUBSCRIPTION CARD */}
      {isPaid && (
        <div className="rounded-3xl border border-stone-100 bg-white shadow-sm overflow-hidden">
          {/* Gradient header */}
          <div className={`bg-gradient-to-r ${tier.gradient} p-6 pb-8 relative overflow-hidden`}>
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <TierIcon size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-white/70 text-[10px] uppercase tracking-[0.2em] font-semibold">Paket Aktif</p>
                  <h2 className="text-xl font-bold text-white">{tier.label}</h2>
                </div>
              </div>
              <p className="text-white/70 text-xs">
                {invitation.slug}.iaundang.online
              </p>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-stone-100 -mt-3 relative z-10 mx-6 rounded-2xl overflow-hidden border border-stone-100 shadow-sm">
            <div className="bg-white p-4 text-center">
              <p className="text-[10px] text-stone-400 uppercase tracking-wider font-medium mb-1">Status</p>
              <div className="flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-sm font-semibold text-emerald-700">Aktif</span>
              </div>
            </div>
            <div className="bg-white p-4 text-center">
              <p className="text-[10px] text-stone-400 uppercase tracking-wider font-medium mb-1">Masa Aktif</p>
              <div className={`flex items-center justify-center gap-1.5 text-sm font-semibold ${
                daysLeft !== null && daysLeft <= 7 ? 'text-red-600' :
                daysLeft !== null && daysLeft <= 30 ? 'text-amber-600' : 'text-stone-900'
              }`}>
                <ExpiryIcon size={14} />
                {expiry.label}
              </div>
            </div>
            <div className="bg-white p-4 text-center col-span-2 sm:col-span-1">
              <p className="text-[10px] text-stone-400 uppercase tracking-wider font-medium mb-1">Berlaku Hingga</p>
              <p className="text-sm font-semibold text-stone-900">
                {expiresAtDisplay
                  ? new Date(expiresAtDisplay).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                  : '-'
                }
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="p-6 pt-5">
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">Fitur Paket</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {tier.features.map(f => (
                <div key={f} className="flex items-center gap-2.5 text-sm text-stone-700">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                  {f}
                </div>
              ))}
            </div>
          </div>

          {/* Expiry warning */}
          {daysLeft !== null && daysLeft <= 14 && daysLeft > 0 && (
            <div className="mx-6 mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
              <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-amber-800">Langganan hampir berakhir</p>
                <p className="text-[11px] text-amber-600 mt-0.5">
                  Paket Anda berakhir dalam {daysLeft} hari. Perpanjang sekarang agar undangan tetap aktif dan bisa diakses tamu.
                </p>
              </div>
            </div>
          )}

          {/* Expired state */}
          {daysLeft === 0 && (
            <div className="mx-6 mb-6 rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
              <AlertTriangle size={16} className="text-red-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-red-800">Langganan kedaluwarsa</p>
                <p className="text-[11px] text-red-600 mt-0.5">
                  Paket Anda telah berakhir. Undangan tidak bisa diakses oleh tamu. Perpanjang sekarang untuk mengaktifkan kembali.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Belum dibayar. Dulu bertuliskan "mode Free Trial" dan tombolnya
          membuka /templates. Trial sudah tidak ada, dan /order menolak
          subdomain undangan yang sudah ada, jadi tombol itu buntu. Sekarang
          keadaannya dijelaskan apa adanya dan tombolnya membuka tab Bantuan. */}
      {!isPaid && !hasPending && (
        <div className="rounded-3xl border border-stone-100 bg-white shadow-sm overflow-hidden">
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
              <Shield size={28} className="text-amber-500" />
            </div>
            <h3 className="text-lg font-bold text-stone-900 mb-1">Pembayaran belum aktif</h3>
            <p className="text-sm text-stone-500 mb-6 max-w-sm mx-auto">
              Undangan ini belum tercatat lunas. Kalau kalian sudah membayar atau merasa ini keliru, kabari kami lewat Bantuan supaya bisa kami cek.
            </p>
            <button
              type="button"
              onClick={onOpenSupport}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold rounded-xl hover:shadow-lg hover:shadow-amber-500/25 transition-all"
            >
              <MessageSquare size={16} />
              Hubungi Bantuan
            </button>
          </div>
        </div>
      )}

      {/* UPGRADE CTA for paid users */}
      {isPaid && (
        <div className="rounded-3xl border border-stone-100 bg-white shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Zap size={14} className="text-amber-500" />
                <p className="text-sm font-semibold text-stone-900">Ingin upgrade atau perpanjang?</p>
              </div>
              <p className="text-xs text-stone-500">
                Pilih template baru atau tingkatkan paket untuk fitur lebih lengkap. Hubungi admin untuk perpanjangan.
              </p>
            </div>
            <Link
              href="/templates"
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-stone-900 text-white text-xs font-bold rounded-xl hover:bg-stone-800 transition-colors shrink-0"
            >
              Lihat Template
              <ExternalLink size={12} />
            </Link>
          </div>
        </div>
      )}

      {/* TRANSACTION HISTORY (compact) */}
      {orders.length > 0 && (
        <div className="rounded-3xl border border-stone-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Receipt size={14} className="text-stone-400" />
            <p className="text-sm font-semibold text-stone-900">Riwayat Pembayaran</p>
          </div>
          <div className="space-y-2">
            {orders.map(p => (
              <div key={p.id} className={`flex items-center gap-3 rounded-xl border p-3 ${
                p.status === 'approved' ? 'border-emerald-100 bg-emerald-50/30' :
                p.status === 'pending' ? 'border-amber-100 bg-amber-50/30' :
                'border-red-100 bg-red-50/30'
              }`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  p.status === 'approved' ? 'bg-emerald-100' :
                  p.status === 'pending' ? 'bg-amber-100' :
                  'bg-red-100'
                }`}>
                  {p.status === 'approved' ? <CheckCircle2 size={14} className="text-emerald-600" /> :
                   p.status === 'pending' ? <Clock size={14} className="text-amber-600" /> :
                   <AlertTriangle size={14} className="text-red-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-stone-800">
                    Rp {p.total_amount.toLocaleString('id-ID')}
                    <span className="font-normal text-stone-500"> · {p.order_number}</span>
                  </p>
                  <p className="text-[10px] text-stone-400">
                    {new Date(p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  p.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                  p.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {p.status === 'approved' ? 'Disetujui' : p.status === 'pending' ? 'Menunggu' : 'Ditolak'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
