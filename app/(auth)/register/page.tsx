'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { ArrowRight, Loader2, Check } from 'lucide-react'
import { TEMPLATES } from '@/lib/types'
import { AuthCard } from '@/components/marketing/AuthCard'
import { InputField, PasswordField } from '@/components/marketing/Field'
import { Button } from '@/components/marketing/Button'

const schema = z
  .object({
    email: z.string().email('Email tidak valid'),
    password: z.string().min(6, 'Password minimal 6 karakter'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Password tidak cocok',
    path: ['confirmPassword'],
  })

type FormData = z.infer<typeof schema>

function RegisterContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const templateId = searchParams.get('template') || ''
  const selectedTemplate = TEMPLATES.find((t) => t.id === templateId)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setLoading(true)
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: data.email, password: data.password }),
    })
    setLoading(false)
    if (!res.ok) {
      const err = await res.json()
      toast.error(err.error || 'Gagal mendaftar')
      return
    }
    toast.success('Akun kalian sudah jadi! 🎉')
    router.push(templateId ? `/dashboard?template=${templateId}` : '/dashboard')
    router.refresh()
  }

  return (
    <AuthCard>
      <div className="mb-6">
        <h1 className="font-display text-display-md text-forest-deep">Daftar Gratis</h1>
        <p className="text-body-sm text-concrete mt-2">
          {selectedTemplate
            ? `Template ${selectedTemplate.name} siap dipakai setelah daftar.`
            : 'Coba dulu sepuasnya, bayar saat siap publish.'}
        </p>
      </div>

      {selectedTemplate && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-button bg-forest-50 border border-forest-100 mb-4">
          <span className="w-3.5 h-3.5 rounded-full bg-forest flex items-center justify-center shrink-0">
            <Check size={9} strokeWidth={3} className="text-chalk" />
          </span>
          <span className="text-body-xs text-carbon">
            <strong>{selectedTemplate.name}</strong> dipilih
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
        <InputField
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="kamu@email.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <PasswordField
          label="Password"
          autoComplete="new-password"
          placeholder="Min. 6 karakter"
          error={errors.password?.message}
          {...register('password')}
        />

        <PasswordField
          label="Konfirmasi Password"
          autoComplete="new-password"
          placeholder="Ulangi password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="animate-spin h-4 w-4" />
              <span>Mendaftar...</span>
            </>
          ) : (
            <>
              <span>{selectedTemplate ? 'Daftar & Lanjut' : 'Daftar'}</span>
              <ArrowRight size={14} />
            </>
          )}
        </Button>
      </form>

      <div className="relative my-5" aria-hidden>
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-hairline" />
        </div>
        <div className="relative flex justify-center">
          <span className="px-3 bg-chalk text-body-xs text-concrete">atau</span>
        </div>
      </div>

      <p className="text-body-sm text-concrete">
        Sudah punya akun?{' '}
        <Link
          href={templateId ? `/login?template=${templateId}` : '/login'}
          className="font-semibold text-forest hover:text-forest-deep transition-colors"
        >
          Masuk
        </Link>
      </p>
    </AuthCard>
  )
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterContent />
    </Suspense>
  )
}
