'use client'

import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import {
  Check, X, Copy, Loader2, Inbox, Search, Zap, Hand,
  ExternalLink, Clock,
} from 'lucide-react'
import type { AdminOrder } from '@/components/admin/types'
import ConfirmDialog from '@/components/admin/ui/ConfirmDialog'

export type QueueView = 'action' | 'all'

interface Props {
  /** Domain dari pengaturan aplikasi. Dulu ditulis keras sebagai
   *  'iaundang.online' di tiga tempat, termasuk di pesan WhatsApp yang
   *  dikirim ke pembeli — kalau admin mengganti domain, alamat yang
   *  diberitahukan ke pembeli jadi salah. */
  appDomain: string
  orders: AdminOrder[]
  view: QueueView
  onOrdersChange: (orders: AdminOrder[]) => void
}

function formatRp(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

/** "3 hari lalu" — admin memproses antrean berdasarkan umur, bukan tanggal. */
function relativeAge(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (days === 0) return 'hari ini'
  if (days === 1) return 'kemarin'
  if (days < 30) return `${days} hari lalu`
  const months = Math.floor(days / 30)
  return months === 1 ? 'sebulan lalu' : `${months} bulan lalu`
}

const STATUS: Record<string, { label: string; chip: string; dot: string }> = {
  pending:  { label: 'Menunggu verifikasi', chip: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-400' },
  approved: { label: 'Disetujui',           chip: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  rejected: { label: 'Ditolak',             chip: 'bg-red-50 text-red-600 border-red-200', dot: 'bg-red-400' },
}

/**
 * Antrean pesanan.
 *
 * Menggantikan tabel lama yang filter bawaannya "Semua" — satu pesanan yang
 * menunggu verifikasi sejak 51 hari tenggelam di antara riwayat tanpa ada yang
 * menonjolkannya. Sekarang yang perlu ditindak selalu tampil paling depan,
 * lengkap dengan nominal dan kode unik yang gampang dicocokkan ke mutasi bank.
 */
export default function OrderQueue({ orders, view, onOrdersChange, appDomain }: Props) {
  const [query, setQuery] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [pending, setPending] = useState<{ order: AdminOrder; action: 'approve' | 'reject' } | null>(null)
  const [notes, setNotes] = useState('')

  const method = (o: AdminOrder): 'mayar' | 'manual' =>
    (o.payment_method === 'mayar' ? 'mayar' : 'manual')

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return orders
      .filter(o => (view === 'action' ? o.status === 'pending' : true))
      .filter(o => !q || `${o.order_number} ${o.email} ${o.subdomain} ${o.groom_name} ${o.bride_name}`.toLowerCase().includes(q))
      // Menunggu selalu di atas, lalu yang paling lama menunggu duluan —
      // urutan yang sama dengan cara admin sebenarnya mengerjakannya.
      .sort((a, b) => {
        if (a.status !== b.status) {
          if (a.status === 'pending') return -1
          if (b.status === 'pending') return 1
        }
        return a.created_at.localeCompare(b.created_at) * (a.status === 'pending' ? 1 : -1)
      })
  }, [orders, view, query])

  async function run() {
    if (!pending) return
    const { order, action } = pending
    setBusyId(order.id)
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, admin_notes: notes }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) { toast.error(data?.error || 'Pesanannya gagal diproses'); return }

      onOrdersChange(orders.map(o => o.id === order.id
        ? { ...o, status: action === 'approve' ? 'approved' : 'rejected', admin_notes: notes, reviewed_at: new Date().toISOString() }
        : o))

      setPending(null)
      setNotes('')

      if (action === 'reject') {
        toast.success('Pesanan ditolak')
      } else if (data.passwordLinkSent) {
        // Admin tidak lagi menerima, menyalin, atau meneruskan password.
        toast.success('Pesanan disetujui. Tautan buat password sudah dikirim ke email pembeli.')
      } else {
        toast.success('Pesanan disetujui. Akunnya sudah ada sebelumnya, jadi pembeli masuk dengan password lamanya.')
      }
    } finally { setBusyId(null) }
  }

  function copy(text: string, label: string) {
    navigator.clipboard.writeText(text)
    toast.success(`${label} disalin`)
  }


  if (orders.length === 0) {
    return <EmptyState title="Belum ada pesanan" hint="Pesanan dari halaman /order akan muncul di sini." />
  }

  return (
    <div className="space-y-3">
      <div className="relative max-w-xs">
        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Cari nomor pesanan, email, subdomain..."
          className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-gray-200/70 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400"
        />
      </div>

      {visible.length === 0 ? (
        view === 'action'
          ? <EmptyState title="Tidak ada yang perlu ditindak" hint="Semua pesanan sudah diproses." tone="ok" />
          : <EmptyState title="Tidak ada pesanan yang cocok" hint="Coba kata kunci lain." />
      ) : (
        visible.map(o => {
          const st = STATUS[o.status] ?? STATUS.pending
          const isPending = o.status === 'pending'
          return (
            <div
              key={o.id}
              className={`rounded-2xl border bg-white p-4 transition-colors ${
                isPending ? 'border-amber-200 shadow-sm' : 'border-gray-200/70'
              } ${busyId === o.id ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[11px] font-bold text-gray-500">{o.order_number}</span>
                    <span className={`inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full font-semibold border ${st.chip}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                      {st.label}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] text-gray-400">
                      {method(o) === 'mayar' ? <Zap className="w-3 h-3" /> : <Hand className="w-3 h-3" />}
                      {method(o) === 'mayar' ? 'Otomatis' : 'Manual'}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] text-gray-400">
                      <Clock className="w-3 h-3" />{relativeAge(o.created_at)}
                    </span>
                  </div>

                  <p className="mt-1.5 text-sm font-bold text-gray-900 truncate">
                    {o.groom_name} &amp; {o.bride_name}
                  </p>
                  <p className="text-[11px] text-gray-400 truncate">
                    {o.email}
                    {o.phone && ` · ${o.phone}`}
                    {' · '}
                    <span className="font-mono">{o.subdomain}.{appDomain}</span>
                  </p>
                </div>

                {/* Nominal + kode unik: satu-satunya angka yang dicocokkan
                    admin ke mutasi bank, jadi ditaruh paling menonjol. */}
                <div className="text-right shrink-0">
                  <p className="font-display text-lg font-bold text-gray-900 tabular-nums">
                    {formatRp(o.total_amount)}
                  </p>
                  {o.unique_code > 0 && (
                    <p className="text-[10px] text-gray-400 tabular-nums">
                      {formatRp(o.amount)} + {o.unique_code} (kode unik, pesanan lama)
                    </p>
                  )}
                  <button
                    onClick={() => copy(String(o.total_amount), 'Nominal')}
                    className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    <Copy className="w-3 h-3" /> Salin nominal
                  </button>
                </div>
              </div>

              {o.admin_notes && (
                <p className="mt-2.5 text-[11px] text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1.5">
                  Catatan: {o.admin_notes}
                </p>
              )}

              <div className="mt-3 flex items-center gap-2 flex-wrap">
                {isPending && (
                  <>
                    <button
                      onClick={() => { setPending({ order: o, action: 'approve' }); setNotes('') }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[12px] font-semibold text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" /> Setujui &amp; aktifkan
                    </button>
                    <button
                      onClick={() => { setPending({ order: o, action: 'reject' }); setNotes('') }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[12px] font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" /> Tolak
                    </button>
                  </>
                )}
                {o.status === 'approved' && (
                  <a
                    href={`https://${o.subdomain}.${appDomain}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" /> Buka undangan
                  </a>
                )}
                {o.proof_url && (
                  <a
                    href={o.proof_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" /> Lihat bukti transfer
                  </a>
                )}
              </div>
            </div>
          )
        })
      )}

      <ConfirmDialog
        open={!!pending}
        busy={!!pending && busyId === pending.order.id}
        tone={pending?.action === 'approve' ? 'neutral' : 'danger'}
        icon={pending?.action === 'approve' ? Check : X}
        title={pending?.action === 'approve' ? 'Setujui pesanan?' : 'Tolak pesanan?'}
        confirmLabel={pending?.action === 'approve' ? 'Ya, setujui' : 'Ya, tolak'}
        message={pending ? (
          <div className="text-left">
            <p className="text-center mb-3">
              {pending.action === 'approve'
                ? <>Akun, undangan, dan langganan untuk <strong>{pending.order.groom_name} &amp; {pending.order.bride_name}</strong> akan langsung dibuat.</>
                : <>Pesanan <strong>{pending.order.order_number}</strong> ditandai ditolak. Tidak ada yang dibuat.</>}
            </p>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1">Catatan admin (opsional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder={pending.action === 'approve' ? 'mis. transfer BCA 19 Agu' : 'mis. nominal tidak cocok'}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/10 resize-none"
            />
          </div>
        ) : ''}
        onConfirm={run}
        onCancel={() => { setPending(null); setNotes('') }}
      />

    </div>
  )
}


function EmptyState({ title, hint, tone }: { title: string; hint: string; tone?: 'ok' }) {
  return (
    <div className="py-16 text-center">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${tone === 'ok' ? 'bg-emerald-50' : 'bg-gray-100'}`}>
        {tone === 'ok'
          ? <Check className="w-6 h-6 text-emerald-500" />
          : <Inbox className="w-6 h-6 text-gray-300" />}
      </div>
      <p className="text-sm font-semibold text-gray-700">{title}</p>
      <p className="text-[12px] text-gray-400 mt-1">{hint}</p>
    </div>
  )
}
