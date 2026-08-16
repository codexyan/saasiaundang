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

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const templateId = searchParams.get('template') || ''
  const redirect = searchParams.get('redirect') || (templateId ? `/dashboard?template=${templateId}` : '/dashboard')
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
