'use client'

import { useState, useOptimistic } from 'react'
import toast from 'react-hot-toast'
import type { Wish } from '@/lib/types'
import { formatDate } from '@/lib/utils'

interface Props {
  invitationId: string
  initialWishes: Wish[]
  className?: string
}

export default function WishesSection({ invitationId, initialWishes, className = '' }: Props) {
  const [wishes, setWishes] = useState<Wish[]>(initialWishes)
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !message.trim()) {
      toast.error('Nama dan ucapannya belum lengkap.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/wishes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationId, name: name.trim(), message: message.trim() }),
      })
      if (!res.ok) throw new Error()

      const newWish: Wish = {
        id: Date.now().toString(),
        invitation_id: invitationId,
        name: name.trim(),
        message: message.trim(),
        created_at: new Date().toISOString(),
      }
      setWishes([newWish, ...wishes])
      setName('')
      setMessage('')
      toast.success('Terima kasih, ucapannya sudah terkirim!')
    } catch {
      toast.error('Ucapannya gagal terkirim. Coba lagi ya.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={className}>
      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-3 mb-8">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nama kamu"
          maxLength={100}
          className="w-full rounded-xl border border-current/20 bg-transparent px-4 py-2.5 text-sm placeholder-current/40 focus:outline-none focus:ring-2 focus:ring-current/30"
        />
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tulis ucapan untuk pengantin..."
          maxLength={500}
          rows={3}
          className="w-full rounded-xl border border-current/20 bg-transparent px-4 py-2.5 text-sm placeholder-current/40 focus:outline-none focus:ring-2 focus:ring-current/30 resize-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl border border-current/40 py-2.5 text-sm font-medium hover:bg-current/10 transition-colors disabled:opacity-50"
        >
          {loading ? 'Mengirim...' : 'Kirim Ucapan 💌'}
        </button>
      </form>

      {/* Wishes list */}
      {wishes.length > 0 && (
        <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
          {wishes.map((wish) => (
            <div key={wish.id} className="border border-current/10 rounded-xl p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-sm">{wish.name}</p>
                <p className="text-xs opacity-40 shrink-0">
                  {formatDate(wish.created_at, 'id-ID')}
                </p>
              </div>
              <p className="text-sm opacity-70 mt-1 leading-relaxed">{wish.message}</p>
            </div>
          ))}
        </div>
      )}

      {wishes.length === 0 && (
        <p className="text-center text-sm opacity-40 py-4">
          Belum ada ucapan. Jadilah yang pertama!
        </p>
      )}
    </div>
  )
}
