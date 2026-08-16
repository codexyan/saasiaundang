'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  Heart, CalendarDays, MapPin, BookOpen, Gift, Link2,
  ChevronLeft, ChevronRight, Check, Loader2, Copy, Eye,
  Camera, Clock, Phone, User, Users,
} from 'lucide-react'
import type { Invitation, NewInvitationData, GiftAccount } from '@/lib/types'

interface Props {
  invitation: Invitation
  onSaved: (inv: Invitation) => void
}

//  Types 

type WizardData = {
  groom_name: string
  bride_name: string
  groom_parents: string
  bride_parents: string
  tagline: string
  couple_photo_url: string
  akad_date: string
  akad_time: string
  akad_venue: string
  akad_address: string
  akad_maps_url: string
  resepsi_date: string
  resepsi_time: string
  resepsi_venue: string
  resepsi_address: string
  resepsi_maps_url: string
  story_title: string
  story_text: string
  closing_text: string
  gift_accounts: GiftAccount[]
}

//  Helpers 

function initFromInvitation(inv: Invitation): WizardData {
  const d = inv.data as unknown as NewInvitationData
  return {
    groom_name: d.groom_name ?? '',
    bride_name: d.bride_name ?? '',
    groom_parents: d.groom_parents ?? '',
    bride_parents: d.bride_parents ?? '',
    tagline: d.tagline ?? '',
    couple_photo_url: d.couple_photo_url ?? '',
    akad_date: d.akad?.date ?? '',
    akad_time: d.akad?.time ?? '08:00',
    akad_venue: d.akad?.venue_name ?? '',
    akad_address: d.akad?.venue_address ?? '',
    akad_maps_url: d.akad?.maps_url ?? '',
    resepsi_date: d.resepsi?.date ?? '',
    resepsi_time: d.resepsi?.time ?? '11:00',
    resepsi_venue: d.resepsi?.venue_name ?? '',
    resepsi_address: d.resepsi?.venue_address ?? '',
    resepsi_maps_url: d.resepsi?.maps_url ?? '',
    story_title: d.story_title ?? '',
    story_text: d.story_text ?? '',
    closing_text: d.closing_text ?? '',
    gift_accounts: d.gift_accounts ?? [],
  }
}

function toNewInvitationData(w: WizardData): NewInvitationData {
  return {
    groom_name: w.groom_name,
    bride_name: w.bride_name,
    groom_parents: w.groom_parents || undefined,
    bride_parents: w.bride_parents || undefined,
    tagline: w.tagline || undefined,
    couple_photo_url: w.couple_photo_url || undefined,
    akad: w.akad_venue ? {
      date: w.akad_date,
      time: w.akad_time,
      venue_name: w.akad_venue,
      venue_address: w.akad_address,
      maps_url: w.akad_maps_url || undefined,
    } : undefined,
    resepsi: w.resepsi_venue ? {
      date: w.resepsi_date,
      time: w.resepsi_time,
      venue_name: w.resepsi_venue,
      venue_address: w.resepsi_address,
      maps_url: w.resepsi_maps_url || undefined,
    } : undefined,
    story_title: w.story_title || undefined,
    story_text: w.story_text || undefined,
    closing_text: w.closing_text || undefined,
    gift_accounts: w.gift_accounts.length > 0 ? w.gift_accounts : undefined,
  }
}

//  Step config 

const STEPS = [
  { id: 'couple',  label: 'Pasangan',    icon: Heart,       color: 'from-rose-500 to-pink-600' },
  { id: 'akad',    label: 'Akad Nikah',  icon: CalendarDays, color: 'from-amber-500 to-orange-500' },
  { id: 'resepsi', label: 'Resepsi',     icon: MapPin,      color: 'from-emerald-500 to-teal-600' },
  { id: 'kisah',   label: 'Kisah & Hadiah', icon: BookOpen, color: 'from-violet-500 to-purple-600' },
  { id: 'selesai', label: 'Simpan',      icon: Check,       color: 'from-rose-600 to-rose-700' },
]

//  Shared input components 

function Field({
  label, hint, required, error, children,
}: { label: string; hint?: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

const inputCls = 'w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent bg-white transition-all placeholder:text-gray-300'

//  Main Component 

export default function NewInvitationWizard({ invitation, onSaved }: Props) {
  const [step, setStep] = useState(0)
  const [data, setData] = useState<WizardData>(() => initFromInvitation(invitation))
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof WizardData, string>>>({})
  const [direction, setDirection] = useState<1 | -1>(1)

  const set = useCallback((field: keyof WizardData, value: unknown) => {
    setData(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: undefined }))
  }, [])

  // Auto-save with debounce after each step change
  async function save(showToast = false): Promise<boolean> {
    setSaving(true)
    const res = await fetch(`/api/invitations/${invitation.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: toNewInvitationData(data) }),
    })
    setSaving(false)
    if (!res.ok) {
      toast.error('Perubahannya gagal disimpan. Coba lagi ya.')
      return false
    }
    const { invitation: updated } = await res.json()
    if (showToast) toast.success('Sudah tersimpan!')
    onSaved(updated as Invitation)
    return true
  }

  function validateStep0(): boolean {
    const e: Partial<Record<keyof WizardData, string>> = {}
    if (!data.groom_name.trim()) e.groom_name = 'Nama mempelai pria wajib diisi'
    if (!data.bride_name.trim()) e.bride_name = 'Nama mempelai wanita wajib diisi'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function validateStep1(): boolean {
    const e: Partial<Record<keyof WizardData, string>> = {}
    if (!data.akad_date) e.akad_date = 'Tanggal akad wajib diisi'
    if (!data.akad_venue.trim()) e.akad_venue = 'Tempat akad wajib diisi'
    if (!data.akad_address.trim()) e.akad_address = 'Alamat akad wajib diisi'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function validateStep2(): boolean {
    const e: Partial<Record<keyof WizardData, string>> = {}
    if (!data.resepsi_date) e.resepsi_date = 'Tanggal resepsi wajib diisi'
    if (!data.resepsi_venue.trim()) e.resepsi_venue = 'Tempat resepsi wajib diisi'
    if (!data.resepsi_address.trim()) e.resepsi_address = 'Alamat resepsi wajib diisi'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function goNext() {
    const validators = [validateStep0, validateStep1, validateStep2, () => true]
    if (step < validators.length && !validators[step]()) return
    await save()
    setDirection(1)
    setStep(s => Math.min(s + 1, STEPS.length - 1))
  }

  async function goPrev() {
    await save()
    setDirection(-1)
    setStep(s => Math.max(s - 1, 0))
  }

  async function handleFinish() {
    const ok = await save(true)
    if (ok) setStep(STEPS.length - 1)
  }

  const progress = ((step) / (STEPS.length - 1)) * 100

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header card */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm mb-4">
        {/* Gradient progress bar */}
        <div className="h-1.5 bg-gray-100">
          <motion.div
            className="h-full bg-gradient-to-r from-rose-500 to-pink-400"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>

        {/* Step indicator */}
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            {STEPS.map((s, i) => {
              const Icon = s.icon
              const done = i < step
              const active = i === step
              return (
                <div key={s.id} className="flex items-center gap-1 sm:gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      done
                        ? 'bg-gold-500 text-white'
                        : active
                        ? `bg-gradient-to-br ${s.color} text-white shadow-lg shadow-rose-200`
                        : 'bg-gray-100 text-gray-300'
                    }`}
                  >
                    {done ? <Check size={14} /> : <Icon size={14} />}
                  </div>
                  <span
                    className={`hidden sm:block text-xs font-medium transition-colors ${
                      active ? 'text-gray-900' : done ? 'text-rose-500' : 'text-gray-300'
                    }`}
                  >
                    {s.label}
                  </span>
                  {i < STEPS.length - 1 && (
                    <div
                      className={`hidden sm:block w-8 h-px ml-1 transition-colors ${i < step ? 'bg-rose-300' : 'bg-gray-100'}`}
                    />
                  )}
                </div>
              )
            })}
          </div>
          <div className="text-xs text-gray-400 shrink-0">
            {step + 1} / {STEPS.length}
          </div>
        </div>
      </div>

      {/* Main card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Step hero */}
        <div className={`bg-gradient-to-br ${STEPS[step].color} px-6 py-5 text-white`}>
          <div className="flex items-center gap-3">
            {(() => { const Icon = STEPS[step].icon; return <Icon size={22} /> })()}
            <div>
              <h2 className="font-bold text-lg leading-none">{STEPS[step].label}</h2>
              <p className="text-white/70 text-sm mt-0.5">
                {step === 0 && 'Nama dan informasi mempelai'}
                {step === 1 && 'Detail waktu dan tempat akad nikah'}
                {step === 2 && 'Detail waktu dan tempat resepsi'}
                {step === 3 && 'Kisah cinta dan info hadiah'}
                {step === 4 && 'Review dan simpan undangan'}
              </p>
            </div>
          </div>
        </div>

        {/* Step content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: direction * 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -30 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              {step === 0 && <StepCouple data={data} set={set} errors={errors} />}
              {step === 1 && <StepAkad data={data} set={set} errors={errors} />}
              {step === 2 && <StepResepsi data={data} set={set} errors={errors} />}
              {step === 3 && <StepKisah data={data} set={set} />}
              {step === 4 && <StepSelesai data={data} invitation={invitation} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer navigation */}
        <div className="px-6 pb-6 flex items-center justify-between gap-3 border-t border-gray-50 pt-4">
          <button
            onClick={goPrev}
            disabled={step === 0 || saving}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={16} />
            Kembali
          </button>

          <div className="flex items-center gap-2">
            {saving && (
              <span className="flex items-center gap-1.5 text-xs text-gray-400">
                <Loader2 size={12} className="animate-spin" />
                Menyimpan...
              </span>
            )}
            {step < STEPS.length - 2 ? (
              <button
                onClick={goNext}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-gold-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-colors shadow-sm"
              >
                Lanjut
                <ChevronRight size={16} />
              </button>
            ) : step === STEPS.length - 2 ? (
              <button
                onClick={handleFinish}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-all shadow-md"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                Simpan Undangan
              </button>
            ) : (
              <a
                href={`/invitation/${invitation.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-2.5 bg-gold-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
              >
                <Eye size={16} />
                Lihat Undangan
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

//  Step 0: Couple 

function StepCouple({ data, set, errors }: { data: WizardData; set: (k: keyof WizardData, v: unknown) => void; errors: Partial<Record<keyof WizardData, string>> }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Mempelai Pria */}
        <div className="space-y-4 p-5 rounded-2xl bg-blue-50 border border-blue-100">
          <div className="flex items-center gap-2 text-blue-700 font-semibold text-sm">
            <User size={15} /> Mempelai Pria
          </div>
          <Field label="Nama Lengkap" required error={errors.groom_name}>
            <input
              className={inputCls}
              placeholder="Ahmad Budi Santoso"
              value={data.groom_name}
              onChange={e => set('groom_name', e.target.value)}
            />
          </Field>
          <Field label="Nama Orang Tua" hint="Format: Bpk. X & Ibu Y">
            <input
              className={inputCls}
              placeholder="Bpk. Ahmad & Ibu Sri"
              value={data.groom_parents}
              onChange={e => set('groom_parents', e.target.value)}
            />
          </Field>
        </div>

        {/* Mempelai Wanita */}
        <div className="space-y-4 p-5 rounded-2xl bg-gold-50 border border-rose-100">
          <div className="flex items-center gap-2 text-gold-600 font-semibold text-sm">
            <User size={15} /> Mempelai Wanita
          </div>
          <Field label="Nama Lengkap" required error={errors.bride_name}>
            <input
              className={inputCls}
              placeholder="Siti Ani Rahayu"
              value={data.bride_name}
              onChange={e => set('bride_name', e.target.value)}
            />
          </Field>
          <Field label="Nama Orang Tua" hint="Format: Bpk. X & Ibu Y">
            <input
              className={inputCls}
              placeholder="Bpk. Hendra & Ibu Dewi"
              value={data.bride_parents}
              onChange={e => set('bride_parents', e.target.value)}
            />
          </Field>
        </div>
      </div>

      <div className="space-y-4">
        <Field label="Kutipan / Tagline" hint="Ayat Al-Quran, hadits, atau kata-kata indah (opsional)">
          <textarea
            className={`${inputCls} resize-none`}
            rows={2}
            placeholder="Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu pasangan-pasangan... (QS Ar-Rum: 21)"
            value={data.tagline}
            onChange={e => set('tagline', e.target.value)}
          />
        </Field>

        <Field label="Foto Pasangan" hint="URL foto (Google Drive, Imgur, dll). Kosongkan jika belum ada.">
          <div className="flex gap-2">
            <input
              className={inputCls}
              placeholder="https://drive.google.com/..."
              value={data.couple_photo_url}
              onChange={e => set('couple_photo_url', e.target.value)}
            />
            {data.couple_photo_url && (
              <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200 shrink-0">
                <img src={data.couple_photo_url} alt="Preview" className="w-full h-full object-cover" onError={e => { e.currentTarget.style.display = 'none' }} />
              </div>
            )}
          </div>
        </Field>
      </div>

      {/* Preview chip */}
      {(data.groom_name || data.bride_name) && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-100 rounded-2xl px-5 py-4"
        >
          <Heart size={18} className="text-rose-400 shrink-0" />
          <p className="text-sm text-gray-600">
            Undangan dari{' '}
            <span className="font-bold text-gray-900">{data.groom_name || '…'}</span>
            <span className="text-rose-400 mx-1">&</span>
            <span className="font-bold text-gray-900">{data.bride_name || '…'}</span>
          </p>
        </motion.div>
      )}
    </div>
  )
}

//  Step 1: Akad 

function StepAkad({ data, set, errors }: { data: WizardData; set: (k: keyof WizardData, v: unknown) => void; errors: Partial<Record<keyof WizardData, string>> }) {
  return (
    <div className="space-y-5">
      <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 text-sm text-amber-800 flex items-start gap-2">
        <CalendarDays size={16} className="mt-0.5 shrink-0 text-amber-500" />
        <span>Akad nikah biasanya dilaksanakan di pagi hari, sebelum resepsi.</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Tanggal Akad" required error={errors.akad_date}>
          <input type="date" className={inputCls} value={data.akad_date} onChange={e => set('akad_date', e.target.value)} />
        </Field>
        <Field label="Waktu Mulai" required>
          <input type="time" className={inputCls} value={data.akad_time} onChange={e => set('akad_time', e.target.value)} />
        </Field>
      </div>

      <Field label="Nama Tempat / Gedung" required error={errors.akad_venue}>
        <input className={inputCls} placeholder="Masjid Al-Ikhlas" value={data.akad_venue} onChange={e => set('akad_venue', e.target.value)} />
      </Field>

      <Field label="Alamat Lengkap" required error={errors.akad_address}>
        <textarea
          className={`${inputCls} resize-none`}
          rows={2}
          placeholder="Jl. Mawar No. 12, Kebayoran Baru, Jakarta Selatan"
          value={data.akad_address}
          onChange={e => set('akad_address', e.target.value)}
        />
      </Field>

      <Field label="Link Google Maps" hint="Tempel URL dari Google Maps (opsional)">
        <input
          className={inputCls}
          placeholder="https://maps.google.com/..."
          value={data.akad_maps_url}
          onChange={e => set('akad_maps_url', e.target.value)}
        />
      </Field>

      {data.akad_venue && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex gap-3 items-start bg-amber-50 border border-amber-100 rounded-2xl p-4"
        >
          <MapPin size={16} className="text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-gray-800">{data.akad_venue}</p>
            <p className="text-xs text-gray-500 mt-0.5">{data.akad_address}</p>
            {data.akad_date && (
              <p className="text-xs text-amber-600 mt-1 font-medium">
                {new Date(data.akad_date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                {data.akad_time && ` · ${data.akad_time} WIB`}
              </p>
            )}
          </div>
        </motion.div>
      )}
    </div>
  )
}

//  Step 2: Resepsi 

function StepResepsi({ data, set, errors }: { data: WizardData; set: (k: keyof WizardData, v: unknown) => void; errors: Partial<Record<keyof WizardData, string>> }) {
  return (
    <div className="space-y-5">
      <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-sm text-emerald-800 flex items-start gap-2">
        <Users size={16} className="mt-0.5 shrink-0 text-emerald-500" />
        <span>Resepsi adalah pesta pernikahan yang mengundang tamu lebih luas.</span>
      </div>

      {/* Same date toggle */}
      <label className="flex items-center gap-3 cursor-pointer select-none">
        <input
          type="checkbox"
          className="w-4 h-4 rounded accent-rose-500"
          checked={data.resepsi_date === data.akad_date && !!data.akad_date}
          onChange={e => {
            if (e.target.checked) {
              set('resepsi_date', data.akad_date)
            }
          }}
        />
        <span className="text-sm text-gray-600">Tanggal sama dengan akad (<span className="text-gray-800 font-medium">{data.akad_date || '...'}</span>)</span>
      </label>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Tanggal Resepsi" required error={errors.resepsi_date}>
          <input type="date" className={inputCls} value={data.resepsi_date} onChange={e => set('resepsi_date', e.target.value)} />
        </Field>
        <Field label="Waktu Mulai" required>
          <input type="time" className={inputCls} value={data.resepsi_time} onChange={e => set('resepsi_time', e.target.value)} />
        </Field>
      </div>

      <Field label="Nama Tempat / Gedung" required error={errors.resepsi_venue}>
        <input className={inputCls} placeholder="Ballroom Hotel Grand Sahid" value={data.resepsi_venue} onChange={e => set('resepsi_venue', e.target.value)} />
      </Field>

      <Field label="Alamat Lengkap" required error={errors.resepsi_address}>
        <textarea
          className={`${inputCls} resize-none`}
          rows={2}
          placeholder="Jl. Jend. Sudirman No. 86, Jakarta Pusat"
          value={data.resepsi_address}
          onChange={e => set('resepsi_address', e.target.value)}
        />
      </Field>

      <Field label="Link Google Maps" hint="Opsional">
        <input
          className={inputCls}
          placeholder="https://maps.google.com/..."
          value={data.resepsi_maps_url}
          onChange={e => set('resepsi_maps_url', e.target.value)}
        />
      </Field>

      {data.resepsi_venue && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex gap-3 items-start bg-emerald-50 border border-emerald-100 rounded-2xl p-4"
        >
          <MapPin size={16} className="text-emerald-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-gray-800">{data.resepsi_venue}</p>
            <p className="text-xs text-gray-500 mt-0.5">{data.resepsi_address}</p>
            {data.resepsi_date && (
              <p className="text-xs text-emerald-600 mt-1 font-medium">
                {new Date(data.resepsi_date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                {data.resepsi_time && ` · ${data.resepsi_time} WIB`}
              </p>
            )}
          </div>
        </motion.div>
      )}
    </div>
  )
}

//  Step 3: Kisah & Hadiah 

function StepKisah({ data, set }: { data: WizardData; set: (k: keyof WizardData, v: unknown) => void }) {
  const [newAccount, setNewAccount] = useState<GiftAccount>({ type: 'bank', bank: '', number: '', name: '' })
  const [addingAccount, setAddingAccount] = useState(false)

  function addGiftAccount() {
    if (!newAccount.number || !newAccount.name) return
    set('gift_accounts', [...data.gift_accounts, newAccount])
    setNewAccount({ type: 'bank', bank: '', number: '', name: '' })
    setAddingAccount(false)
  }

  function removeAccount(i: number) {
    set('gift_accounts', data.gift_accounts.filter((_, idx) => idx !== i))
  }

  return (
    <div className="space-y-6">
      {/* Kisah */}
      <div>
        <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
          <BookOpen size={15} className="text-violet-500" /> Kisah Cinta (opsional)
        </h3>
        <div className="space-y-3">
          <Field label="Judul Kisah">
            <input className={inputCls} placeholder="Kisah Kami" value={data.story_title} onChange={e => set('story_title', e.target.value)} />
          </Field>
          <Field label="Cerita Singkat" hint={`${data.story_text.length}/500 karakter`}>
            <textarea
              className={`${inputCls} resize-none`}
              rows={4}
              maxLength={500}
              placeholder="Kami pertama kali bertemu di..."
              value={data.story_text}
              onChange={e => set('story_text', e.target.value)}
            />
          </Field>
        </div>
      </div>

      {/* Hadiah */}
      <div>
        <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
          <Gift size={15} className="text-violet-500" /> Amplop Digital (opsional)
        </h3>

        {data.gift_accounts.length > 0 && (
          <div className="space-y-2 mb-3">
            {data.gift_accounts.map((acc, i) => (
              <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3 text-sm">
                <div className="flex-1">
                  <span className="text-xs text-gray-400 uppercase tracking-wide">
                    {acc.type === 'bank' ? acc.bank : acc.platform}
                  </span>
                  <p className="font-mono font-semibold text-gray-800">{acc.number}</p>
                  <p className="text-xs text-gray-500">a.n. {acc.name}</p>
                </div>
                <button onClick={() => removeAccount(i)} className="text-gray-300 hover:text-red-400 transition-colors text-xs">
                  Hapus
                </button>
              </div>
            ))}
          </div>
        )}

        {addingAccount ? (
          <div className="border border-violet-200 rounded-2xl p-4 space-y-3 bg-violet-50">
            <div className="flex gap-2">
              {['bank', 'ewallet'].map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setNewAccount(a => ({ ...a, type: t as 'bank' | 'ewallet' }))}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${newAccount.type === t ? 'bg-violet-600 text-white' : 'bg-white border border-gray-200 text-gray-500'}`}
                >
                  {t === 'bank' ? '🏦 Bank' : '📱 E-Wallet'}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label={newAccount.type === 'bank' ? 'Nama Bank' : 'Platform'}>
                <input
                  className={inputCls}
                  placeholder={newAccount.type === 'bank' ? 'BCA, Mandiri...' : 'GoPay, OVO...'}
                  value={newAccount.type === 'bank' ? (newAccount.bank ?? '') : (newAccount.platform ?? '')}
                  onChange={e => setNewAccount(a => newAccount.type === 'bank' ? { ...a, bank: e.target.value } : { ...a, platform: e.target.value })}
                />
              </Field>
              <Field label="No. Rekening / No. HP">
                <input
                  className={inputCls}
                  placeholder="1234567890"
                  value={newAccount.number}
                  onChange={e => setNewAccount(a => ({ ...a, number: e.target.value }))}
                />
              </Field>
            </div>
            <Field label="Nama Pemilik">
              <input
                className={inputCls}
                placeholder="Nama lengkap"
                value={newAccount.name}
                onChange={e => setNewAccount(a => ({ ...a, name: e.target.value }))}
              />
            </Field>
            <div className="flex gap-2">
              <button onClick={addGiftAccount} className="flex-1 py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 transition-colors">
                Tambah
              </button>
              <button onClick={() => setAddingAccount(false)} className="px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700">
                Batal
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAddingAccount(true)}
            className="w-full py-3 border-2 border-dashed border-gray-200 rounded-2xl text-sm text-gray-400 hover:border-violet-300 hover:text-violet-500 transition-all"
          >
            + Tambah Rekening / E-Wallet
          </button>
        )}
      </div>

      {/* Penutup */}
      <div>
        <h3 className="text-sm font-bold text-gray-700 mb-3">Kalimat Penutup (opsional)</h3>
        <textarea
          className={`${inputCls} resize-none`}
          rows={3}
          placeholder="Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir..."
          value={data.closing_text}
          onChange={e => set('closing_text', e.target.value)}
        />
      </div>
    </div>
  )
}

//  Step 4: Selesai 

function StepSelesai({ data, invitation }: { data: WizardData; invitation: Invitation }) {
  const invUrl = `${invitation.slug}.iaundang.online`

  const completedFields = [
    { label: 'Nama Mempelai', done: !!(data.groom_name && data.bride_name) },
    { label: 'Akad Nikah', done: !!(data.akad_date && data.akad_venue) },
    { label: 'Resepsi', done: !!(data.resepsi_date && data.resepsi_venue) },
    { label: 'Foto Pasangan', done: !!data.couple_photo_url },
    { label: 'Kisah Cinta', done: !!data.story_text },
    { label: 'Amplop Digital', done: data.gift_accounts.length > 0 },
  ]

  const completedCount = completedFields.filter(f => f.done).length

  return (
    <div className="space-y-6">
      {/* Completion ring */}
      <div className="flex flex-col items-center py-4">
        <div className="relative w-28 h-28">
          <svg className="w-28 h-28 -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f3f4f6" strokeWidth="3" />
            <motion.circle
              cx="18" cy="18" r="15.9" fill="none"
              stroke="#e11d48" strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="100"
              initial={{ strokeDashoffset: 100 }}
              animate={{ strokeDashoffset: 100 - (completedCount / completedFields.length) * 100 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-gray-900">{completedCount}</span>
            <span className="text-xs text-gray-400">dari {completedFields.length}</span>
          </div>
        </div>
        <p className="mt-3 text-gray-600 text-sm font-medium">
          {completedCount === completedFields.length ? '🎉 Undangan lengkap!' : `${completedFields.length - completedCount} bagian lagi untuk sempurna`}
        </p>
      </div>

      {/* Checklist */}
      <div className="grid grid-cols-2 gap-2">
        {completedFields.map(({ label, done }) => (
          <div
            key={label}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm ${done ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-400'}`}
          >
            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${done ? 'bg-green-500' : 'bg-gray-200'}`}>
              {done ? <Check size={11} className="text-white" /> : <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />}
            </div>
            {label}
          </div>
        ))}
      </div>

      {/* Link undangan */}
      <div className="bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-100 rounded-2xl p-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Link Undangan Kamu</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-white border border-gold-200 rounded-xl px-4 py-2.5 flex items-center gap-2">
            <Link2 size={14} className="text-rose-400 shrink-0" />
            <span className="text-sm font-mono font-semibold text-gray-800 truncate">{invUrl}</span>
          </div>
          <button
            onClick={() => { navigator.clipboard.writeText(`https://${invUrl}`); toast.success('Tautan undangan sudah disalin!') }}
            className="p-2.5 bg-white border border-gold-200 rounded-xl text-rose-400 hover:text-gold-600 transition-colors"
          >
            <Copy size={16} />
          </button>
        </div>
      </div>

      {/* Quick tips */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tips Selanjutnya</p>
        {[
          { icon: '🖼️', text: 'Upload foto galeri di tab Galeri' },
          { icon: '🎵', text: 'Tambahkan musik latar di tab Musik' },
          { icon: '📢', text: 'Publish undangan agar bisa diakses tamu' },
        ].map(t => (
          <div key={t.text} className="flex items-center gap-3 text-sm text-gray-600">
            <span>{t.icon}</span>
            <span>{t.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
