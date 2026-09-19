'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight, ArrowLeft, Check, Loader2, User, ExternalLink,
} from 'lucide-react'
import type { TemplateInfo } from './DashboardClient'

// Sepuluh field acara (akad dan resepsi: tanggal, jam, venue, alamat, tautan
// peta) dibuang dari wizard ini. Alur pembelian di /order tidak punya tempat
// untuk menampungnya, dan tempat yang benar sudah ada: EventDetailsForm di
// Studio menulis ke data.akad dan data.resepsi yang sama dengan yang dibaca
// renderer, lengkap dengan input tautan peta dan foto venue. Di sini tautan
// peta malah tidak pernah punya input, jadi maps_url selalu terkirim kosong.
interface FormData {
  templateId: string
  groomName: string
  brideName: string
}

interface Props {
  allTemplates: TemplateInfo[]
  /** Email akun yang sedang login, dititipkan ke /order. Lihat handleContinue. */
  userEmail: string
}

// Langkah Paket, kolom subdomain, dan layar Konfirmasi dibuang karena /order
// sudah menanyakan semuanya dengan cara yang benar. Pilihan paket di sini
// bahkan tidak pernah tersimpan: skema POST /api/invitations tidak mengenal
// package_tier, jadi zod membuangnya diam-diam. Harga yang dipajangnya pun
// tier.price mentah, tanpa harga khusus template maupun flash sale, sedangkan
// /order memakai computePrice(). Subdomain di sini hanya dicek terhadap
// undangan, sedangkan /order juga memeriksa pesanan yang masih tertunda.
const STEPS_WITH_TEMPLATE = [
  { id: 1, label: 'Template' },
  { id: 2, label: 'Nama' },
]

const STEPS_WITHOUT_TEMPLATE = [
  { id: 1, label: 'Nama' },
]

export default function OnboardingWizard({ allTemplates, userEmail }: Props) {
  return <Wizard allTemplates={allTemplates} userEmail={userEmail} />
}

type StepKey = 'template' | 'names'

function Wizard({ allTemplates, userEmail }: Props) {
  const router = useRouter()
  const showTemplateStep = allTemplates.length > 1
  const STEPS = showTemplateStep ? STEPS_WITH_TEMPLATE : STEPS_WITHOUT_TEMPLATE
  const stepKeys: StepKey[] = showTemplateStep
    ? ['template', 'names']
    : ['names']

  const [step, setStep] = useState(1)
  const [navigating, setNavigating] = useState(false)
  const defaultTemplateId = allTemplates[0]?.id ?? ''
  const [form, setForm] = useState<FormData>({
    templateId: defaultTemplateId,
    groomName: '',
    brideName: '',
  })

  const currentKey = stepKeys[step - 1]
  const lastStep = STEPS.length

  function patch(key: keyof FormData, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function canNext(): boolean {
    if (currentKey === 'template') return !!form.templateId
    if (currentKey === 'names') return !!form.groomName.trim() && !!form.brideName.trim()
    return true
  }

  /**
   * Ujung wizard: titipkan data ke /order lalu pindah ke sana.
   *
   * Dulu di sini ada POST /api/invitations yang langsung membuat undangan
   * is_paid: false dengan trial 7 hari lewat createTrial(), tanpa pesanan apa
   * pun. Itu jalur undangan gratis yang bertentangan dengan keputusan produk:
   * undangan hanya lahir dari pembelian lewat provision-order.ts. Sekarang
   * wizard hanya mengantar ke checkout, dan undangannya dibuat setelah
   * pembayaran terkonfirmasi.
   *
   * Kunci dan format sessionStorage sama dengan DemoEditorClient
   * (iaundang:prefill), ditambah email akun. Tanpa email itu pembeli bisa
   * mengetik alamat lain di /order, lalu provision-order membuat akun BARU
   * untuk alamat tersebut dan undangan barunya tidak muncul di dashboard ini.
   */
  function handleContinue() {
    setNavigating(true)
    try {
      sessionStorage.setItem('iaundang:prefill', JSON.stringify({
        groomName: form.groomName.trim(),
        brideName: form.brideName.trim(),
        email: userEmail,
      }))
    } catch {
      // Storage diblokir atau penuh. Bukan alasan menahan pembeli: /order
      // tetap jalan, hanya isiannya diketik ulang.
    }
    router.push(`/order?template=${encodeURIComponent(form.templateId)}`)
  }

  return (
    <div className="min-h-[70vh] flex flex-col">

      {/* Progress bar. Disembunyikan kalau wizard tinggal satu langkah (hanya
          ada satu template aktif): satu lingkaran tanpa lanjutan tidak
          menunjukkan progres apa pun, dan rumus lebarnya membagi dengan nol. */}
      {lastStep > 1 && (
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
      )}

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
            {currentKey === 'names' && <StepNames form={form} onPatch={patch} />}
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
              onClick={handleContinue}
              disabled={!canNext() || navigating}
              className="flex items-center gap-2 bg-stone-900 hover:bg-stone-800 text-white text-sm font-semibold px-7 py-2.5 rounded-xl disabled:opacity-40 transition-all"
            >
              {navigating ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
              Lanjut ke Pemesanan
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

//  Step 2: Nama
function StepNames({ form, onPatch }: { form: FormData; onPatch: (key: keyof FormData, value: string) => void }) {
  return (
    <div className="max-w-lg">
      <h2 className="font-sans text-2xl font-bold text-stone-900 mb-1">Nama mempelai</h2>
      <p className="text-stone-400 text-sm mb-6">Kami bawa ke halaman pemesanan supaya tidak perlu diketik ulang. Paket, alamat undangan, dan pembayaran diatur di sana.</p>

      {/* Label "Nama Lengkap", dulu cuma "Nama Pria" dengan contoh "Ahmad".
          Nilai ini mengisi kolom nama lengkap di /order, yang dipakai sebagai
          nama di tagihan Mayar dan tampil di sampul undangan. */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-xs font-semibold text-stone-500 mb-1.5 flex items-center gap-1.5">
            <User size={11} /> Nama Lengkap Pria
          </label>
          <input
            value={form.groomName}
            onChange={e => onPatch('groomName', e.target.value)}
            placeholder="Ahmad Pratama"
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-stone-500 mb-1.5 flex items-center gap-1.5">
            <User size={11} /> Nama Lengkap Wanita
          </label>
          <input
            value={form.brideName}
            onChange={e => onPatch('brideName', e.target.value)}
            placeholder="Siti Rahma"
            className={inputCls}
          />
        </div>
      </div>
    </div>
  )
}

const inputCls = 'w-full px-3.5 py-2.5 text-sm border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-400 bg-white'
