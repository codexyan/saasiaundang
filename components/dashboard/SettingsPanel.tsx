'use client'

import { useState } from 'react'
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Invitation } from '@/lib/types'
import { Button } from '@/components/ui/Button'

interface Props {
  invitation: Invitation
  userEmail?: string
  onDeleted?: () => void
}

export default function SettingsPanel({ invitation, userEmail, onDeleted }: Props) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  const slug = invitation.slug

  async function handleDelete() {
    if (confirmText !== slug) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/invitations/${invitation.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Gagal dihapus. Coba lagi ya.')
      toast.success('Undangannya sudah dihapus.')
      onDeleted?.()
    } catch {
      toast.error('Undangannya gagal dihapus. Coba lagi ya.')
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-rose-500 font-semibold">Pengaturan</p>
            <h2 className="mt-2 text-2xl font-semibold text-gray-900">Kelola akun & undangan</h2>
            <p className="mt-2 text-sm text-gray-500 max-w-2xl">Pengaturan dasar untuk undangan Anda dan preferensi dashboard.</p>
          </div>
          <div className="rounded-3xl bg-gray-50 px-4 py-3 text-sm text-gray-600">
            Slug: <span className="font-medium text-gray-900">{slug}.iaundang.online</span>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm font-semibold text-gray-900">Preferensi notifikasi</p>
            <p className="text-sm text-gray-500 mt-2">Aktifkan notifikasi email untuk pembaruan undangan dan transaksi.</p>
            <div className="mt-4 flex items-center justify-between rounded-2xl bg-white border border-gray-200 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">Email notifikasi</p>
                <p className="text-xs text-gray-500">Pesan akan dikirim ke alamat email akun Anda.</p>
              </div>
              <Button variant="secondary" size="sm">Ubah</Button>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm font-semibold text-gray-900">Akun pengguna</p>
            <p className="text-sm text-gray-500 mt-2">Kelola akses dan informasi dasar akun.</p>
            <div className="mt-4 rounded-2xl bg-white border border-gray-200 p-4">
              <p className="text-xs text-gray-400">Email login</p>
              <p className="mt-1 font-medium text-gray-900">{userEmail || 'Tidak tersedia'}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-gray-200 bg-white p-5">
          <p className="text-sm font-semibold text-gray-900">Informasi undangan</p>
          <p className="text-sm text-gray-500 mt-2">Slug undangan ini akan digunakan di semua modul terkait.</p>
          <div className="mt-4 rounded-2xl bg-gray-50 border border-gray-200 p-4">
            <p className="text-xs text-gray-500">Link undangan</p>
            <p className="text-sm font-medium text-gold-600 mt-1">https://{slug}.iaundang.online</p>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">Alamat Hadiah</p>
              <p className="text-sm text-gray-500 mt-2">Tempat pengiriman hadiah dan nomor kontak penerima.</p>
            </div>
            <Button variant="secondary" size="sm">Ubah</Button>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4">
              <p className="text-xs text-gray-500">Alamat</p>
              <p className="mt-1 text-sm text-gray-700">{invitation.data.giftAddress || 'Belum diatur'}</p>
            </div>
            <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4">
              <p className="text-xs text-gray-500">Penerima</p>
              <p className="mt-1 text-sm text-gray-700">{invitation.data.giftRecipient || 'Belum diatur'}</p>
              <p className="text-xs text-gray-500 mt-1">{invitation.data.giftContact || 'No. WA belum diatur'}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">Transfer / QRIS</p>
              <p className="text-sm text-gray-500 mt-2">Berikan informasi rekening atau QRIS yang bisa dipakai tamu yang tidak bisa hadir.</p>
            </div>
            <Button variant="secondary" size="sm">Ubah</Button>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4">
              <p className="text-xs text-gray-500">Bank / QRIS</p>
              <p className="mt-1 text-sm text-gray-700">{invitation.data.paymentBankName || invitation.data.paymentQris || 'Belum diatur'}</p>
            </div>
            <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4">
              <p className="text-xs text-gray-500">Rekening</p>
              <p className="mt-1 text-sm text-gray-700">{invitation.data.paymentAccountNumber || 'Belum diatur'}</p>
              <p className="text-xs text-gray-500 mt-1">{invitation.data.paymentAccountName || ''}</p>
            </div>
          </div>
          {invitation.data.paymentNote && (
            <div className="mt-4 rounded-2xl bg-gray-50 border border-gray-200 p-4 text-sm text-gray-600">
              {invitation.data.paymentNote}
            </div>
          )}
        </div>
      </div>

      {/* Zona Bahaya */}
      <div className="rounded-3xl border border-red-200 bg-red-50/50 p-6">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle size={16} className="text-red-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-800">Zona Bahaya</p>
            <p className="text-sm text-red-600/70 mt-1 leading-relaxed">
              Menghapus undangan bersifat permanen. Semua data termasuk galeri foto, daftar tamu, RSVP, ucapan, dan bukti transfer akan ikut terhapus dan tidak bisa dikembalikan.
            </p>
            <button
              onClick={() => setShowDeleteDialog(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-600 bg-red-100 hover:bg-red-200 border border-red-200 hover:border-red-300 transition-all"
            >
              <Trash2 size={14} />
              Hapus Undangan
            </button>
          </div>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => !deleting && setShowDeleteDialog(false)}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle size={18} className="text-red-500" />
              </div>
              <div>
                <p className="text-base font-semibold text-gray-900">Hapus undangan?</p>
                <p className="text-xs text-gray-500">Tindakan ini tidak bisa dibatalkan</p>
              </div>
            </div>

            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              Semua data undangan <span className="font-semibold text-gray-900">{slug}</span> akan dihapus permanen, termasuk galeri, daftar tamu, RSVP, ucapan, dan bukti transfer.
            </p>

            <div className="mb-5">
              <p className="text-xs text-gray-500 mb-2">
                Ketik <span className="font-mono font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">{slug}</span> untuk konfirmasi:
              </p>
              <input
                type="text"
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                placeholder={slug}
                disabled={deleting}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent placeholder:text-gray-300 disabled:opacity-50"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => { setShowDeleteDialog(false); setConfirmText('') }}
                disabled={deleting}
                className="flex-1"
              >
                Batal
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                disabled={confirmText !== slug || deleting}
                className="flex-1"
              >
                {deleting ? (
                  <><Loader2 size={14} className="animate-spin" /> Menghapus...</>
                ) : (
                  <><Trash2 size={14} /> Hapus Permanen</>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
