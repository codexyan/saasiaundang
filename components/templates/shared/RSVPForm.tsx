'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'

const schema = z.object({
  name: z.string().min(1, 'Namanya belum diisi.'),
  attending: z.enum(['yes', 'no']),
  totalGuests: z.number().min(1).max(10),
})
type FormData = z.infer<typeof schema>

interface Props {
  invitationId: string
  className?: string
  accentColor?: string
}

export default function RSVPForm({ invitationId, className = '', accentColor = '#e11d48' }: Props) {
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { attending: 'yes', totalGuests: 1 },
  })

  const attending = watch('attending')

  async function onSubmit(data: FormData) {
    setLoading(true)
    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invitationId,
          name: data.name,
          attending: data.attending === 'yes',
          totalGuests: data.attending === 'yes' ? data.totalGuests : 0,
        }),
      })
      if (!res.ok) throw new Error()
      setSubmitted(true)
      toast.success('Terima kasih, konfirmasi kehadiran sudah terkirim!')
    } catch {
      toast.error('Konfirmasinya gagal terkirim. Coba lagi ya.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-4xl mb-3">💌</div>
        <p className="font-sans text-lg font-semibold">Terima kasih!</p>
        <p className="text-sm opacity-70 mt-1">Konfirmasi RSVP kamu telah kami terima.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={`space-y-4 ${className}`}>
      <div>
        <label className="block text-sm font-medium mb-1.5">Nama kamu</label>
        <input
          {...register('name')}
          placeholder="Tulis nama lengkap"
          className="w-full rounded-xl border border-current/20 bg-transparent px-4 py-2.5 text-sm placeholder-current/40 focus:outline-none focus:ring-2 focus:ring-current/30"
        />
        {errors.name && <p className="text-xs mt-1 opacity-70">{errors.name.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Konfirmasi kehadiran</label>
        <div className="flex gap-3">
          {[
            { value: 'yes', label: '✓ Hadir' },
            { value: 'no', label: '✗ Tidak Hadir' },
          ].map((opt) => (
            <label
              key={opt.value}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm cursor-pointer transition-colors ${
                attending === opt.value
                  ? 'border-current bg-current/10 font-medium'
                  : 'border-current/20 opacity-60'
              }`}
            >
              <input
                {...register('attending')}
                type="radio"
                value={opt.value}
                className="sr-only"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      {attending === 'yes' && (
        <div>
          <label className="block text-sm font-medium mb-1.5">Jumlah tamu (termasuk kamu)</label>
          <select
            {...register('totalGuests', { valueAsNumber: true })}
            className="w-full rounded-xl border border-current/20 bg-transparent px-4 py-2.5 text-sm focus:outline-none"
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>{n} orang</option>
            ))}
          </select>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl py-3 text-sm font-semibold transition-opacity disabled:opacity-60"
        style={{ backgroundColor: accentColor, color: 'white' }}
      >
        {loading ? 'Mengirim...' : 'Kirim RSVP'}
      </button>
    </form>
  )
}
