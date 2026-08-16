'use client'

import { useState, useEffect, useRef } from 'react'
import { Loader2, MessageSquare, Send, Plus, ArrowLeft, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/Button'

interface Reply {
  id: string
  message: string
  is_admin: boolean
  created_at: string
}

interface Ticket {
  id: string
  subject: string
  message: string
  status: string
  priority: string
  created_at: string
  closed_at: string | null
  replies: Reply[]
}

const STATUS_MAP: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  open:        { label: 'Terbuka',     cls: 'bg-blue-100 text-blue-700',   icon: AlertCircle },
  in_progress: { label: 'Diproses',    cls: 'bg-amber-100 text-amber-700', icon: Clock },
  resolved:    { label: 'Selesai',     cls: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  closed:      { label: 'Ditutup',     cls: 'bg-stone-100 text-stone-500', icon: CheckCircle2 },
}

export default function SupportTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'list' | 'detail' | 'create'>('list')
  const [selected, setSelected] = useState<Ticket | null>(null)

  useEffect(() => {
    fetchTickets()
  }, [])

  async function fetchTickets() {
    setLoading(true)
    try {
      const res = await fetch('/api/tickets')
      const data = await res.json()
      setTickets(data.tickets ?? [])
    } catch {
      toast.error('Pesan bantuannya gagal dimuat. Coba muat ulang halaman ya.')
    } finally {
      setLoading(false)
    }
  }

  function openDetail(ticket: Ticket) {
    setSelected(ticket)
    setView('detail')
  }

  function handleCreated(ticket: Ticket) {
    setTickets(prev => [ticket, ...prev])
    setView('list')
  }

  function handleReplyAdded(ticketId: string, reply: Reply) {
    setTickets(prev => prev.map(t =>
      t.id === ticketId ? { ...t, replies: [...t.replies, reply] } : t
    ))
    if (selected?.id === ticketId) {
      setSelected(prev => prev ? { ...prev, replies: [...prev.replies, reply] } : prev)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={24} className="animate-spin text-stone-300" />
      </div>
    )
  }

  if (view === 'create') {
    return <CreateTicket onBack={() => setView('list')} onCreated={handleCreated} />
  }

  if (view === 'detail' && selected) {
    return (
      <TicketDetail
        ticket={selected}
        onBack={() => { setView('list'); setSelected(null) }}
        onReplyAdded={(reply) => handleReplyAdded(selected.id, reply)}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-rose-500 font-semibold">Bantuan</p>
            <h2 className="mt-2 text-2xl font-semibold text-gray-900">Tiket Support</h2>
            <p className="mt-2 text-sm text-gray-500">Kirim pertanyaan atau laporan masalah ke tim kami.</p>
          </div>
          <Button size="sm" onClick={() => setView('create')}>
            <Plus size={14} className="mr-1.5" /> Buat Tiket
          </Button>
        </div>

        {tickets.length === 0 ? (
          <div className="mt-8 flex flex-col items-center justify-center py-12 text-center">
            <div className="w-14 h-14 rounded-full bg-stone-100 flex items-center justify-center mb-3">
              <MessageSquare size={24} className="text-stone-400" />
            </div>
            <p className="text-sm font-medium text-stone-600">Belum ada tiket</p>
            <p className="text-xs text-stone-400 mt-1">Buat tiket baru jika Anda memiliki pertanyaan atau kendala.</p>
          </div>
        ) : (
          <div className="mt-6 space-y-2">
            {tickets.map(t => {
              const st = STATUS_MAP[t.status] ?? STATUS_MAP.open
              const StIcon = st.icon
              return (
                <button
                  key={t.id}
                  onClick={() => openDetail(t)}
                  className="w-full text-left bg-stone-50 hover:bg-stone-100 rounded-xl p-4 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-stone-900 truncate">{t.subject}</p>
                      <p className="text-xs text-stone-500 mt-1 line-clamp-1">{t.message}</p>
                      <p className="text-[10px] text-stone-400 mt-1.5">
                        {new Date(t.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {t.replies.length > 0 && ` · ${t.replies.length} balasan`}
                      </p>
                    </div>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full shrink-0 ${st.cls}`}>
                      <StIcon size={10} />
                      {st.label}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function CreateTicket({ onBack, onCreated }: { onBack: () => void; onCreated: (t: Ticket) => void }) {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!subject.trim() || !message.trim()) return

    setSending(true)
    const res = await fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, message }),
    })
    setSending(false)

    if (res.ok) {
      const data = await res.json()
      toast.success('Pesan kalian sudah terkirim. Kami balas secepatnya ya!')
      onCreated(data.ticket)
    } else {
      const { error } = await res.json()
      toast.error(error || 'Gagal membuat tiket')
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-700 mb-4">
          <ArrowLeft size={14} /> Kembali
        </button>

        <h2 className="text-xl font-semibold text-gray-900 mb-4">Buat Tiket Baru</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-500 mb-1.5">Subjek</label>
            <input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Contoh: Tidak bisa upload foto"
              className="w-full px-3.5 py-2.5 text-sm border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-400 bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-500 mb-1.5">Pesan</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={5}
              placeholder="Jelaskan masalah atau pertanyaan Anda secara detail..."
              className="w-full px-3.5 py-2.5 text-sm border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-400 bg-white resize-none"
            />
          </div>
          <Button type="submit" loading={sending} disabled={!subject.trim() || !message.trim()}>
            Kirim Tiket
          </Button>
        </form>
      </div>
    </div>
  )
}

function TicketDetail({ ticket, onBack, onReplyAdded }: { ticket: Ticket; onBack: () => void; onReplyAdded: (reply: Reply) => void }) {
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const st = STATUS_MAP[ticket.status] ?? STATUS_MAP.open
  const StIcon = st.icon
  const isClosed = ticket.status === 'closed'

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [ticket.replies.length])

  async function handleReply(e: React.FormEvent) {
    e.preventDefault()
    if (!replyText.trim()) return

    setSending(true)
    const res = await fetch(`/api/tickets/${ticket.id}/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: replyText }),
    })
    setSending(false)

    if (res.ok) {
      const data = await res.json()
      onReplyAdded(data.reply)
      setReplyText('')
    } else {
      const { error } = await res.json()
      toast.error(error || 'Gagal mengirim balasan')
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-700 mb-4">
          <ArrowLeft size={14} /> Kembali
        </button>

        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{ticket.subject}</h2>
            <p className="text-xs text-stone-400 mt-1">
              {new Date(ticket.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${st.cls}`}>
            <StIcon size={12} />
            {st.label}
          </span>
        </div>

        {/* Original message */}
        <div className="bg-stone-50 rounded-xl p-4 mb-4">
          <p className="text-sm text-stone-700 whitespace-pre-wrap">{ticket.message}</p>
        </div>

        {/* Replies thread */}
        {ticket.replies.length > 0 && (
          <div className="space-y-3 mb-4">
            {ticket.replies.map(r => (
              <div key={r.id} className={`rounded-xl p-4 ${r.is_admin ? 'bg-blue-50 border border-blue-100' : 'bg-stone-50'}`}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.is_admin ? 'bg-blue-200 text-blue-800' : 'bg-stone-200 text-stone-600'}`}>
                    {r.is_admin ? 'Admin' : 'Anda'}
                  </span>
                  <span className="text-[10px] text-stone-400">
                    {new Date(r.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-sm text-stone-700 whitespace-pre-wrap">{r.message}</p>
              </div>
            ))}
          </div>
        )}

        <div ref={bottomRef} />

        {/* Reply form */}
        {!isClosed ? (
          <form onSubmit={handleReply} className="flex items-end gap-2 pt-3 border-t border-stone-100">
            <textarea
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              rows={2}
              placeholder="Tulis balasan..."
              className="flex-1 px-3.5 py-2.5 text-sm border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-400 bg-white resize-none"
            />
            <Button type="submit" size="sm" loading={sending} disabled={!replyText.trim()}>
              <Send size={14} />
            </Button>
          </form>
        ) : (
          <div className="pt-3 border-t border-stone-100 text-center">
            <p className="text-xs text-stone-400">Tiket ini sudah ditutup.</p>
          </div>
        )}
      </div>
    </div>
  )
}
