'use client'

import { computePrice } from '@/lib/pricing'
import type { FlashSale } from '@/lib/types'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  ChevronRight, ChevronLeft, Check, Crown, Rocket, Gem,
  Copy, CreditCard, Send, Loader2, CheckCircle2,
  Users, ShoppingBag, Clock, X, Landmark,
} from 'lucide-react'
import BankCard, { QrisCard } from '@/components/ui/BankCard'
import { InputField } from '@/components/marketing/Field'
import toast, { Toaster } from 'react-hot-toast'

interface TierFeatures {
  max_photos: number
  max_guests: number
  music: boolean
  custom_music: boolean
  opening_animation: boolean
  rsvp: boolean
  wishes: boolean
  countdown: boolean
  gallery: boolean
  gift: boolean
  gift_registry: boolean
  story: boolean
  video: boolean
  livestream: boolean
  qrcode: boolean
  custom_domain: boolean
  subdomain: boolean
  remove_watermark: boolean
  analytics: boolean
  priority_support: boolean
  validity_days: number
}

interface TierInfo {
  id: string
  label: string
  price: number
  description: string
  color: string
  icon: string
  highlight: boolean
  features: TierFeatures | null
}

interface PaymentConfig {
  bankAccounts: { id: string; bankName: string; accountNumber: string; accountName: string }[]
  qrisImageUrl: string
  paymentInstructions: string
  confirmationWhatsapp: string
}

interface Props {
  templateId: string
  templateName: string
  templatePrice: number
  templateCategory: string
  flashSales: FlashSale[]
  tiers: TierInfo[]
  paymentConfig: PaymentConfig
}

type Step = 0 | 1 | 2

// Paket sengaja jadi langkah pertama. Dulu paket baru muncul di langkah ketiga,
// setelah pembeli mengisi 13 field, jadi harga baru terlihat setelah mereka
// terlanjur mengetik banyak. Isi undangan juga tidak lagi ditanyakan di sini:
// halaman ini checkout murni, isi undangan dilengkapi di Studio setelah bayar.
const STEP_LABELS = [
  { icon: ShoppingBag, label: 'Pilih Paket' },
  { icon: Users, label: 'Data & Kontak' },
  { icon: CreditCard, label: 'Pembayaran' },
]

const TIER_ICONS: Record<string, React.ElementType> = { rocket: Rocket, crown: Crown, gem: Gem }

type FeatureItem = { label: string; included: boolean; section?: boolean }

function buildTierFeatureList(tierId: string, f: TierFeatures): FeatureItem[] {
  const list: FeatureItem[] = []

  // Kapasitas & durasi
  list.push({ label: `Sampai ${f.max_photos} foto`, included: true })
  list.push({ label: `Sampai ${f.max_guests} tamu`, included: true })
  list.push({ label: `Aktif selama ${f.validity_days} hari`, included: true })

  // Section yang ditampilkan
  list.push({ label: 'Musik pengiring', included: f.music, section: true })
  list.push({ label: 'Konfirmasi kehadiran tamu', included: f.rsvp, section: true })
  list.push({ label: 'Galeri foto', included: f.gallery, section: true })
  list.push({ label: 'Ucapan & doa dari tamu', included: f.wishes, section: true })
  list.push({ label: 'Hitung mundur hari H', included: f.countdown, section: true })
  list.push({ label: 'Amplop digital & rekening', included: f.gift, section: true })
  list.push({ label: 'Daftar hadiah impian', included: f.gift_registry, section: true })
  list.push({ label: 'Kisah perjalanan cinta', included: f.story, section: true })
  list.push({ label: 'Video pernikahan', included: f.video, section: true })

  // Fitur ekstra
  list.push({ label: 'Tanpa logo iaundang', included: f.remove_watermark })
  list.push({ label: 'Kode QR untuk absen tamu', included: f.qrcode })
  list.push({ label: 'Alamat website sendiri', included: f.custom_domain })
  list.push({ label: 'Dibantu lebih dulu lewat WhatsApp', included: f.priority_support })
  return list
}

export default function OrderForm({ templateId, templateName, templatePrice, templateCategory, flashSales, tiers, paymentConfig }: Props) {
  const [step, setStep] = useState<Step>(0)

  // Langkah 0: Paket
  const [packageTier, setPackageTier] = useState('')

  // Langkah 1: Data & kontak
  const [groomName, setGroomName] = useState('')
  const [brideName, setBrideName] = useState('')
  // Nama panggilan tidak punya input lagi, tapi state-nya sengaja dipertahankan:
  // diisi dari pratinjau demo lewat sessionStorage dan dipakai effect saran
  // subdomain di bawah. Untuk pembeli yang langsung ke /order keduanya kosong,
  // jadi setiap tempat yang menyapa pasangan wajib jatuh ke nama lengkap.
  const [groomNickname, setGroomNickname] = useState('')
  const [brideNickname, setBrideNickname] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [subdomain, setSubdomain] = useState('')
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null)
  const [checkingSubdomain, setCheckingSubdomain] = useState(false)

  // Langkah 2: hasil pesanan untuk layar pembayaran
  const [order, setOrder] = useState<{ order_number: string; total_amount: number; unique_code: number; amount: number } | null>(null)

  //  Kupon
  const [couponInput, setCouponInput] = useState('')
  const [couponCode, setCouponCode] = useState<string | null>(null)
  const [couponMsg, setCouponMsg] = useState<string | null>(null)
  const [couponAmount, setCouponAmount] = useState<number | null>(null)
  const [checkingCoupon, setCheckingCoupon] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const checkSubdomain = useCallback((slug: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const cleaned = slug.toLowerCase().replace(/[^a-z0-9-]/g, '')
    setSubdomain(cleaned)
    if (cleaned.length < 3) { setSubdomainAvailable(null); return }
    setCheckingSubdomain(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/orders/check-subdomain?slug=${cleaned}`)
        const data = await res.json()
        setSubdomainAvailable(data.available)
      } catch { setSubdomainAvailable(null) }
      finally { setCheckingSubdomain(false) }
    }, 500)
  }, [])

  // Nama yang sudah diketik di pratinjau demo (DemoEditorClient) atau di
  // OnboardingWizard dashboard dipakai sebagai isian awal, supaya tidak
  // diketik dua kali. Sengaja tidak dihapus setelah dibaca: kalau halaman ini
  // di-refresh, isiannya tetap ada. Setiap klik CTA di demo maupun tombol
  // akhir wizard menimpa nilainya.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('iaundang:prefill')
      if (!raw) return
      const p = JSON.parse(raw) as Partial<Record<'groomName' | 'brideName' | 'groomNickname' | 'brideNickname' | 'email', string>>
      if (p.groomName) setGroomName(p.groomName)
      if (p.brideName) setBrideName(p.brideName)
      if (p.groomNickname) setGroomNickname(p.groomNickname)
      if (p.brideNickname) setBrideNickname(p.brideNickname)
      // Hanya dikirim OnboardingWizard, milik pembeli yang sudah login.
      // provision-order mencari akun lewat email pesanan, jadi alamat lain
      // berarti akun baru yang terpisah dan undangannya tidak muncul di
      // dashboard mereka.
      if (p.email) setEmail(p.email)
    } catch {
      // JSON rusak atau storage diblokir — form tetap jalan, cuma kosong.
    }
  }, [])

  // Hanya berjalan kalau nama panggilan terisi dari pratinjau demo. Sengaja
  // tidak menebak dari nama lengkap untuk pembeli yang langsung ke /order:
  // kata pertama dari "Muhammad Rizky" atau "M. Rizky" menghasilkan alamat
  // undangan yang buruk, padahal alamat itu dipakai permanen.
  useEffect(() => {
    if (!groomNickname || !brideNickname) return
    const auto = `${groomNickname}-${brideNickname}`.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')
    if (!subdomain) checkSubdomain(auto)
  }, [groomNickname, brideNickname, subdomain, checkSubdomain])

  function canNext(): boolean {
    switch (step) {
      case 0: return !!packageTier
      // Nama panggilan tidak lagi jadi syarat. Inputnya sudah tidak ada, jadi
      // syarat lama akan mengunci tombol selamanya bagi pembeli langsung.
      case 1: return !!(groomName && brideName && email && subdomain && subdomainAvailable)
      default: return false
    }
  }

  async function handleSubmitOrder() {
    setSubmitting(true)
    try {
      const tier = tiers.find(t => t.id === packageTier)
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Nama orang tua dan profesi tidak dikirim lagi. Skema /api/orders
        // menandainya opsional dan kolom Order ber-default string kosong, jadi
        // API tidak perlu diubah. Nama panggilan tetap dikirim apa adanya,
        // kosong kalau pembeli tidak datang dari demo.
        body: JSON.stringify({
          email, phone,
          groom_name: groomName, bride_name: brideName,
          groom_nickname: groomNickname, bride_nickname: brideNickname,
          subdomain, template_id: templateId,
          package_tier: packageTier,
          coupon_code: couponCode,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || 'Pesanannya gagal dibuat. Coba lagi ya.')
        return
      }
      const { order: newOrder, paymentUrl } = await res.json()

      if (paymentUrl) {
        toast.success('Sebentar ya, kami antar ke halaman pembayaran.')
        window.location.href = paymentUrl
        return
      }

      setOrder(newOrder)
      setStep(2)
      toast.success('Pesanan kalian sudah masuk!')
    } catch { toast.error('Ada kendala sebentar. Coba lagi ya.') }
    finally { setSubmitting(false) }
  }

  function copyText(text: string, label: string) {
    navigator.clipboard.writeText(text)
    setCopied(label)
    toast.success('Sudah disalin!')
    setTimeout(() => setCopied(null), 2000)
  }

  function openWhatsApp() {
    if (!paymentConfig.confirmationWhatsapp || !order) return
    const tier = tiers.find(t => t.id === packageTier)
    const msg = [
      `Halo admin iaundang! 👋`,
      ``,
      `Saya ingin konfirmasi pembayaran:`,
      `📋 No. Pesanan: ${order.order_number}`,
      // Fallback ke nama lengkap: pembeli yang langsung ke /order tidak punya
      // nama panggilan, dan tanpa fallback baris ini terkirim sebagai "👤  & ".
      `👤 ${groomNickname || groomName} & ${brideNickname || brideName}`,
      `📧 Email: ${email}`,
      `📦 Paket: ${tier?.label ?? packageTier}`,
      `💰 Total: Rp ${order.total_amount.toLocaleString('id-ID')}`,
      `🌐 Subdomain: ${subdomain}.iaundang.online`,
      ``,
      `Mohon diverifikasi. Terima kasih! 🙏`,
    ].join('\n')
    window.open(`https://wa.me/${paymentConfig.confirmationWhatsapp}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  const selectedTier = tiers.find(t => t.id === packageTier)

  /**
   * Rincian harga memakai computePrice() — FUNGSI YANG SAMA dengan
   * /api/orders. Ringkasan lama menampilkan `selectedTier.price` mentah, jadi
   * harga khusus template dan diskon flash sale tidak terlihat sama sekali:
   * pembeli melihat satu angka di layar ini lalu angka lain di layar transfer.
   *
   * Kartu paket sekarang ikut memakai priceFor(). Dulu kartu tetap memajang
   * tier.price mentah, jadi masalah di atas masih tersisa di layar pertama
   * checkout: kalau template punya harga khusus atau sedang ada flash sale,
   * angka di kartu bukan angka yang ditagih. Satu helper untuk kartu dan
   * ringkasan menjamin keduanya tidak bisa berbeda untuk paket yang sama.
   */
  const priceFor = (tier: TierInfo) => computePrice({
    basePrice: templatePrice > 0 ? templatePrice : tier.price,
    tierId: tier.id,
    category: templateCategory,
    flashSales,
    coupons: [],
  })
  const priceBreakdown = selectedTier ? priceFor(selectedTier) : null

  async function applyCoupon() {
    const code = couponInput.trim()
    if (!code || !packageTier) return
    setCheckingCoupon(true)
    setCouponMsg(null)
    try {
      const res = await fetch('/api/orders/check-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, package_tier: packageTier, template_id: templateId }),
      })
      const data = await res.json().catch(() => null)
      if (!data?.ok) {
        setCouponCode(null)
        setCouponAmount(null)
        setCouponMsg(data?.message || 'Kupon tidak bisa dipakai.')
        return
      }
      const saved = Number(data.price?.coupon?.saved ?? 0)
      setCouponCode(data.code)
      setCouponAmount(saved)
      setCouponMsg(`Kupon "${data.code}" dipakai — hemat Rp ${saved.toLocaleString('id-ID')}`)
    } finally {
      setCheckingCoupon(false)
    }
  }

  function clearCoupon() {
    setCouponCode(null)
    setCouponAmount(null)
    setCouponInput('')
    setCouponMsg(null)
  }

  // Kupon divalidasi untuk SATU paket: check-coupon menerima package_tier dan
  // menghitung potongan dari harga paket itu. Dulu kupon tetap terpasang saat
  // pembeli pindah paket, jadi layar memajang potongan milik paket lama
  // sementara server menghitung ulang untuk paket baru. Total di layar bisa
  // beda dengan tagihan, atau pesanan baru gagal di klik terakhir kalau kupon
  // tidak berlaku untuk paket baru. Pesan gagal milik paket lama juga dibuang
  // karena belum tentu berlaku untuk paket baru. Kode yang sudah diketik
  // dibiarkan di input supaya pembeli cukup menekan "Pakai" lagi.
  function selectTier(id: string) {
    if (id !== packageTier) {
      setCouponCode(null)
      setCouponAmount(null)
      setCouponMsg(couponCode ? 'Paket diganti. Tekan "Pakai" untuk mengecek ulang kupon di paket ini.' : null)
    }
    setPackageTier(id)
  }

  // Diskon kupon dihitung ulang di sini hanya untuk DITAMPILKAN. Angka yang
  // menentukan tagihan tetap dihitung server saat pesanan dibuat.
  const couponSaved = couponCode && couponAmount != null ? couponAmount : 0
  const finalPrice = Math.max(0, (priceBreakdown?.final ?? 0) - couponSaved)

  return (
    <div className="min-h-screen bg-ivory pt-24 pb-16">
      <Toaster position="top-center" />
      <div className="max-w-3xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-eyebrow text-concrete mb-3">Langkah terakhir menuju hari bahagia</p>
          <h1 className="font-display text-display-md text-forest-deep">Buat Undangan Digital</h1>
          <p className="mt-2 text-body-sm text-concrete">
            Template: <span className="font-semibold text-graphite">{templateName}</span>
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-1 mb-8 flex-wrap">
          {STEP_LABELS.map((s, i) => {
            const isActive = step === i
            const isDone = i < step
            const canGoBack = isDone && step !== 2
            return (
              <div key={i} className="flex items-center">
                {i > 0 && <div className={`w-6 sm:w-10 h-px mx-1 rounded-full ${isDone ? 'bg-forest-300' : 'bg-hairline'}`} />}
                <button
                  type="button"
                  onClick={() => { if (canGoBack) setStep(i as Step) }}
                  disabled={!canGoBack && !isActive}
                  className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-pill text-label-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40 ${
                    isActive ? 'bg-forest-50 text-forest-deep' :
                    isDone ? 'text-forest hover:bg-forest-50 cursor-pointer' : 'text-concrete cursor-default'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                    isActive ? 'bg-forest text-chalk' :
                    isDone ? 'bg-forest-100 text-forest-deep' : 'bg-mist text-concrete'
                  }`}>
                    {isDone ? <Check size={10} strokeWidth={3} /> : i + 1}
                  </span>
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
              </div>
            )
          })}
        </div>

        {/* Form card */}
        <div className="bg-chalk rounded-card border border-hairline shadow-card overflow-hidden">

          {/* Langkah 0: Paket */}
          {step === 0 && (
            <div className="p-6 sm:p-8">
              <div className="flex items-center gap-2.5 mb-6">
                <div className="w-8 h-8 rounded-lg bg-forest-50 flex items-center justify-center">
                  <ShoppingBag size={15} className="text-forest" />
                </div>
                <h2 className="font-display text-h2 text-graphite">Pilih Paket</h2>
              </div>

              {/* Tier cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {tiers.map(tier => {
                  const TierIcon = TIER_ICONS[tier.icon] ?? Rocket
                  const selected = packageTier === tier.id
                  const f = tier.features
                  const cardPrice = priceFor(tier)
                  return (
                    <button
                      key={tier.id}
                      onClick={() => selectTier(tier.id)}
                      aria-pressed={selected}
                      className={`relative text-left rounded-card border-2 transition-all flex flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40 focus-visible:ring-offset-2 ${
                        selected
                          ? 'border-forest bg-forest-50/40 shadow-card-hover'
                          : 'border-hairline bg-chalk hover:border-ash/50 hover:shadow-card'
                      }`}
                    >
                      {tier.highlight && (
                        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-forest text-chalk text-label-sm uppercase tracking-wider rounded-pill">
                          Populer
                        </span>
                      )}

                      {/* Header */}
                      <div className="p-5 pb-3">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${tier.color}20` }}>
                            <TierIcon size={16} style={{ color: tier.color }} />
                          </div>
                          <span className="text-body-sm font-semibold text-graphite">{tier.label}</span>
                        </div>
                        {/* Harga coret hanya muncul kalau flash sale memang
                            memotong harga paket ini, supaya potongan yang
                            ditagih server terlihat sejak kartu pertama. */}
                        {cardPrice.final < cardPrice.base && (
                          <p className="text-body-xs text-concrete line-through">
                            Rp {cardPrice.base.toLocaleString('id-ID')}
                          </p>
                        )}
                        <p className="font-display text-h2 text-graphite">
                          Rp {cardPrice.final.toLocaleString('id-ID')}
                        </p>
                        <p className="text-body-xs text-concrete mt-0.5">
                          sekali bayar {f ? `· aktif ${f.validity_days} hari` : ''}
                        </p>
                      </div>

                      {/* Features */}
                      {f && (() => {
                        const features = buildTierFeatureList(tier.id, f)
                        const basics = features.filter(ft => !ft.section)
                        const sections = features.filter(ft => ft.section)
                        return (
                          <div className="px-5 pb-5 flex-1">
                            <div className="border-t border-hairline pt-3 space-y-3">
                              <ul className="space-y-1.5">
                                {basics.slice(0, 3).map((feat, i) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <Check size={12} strokeWidth={3} className="text-forest mt-0.5 shrink-0" />
                                    <span className="text-body-xs leading-snug text-carbon">{feat.label}</span>
                                  </li>
                                ))}
                              </ul>
                              <div>
                                <p className="text-label-sm uppercase tracking-wider text-concrete mb-1.5">Isi undangan</p>
                                <ul className="space-y-1">
                                  {sections.map((feat, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                      {feat.included ? (
                                        <Check size={11} strokeWidth={3} className="text-forest mt-0.5 shrink-0" />
                                      ) : (
                                        <X size={11} strokeWidth={2} className="text-smoke mt-0.5 shrink-0" />
                                      )}
                                      <span className={`text-body-xs leading-snug ${feat.included ? 'text-concrete' : 'text-ash line-through'}`}>
                                        {feat.label}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              {basics.slice(3).some(ft => ft.included) && (
                                <div>
                                  <p className="text-label-sm uppercase tracking-wider text-concrete mb-1.5">Fitur ekstra</p>
                                  <ul className="space-y-1">
                                    {basics.slice(3).map((feat, i) => (
                                      <li key={i} className="flex items-start gap-2">
                                        {feat.included ? (
                                          <Check size={11} strokeWidth={3} className="text-forest mt-0.5 shrink-0" />
                                        ) : (
                                          <X size={11} strokeWidth={2} className="text-smoke mt-0.5 shrink-0" />
                                        )}
                                        <span className={`text-body-xs leading-snug ${feat.included ? 'text-concrete' : 'text-ash line-through'}`}>
                                          {feat.label}
                                        </span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })()}

                      {selected && (
                        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-forest flex items-center justify-center">
                          <Check size={12} className="text-chalk" strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Summary */}
              {packageTier && selectedTier && (
                <div className="mt-6 rounded-card bg-ivory border border-hairline p-5">
                  <p className="text-eyebrow text-concrete mb-3">Ringkasan Pesanan</p>
                  <div className="space-y-2">
                    {/* Tanpa baris Mempelai dan Subdomain: ringkasan ini sekarang
                        tampil di langkah pertama, sebelum data itu diisi. */}
                    <div className="flex justify-between text-body-sm"><span className="text-concrete">Template</span><span className="font-medium text-graphite">{templateName}</span></div>
                    <div className="flex justify-between text-body-sm"><span className="text-concrete">Paket</span><span className="font-medium text-graphite">{selectedTier.label}</span></div>
                    <div className="border-t border-hairline my-2" />

                    <div className="flex justify-between text-body-sm">
                      <span className="text-concrete">Harga</span>
                      <span className="text-graphite">Rp {(priceBreakdown?.base ?? 0).toLocaleString('id-ID')}</span>
                    </div>
                    {priceBreakdown?.flashSale && (
                      <div className="flex justify-between text-body-sm">
                        <span className="text-forest">{priceBreakdown.flashSale.label}</span>
                        <span className="text-forest">&minus; Rp {priceBreakdown.flashSale.saved.toLocaleString('id-ID')}</span>
                      </div>
                    )}
                    {couponSaved > 0 && (
                      <div className="flex justify-between text-body-sm">
                        <span className="text-forest">Kupon {couponCode}</span>
                        <span className="text-forest">&minus; Rp {couponSaved.toLocaleString('id-ID')}</span>
                      </div>
                    )}

                    <div className="border-t border-hairline my-2" />
                    <div className="flex justify-between items-baseline">
                      <span className="text-body-base font-semibold text-carbon">Total</span>
                      <span className="font-display text-h2 text-forest-deep">
                        Rp {finalPrice.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  {/* Kode kupon — sebelumnya fitur kupon tidak punya jalur
                      masuk sama sekali, jadi kode yang dibuat admin tidak
                      pernah bisa dipakai siapa pun. */}
                  <div className="mt-4 pt-4 border-t border-hairline">
                    {couponCode ? (
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-body-sm text-forest font-medium">{couponMsg}</p>
                        <button type="button" onClick={clearCoupon}
                          className="text-body-xs text-concrete hover:text-graphite underline shrink-0">
                          Hapus
                        </button>
                      </div>
                    ) : (
                      <>
                        <label className="block text-label-sm text-concrete mb-1.5">Punya kode kupon?</label>
                        <div className="flex gap-2">
                          <input
                            value={couponInput}
                            onChange={e => setCouponInput(e.target.value.toUpperCase())}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); applyCoupon() } }}
                            placeholder="KODEKUPON"
                            className="flex-1 px-3 py-2 text-body-sm font-mono uppercase border border-hairline rounded-button focus:outline-none focus:ring-2 focus:ring-forest/30"
                          />
                          <button
                            type="button"
                            onClick={applyCoupon}
                            disabled={!couponInput.trim() || checkingCoupon}
                            className="px-4 py-2 text-button-sm font-semibold text-graphite bg-mist rounded-button hover:bg-hairline disabled:opacity-40 transition-colors shrink-0"
                          >
                            {checkingCoupon ? 'Cek...' : 'Pakai'}
                          </button>
                        </div>
                        {couponMsg && <p className="mt-1.5 text-body-xs text-red-600">{couponMsg}</p>}
                      </>
                    )}
                  </div>

                  <p className="text-body-xs text-concrete mt-3">* Kami tambahkan kode unik kecil saat konfirmasi supaya pembayaran kalian lebih mudah dicek</p>
                </div>
              )}
            </div>
          )}

          {/* Langkah 1: Data & kontak */}
          {step === 1 && (
            <div className="p-6 sm:p-8">
              <div className="flex items-center gap-2.5 mb-6">
                <div className="w-8 h-8 rounded-lg bg-forest-50 flex items-center justify-center">
                  <Users size={15} className="text-forest" />
                </div>
                <h2 className="font-display text-h2 text-graphite">Data &amp; Kontak</h2>
              </div>

              {/* Lima field, hanya yang dibutuhkan untuk membuat pesanan dan akun.
                  Dulu ada 13 field di dua langkah: nama panggilan, nama orang tua,
                  dan profesi ikut ditanyakan sebelum bayar. Semua itu isi undangan,
                  bukan syarat transaksi, dan tidak satu pun sampai ke undangan:
                  profesi tidak pernah disalin saat pesanan disetujui, sedangkan
                  nama panggilan dan orang tua disalin ke field yang tidak dibaca
                  renderer. Isi undangan dilengkapi di Studio setelah bayar. */}
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <InputField label="Nama Lengkap Mempelai Pria *" value={groomName} onChange={e => setGroomName(e.target.value)} placeholder="Muhammad Rizky Pratama, S.Kom" />
                  <InputField label="Nama Lengkap Mempelai Wanita *" value={brideName} onChange={e => setBrideName(e.target.value)} placeholder="Aulia Putri Ramadhani, S.Pd" />
                </div>

                <InputField
                  label="Email *"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="email@contoh.com"
                  hint="Kami akan kirim akses login ke email ini begitu pembayaran kalian terkonfirmasi"
                />

                <div>
                  <label className="block text-label-base text-carbon mb-1.5">Subdomain Undangan *</label>
                  <div className="flex items-center gap-0">
                    <input
                      value={subdomain}
                      onChange={e => checkSubdomain(e.target.value)}
                      placeholder="rizky-aulia"
                      className="flex-1 min-w-0 px-4 py-3 text-body-base text-graphite placeholder:text-ash bg-chalk border border-hairline rounded-l-input focus:outline-none focus:border-forest-light focus:ring-2 focus:ring-forest/15 transition-colors"
                    />
                    <span className="px-4 py-3 text-body-sm bg-mist border border-l-0 border-hairline rounded-r-input text-concrete font-mono whitespace-nowrap">
                      .iaundang.online
                    </span>
                  </div>
                  {subdomain.length >= 3 && (
                    <div className="mt-1.5 flex items-center gap-1.5">
                      {checkingSubdomain ? (
                        <><Loader2 size={12} className="animate-spin text-concrete" /><span className="text-body-xs text-concrete">Memeriksa...</span></>
                      ) : subdomainAvailable ? (
                        <><CheckCircle2 size={12} className="text-green-600" /><span className="text-body-xs text-green-700 font-medium">Tersedia!</span></>
                      ) : subdomainAvailable === false ? (
                        <><span className="text-body-xs text-red-600">Subdomain sudah digunakan, coba yang lain</span></>
                      ) : null}
                    </div>
                  )}
                  <p className="text-body-xs text-concrete mt-1">Ini akan menjadi alamat undangan kalian. Contoh: rizky-aulia.iaundang.online</p>
                </div>

                <InputField label="WhatsApp (opsional)" value={phone} onChange={e => setPhone(e.target.value)} placeholder="08123456789" />
              </div>

              {/* Rekap total di layar yang sama dengan tombol "Buat Pesanan".
                  Rincian lengkapnya ada di langkah Paket, tapi tombol itu
                  langsung membuat pesanan dan bisa mengantar ke halaman bayar
                  Mayar, jadi angka yang akan ditagih harus terlihat di sini. */}
              {selectedTier && (
                <div className="mt-6 flex items-baseline justify-between gap-3 rounded-card bg-ivory border border-hairline p-5">
                  <span className="text-body-sm text-concrete">Total paket {selectedTier.label}</span>
                  <span className="font-display text-h2 text-forest-deep">Rp {finalPrice.toLocaleString('id-ID')}</span>
                </div>
              )}
            </div>
          )}

          {/* Langkah 2: Pembayaran */}
          {step === 2 && order && (() => {
            const hasBank = paymentConfig.bankAccounts.length > 0
            const hasQris = !!paymentConfig.qrisImageUrl
            const selectedBank = paymentConfig.bankAccounts.find(b => b.id === selectedPayment)

            return (
              <div className="p-6 sm:p-8">
                <div className="text-center mb-8">
                  <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 size={28} className="text-green-600" />
                  </div>
                  <h2 className="font-display text-h1 text-graphite mb-1">Pesanan Berhasil Dibuat!</h2>
                  <p className="text-body-sm text-concrete">Pilih metode pembayaran lalu transfer sesuai nominal</p>
                </div>

                {/* Order number & amount side by side */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div className="rounded-card bg-forest-50 border border-forest-100 p-4 text-center">
                    <p className="text-label-sm uppercase tracking-wider text-forest mb-1">Nomor Pesanan</p>
                    <p className="text-body-xl font-bold font-mono text-forest-deep">{order.order_number}</p>
                  </div>
                  <div className="rounded-card bg-amber-50 border border-amber-200 p-4 text-center">
                    <p className="text-label-sm uppercase tracking-wider text-amber-700 mb-1">Total Transfer</p>
                    <p className="font-display text-h1 text-amber-900">
                      Rp {order.total_amount.toLocaleString('id-ID')}
                    </p>
                    <p className="text-body-xs text-amber-700 mt-0.5">
                      Rp {order.amount.toLocaleString('id-ID')} + Rp {order.unique_code} (kode unik)
                    </p>
                    <button onClick={() => copyText(String(order.total_amount), 'amount')} className="mt-1.5 inline-flex items-center gap-1 text-body-xs text-amber-800 hover:text-amber-900 font-medium">
                      {copied === 'amount' ? <Check size={12} /> : <Copy size={12} />} Salin nominal
                    </button>
                  </div>
                </div>

                {/* Important notice */}
                <div className="rounded-xl bg-red-50 border border-red-100 p-3 mb-8">
                  <p className="text-body-xs text-red-700 font-medium text-center">
                    Pastikan transfer sesuai nominal di atas (termasuk kode unik) agar pembayaran mudah diverifikasi
                  </p>
                </div>

                {/* Payment method selection */}
                <div className="mb-8">
                  <p className="text-body-base font-semibold text-graphite mb-1">Pilih metode pembayaran</p>
                  <p className="text-body-xs text-concrete mb-4">Klik kartu rekening atau QRIS yang ingin kamu gunakan untuk transfer</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {paymentConfig.bankAccounts.map(bank => (
                      <BankCard
                        key={bank.id}
                        bankName={bank.bankName}
                        accountNumber={bank.accountNumber}
                        accountName={bank.accountName}
                        selectable
                        selected={selectedPayment === bank.id}
                        onClick={() => setSelectedPayment(bank.id)}
                      />
                    ))}
                    {hasQris && (
                      <QrisCard
                        imageUrl={paymentConfig.qrisImageUrl}
                        selectable
                        selected={selectedPayment === 'qris'}
                        onClick={() => setSelectedPayment('qris')}
                      />
                    )}
                  </div>

                  {!hasBank && !hasQris && (
                    <div className="rounded-card border border-hairline bg-ivory p-6 text-center">
                      <Landmark size={24} className="text-smoke mx-auto mb-2" />
                      <p className="text-body-xs text-concrete">Hubungi admin via WhatsApp untuk info metode pembayaran</p>
                    </div>
                  )}
                </div>

                {/* Selected payment detail */}
                {selectedPayment && selectedPayment !== 'qris' && selectedBank && (
                  <div className="mb-8 rounded-card bg-ivory border border-hairline p-5">
                    <p className="text-eyebrow text-concrete mb-3">Detail Transfer</p>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-body-sm text-concrete">Bank</span>
                        <span className="text-body-sm font-semibold text-graphite">{selectedBank.bankName}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-body-sm text-concrete">No. Rekening</span>
                        <div className="flex items-center gap-2">
                          <span className="text-body-sm font-mono font-bold text-graphite">{selectedBank.accountNumber}</span>
                          <button onClick={() => copyText(selectedBank.accountNumber, selectedBank.id)} aria-label="Salin nomor rekening" className="text-concrete hover:text-forest">
                            {copied === selectedBank.id ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-body-sm text-concrete">Atas Nama</span>
                        <span className="text-body-sm font-semibold text-graphite">{selectedBank.accountName}</span>
                      </div>
                      <div className="border-t border-hairline pt-2 mt-2 flex justify-between items-center">
                        <span className="text-body-sm font-semibold text-carbon">Nominal Transfer</span>
                        <span className="text-body-lg font-bold text-amber-800">Rp {order.total_amount.toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedPayment === 'qris' && hasQris && (
                  <div className="mb-8 rounded-card bg-ivory border border-hairline p-5 text-center">
                    <p className="text-eyebrow text-concrete mb-4">Scan QRIS untuk Bayar</p>
                    <div className="inline-block rounded-xl bg-chalk border border-hairline p-3 shadow-card">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={paymentConfig.qrisImageUrl} alt="QRIS" className="w-52 h-52 object-contain" />
                    </div>
                    <p className="text-body-sm font-bold text-amber-800 mt-4">Rp {order.total_amount.toLocaleString('id-ID')}</p>
                    <p className="text-body-xs text-concrete mt-1">Pastikan nominal sesuai termasuk kode unik</p>
                  </div>
                )}

                {/* Payment instructions */}
                {selectedPayment && paymentConfig.paymentInstructions && (
                  <div className="mb-8 rounded-card bg-blue-50 border border-blue-100 p-5">
                    <p className="text-label-sm uppercase tracking-wider text-blue-800 mb-3">Instruksi Pembayaran</p>
                    <div className="text-body-xs text-blue-900/80 leading-relaxed whitespace-pre-line">
                      {paymentConfig.paymentInstructions}
                    </div>
                  </div>
                )}

                {/* CTA: Konfirmasi WA */}
                <div className="rounded-card bg-green-50 border border-green-200 p-5 mb-6">
                  <p className="text-body-sm font-semibold text-green-900 mb-1">Sudah transfer?</p>
                  <p className="text-body-xs text-green-800 mb-4">Kirimkan bukti transfer ke WhatsApp admin untuk verifikasi pembayaran.</p>
                  {paymentConfig.confirmationWhatsapp && (
                    <button
                      onClick={openWhatsApp}
                      className="w-full flex items-center justify-center gap-2 min-h-[48px] px-6 py-3.5 bg-green-600 text-white text-button-base font-bold rounded-button hover:bg-green-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600/50 focus-visible:ring-offset-2"
                    >
                      <Send size={16} />
                      Kirim Bukti Transfer via WhatsApp
                    </button>
                  )}
                </div>

                {/* Next steps */}
                <div className="rounded-card bg-ivory border border-hairline p-4">
                  <div className="flex items-start gap-2">
                    <Clock size={14} className="text-concrete mt-0.5 shrink-0" />
                    <div>
                      <p className="text-body-xs font-semibold text-carbon">Langkah selanjutnya</p>
                      <ol className="text-body-xs text-concrete mt-1 space-y-1 list-decimal list-inside">
                        <li>Pilih metode pembayaran di atas</li>
                        <li>Transfer sesuai nominal unik</li>
                        <li>Screenshot bukti transfer</li>
                        <li>Kirim bukti ke WhatsApp admin (klik tombol di atas)</li>
                        <li>Admin verifikasi pembayaran (maks 1x24 jam kerja)</li>
                        <li>Terima akun login via WhatsApp / email</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* Navigation */}
          {step < 2 && (
            <div className="flex items-center justify-between px-6 sm:px-8 py-4 border-t border-hairline bg-ivory/70">
              {step > 0 ? (
                <button onClick={() => setStep((step - 1) as Step)} className="flex items-center gap-1 min-h-[44px] px-3 py-2.5 -ml-2 rounded-button text-button-base text-concrete hover:text-graphite hover:bg-mist transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40">
                  <ChevronLeft size={16} /> Kembali
                </button>
              ) : <div />}

              {step === 1 ? (
                <button
                  onClick={handleSubmitOrder}
                  disabled={!canNext() || submitting}
                  className="flex items-center gap-2 min-h-[44px] px-7 py-3 bg-forest text-chalk text-button-base font-bold rounded-button hover:bg-forest-deep transition-colors disabled:bg-mist disabled:text-ash disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40 focus-visible:ring-offset-2"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <ShoppingBag size={16} />}
                  Buat Pesanan
                </button>
              ) : (
                <button
                  onClick={() => setStep((step + 1) as Step)}
                  disabled={!canNext()}
                  className="flex items-center gap-1 min-h-[44px] px-6 py-3 bg-forest text-chalk text-button-base font-semibold rounded-button hover:bg-forest-deep transition-colors disabled:bg-mist disabled:text-ash disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40 focus-visible:ring-offset-2"
                >
                  Lanjut <ChevronRight size={16} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
