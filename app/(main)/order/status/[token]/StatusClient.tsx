'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { CheckCircle2, Clock, Loader2, MessageCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/marketing/Button'
import type { OrderStatusView } from '@/lib/order-status'

const POLL_MS = 5000
/** 24 kali 5 detik, jadi dua menit. Sesudah itu pembeli yang memutuskan. */
const MAX_POLLS = 24

interface Props {
  token: string
  initial: OrderStatusView | null
  whatsapp: string
  appDomain: string
}

export default function StatusClient({ token, initial, whatsapp, appDomain }: Props) {
  const [view, setView] = useState<OrderStatusView | null>(initial)
  const [gone, setGone] = useState(initial === null)
  const [polling, setPolling] = useState(initial?.state === 'menunggu')
  const [checking, setChecking] = useState(false)
  const polls = useRef(0)

  const check = useCallback(async () => {
    setChecking(true)
    try {
      const res = await fetch(`/api/orders/status?token=${encodeURIComponent(token)}`)
      if (res.status === 404) {
        setGone(true)
        setPolling(false)
        return
      }
      const data = await res.json()
      if (data.status) {
        setView(data.status)
        if (data.status.state !== 'menunggu') setPolling(false)
      }
    } catch {
      // Jaringan putus sebentar bukan alasan mengganti isi layar. Percobaan
      // berikutnya menutupinya, dan tombol "Cek ulang" selalu tersedia.
    } finally {
      setChecking(false)
    }
  }, [token])

  useEffect(() => {
    if (!polling) return
    const id = setInterval(() => {
      polls.current += 1
      if (polls.current > MAX_POLLS) {
        setPolling(false)
        return
      }
      check()
    }, POLL_MS)
    return () => clearInterval(id)
  }, [polling, check])

  const wa = whatsapp ? `https://wa.me/${whatsapp}` : null

  return (
    <div className="max-w-lg mx-auto px-4 py-14 sm:py-20">
      <div className="bg-chalk rounded-card border border-hairline shadow-card p-6 sm:p-8">
        {gone || !view ? (
          <Kedaluwarsa wa={wa} />
        ) : view.state === 'lunas' ? (
          <Lunas view={view} appDomain={appDomain} />
        ) : view.state === 'ditolak' ? (
          <Ditolak view={view} wa={wa} />
        ) : (
          <Menunggu
            view={view}
            polling={polling}
            checking={checking}
            onCheck={() => { polls.current = 0; check() }}
          />
        )}
      </div>

      {!gone && view && wa && view.state !== 'ditolak' && (
        <p className="text-body-sm text-concrete text-center mt-6">
          Ada yang ingin ditanyakan?{' '}
          <a href={wa} target="_blank" rel="noopener noreferrer" className="text-forest font-medium underline underline-offset-2">
            Chat kami lewat WhatsApp
          </a>
        </p>
      )}
    </div>
  )
}

function Rincian({ view }: { view: OrderStatusView }) {
  return (
    <dl className="mt-6 border-t border-hairline pt-5 space-y-2.5">
      <Baris label="Nomor pesanan" value={view.orderNumber} />
      <Baris label="Paket" value={view.tierLabel} />
      <Baris label="Total" value={`Rp ${view.totalAmount.toLocaleString('id-ID')}`} />
      <Baris label="Email" value={view.emailMasked} />
    </dl>
  )
}

function Baris({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-body-sm text-concrete">{label}</dt>
      <dd className="text-body-sm font-medium text-forest-deep text-right">{value}</dd>
    </div>
  )
}

function Menunggu({
  view, polling, checking, onCheck,
}: {
  view: OrderStatusView
  polling: boolean
  checking: boolean
  onCheck: () => void
}) {
  return (
    <>
      <div className="w-11 h-11 rounded-xl bg-gold-50 border border-gold-200 flex items-center justify-center">
        <Clock size={20} className="text-gold-700" aria-hidden />
      </div>
      <h1 className="text-h3 font-display text-forest-deep mt-5">Kami menunggu konfirmasi pembayaran</h1>
      <p className="text-body-base text-concrete mt-2 leading-relaxed">
        Pesanan kalian sudah masuk. Begitu pembayarannya terkonfirmasi, halaman ini berganti sendiri
        dan kami kirim langkah berikutnya lewat email.
      </p>

      <p className="text-body-sm text-concrete mt-4 flex items-center gap-2" aria-live="polite">
        {polling ? (
          <>
            <Loader2 size={14} className="animate-spin text-forest" aria-hidden />
            Memeriksa tiap 5 detik
          </>
        ) : (
          'Belum ada perubahan dalam dua menit terakhir.'
        )}
      </p>

      <Rincian view={view} />

      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        {view.paymentUrl && (
          <Button href={view.paymentUrl} external variant="primary" className="w-full sm:w-auto">
            Lanjutkan pembayaran
          </Button>
        )}
        {!polling && (
          <Button onClick={onCheck} variant="secondary" disabled={checking} className="w-full sm:w-auto">
            {checking ? 'Memeriksa...' : 'Cek ulang'}
          </Button>
        )}
      </div>
    </>
  )
}

function Lunas({ view, appDomain }: { view: OrderStatusView; appDomain: string }) {
  return (
    <>
      <div className="w-11 h-11 rounded-xl bg-forest-50 border border-forest-100 flex items-center justify-center">
        <CheckCircle2 size={20} className="text-forest" aria-hidden />
      </div>
      <h1 className="text-h3 font-display text-forest-deep mt-5">Pembayaran kalian sudah kami terima</h1>
      <p className="text-body-base text-concrete mt-2 leading-relaxed">
        Kami sudah mengirim email ke <strong className="text-forest-deep">{view.emailMasked}</strong> berisi
        langkah untuk masuk ke akun kalian. Cek juga folder spam kalau belum terlihat.
      </p>
      <p className="text-body-base text-concrete mt-3 leading-relaxed">
        Alamat undangan <strong className="text-forest-deep">{view.subdomain}.{appDomain}</strong> sudah
        kami kunci untuk kalian. Tamu baru bisa membukanya setelah kalian melengkapi isi undangan dan
        menekan publikasikan.
      </p>

      <Rincian view={view} />
    </>
  )
}

function Ditolak({ view, wa }: { view: OrderStatusView; wa: string | null }) {
  return (
    <>
      <div className="w-11 h-11 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center">
        <XCircle size={20} className="text-red-600" aria-hidden />
      </div>
      <h1 className="text-h3 font-display text-forest-deep mt-5">Pesanan ini belum bisa kami proses</h1>
      <p className="text-body-base text-concrete mt-2 leading-relaxed">
        {view.adminNotes || 'Belum ada catatan alasannya. Hubungi kami dan pesanan ini kami periksa ulang.'}
      </p>

      <Rincian view={view} />

      {wa && (
        <div className="mt-6">
          <Button href={wa} external variant="primary" className="w-full sm:w-auto">
            <MessageCircle size={16} aria-hidden />
            Hubungi kami
          </Button>
        </div>
      )}
    </>
  )
}

function Kedaluwarsa({ wa }: { wa: string | null }) {
  return (
    <>
      <div className="w-11 h-11 rounded-xl bg-mist border border-hairline flex items-center justify-center">
        <Clock size={20} className="text-concrete" aria-hidden />
      </div>
      <h1 className="text-h3 font-display text-forest-deep mt-5">Tautannya sudah tidak berlaku</h1>
      <p className="text-body-base text-concrete mt-2 leading-relaxed">
        Tautan status pesanan berlaku 7 hari sejak pesanan dibuat. Kalau kalian sudah membayar,
        pesanannya tetap aman: kirim nomor pesanan atau email kalian ke kami, dan kami carikan.
      </p>

      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        {wa && (
          <Button href={wa} external variant="primary" className="w-full sm:w-auto">
            <MessageCircle size={16} aria-hidden />
            Hubungi kami
          </Button>
        )}
        <Button href="/login" variant="secondary" className="w-full sm:w-auto">
          Masuk ke akun
        </Button>
      </div>
    </>
  )
}
