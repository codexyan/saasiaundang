'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { ArrowRight, KeyRound, CheckCircle, Loader2 } from 'lucide-react'
import { AuthCard } from '@/components/marketing/AuthCard'
import { PasswordField } from '@/components/marketing/Field'
import { Button } from '@/components/marketing/Button'

const schema = z
  .object({
    password: z.string().min(6, 'Password minimal 6 karakter'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Password tidak cocok',
    path: ['confirmPassword'],
  })

type FormData = z.infer<typeof schema>

type TokenState = 'checking' | 'valid' | 'invalid'

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''

  const [tokenState, setTokenState] = useState<TokenState>('checking')
  const [tokenError, setTokenError] = useState('')
  const [email, setEmail] = useState('')
  // Tautan dari pembelian membuat password PERTAMA sebuah akun; tautan dari
  // Lupa password mengganti password yang sudah ada. Kalimat di halaman ini
  // mengikuti asal tokennya, bukan satu teks untuk keduanya.
  const [dariPembelian, setDariPembelian] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (!token) {
      setTokenState('invalid')
      setTokenError('Link reset tidak lengkap. Silakan minta link baru.')
      return
    }
    fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.valid) {
          setEmail(data.email || '')
          setDariPembelian(data.purpose === 'purchase')
          setTokenState('valid')
        } else {
          setTokenState('invalid')
          setTokenError(
            data.expired
              ? 'Link reset sudah kadaluarsa. Silakan minta link baru.'
              : 'Link reset tidak valid. Silakan minta link baru.'
          )
        }
      })
      .catch(() => {
        setTokenState('invalid')
        setTokenError('Gagal memeriksa link reset. Coba muat ulang halaman.')
      })
  }, [token])

  async function onSubmit(data: FormData) {
    setLoading(true)
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password: data.password }),
    })
    setLoading(false)
    if (!res.ok) {
      const err = await res.json()
      toast.error(err.error || 'Gagal mereset password')
      return
    }
    setSuccess(true)
    toast.success(dariPembelian ? 'Password kalian sudah dibuat' : 'Password baru kalian sudah aktif')
    setTimeout(() => router.push('/login'), 2500)
  }

  if (tokenState === 'checking') {
    return (
      <AuthCard backHref="/login">
        <div className="text-center py-6">
          <Loader2 className="w-6 h-6 text-concrete animate-spin mx-auto mb-3" />
          <p className="text-body-sm text-concrete">Memeriksa tautannya...</p>
        </div>
      </AuthCard>
    )
  }

  if (tokenState === 'invalid') {
    return (
      <AuthCard backHref="/login">
        <div className="text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center">
            <KeyRound className="w-6 h-6 text-amber-700" />
          </div>
          <h1 className="font-display text-h1 text-forest-deep mb-2">Link Tidak Berlaku</h1>
          <p className="text-body-xs text-concrete mb-6">{tokenError}</p>
          <div className="space-y-3">
            <Button href="/forgot-password" className="w-full">
              <span>Minta Link Baru</span>
              <ArrowRight size={14} />
            </Button>
            <Button href="/login" variant="secondary" className="w-full">
              Kembali ke Login
            </Button>
          </div>
        </div>
      </AuthCard>
    )
  }

  if (success) {
    return (
      <AuthCard backHref="/login">
        <div className="text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="w-7 h-7 text-green-600" />
          </div>
          <h1 className="font-display text-h1 text-forest-deep mb-2">
            {dariPembelian ? 'Password Kalian Sudah Siap' : 'Password Berhasil Diganti'}
          </h1>
          <p className="text-body-xs text-concrete mb-6">
            {dariPembelian
              ? 'Kami arahkan ke halaman masuk. Pakai email kalian dan password yang barusan dibuat.'
              : 'Kami arahkan ke halaman masuk. Silakan masuk dengan password baru.'}
          </p>
          <Button href="/login" className="w-full">
            <span>Masuk Sekarang</span>
            <ArrowRight size={14} />
          </Button>
        </div>
      </AuthCard>
    )
  }

  return (
    <AuthCard backHref="/login">
      <div className="mb-8">
        <h1 className="font-display text-display-md text-forest-deep">
          {dariPembelian ? 'Buat Password Kalian' : 'Buat Password Baru'}
        </h1>
        <p className="text-body-sm text-concrete mt-2">
          {dariPembelian
            ? <>Password pertama untuk akun {email ? <strong className="text-graphite">{email}</strong> : 'kalian'}. Sesudah ini kalian bisa masuk dan mulai mengisi undangan.</>
            : email
              ? <>untuk akun <strong className="text-graphite">{email}</strong></>
              : 'Masukkan password baru untuk akunmu'}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <PasswordField
          label={dariPembelian ? 'Password' : 'Password Baru'}
          autoComplete="new-password"
          placeholder="Min. 6 karakter"
          error={errors.password?.message}
          {...register('password')}
        />

        <PasswordField
          label={dariPembelian ? 'Konfirmasi Password' : 'Konfirmasi Password Baru'}
          autoComplete="new-password"
          placeholder="Ulangi password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="animate-spin h-4 w-4" />
              <span>Menyimpan...</span>
            </>
          ) : (
            <>
              <span>{dariPembelian ? 'Simpan Password' : 'Simpan Password Baru'}</span>
              <ArrowRight size={14} />
            </>
          )}
        </Button>
      </form>
    </AuthCard>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  )
}
