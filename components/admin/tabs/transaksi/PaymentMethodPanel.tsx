'use client'

import { useState, useRef } from 'react'
import toast from 'react-hot-toast'
import {
  Plus, Trash2, Save, Landmark, QrCode, Upload, ToggleLeft, ToggleRight, Loader2, Phone, FileText, X, Edit3, Building2, Hash, User,
} from 'lucide-react'
import type { BankAccount } from '@/lib/db'
import { formatPrice } from '@/lib/utils'
import BankCard from '@/components/ui/BankCard'
import { Button } from '@/components/ui/Button'

interface PaymentConfig {
  bankAccounts: BankAccount[]
  qrisImageUrl: string
  paymentInstructions: string
  confirmationWhatsapp: string
}

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

/**
 * Metode pembayaran yang dilihat pembeli.
 *
 * Dulu ini separuh dari tab "Pembayaran"; separuh lainnya adalah antrean
 * review bukti transfer yang TIDAK PERNAH menerima satu baris pun — tidak ada
 * UI yang bisa mengirim bukti, jadi admin membuka antrean yang mustahil
 * terisi. Separuh yang mati sudah dihapus, dan yang ini pindah ke modul
 * Transaksi karena memang instruksi yang diikuti pembeli untuk membayar
 * pesanannya.
 */
export default function PaymentMethodPanel({ config, onUpdate }: { config: PaymentConfig; onUpdate: (c: PaymentConfig) => void }) {
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
