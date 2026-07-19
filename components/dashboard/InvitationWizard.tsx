'use client'

import { useState, useRef, useCallback } from 'react'
import toast from 'react-hot-toast'
import { Loader2, Check } from 'lucide-react'
import type { Invitation, InvitationData } from '@/lib/types'

interface Props {
  invitation: Invitation
  userId: string
  onSaved: (inv: Invitation) => void
}

const ic = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-rose-400 bg-white placeholder:text-gray-300 transition-all'

function F({ label, required, hint, children }: {
  label: string
  required?: boolean
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-gray-400">{hint}</p>}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-gray-800 pb-2 border-b border-gray-100">{title}</h3>
      {children}
    </div>
  )
}

export default function InvitationWizard({ invitation, onSaved }: Props) {
  const d = invitation.data

  const [form, setForm] = useState<InvitationData>({
    groomName: d.groomName ?? '',
    groomFather: d.groomFather ?? '',
    groomMother: d.groomMother ?? '',
    brideName: d.brideName ?? '',
    brideFather: d.brideFather ?? '',
    brideMother: d.brideMother ?? '',
    akadDate: d.akadDate ?? '',
    akadTime: d.akadTime ?? '08:00',
    akadVenue: d.akadVenue ?? '',
    akadAddress: d.akadAddress ?? '',
    akadMapsUrl: d.akadMapsUrl ?? '',
    resepsiDate: d.resepsiDate ?? '',
    resepsiTime: d.resepsiTime ?? '11:00',
    resepsiVenue: d.resepsiVenue ?? '',
    resepsiAddress: d.resepsiAddress ?? '',
    resepsiMapsUrl: d.resepsiMapsUrl ?? '',
    heroPhotoUrl: d.heroPhotoUrl ?? '',
    musicUrl: d.musicUrl ?? '',
    musicTitle: d.musicTitle ?? '',
    openingText: d.openingText ?? '',
    closingText: d.closingText ?? '',
    giftAddress: d.giftAddress ?? '',
    giftRecipient: d.giftRecipient ?? '',
    giftContact: d.giftContact ?? '',
    paymentBankName: d.paymentBankName ?? '',
    paymentAccountNumber: d.paymentAccountNumber ?? '',
    paymentAccountName: d.paymentAccountName ?? '',
    paymentQris: d.paymentQris ?? '',
    paymentNote: d.paymentNote ?? '',
  })

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const set = useCallback((key: keyof InvitationData, value: string) => {
    setForm(prev => {
      const next = { ...prev, [key]: value }
      clearTimeout(timer.current)
      setSaveStatus('saving')
      timer.current = setTimeout(async () => {
        const res = await fetch(`/api/invitations/${invitation.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: next }),
        })
        if (!res.ok) { toast.error('Gagal menyimpan'); setSaveStatus('idle'); return }
        const { invitation: updated } = await res.json()
        onSaved(updated)
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus('idle'), 2000)
      }, 1000)
      return next
    })
  }, [invitation.id, onSaved])

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Auto-save indicator */}
      <div className={`flex items-center gap-1.5 text-xs h-4 transition-all ${saveStatus === 'idle' ? 'opacity-0' : 'opacity-100'}`}>
        {saveStatus === 'saving' && <><Loader2 size={11} className="animate-spin text-gray-400" /><span className="text-gray-400">Menyimpan...</span></>}
        {saveStatus === 'saved' && <><Check size={11} className="text-green-500" /><span className="text-green-600">Tersimpan</span></>}
      </div>

      {/* Mempelai Pria */}
      <Section title="👤 Mempelai Pria">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <F label="Nama Lengkap" required>
            <input className={ic} value={form.groomName} onChange={e => set('groomName', e.target.value)} placeholder="Ahmad Budi Santoso" />
          </F>
          <div className="sm:col-span-1" />
          <F label="Nama Ayah" required>
            <input className={ic} value={form.groomFather} onChange={e => set('groomFather', e.target.value)} placeholder="Bapak Ahmad" />
          </F>
          <F label="Nama Ibu" required>
            <input className={ic} value={form.groomMother} onChange={e => set('groomMother', e.target.value)} placeholder="Ibu Sri" />
          </F>
        </div>
      </Section>

      {/* Mempelai Wanita */}
      <Section title="👤 Mempelai Wanita">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <F label="Nama Lengkap" required>
            <input className={ic} value={form.brideName} onChange={e => set('brideName', e.target.value)} placeholder="Siti Ani Rahayu" />
          </F>
          <div className="sm:col-span-1" />
          <F label="Nama Ayah" required>
            <input className={ic} value={form.brideFather} onChange={e => set('brideFather', e.target.value)} placeholder="Bapak Hendra" />
          </F>
          <F label="Nama Ibu" required>
            <input className={ic} value={form.brideMother} onChange={e => set('brideMother', e.target.value)} placeholder="Ibu Dewi" />
          </F>
        </div>
      </Section>

      {/* Akad */}
      <Section title="🕌 Akad Nikah">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="col-span-2">
            <F label="Tanggal" required>
              <input type="date" className={ic} value={form.akadDate} onChange={e => set('akadDate', e.target.value)} />
            </F>
          </div>
          <div className="col-span-2">
            <F label="Waktu" required>
              <input type="time" className={ic} value={form.akadTime} onChange={e => set('akadTime', e.target.value)} />
            </F>
          </div>
          <div className="col-span-4">
            <F label="Nama Tempat" required>
              <input className={ic} value={form.akadVenue} onChange={e => set('akadVenue', e.target.value)} placeholder="Masjid Al-Ikhlas" />
            </F>
          </div>
          <div className="col-span-4">
            <F label="Alamat" required>
              <textarea className={`${ic} resize-none`} rows={2} value={form.akadAddress} onChange={e => set('akadAddress', e.target.value)} placeholder="Jl. Mawar No. 12, Jakarta Selatan" />
            </F>
          </div>
          <div className="col-span-4">
            <F label="Link Google Maps" hint="Opsional">
              <input className={ic} value={form.akadMapsUrl} onChange={e => set('akadMapsUrl', e.target.value)} placeholder="https://maps.google.com/..." />
            </F>
          </div>
        </div>
      </Section>

      {/* Resepsi */}
      <Section title="🥂 Resepsi">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="col-span-2">
            <F label="Tanggal" required>
              <input type="date" className={ic} value={form.resepsiDate} onChange={e => set('resepsiDate', e.target.value)} />
            </F>
          </div>
          <div className="col-span-2">
            <F label="Waktu" required>
              <input type="time" className={ic} value={form.resepsiTime} onChange={e => set('resepsiTime', e.target.value)} />
            </F>
          </div>
          <div className="col-span-4">
            <F label="Nama Tempat" required>
              <input className={ic} value={form.resepsiVenue} onChange={e => set('resepsiVenue', e.target.value)} placeholder="Ballroom Hotel Grand Sahid" />
            </F>
          </div>
          <div className="col-span-4">
            <F label="Alamat" required>
              <textarea className={`${ic} resize-none`} rows={2} value={form.resepsiAddress} onChange={e => set('resepsiAddress', e.target.value)} placeholder="Jl. Sudirman No. 86, Jakarta Pusat" />
            </F>
          </div>
          <div className="col-span-4">
            <F label="Link Google Maps" hint="Opsional">
              <input className={ic} value={form.resepsiMapsUrl} onChange={e => set('resepsiMapsUrl', e.target.value)} placeholder="https://maps.google.com/..." />
            </F>
          </div>
        </div>
      </Section>

      {/* Pesan & Teks */}
      <Section title="✍️ Teks Undangan">
        <F label="Kalimat Pembuka" hint="Tampil di atas nama mempelai">
          <textarea className={`${ic} resize-none`} rows={2} value={form.openingText ?? ''} onChange={e => set('openingText', e.target.value)} placeholder="Dengan memohon rahmat dan ridho Allah SWT..." />
        </F>
        <F label="Kalimat Penutup">
          <textarea className={`${ic} resize-none`} rows={2} value={form.closingText ?? ''} onChange={e => set('closingText', e.target.value)} placeholder="Merupakan suatu kehormatan atas kehadiran Bapak/Ibu..." />
        </F>
      </Section>

      {/* Hadiah */}
      <Section title="🎁 Amplop & Hadiah">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <F label="Alamat Kirim Hadiah">
            <input className={ic} value={form.giftAddress ?? ''} onChange={e => set('giftAddress', e.target.value)} placeholder="Jl. Melati No. 5, Jakarta" />
          </F>
          <F label="Nama Penerima">
            <input className={ic} value={form.giftRecipient ?? ''} onChange={e => set('giftRecipient', e.target.value)} placeholder="Bapak & Ibu Ahmad" />
          </F>
          <F label="Kontak Penerima">
            <input className={ic} value={form.giftContact ?? ''} onChange={e => set('giftContact', e.target.value)} placeholder="0812-3456-7890" />
          </F>
        </div>

        <div className="pt-2 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Transfer Bank</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <F label="Nama Bank">
              <input className={ic} value={form.paymentBankName ?? ''} onChange={e => set('paymentBankName', e.target.value)} placeholder="BCA / Mandiri / BNI" />
            </F>
            <F label="Nomor Rekening">
              <input className={ic} value={form.paymentAccountNumber ?? ''} onChange={e => set('paymentAccountNumber', e.target.value)} placeholder="1234567890" />
            </F>
            <F label="Atas Nama">
              <input className={ic} value={form.paymentAccountName ?? ''} onChange={e => set('paymentAccountName', e.target.value)} placeholder="Nama pemilik rekening" />
            </F>
            <F label="Link QRIS / Catatan">
              <input className={ic} value={form.paymentQris ?? ''} onChange={e => set('paymentQris', e.target.value)} placeholder="https://..." />
            </F>
          </div>
        </div>
      </Section>
    </div>
  )
}
