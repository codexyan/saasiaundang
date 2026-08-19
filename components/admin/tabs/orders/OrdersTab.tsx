'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { ShoppingCart, Copy, Zap, Hand } from 'lucide-react'
import type { AdminOrder } from '@/components/admin/types'
import PageHeader from '@/components/admin/ui/PageHeader'
import Badge from '@/components/admin/ui/Badge'

/**
 * Tab Pesanan.
 *
 * Dulu didefinisikan DI DALAM AdminPanel.tsx — 360 baris tabel, modal, dan
 * aksi approve/reject menumpang di berkas kerangka panel yang sudah memuat
 * routing tab, state pengaturan, dan belasan handler.
 */
export default function OrdersTab({ orders: initialOrders }: { orders: AdminOrder[] }) {
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
