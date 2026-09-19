'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { ArrowRight, Loader2 } from 'lucide-react'
import { AuthCard } from '@/components/marketing/AuthCard'
import { InputField, PasswordField } from '@/components/marketing/Field'
import { Button } from '@/components/marketing/Button'

const schema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
})
type FormData = z.infer<typeof schema>

// Origin bayangan untuk mengurai ?redirect=. Domain .invalid tidak mungkin
// dimiliki siapa pun, jadi hasil urai yang origin-nya berbeda pasti menunjuk
// ke situs lain.
const REDIRECT_BASE = 'https://iaundang.invalid'

/**
 * Tujuan sesudah masuk, hanya path di situs ini sendiri.
 *
 * Dulu nilai ?redirect= diteruskan apa adanya ke router.push. Tautan seperti
 * /login?redirect=https://situs-lain melempar pengguna yang baru saja
 * memasukkan password ke situs lain yang bisa meniru halaman iaundang (open
 * redirect). Nilainya sekarang diurai dengan URL() yang mengikuti aturan
 * browser, jadi bentuk licin seperti //situs-lain atau /\situs-lain ikut
 * tertolak.
 */
function safeRedirect(value: string | null): string | null {
  if (!value) return null
  try {
    const url = new URL(value, REDIRECT_BASE)
    if (url.origin !== REDIRECT_BASE) return null
    return url.pathname + url.search + url.hash
  } catch {
    return null
  }
}

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const templateId = searchParams.get('template') || ''
  const redirect = safeRedirect(searchParams.get('redirect')) || (templateId ? `/dashboard?template=${templateId}` : '/dashboard')
  // Pembeli yang kembali dari halaman bayar Mayar tanpa sesi. Middleware kini
  // membawa /dashboard?payment=success ke sini lewat ?redirect=; tanpa penanda
  // ini halaman login diam saja soal pembayaran yang baru terjadi.
  const fromPayment = new URL(redirect, REDIRECT_BASE).searchParams.get('payment') === 'success'
  // Dikirim /api/auth/logout saat sesi lama dicabut (reset password atau
  // ganti role). Tanpa ini halaman login diam saja, dan orangnya tidak
  // pernah tahu kenapa ia tiba tiba dikeluarkan.
  const sesiBerakhir = searchParams.get('alasan') === 'sesi-berakhir'
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setLoading(true)
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    setLoading(false)
    if (!res.ok) {
      toast.error('Email atau passwordnya belum cocok. Coba periksa lagi ya.', { icon: '🔐' })
      return
    }
    const { user } = await res.json()
    toast.success('Berhasil masuk! 🎉')
    const isAdmin = user?.role === 'admin' || user?.isAdmin === true
    const isWriterRole = user?.role === 'content_writer'
    const isAffiliateRole = user?.role === 'affiliate'
    const destination = isAdmin ? '/admin' : isWriterRole ? '/writer' : isAffiliateRole ? '/affiliate' : redirect
    router.push(destination)
    router.refresh()
  }

  return (
    <AuthCard>
      <div className="mb-8">
        <h1 className="font-display text-display-md text-forest-deep">Masuk ke Akun</h1>
        <p className="text-body-sm text-concrete mt-2">Kelola undangan dan tamu kalian dari satu tempat.</p>

        {sesiBerakhir && (
          <p className="mt-4 text-body-sm text-graphite bg-mist border border-hairline rounded-card px-4 py-3">
            Sesi sebelumnya sudah berakhir karena password atau akses akunmu baru saja berubah.
            Masuk lagi dengan password yang baru ya.
          </p>
        )}

        {/*
          Sengaja TIDAK berbunyi "pembayaranmu sudah kami terima". Penanda
          payment=success datang dari alamat kembalian yang bisa diketik siapa
          saja, jadi kalimat itu akan jadi pengakuan pembayaran yang belum
          tentu benar. Yang boleh dikatakan cuma: kamu baru saja dari halaman
          bayar, statusnya dilihat sesudah masuk.
        */}
        {fromPayment && (
          <p className="mt-4 text-body-sm text-graphite bg-mist border border-hairline rounded-card px-4 py-3">
            Kamu baru saja kembali dari halaman pembayaran. Masuk dulu ya,
            status pesanannya ada di dashboard.
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <InputField
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="nama@email.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <PasswordField
          label="Password"
          autoComplete="current-password"
          placeholder="Masukkan password"
          error={errors.password?.message}
          labelAction={
            <Link href="/forgot-password" className="text-label-sm text-forest hover:text-forest-deep transition-colors">
              Lupa?
            </Link>
          }
          {...register('password')}
        />

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="animate-spin h-4 w-4" />
              <span>Masuk...</span>
            </>
          ) : (
            <>
              <span>Masuk</span>
              <ArrowRight size={14} />
            </>
          )}
        </Button>
      </form>

      <div className="relative my-6" aria-hidden>
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-hairline" />
        </div>
        <div className="relative flex justify-center">
          <span className="px-3 bg-chalk text-body-xs text-concrete">atau</span>
        </div>
      </div>

      <p className="text-body-sm text-concrete">
        Belum punya akun?{' '}
        <Link
          href={templateId ? `/order?template=${templateId}` : '/templates'}
          className="font-semibold text-forest hover:text-forest-deep transition-colors"
        >
          Buat undangan
        </Link>
      </p>
    </AuthCard>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}
