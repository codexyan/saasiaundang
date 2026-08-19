'use client'

import { useMemo, useState } from 'react'
import { Inbox, ListOrdered, Landmark, Wallet } from 'lucide-react'
import type { BankAccount } from '@/lib/db'
import type { AdminOrder } from '@/components/admin/types'
import OrderQueue, { type QueueView } from './OrderQueue'
import PaymentMethodPanel from './PaymentMethodPanel'

interface PaymentConfig {
  bankAccounts: BankAccount[]
  qrisImageUrl: string
  paymentInstructions: string
  confirmationWhatsapp: string
}

interface Props {
  orders: AdminOrder[]
  onOrdersChange: (orders: AdminOrder[]) => void
  paymentConfig: PaymentConfig
  onPaymentConfigChange: (c: PaymentConfig) => void
  appDomain: string
}

type View = QueueView | 'method'

function formatRp(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

function Stat({ icon: Icon, label, value, tone }: {
  icon: React.ElementType; label: string; value: string | number; tone: string
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white border border-gray-200/70">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${tone}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-lg font-bold text-gray-900 leading-none tabular-nums">{value}</p>
        <p className="text-[11px] text-gray-400 mt-1 truncate">{label}</p>
      </div>
    </div>
  )
}

/**
 * Modul Transaksi — semua urusan "uang masuk" di satu tempat.
 *
 * Menggantikan pasangan tab "Pembayaran" + "Pesanan". Keduanya sebenarnya satu
 * pekerjaan yang dipecah dua hanya karena bentuk datanya berbeda: instruksi
 * transfer yang diatur di satu tab adalah instruksi yang diikuti pembeli di
 * tab satunya, dan admin harus memeriksa dua tempat untuk tahu apakah ada yang
 * perlu ditindak.
 *
 * Separuh tab Pembayaran yang lama — antrean review bukti transfer — dihapus,
 * bukan dipindah: tidak ada satu pun UI yang bisa mengirim bukti, jadi
 * tabelnya nol baris sepanjang sejarah dan antreannya mustahil terisi.
 */
export default function TransaksiModule({
  orders, onOrdersChange, paymentConfig, onPaymentConfigChange, appDomain,
}: Props) {
  const [view, setView] = useState<View>('action')

  const stats = useMemo(() => {
    const pending = orders.filter(o => o.status === 'pending')
    const approved = orders.filter(o => o.status === 'approved')
    return {
      pending: pending.length,
      approved: approved.length,
      revenue: approved.reduce((s, o) => s + o.total_amount, 0),
      // Umur pesanan tertua yang belum ditindak — angka yang paling jujur
      // tentang apakah antreannya terurus.
      oldestDays: pending.length === 0 ? 0 : Math.max(
        ...pending.map(o => Math.floor((Date.now() - new Date(o.created_at).getTime()) / 86_400_000)),
      ),
    }
  }, [orders])

  const TABS: { id: View; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'action', label: 'Perlu Tindakan', icon: Inbox, badge: stats.pending },
    { id: 'all',    label: 'Semua Pesanan',  icon: ListOrdered, badge: orders.length },
    { id: 'method', label: 'Metode Pembayaran', icon: Landmark },
  ]

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50/60">
      <div className="bg-white border-b border-gray-200/70 shrink-0">
        <div className="px-8 py-5 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-bold text-gray-900">Transaksi</h1>
            <p className="text-[11px] text-gray-400 truncate">
              {stats.pending > 0
                ? `${stats.pending} pesanan menunggu verifikasi${stats.oldestDays > 2 ? ` — yang terlama sudah ${stats.oldestDays} hari` : ''}`
                : 'Semua pesanan sudah diproses'}
            </p>
          </div>
        </div>

        <div className="px-8 flex items-center gap-1">
          {TABS.map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              onClick={() => setView(id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold border-b-2 -mb-px transition-colors ${
                view === id
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-400 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              {badge != null && badge > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  id === 'action' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-400'
                }`}>
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="px-8 py-6 space-y-5">
          {view !== 'method' && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Stat icon={Inbox} label="Menunggu verifikasi" value={stats.pending}
                tone={stats.pending > 0 ? 'bg-amber-50 text-amber-600' : 'bg-gray-100 text-gray-400'} />
              <Stat icon={ListOrdered} label="Pesanan disetujui" value={stats.approved} tone="bg-emerald-50 text-emerald-600" />
              <Stat icon={Wallet} label="Nilai pesanan disetujui" value={formatRp(stats.revenue)} tone="bg-indigo-50 text-indigo-600" />
            </div>
          )}

          {view === 'method' ? (
            <PaymentMethodPanel config={paymentConfig} onUpdate={onPaymentConfigChange} />
          ) : (
            <OrderQueue orders={orders} view={view} onOrdersChange={onOrdersChange} appDomain={appDomain} />
          )}
        </div>
      </div>
    </div>
  )
}
