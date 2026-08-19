'use client'

import { useState, useRef } from 'react'
import toast from 'react-hot-toast'
import {
  Plus, Trash2, Save, CheckCircle2, XCircle, Clock,
  Landmark, QrCode, Eye, Upload,
  CreditCard, ToggleLeft, ToggleRight, Loader2,
  Phone, FileText, AlertTriangle, Image as ImageIcon,
  X, Edit3, Building2, Hash, User, Info,
} from 'lucide-react'
import type { BankAccount, PaymentProof } from '@/lib/db'
import { formatPrice } from '@/lib/utils'
import BankCard from '@/components/ui/BankCard'
import { Button } from '@/components/ui/Button'

interface PaymentConfig {
  bankAccounts: BankAccount[]
  qrisImageUrl: string
  paymentInstructions: string
  confirmationWhatsapp: string
}

interface Props {
  config: PaymentConfig
  proofs: PaymentProof[]
  onConfigUpdate: (config: PaymentConfig) => void
  onProofReview: (proofId: string, status: 'approved' | 'rejected', notes: string) => Promise<void>
}

type SubTab = 'config' | 'proofs'

const DEFAULT_INSTRUCTIONS = `Pastikan nominal transfer sesuai dengan total tagihan (termasuk kode unik) agar pembayaran dapat diverifikasi secara otomatis.

Langkah pembayaran:
1. Transfer ke salah satu rekening di atas sesuai nominal yang tertera
2. Screenshot bukti transfer
3. Klik tombol "Konfirmasi via WhatsApp" dan kirimkan bukti transfer
4. Tim kami akan memverifikasi dalam 1×24 jam kerja
5. Setelah diverifikasi, akun login akan dikirim via WhatsApp/email

Catatan:
• Pembayaran berlaku 1×24 jam sejak pesanan dibuat
• Jika ada kendala, silakan hubungi admin via WhatsApp`

const BANK_PRESETS: { name: string; color: string; textColor: string }[] = [
  { name: 'BCA', color: '#003D79', textColor: '#ffffff' },
  { name: 'BNI', color: '#F05A28', textColor: '#ffffff' },
  { name: 'BRI', color: '#00529C', textColor: '#ffffff' },
  { name: 'Mandiri', color: '#003066', textColor: '#ffffff' },
  { name: 'BSI', color: '#00A652', textColor: '#ffffff' },
  { name: 'CIMB Niaga', color: '#7B1D3E', textColor: '#ffffff' },
  { name: 'Permata', color: '#00A551', textColor: '#ffffff' },
  { name: 'Danamon', color: '#FCBB08', textColor: '#003D6A' },
  { name: 'OCBC NISP', color: '#DE1C24', textColor: '#ffffff' },
  { name: 'Jago', color: '#00C8FF', textColor: '#ffffff' },
  { name: 'Seabank', color: '#2AA0A0', textColor: '#ffffff' },
]

export default function PaymentTab({ config, proofs, onConfigUpdate, onProofReview }: Props) {
  const [subTab, setSubTab] = useState<SubTab>('config')
  const pendingCount = proofs.filter((p) => p.status === 'pending').length

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
          <CreditCard className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Pembayaran</h1>
          <p className="text-sm text-gray-500">Kelola metode pembayaran, QRIS, dan verifikasi transfer</p>
        </div>
      </div>

      {/* Sub-tab switcher */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => setSubTab('config')}
          className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${subTab === 'config' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Landmark className="w-4 h-4" />
          Rekening & QRIS
        </button>
        <button
          onClick={() => setSubTab('proofs')}
          className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${subTab === 'proofs' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Clock className="w-4 h-4" />
          Verifikasi Transfer
          {pendingCount > 0 && (
            <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      {subTab === 'config' && (
        <PaymentConfigTab config={config} onUpdate={onConfigUpdate} />
      )}
      {subTab === 'proofs' && (
        <ProofsTab proofs={proofs} onReview={onProofReview} />
      )}
    </div>
  )
}

// ─── Payment Config ─────────────────────────────────────────

function PaymentConfigTab({ config, onUpdate }: { config: PaymentConfig; onUpdate: (c: PaymentConfig) => void }) {
  const [accounts, setAccounts] = useState<BankAccount[]>(config.bankAccounts)
  const [qrisUrl, setQrisUrl] = useState(config.qrisImageUrl)
  const [instructions, setInstructions] = useState(config.paymentInstructions || DEFAULT_INSTRUCTIONS)
  const [wa, setWa] = useState(config.confirmationWhatsapp)
  const [saving, setSaving] = useState(false)

  const [showAddBank, setShowAddBank] = useState(false)
  const [newBank, setNewBank] = useState({ bankName: '', accountNumber: '', accountName: '', logoUrl: '' })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState({ bankName: '', accountNumber: '', accountName: '' })

  const [uploadingQris, setUploadingQris] = useState(false)
  const qrisFileRef = useRef<HTMLInputElement>(null)

  async function save() {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/payment-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bankAccounts: accounts,
          qrisImageUrl: qrisUrl,
          paymentInstructions: instructions,
          confirmationWhatsapp: wa,
        }),
      })
      if (!res.ok) { toast.error('Gagal simpan'); return }
      onUpdate({ bankAccounts: accounts, qrisImageUrl: qrisUrl, paymentInstructions: instructions, confirmationWhatsapp: wa })
      toast.success('Konfigurasi pembayaran tersimpan!')
    } catch { toast.error('Gagal simpan') }
    finally { setSaving(false) }
  }

  function addBank() {
    if (!newBank.bankName || !newBank.accountNumber || !newBank.accountName) {
      toast.error('Nama bank, nomor rekening, dan nama pemilik wajib diisi')
      return
    }
    const account: BankAccount = {
      id: crypto.randomUUID(),
      ...newBank,
      isActive: true,
    }
    setAccounts([...accounts, account])
    setNewBank({ bankName: '', accountNumber: '', accountName: '', logoUrl: '' })
    setShowAddBank(false)
    toast.success(`Rekening ${newBank.bankName} ditambahkan`)
  }

  function startEdit(acc: BankAccount) {
    setEditingId(acc.id)
    setEditData({ bankName: acc.bankName, accountNumber: acc.accountNumber, accountName: acc.accountName })
  }

  function saveEdit(id: string) {
    setAccounts(accounts.map(a => a.id === id ? { ...a, ...editData } : a))
    setEditingId(null)
    toast.success('Rekening diperbarui')
  }

  function removeBank(id: string) {
    setAccounts(accounts.filter((a) => a.id !== id))
    toast.success('Rekening dihapus')
  }

  function toggleActive(id: string) {
    setAccounts(accounts.map((a) => a.id === id ? { ...a, isActive: !a.isActive } : a))
  }

  async function uploadQrisImage(file: File) {
    if (file.size > 5 * 1024 * 1024) { toast.error('Ukuran file maks 5MB'); return }
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) { toast.error('Format: JPG, PNG, atau WebP'); return }

    setUploadingQris(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/admin/upload', { method: 'POST', body: formData })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setQrisUrl(data.url)
      toast.success('Gambar QRIS berhasil diupload!')
    } catch { toast.error('Gagal upload gambar') }
    finally { setUploadingQris(false) }
  }

  return (
    <div className="space-y-8">

      {/* ── Bank Accounts ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
              <Landmark className="w-5 h-5 text-indigo-500" />
              Rekening Bank
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">Rekening tujuan transfer pembayaran dari customer</p>
          </div>
          <Button
            variant="indigo"
            onClick={() => setShowAddBank(!showAddBank)}
            className="text-xs px-4 py-2 gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Tambah Rekening
          </Button>
        </div>

        {/* Add bank form */}
        {showAddBank && (
          <div className="mb-4 rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/30 p-5">
            <p className="text-sm font-semibold text-indigo-900 mb-4">Tambah Rekening Baru</p>

            {/* Bank preset chips */}
            <div className="mb-4">
              <p className="text-[11px] text-gray-500 font-medium mb-2">Pilih bank:</p>
              <div className="flex flex-wrap gap-1.5">
                {BANK_PRESETS.map(preset => (
                  <button
                    key={preset.name}
                    onClick={() => setNewBank({ ...newBank, bankName: preset.name })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                      newBank.bankName === preset.name
                        ? 'text-white shadow-sm'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                    }`}
                    style={newBank.bankName === preset.name ? { backgroundColor: preset.color, borderColor: preset.color, color: preset.textColor } : undefined}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1">
                  <Building2 className="w-3 h-3" /> Nama Bank *
                </label>
                <input value={newBank.bankName} onChange={(e) => setNewBank({ ...newBank, bankName: e.target.value })}
                  placeholder="BCA, Mandiri..."
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 bg-white" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1">
                  <Hash className="w-3 h-3" /> Nomor Rekening *
                </label>
                <input value={newBank.accountNumber} onChange={(e) => setNewBank({ ...newBank, accountNumber: e.target.value })}
                  placeholder="1234567890"
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 font-mono bg-white" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1">
                  <User className="w-3 h-3" /> Atas Nama *
                </label>
                <input value={newBank.accountName} onChange={(e) => setNewBank({ ...newBank, accountName: e.target.value })}
                  placeholder="PT Iaundang Digital"
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 bg-white" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="indigo" onClick={addBank} className="px-5">
                <Plus className="w-3.5 h-3.5" /> Tambahkan
              </Button>
              <button onClick={() => { setShowAddBank(false); setNewBank({ bankName: '', accountNumber: '', accountName: '', logoUrl: '' }) }}
                className="px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700 font-medium">
                Batal
              </button>
            </div>
          </div>
        )}

        {/* Bank account cards */}
        {accounts.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <Landmark className="w-6 h-6 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500 mb-1">Belum ada rekening</p>
            <p className="text-xs text-gray-400">Tambahkan rekening bank untuk menerima pembayaran dari customer</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {accounts.map(acc => {
              const isEditing = editingId === acc.id

              if (isEditing) {
                return (
                  <div key={acc.id} className="rounded-2xl border-2 border-indigo-200 bg-white p-5 shadow-sm">
                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3">Edit Rekening</p>
                    <div className="space-y-2.5">
                      <input value={editData.bankName} onChange={e => setEditData({ ...editData, bankName: e.target.value })}
                        placeholder="Nama Bank"
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-semibold" />
                      <input value={editData.accountNumber} onChange={e => setEditData({ ...editData, accountNumber: e.target.value })}
                        placeholder="Nomor Rekening"
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono" />
                      <input value={editData.accountName} onChange={e => setEditData({ ...editData, accountName: e.target.value })}
                        placeholder="Atas Nama"
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                      <div className="flex gap-2">
                        <Button variant="indigo" onClick={() => saveEdit(acc.id)} className="text-xs px-4 py-2 rounded-lg">
                          Simpan
                        </Button>
                        <button onClick={() => setEditingId(null)} className="text-xs text-gray-500 hover:text-gray-700 px-3 py-2">
                          Batal
                        </button>
                      </div>
                    </div>
                  </div>
                )
              }

              return (
                <div key={acc.id} className={`space-y-2 ${!acc.isActive ? 'opacity-50' : ''}`}>
                  <BankCard
                    bankName={acc.bankName}
                    accountNumber={acc.accountNumber}
                    accountName={acc.accountName}
                    showCopy
                  />
                  <div className="flex items-center gap-1.5 px-1">
                    <button onClick={() => toggleActive(acc.id)}
                      className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-colors ${
                        acc.isActive
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}>
                      {acc.isActive ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                      {acc.isActive ? 'Aktif' : 'Nonaktif'}
                    </button>
                    <button onClick={() => startEdit(acc)}
                      className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 px-2.5 py-1.5 rounded-lg transition-colors font-medium">
                      <Edit3 className="w-3 h-3" /> Edit
                    </button>
                    <div className="flex-1" />
                    <button onClick={() => removeBank(acc.id)}
                      className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ── QRIS ── */}
      <section>
        <h3 className="font-bold text-gray-900 text-base flex items-center gap-2 mb-1">
          <QrCode className="w-5 h-5 text-indigo-500" />
          QRIS
        </h3>
        <p className="text-xs text-gray-400 mb-4">Upload gambar QR code untuk pembayaran via QRIS</p>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {qrisUrl ? (
            <div className="p-5">
              <div className="flex items-start gap-5">
                <div className="relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrisUrl} alt="QRIS" className="w-40 h-40 object-contain rounded-xl border border-gray-200 bg-white p-2" />
                  <button
                    onClick={() => setQrisUrl('')}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800 mb-1">QRIS aktif</p>
                  <p className="text-xs text-gray-400 mb-3">QR code ini akan ditampilkan di halaman pembayaran customer sebagai opsi pembayaran</p>
                  <button
                    onClick={() => qrisFileRef.current?.click()}
                    disabled={uploadingQris}
                    className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-semibold transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" /> Ganti gambar
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => qrisFileRef.current?.click()}
              disabled={uploadingQris}
              className="w-full p-8 flex flex-col items-center justify-center gap-3 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              {uploadingQris ? (
                <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
              ) : (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center">
                    <QrCode className="w-8 h-8 text-indigo-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-700">Upload gambar QRIS</p>
                    <p className="text-xs text-gray-400 mt-0.5">JPG, PNG, atau WebP, maks 5MB</p>
                  </div>
                </>
              )}
            </button>
          )}
        </div>

        <input
          ref={qrisFileRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          className="hidden"
          onChange={e => {
            const f = e.target.files?.[0]
            if (f) uploadQrisImage(f)
            e.target.value = ''
          }}
        />
      </section>

      {/* ── Payment Instructions ── */}
      <section>
        <h3 className="font-bold text-gray-900 text-base flex items-center gap-2 mb-1">
          <FileText className="w-5 h-5 text-indigo-500" />
          Instruksi Pembayaran
        </h3>
        <p className="text-xs text-gray-400 mb-4">Instruksi ini ditampilkan ke customer saat mereka pilih transfer manual di halaman pembayaran</p>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={10}
            placeholder="Tulis instruksi pembayaran..."
            className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 resize-none leading-relaxed"
          />
          {!instructions && (
            <button
              onClick={() => setInstructions(DEFAULT_INSTRUCTIONS)}
              className="mt-2 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Gunakan template instruksi default
            </button>
          )}
        </div>
      </section>

      {/* ── WhatsApp ── */}
      <section>
        <h3 className="font-bold text-gray-900 text-base flex items-center gap-2 mb-1">
          <Phone className="w-5 h-5 text-indigo-500" />
          WhatsApp Konfirmasi
        </h3>
        <p className="text-xs text-gray-400 mb-4">Nomor WhatsApp admin untuk menerima konfirmasi dan bukti transfer</p>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-0">
            <span className="px-4 py-2.5 text-sm bg-gray-100 border border-r-0 border-gray-200 rounded-l-xl text-gray-500 font-mono shrink-0">
              +
            </span>
            <input
              value={wa}
              onChange={(e) => setWa(e.target.value)}
              placeholder="6281234567890"
              className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-r-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 font-mono"
            />
          </div>
          <p className="text-[11px] text-gray-400 mt-2">Format internasional tanpa tanda +, contoh: 6281234567890</p>
        </div>
      </section>

      {/* ── Save Button ── */}
      <div className="sticky bottom-0 bg-gradient-to-t from-gray-50 via-gray-50 to-transparent pt-4 pb-2">
        <div className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 shadow-lg p-4">
          <div className="flex-1">
            <p className="text-xs text-gray-500">
              {accounts.filter(a => a.isActive).length} rekening aktif
              {qrisUrl ? ' · QRIS aktif' : ''}
              {wa ? ` · WA: +${wa}` : ''}
            </p>
          </div>
          <Button
            variant="indigo"
            onClick={save}
            disabled={saving}
            className="px-6"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Menyimpan...' : 'Simpan Semua'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Proofs Verification ────────────────────────────────────

type ProofFilter = 'all' | 'pending' | 'approved' | 'rejected'

function ProofsTab({ proofs, onReview }: {
  proofs: PaymentProof[]
  onReview: (id: string, status: 'approved' | 'rejected', notes: string) => Promise<void>
}) {
  const [filter, setFilter] = useState<ProofFilter>('pending')
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const filtered = proofs.filter((p) => filter === 'all' || p.status === filter)
  const pendingCount = proofs.filter(p => p.status === 'pending').length
  const approvedCount = proofs.filter(p => p.status === 'approved').length
  const rejectedCount = proofs.filter(p => p.status === 'rejected').length

  async function handleReview(proof: PaymentProof, status: 'approved' | 'rejected') {
    setLoading(true)
    await onReview(proof.id, status, adminNotes)
    setLoading(false)
    setReviewingId(null)
    setAdminNotes('')
  }

  const FILTERS: { id: ProofFilter; label: string; count: number; color: string }[] = [
    { id: 'pending', label: 'Menunggu', count: pendingCount, color: 'amber' },
    { id: 'approved', label: 'Disetujui', count: approvedCount, color: 'emerald' },
    { id: 'rejected', label: 'Ditolak', count: rejectedCount, color: 'red' },
    { id: 'all', label: 'Semua', count: proofs.length, color: 'gray' },
  ]

  return (
    <div className="space-y-5">

      {/* Context: this tab is for manual payments only */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-indigo-900">
            Tab ini khusus untuk pembayaran manual (transfer bank)
          </p>
          <p className="text-xs text-indigo-600 mt-0.5">
            Order yang dibayar via Mayar (QRIS/e-wallet) sudah otomatis aktif tanpa perlu verifikasi di sini.
            Cek tab &ldquo;Pesanan&rdquo; untuk melihat semua order termasuk yang sudah otomatis.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-amber-50 rounded-2xl border border-amber-100 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-amber-500" />
            <p className="text-[11px] text-amber-600 font-semibold uppercase tracking-wider">Menunggu</p>
          </div>
          <p className="text-2xl font-bold text-amber-800">{pendingCount}</p>
        </div>
        <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <p className="text-[11px] text-emerald-600 font-semibold uppercase tracking-wider">Disetujui</p>
          </div>
          <p className="text-2xl font-bold text-emerald-800">{approvedCount}</p>
        </div>
        <div className="bg-red-50 rounded-2xl border border-red-100 p-4">
          <div className="flex items-center gap-2 mb-1">
            <XCircle className="w-4 h-4 text-red-500" />
            <p className="text-[11px] text-red-600 font-semibold uppercase tracking-wider">Ditolak</p>
          </div>
          <p className="text-2xl font-bold text-red-800">{rejectedCount}</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-white border border-gray-100 rounded-xl p-1 w-fit shadow-sm">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
              filter === f.id ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            {f.label}
            {f.count > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                filter === f.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                {f.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6 text-gray-300" />
          </div>
          <p className="text-sm font-medium text-gray-500">
            {filter === 'pending' ? 'Tidak ada bukti transfer yang menunggu verifikasi' : 'Tidak ada data untuk filter ini'}
          </p>
        </div>
      )}

      {/* Proof cards */}
      <div className="space-y-3">
        {filtered.map((proof) => (
          <div key={proof.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
            proof.status === 'pending' ? 'border-amber-200 hover:border-amber-300' :
            proof.status === 'approved' ? 'border-emerald-200' : 'border-red-200'
          }`}>
            {/* Status accent */}
            <div className={`h-1 ${
              proof.status === 'pending' ? 'bg-amber-400' :
              proof.status === 'approved' ? 'bg-emerald-400' : 'bg-red-400'
            }`} />

            <div className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Status + timestamp */}
                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg ${
                      proof.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      proof.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {proof.status === 'pending' && <Clock className="w-3 h-3" />}
                      {proof.status === 'approved' && <CheckCircle2 className="w-3 h-3" />}
                      {proof.status === 'rejected' && <XCircle className="w-3 h-3" />}
                      {proof.status === 'pending' ? 'Menunggu' : proof.status === 'approved' ? 'Disetujui' : 'Ditolak'}
                    </span>
                    <span className="text-[11px] text-gray-400">
                      {new Date(proof.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Info grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-0.5">Email</p>
                      <p className="text-sm font-medium text-gray-800 break-all">{proof.user_email}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-0.5">Undangan</p>
                      <p className="text-sm font-mono text-indigo-600 font-medium">/{proof.slug}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-0.5">Nominal</p>
                      <p className="text-sm font-bold text-gray-900">{formatPrice(proof.amount)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-0.5">Bank</p>
                      <p className="text-sm text-gray-800">{proof.bank_name || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-0.5">Tanggal Transfer</p>
                      <p className="text-sm text-gray-800">{proof.transfer_date || '-'}</p>
                    </div>
                    {proof.proof_url && (
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-0.5">Bukti</p>
                        <a href={proof.proof_url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-semibold">
                          <Eye className="w-3 h-3" /> Lihat bukti
                        </a>
                      </div>
                    )}
                  </div>

                  {proof.notes && (
                    <div className="mt-3 rounded-lg bg-gray-50 px-3 py-2">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-0.5">Catatan User</p>
                      <p className="text-xs text-gray-700">{proof.notes}</p>
                    </div>
                  )}
                  {proof.admin_notes && (
                    <div className={`mt-2 rounded-lg px-3 py-2 ${
                      proof.status === 'approved' ? 'bg-emerald-50' : proof.status === 'rejected' ? 'bg-red-50' : 'bg-gray-50'
                    }`}>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-0.5">Catatan Admin</p>
                      <p className="text-xs text-gray-700">{proof.admin_notes}</p>
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                {proof.status === 'pending' && reviewingId !== proof.id && reviewingId !== proof.id + '-reject' && (
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => { setReviewingId(proof.id); setAdminNotes('') }}
                      className="flex items-center gap-1.5 bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Setujui
                    </button>
                    <button
                      onClick={() => { setReviewingId(proof.id + '-reject'); setAdminNotes('') }}
                      className="flex items-center gap-1.5 bg-white text-red-600 border border-red-200 px-4 py-2.5 rounded-xl text-xs font-semibold hover:bg-red-50 transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Tolak
                    </button>
                  </div>
                )}
              </div>

              {/* Approve review form */}
              {reviewingId === proof.id && (
                <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <p className="text-sm font-semibold text-emerald-800">Setujui Transfer</p>
                  </div>
                  {/* Durasinya SENGAJA tidak disebut di sini. Kalimat lama menampilkan
                      settings.packageDuration — satu angka global yang tidak pernah
                      dipakai endpoint approval; paket Starter diaktifkan 30 hari
                      sementara admin dijanjikan 3 bulan. Masa aktif kini dihitung
                      server dari paket undangannya. */}
                  <p className="text-xs text-emerald-700">Undangan <strong className="font-mono">/{proof.slug}</strong> akan langsung diaktifkan sesuai masa aktif paketnya.</p>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Catatan untuk user (opsional)..."
                    rows={2}
                    className="w-full px-3.5 py-2.5 text-sm border border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none bg-white"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => handleReview(proof, 'approved')} disabled={loading}
                      className="flex items-center gap-1.5 bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 shadow-sm">
                      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      {loading ? 'Memproses...' : 'Konfirmasi Setujui'}
                    </button>
                    <button onClick={() => setReviewingId(null)} className="px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700 font-medium">
                      Batal
                    </button>
                  </div>
                </div>
              )}

              {/* Reject review form */}
              {reviewingId === proof.id + '-reject' && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <p className="text-sm font-semibold text-red-800">Tolak Transfer</p>
                  </div>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Alasan penolakan (wajib diisi agar customer mengerti)..."
                    rows={3}
                    className="w-full px-3.5 py-2.5 text-sm border border-red-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 resize-none bg-white"
                  />
                  <div className="flex gap-2">
                    <Button variant="danger" onClick={() => handleReview(proof, 'rejected')} disabled={loading || !adminNotes.trim()}
                      className="px-5">
                      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                      {loading ? 'Memproses...' : 'Konfirmasi Tolak'}
                    </Button>
                    <button onClick={() => setReviewingId(null)} className="px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700 font-medium">
                      Batal
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
