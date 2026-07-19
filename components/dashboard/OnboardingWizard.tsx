'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  ArrowRight, ArrowLeft, Check, Loader2,
  MapPin, Calendar, Clock, Link2, User, Users, ExternalLink,
  Crown, Sparkles, Leaf,
} from 'lucide-react'
import type { Invitation } from '@/lib/types'
import { generateSlugSuggestions } from '@/lib/slug-generator'
import { PACKAGES, PACKAGE_LIST, formatPrice, type PackageTier } from '@/lib/packages'
import type { TemplateInfo } from './DashboardClient'

interface FormData {
  templateId: string
  packageTier: PackageTier
  groomName: string
  brideName: string
  slug: string
  akadDate: string
  akadTime: string
  akadVenue: string
  akadAddress: string
  akadMaps: string
  resepsiDate: string
  resepsiTime: string
  resepsiVenue: string
  resepsiAddress: string
  resepsiMaps: string
}

interface Props {
  onInvitationCreated: (inv: Invitation) => void
  invitation?: Invitation | null
  allTemplates: TemplateInfo[]
}

const STEPS_WITH_TEMPLATE = [
  { id: 1, label: 'Template' },
  { id: 2, label: 'Paket' },
  { id: 3, label: 'Nama & Link' },
  { id: 4, label: 'Acara' },
  { id: 5, label: 'Konfirmasi' },
]

const STEPS_WITHOUT_TEMPLATE = [
  { id: 1, label: 'Paket' },
  { id: 2, label: 'Nama & Link' },
  { id: 3, label: 'Acara' },
  { id: 4, label: 'Konfirmasi' },
]

export default function OnboardingWizard({ onInvitationCreated, allTemplates }: Props) {
  return <Wizard onInvitationCreated={onInvitationCreated} allTemplates={allTemplates} />
}

type StepKey = 'template' | 'package' | 'names' | 'acara' | 'konfirmasi'

function Wizard({ onInvitationCreated, allTemplates }: { onInvitationCreated: (inv: Invitation) => void; allTemplates: TemplateInfo[] }) {
  const showTemplateStep = allTemplates.length > 1
  const STEPS = showTemplateStep ? STEPS_WITH_TEMPLATE : STEPS_WITHOUT_TEMPLATE
  const stepKeys: StepKey[] = showTemplateStep
    ? ['template', 'package', 'names', 'acara', 'konfirmasi']
    : ['package', 'names', 'acara', 'konfirmasi']

  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const defaultTemplateId = allTemplates[0]?.id ?? ''
  const [form, setForm] = useState<FormData>({
    templateId: defaultTemplateId,
    packageTier: 'popular',
    groomName: '',
    brideName: '',
    slug: '',
    akadDate: '',
    akadTime: '08:00',
    akadVenue: '',
    akadAddress: '',
    akadMaps: '',
    resepsiDate: '',
    resepsiTime: '11:00',
    resepsiVenue: '',
    resepsiAddress: '',
    resepsiMaps: '',
  })

  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'ok' | 'taken'>('idle')
  const [slugError, setSlugError] = useState('')

  const slugSuggestions = generateSlugSuggestions(form.groomName, form.brideName)
  const currentKey = stepKeys[step - 1]
  const lastStep = STEPS.length

  function patch(key: keyof FormData, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  useEffect(() => {
    if (!form.slug || form.slug.length < 3) { setSlugStatus('idle'); return }
    setSlugStatus('checking')
    const t = setTimeout(async () => {
      const res = await fetch(`/api/invitations/check-slug?slug=${encodeURIComponent(form.slug)}`)
      const { available } = await res.json()
      setSlugStatus(available ? 'ok' : 'taken')
    }, 450)
    return () => clearTimeout(t)
  }, [form.slug])

  function handleSlugInput(value: string) {
    const clean = value.toLowerCase().replace(/[^a-z0-9-]/g, '')
    patch('slug', clean)
    setSlugError('')
    setSlugStatus('idle')
  }

  function canNext(): boolean {
    if (currentKey === 'template') return !!form.templateId
    if (currentKey === 'package') return !!form.packageTier
    if (currentKey === 'names') {
      return !!form.groomName.trim() && !!form.brideName.trim() &&
        form.slug.length >= 3 && slugStatus === 'ok'
    }
    return true
  }

  async function handleCreate() {
    setSaving(true)
    const data: Record<string, unknown> = {
      groom_name: form.groomName,
      bride_name: form.brideName,
    }
    if (form.akadVenue) {
      data.akad = {
        date: form.akadDate || new Date().toISOString().split('T')[0],
        time: form.akadTime,
        venue_name: form.akadVenue,
        venue_address: form.akadAddress,
        maps_url: form.akadMaps,
      }
    }
    if (form.resepsiVenue) {
      data.resepsi = {
        date: form.resepsiDate || form.akadDate || new Date().toISOString().split('T')[0],
        time: form.resepsiTime,
        venue_name: form.resepsiVenue,
        venue_address: form.resepsiAddress,
        maps_url: form.resepsiMaps,
      }
    }

    const res = await fetch('/api/invitations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: form.slug,
        template_id: form.templateId,
        package_tier: form.packageTier,
        data,
      }),
    })
    setSaving(false)

    if (!res.ok) {
      const { error } = await res.json()
      if (error?.includes('Slug') || error?.includes('slug')) {
        const namesIdx = stepKeys.indexOf('names') + 1
        setStep(namesIdx)
        setSlugError('Nama link ini sudah dipakai, coba yang lain')
      } else {
        toast.error(error || 'Gagal membuat undangan')
      }
      return
    }
    const { invitation: created } = await res.json()
    onInvitationCreated(created)
  }

  return (
    <div className="min-h-[70vh] flex flex-col">

      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between relative">
          <div className="absolute top-4 left-0 right-0 h-px bg-stone-100 z-0" />
          <motion.div
            className="absolute top-4 left-0 h-px bg-stone-800 z-0"
            initial={{ width: '0%' }}
            animate={{ width: `${((step - 1) / (lastStep - 1)) * 100}%` }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          />

          {STEPS.map((s, i) => (
            <div key={s.id} className="relative z-10 flex flex-col items-center gap-1.5">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                i + 1 < step
                  ? 'bg-stone-800 text-white'
                  : i + 1 === step
                  ? 'bg-stone-900 text-white ring-4 ring-stone-100'
                  : 'bg-white border-2 border-stone-200 text-stone-300'
              }`}>
                {i + 1 < step ? <Check size={14} /> : i + 1}
              </div>
              <span className={`text-[10px] font-semibold hidden sm:block ${i + 1 === step ? 'text-stone-800' : 'text-stone-300'}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            {currentKey === 'template' && <StepTemplate form={form} onSelect={id => patch('templateId', id)} allTemplates={allTemplates} />}
            {currentKey === 'package' && <StepPackage form={form} onSelect={tier => patch('packageTier', tier)} />}
            {currentKey === 'names' && (
              <StepNames
                form={form}
                slugStatus={slugStatus}
                slugError={slugError}
                slugSuggestions={slugSuggestions}
                onPatch={patch}
                onSlugInput={handleSlugInput}
              />
            )}
            {currentKey === 'acara' && <StepAcara form={form} onPatch={patch} />}
            {currentKey === 'konfirmasi' && <StepKonfirmasi form={form} allTemplates={allTemplates} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8 pt-5 border-t border-stone-100">
        <button
          onClick={() => setStep(s => s - 1)}
          disabled={step === 1}
          className="flex items-center gap-2 text-sm text-stone-400 hover:text-stone-700 disabled:opacity-0 transition-colors font-medium"
        >
          <ArrowLeft size={15} /> Kembali
        </button>

        <div className="flex items-center gap-3">
          {currentKey === 'acara' && (
            <button
              onClick={() => setStep(s => s + 1)}
              className="text-sm text-stone-400 hover:text-stone-600 font-medium transition-colors"
            >
              Lewati
            </button>
          )}
          {step < lastStep ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canNext()}
              className="flex items-center gap-2 bg-stone-900 hover:bg-stone-800 text-white text-sm font-semibold px-6 py-2.5 rounded-xl disabled:opacity-40 transition-all"
            >
              Lanjut <ArrowRight size={14} />
            </button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={saving}
              className="flex items-center gap-2 bg-stone-900 hover:bg-stone-800 text-white text-sm font-semibold px-7 py-2.5 rounded-xl disabled:opacity-60 transition-all"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {saving ? 'Membuat...' : 'Buat Undangan'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

//  Step 1: Pilih Template 
function StepTemplate({ form, onSelect, allTemplates }: { form: FormData; onSelect: (id: string) => void; allTemplates: TemplateInfo[] }) {
  return (
    <div>
      <h2 className="font-sans text-2xl font-bold text-stone-900 mb-1">Pilih template undangan</h2>
      <p className="text-stone-400 text-sm mb-6">Pilih desain yang paling mencerminkan kalian.</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {allTemplates.map(tpl => (
          <button
            key={tpl.id}
            onClick={() => onSelect(tpl.id)}
            className="group relative rounded-2xl overflow-hidden border-2 transition-all duration-200 text-left focus:outline-none"
            style={{ borderColor: form.templateId === tpl.id ? '#1c1917' : '#e7e5e4' }}
          >
            <div className="relative aspect-[3/4]">
              {tpl.thumbnailUrl ? (
                <Image
                  src={tpl.thumbnailUrl}
                  alt={tpl.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 640px) 50vw, 33vw"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

              {form.templateId === tpl.id && (
                <div className="absolute top-3 right-3 w-7 h-7 bg-stone-900 rounded-full flex items-center justify-center">
                  <Check size={14} className="text-white" />
                </div>
              )}

              {tpl.isNew && (
                <div className="absolute top-3 left-3">
                  <span className="text-[9px] bg-gold-500 text-white px-1.5 py-0.5 rounded-full font-bold">NEW</span>
                </div>
              )}

              <div className="absolute bottom-0 inset-x-0 p-4">
                <p className="font-semibold text-white text-sm">{tpl.name}</p>
                <p className="text-[10px] text-white/60 capitalize">{tpl.category}</p>
              </div>
            </div>

            <div className="px-3 py-2.5 bg-white flex items-center justify-between">
              <span className="text-xs font-medium text-stone-600">{tpl.name}</span>
              <a
                href={tpl.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="flex items-center gap-1 text-[10px] text-stone-400 hover:text-stone-700 transition-colors"
              >
                Preview <ExternalLink size={10} />
              </a>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

//  Step 2: Pilih Paket 
const TIER_ICONS: Record<PackageTier, React.ElementType> = {
  starter: Leaf,
  popular: Sparkles,
  eksklusif: Crown,
}

const TIER_COLORS: Record<PackageTier, { bg: string; border: string; badge: string; ring: string }> = {
  starter: { bg: 'from-blue-50 to-blue-100', border: 'border-blue-300', badge: 'bg-blue-100 text-blue-700', ring: 'ring-blue-200' },
  popular: { bg: 'from-rose-50 to-rose-100', border: 'border-rose-300', badge: 'bg-rose-100 text-rose-700', ring: 'ring-rose-200' },
  eksklusif: { bg: 'from-amber-50 to-amber-100', border: 'border-amber-300', badge: 'bg-amber-100 text-amber-700', ring: 'ring-amber-200' },
}

function StepPackage({ form, onSelect }: { form: FormData; onSelect: (tier: string) => void }) {
  return (
    <div>
      <h2 className="font-sans text-2xl font-bold text-stone-900 mb-1">Pilih paket</h2>
      <p className="text-stone-400 text-sm mb-6">Sesuaikan dengan kebutuhan undangan kalian.</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {PACKAGE_LIST.map(tier => {
          const pkg = PACKAGES[tier]
          const Icon = TIER_ICONS[tier]
          const colors = TIER_COLORS[tier]
          const selected = form.packageTier === tier

          return (
            <button
              key={tier}
              onClick={() => onSelect(tier)}
              className={`relative rounded-2xl border-2 p-5 text-left transition-all duration-200 ${
                selected
                  ? `${colors.border} ring-4 ${colors.ring} shadow-md`
                  : 'border-stone-200 hover:border-stone-300'
              }`}
            >
              {tier === 'popular' && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="text-[10px] bg-rose-500 text-white px-3 py-1 rounded-full font-bold uppercase tracking-wide">
                    Populer
                  </span>
                </div>
              )}

              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors.bg} flex items-center justify-center mb-3`}>
                <Icon size={20} className="text-stone-700" />
              </div>

              <h3 className="font-bold text-stone-900 text-lg">{pkg.emoji} {pkg.name}</h3>
              <p className="text-2xl font-bold text-stone-900 mt-1">{formatPrice(pkg.price)}</p>
              <p className="text-xs text-stone-400 mb-4">{pkg.activeMonths} bulan aktif</p>

              <ul className="space-y-2 text-sm text-stone-600">
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-green-500 shrink-0" />
                  {pkg.maxPhotos === -1 ? 'Foto unlimited' : `Maks. ${pkg.maxPhotos} foto`}
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-green-500 shrink-0" />
                  {pkg.maxGuests === -1 ? 'Tamu unlimited' : `Maks. ${pkg.maxGuests} blast tamu`}
                </li>
                {pkg.hasWatermarkFree && (
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-green-500 shrink-0" />
                    Tanpa watermark
                  </li>
                )}
                {pkg.hasCustomDomain && (
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-green-500 shrink-0" />
                    Custom domain
                  </li>
                )}
                {pkg.canHideWishes && (
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-green-500 shrink-0" />
                    Sembunyikan ucapan
                  </li>
                )}
              </ul>

              {selected && (
                <div className="absolute top-3 right-3 w-6 h-6 bg-stone-900 rounded-full flex items-center justify-center">
                  <Check size={12} className="text-white" />
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

//  Step 3: Nama & Link 
function StepNames({
  form, slugStatus, slugError, slugSuggestions, onPatch, onSlugInput,
}: {
  form: FormData
  slugStatus: 'idle' | 'checking' | 'ok' | 'taken'
  slugError: string
  slugSuggestions: string[]
  onPatch: (key: keyof FormData, value: string) => void
  onSlugInput: (v: string) => void
}) {
  const slugIndicator = {
    idle:     { color: 'text-stone-300',  text: '' },
    checking: { color: 'text-stone-400',  text: 'Mengecek...' },
    ok:       { color: 'text-green-600',  text: '✓ Tersedia' },
    taken:    { color: 'text-red-500',    text: '✗ Sudah dipakai' },
  }[slugStatus]

  return (
    <div className="max-w-lg">
      <h2 className="font-sans text-2xl font-bold text-stone-900 mb-1">Nama & link undangan</h2>
      <p className="text-stone-400 text-sm mb-6">Nama kalian untuk personalisasi undangan, dan link unik untuk dibagikan ke tamu.</p>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-xs font-semibold text-stone-500 mb-1.5 flex items-center gap-1.5">
            <User size={11} /> Nama Pria
          </label>
          <input
            value={form.groomName}
            onChange={e => onPatch('groomName', e.target.value)}
            placeholder="Ahmad"
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-stone-500 mb-1.5 flex items-center gap-1.5">
            <User size={11} /> Nama Wanita
          </label>
          <input
            value={form.brideName}
            onChange={e => onPatch('brideName', e.target.value)}
            placeholder="Siti"
            className={inputCls}
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-xs font-semibold text-stone-500 mb-1.5 flex items-center gap-1.5">
          <Link2 size={11} /> Subdomain Undangan
        </label>
        <div className="flex items-center border border-stone-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-stone-400 bg-white">
          <input
            value={form.slug}
            onChange={e => onSlugInput(e.target.value)}
            placeholder="ahmad-siti"
            className="flex-1 pl-3.5 pr-1 py-2.5 text-sm font-mono text-stone-800 bg-transparent focus:outline-none text-right"
          />
          <span className="pr-3.5 pl-1 text-sm text-stone-400 shrink-0 select-none">.iaundang.online</span>
          <span className={`pr-3 text-xs font-medium shrink-0 ${slugIndicator.color}`}>
            {slugStatus === 'checking'
              ? <Loader2 size={12} className="animate-spin inline" />
              : slugIndicator.text}
          </span>
        </div>
        {slugError && <p className="text-xs text-red-500 mt-1">{slugError}</p>}
        {!slugError && form.slug && (
          <p className="text-xs text-stone-400 mt-1.5">
            Undangan Anda akan tersedia di <span className="font-mono font-medium text-stone-600">{form.slug}.iaundang.online</span>
          </p>
        )}
        {!slugError && !form.slug && (
          <p className="text-xs text-stone-400 mt-1">Hanya huruf kecil, angka, tanda hubung. Min. 3 karakter.</p>
        )}
      </div>

      {slugSuggestions.length > 0 && (
        <div>
          <p className="text-xs text-stone-400 mb-2">Rekomendasi:</p>
          <div className="flex flex-wrap gap-2">
            {slugSuggestions.map(s => (
              <button
                key={s}
                onClick={() => onSlugInput(s)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all font-medium ${
                  form.slug === s
                    ? 'bg-stone-900 text-white border-stone-900'
                    : 'border-stone-200 text-stone-600 hover:border-stone-400 hover:text-stone-900'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

//  Step 4: Detail Acara 
function StepAcara({ form, onPatch }: { form: FormData; onPatch: (key: keyof FormData, value: string) => void }) {
  return (
    <div className="max-w-lg">
      <h2 className="font-sans text-2xl font-bold text-stone-900 mb-1">Detail acara</h2>
      <p className="text-stone-400 text-sm mb-6">Opsional, bisa diisi atau dilengkapi nanti di dashboard.</p>

      <div className="bg-stone-50 rounded-2xl border border-stone-100 p-5 mb-4">
        <h3 className="text-sm font-bold text-stone-700 mb-4 flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-stone-800 text-white text-[10px] flex items-center justify-center font-bold">1</span>
          Akad Nikah
        </h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-stone-400 flex items-center gap-1 mb-1"><Calendar size={10} /> Tanggal</label>
              <input type="date" value={form.akadDate} onChange={e => onPatch('akadDate', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-stone-400 flex items-center gap-1 mb-1"><Clock size={10} /> Jam</label>
              <input type="time" value={form.akadTime} onChange={e => onPatch('akadTime', e.target.value)} className={inputCls} />
            </div>
          </div>
          <div>
            <label className="text-xs text-stone-400 flex items-center gap-1 mb-1"><MapPin size={10} /> Nama Venue</label>
            <input value={form.akadVenue} onChange={e => onPatch('akadVenue', e.target.value)} placeholder="Masjid Al-Ikhlas" className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-stone-400 mb-1 block">Alamat</label>
            <input value={form.akadAddress} onChange={e => onPatch('akadAddress', e.target.value)} placeholder="Jl. Mawar No. 1, Jakarta" className={inputCls} />
          </div>
        </div>
      </div>

      <div className="bg-stone-50 rounded-2xl border border-stone-100 p-5">
        <h3 className="text-sm font-bold text-stone-700 mb-4 flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-stone-800 text-white text-[10px] flex items-center justify-center font-bold">2</span>
          Resepsi
        </h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-stone-400 flex items-center gap-1 mb-1"><Calendar size={10} /> Tanggal</label>
              <input type="date" value={form.resepsiDate} onChange={e => onPatch('resepsiDate', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-stone-400 flex items-center gap-1 mb-1"><Clock size={10} /> Jam</label>
              <input type="time" value={form.resepsiTime} onChange={e => onPatch('resepsiTime', e.target.value)} className={inputCls} />
            </div>
          </div>
          <div>
            <label className="text-xs text-stone-400 flex items-center gap-1 mb-1"><MapPin size={10} /> Nama Venue</label>
            <input value={form.resepsiVenue} onChange={e => onPatch('resepsiVenue', e.target.value)} placeholder="Ballroom Hotel Grand" className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-stone-400 mb-1 block">Alamat</label>
            <input value={form.resepsiAddress} onChange={e => onPatch('resepsiAddress', e.target.value)} placeholder="Jl. Sudirman No. 86, Jakarta" className={inputCls} />
          </div>
        </div>
      </div>
    </div>
  )
}

//  Step 5: Konfirmasi 
function StepKonfirmasi({ form, allTemplates }: { form: FormData; allTemplates: TemplateInfo[] }) {
  const tpl = allTemplates.find(t => t.id === form.templateId)
  const pkg = PACKAGES[form.packageTier]

  return (
    <div className="max-w-md">
      <h2 className="font-sans text-2xl font-bold text-stone-900 mb-1">Hampir selesai!</h2>
      <p className="text-stone-400 text-sm mb-6">Periksa sekali lagi sebelum membuat undangan.</p>

      <div className="bg-stone-50 rounded-2xl border border-stone-100 divide-y divide-stone-100 overflow-hidden mb-5">
        <Row icon={<Sparkles size={14} className="text-stone-400" />}
          label="Template" value={tpl?.name ?? form.templateId} />
        <Row icon={<Crown size={14} className="text-stone-400" />}
          label="Paket" value={`${pkg.emoji} ${pkg.name} · ${formatPrice(pkg.price)}`} />
        <Row icon={<Users size={14} className="text-stone-400" />}
          label="Pasangan" value={`${form.groomName} & ${form.brideName}`} />
        <Row icon={<Link2 size={14} className="text-stone-400" />}
          label="Link" value={`${form.slug}.iaundang.online`} mono />
        <Row icon={<Calendar size={14} className="text-stone-400" />}
          label="Masa aktif" value={`${pkg.activeMonths} bulan`} />
        {form.akadVenue && (
          <Row icon={<MapPin size={14} className="text-stone-400" />}
            label="Akad" value={`${form.akadVenue}${form.akadDate ? ' · ' + new Date(form.akadDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}`} />
        )}
        {form.resepsiVenue && (
          <Row icon={<MapPin size={14} className="text-stone-400" />}
            label="Resepsi" value={`${form.resepsiVenue}${form.resepsiDate ? ' · ' + new Date(form.resepsiDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}`} />
        )}
      </div>

      <div className="bg-green-50 border border-green-100 rounded-2xl p-4 text-sm text-green-700">
        <p className="font-semibold mb-0.5">Coba gratis!</p>
        <p className="text-green-600 text-xs">Setelah dibuat, Anda bisa langsung mengedit undangan secara gratis. Bayar hanya saat siap publish ke tamu.</p>
      </div>
    </div>
  )
}

function Row({ icon, label, value, mono }: { icon: React.ReactNode; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <span className="shrink-0 mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-stone-400 font-medium">{label}</p>
        <p className={`text-sm text-stone-800 font-semibold truncate ${mono ? 'font-mono' : ''}`}>{value || ''}</p>
      </div>
    </div>
  )
}

const inputCls = 'w-full px-3.5 py-2.5 text-sm border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-400 bg-white'
