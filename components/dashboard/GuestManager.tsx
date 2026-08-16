'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  Plus, Trash2, Send, Copy, Download, Search, Users,
  CheckCircle2, Clock, MessageSquare, Lock, Crown,
  Loader2,
} from 'lucide-react'
import type { Invitation, Guest } from '@/lib/types'
import { getPackage, type PackageTier } from '@/lib/packages'
import { getInvitationUrl } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

interface Props {
  invitation: Invitation
}

interface GuestStats {
  total: number
  attending: number
  declined: number
  pending: number
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  return digits.startsWith('0') ? `62${digits.slice(1)}` : digits
}

function generateWaLink(phone: string, message: string): string {
  return `https://wa.me/${normalizePhone(phone)}?text=${encodeURIComponent(message)}`
}

export default function GuestManager({ invitation }: Props) {
  const [contacts, setContacts] = useState<Guest[]>([])
  const [stats, setStats] = useState<GuestStats>({ total: 0, attending: 0, declined: 0, pending: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterSent, setFilterSent] = useState<'all' | 'sent' | 'unsent'>('all')
  const [showAddForm, setShowAddForm] = useState(false)
  const [showBlast, setShowBlast] = useState(false)
  const [newGuest, setNewGuest] = useState({ name: '', phone: '', group: '', note: '' })

  const tier = (invitation.package_tier ?? 'popular') as PackageTier
  const pkg = getPackage(tier)
  const maxGuests = pkg.maxGuests
  const isAtLimit = maxGuests !== -1 && contacts.length >= maxGuests

  const invUrl = getInvitationUrl(invitation.slug)

  const defaultMessage = useCallback((name: string) =>
    `Assalamu'alaikum Yth. ${name},\n\nKami mengundang kehadiran Bapak/Ibu/Saudara/i dalam acara pernikahan kami.\n\n🔗 Undangan digital: ${invUrl}\n\nMohon hadir ya, terima kasih 💝`,
    [invUrl])

  const fetchGuests = useCallback(async () => {
    try {
      const res = await fetch(`/api/guests?invitation_id=${invitation.id}`)
      if (!res.ok) return
      const data = await res.json()
      setContacts(data.guests ?? [])
      setStats(data.stats ?? { total: 0, attending: 0, declined: 0, pending: 0 })
    } catch { /* ignore */ }
  }, [invitation.id])

  useEffect(() => {
    fetchGuests().finally(() => setLoading(false))
  }, [fetchGuests])

  const filtered = useMemo(() => {
    return contacts.filter(c => {
      const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search)
      const matchFilter = filterSent === 'all'
        ? true
        : filterSent === 'sent' ? !!c.blast_sent_at : !c.blast_sent_at
      return matchSearch && matchFilter
    })
  }, [contacts, search, filterSent])

  const sentCount = contacts.filter(c => c.blast_sent_at).length
  const unsentCount = contacts.filter(c => c.phone && !c.blast_sent_at).length

  async function addGuest() {
    if (!newGuest.name.trim()) { toast.error('Namanya belum diisi.'); return }
    if (!newGuest.phone.trim()) { toast.error('Nomor WhatsApp-nya belum diisi.'); return }
    if (newGuest.phone.replace(/\D/g, '').length < 9) { toast.error('Nomor WhatsApp-nya belum benar. Contoh: 08123456789'); return }
    if (isAtLimit) { toast.error(`Batas ${maxGuests} tamu di paket ${pkg.name}`); return }

    const res = await fetch('/api/guests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        invitation_id: invitation.id,
        name: newGuest.name.trim(),
        phone: newGuest.phone.trim(),
        group: newGuest.group.trim(),
        note: newGuest.note.trim(),
      }),
    })
    if (!res.ok) { toast.error('Tamunya gagal ditambahkan. Coba lagi ya.'); return }

    const { guest } = await res.json()
    setContacts(prev => [guest, ...prev])
    setNewGuest({ name: '', phone: '', group: '', note: '' })
    setShowAddForm(false)
    toast.success('Tamunya sudah ditambahkan!')
  }

  async function removeGuest(id: string) {
    const res = await fetch(`/api/guests?id=${id}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('Gagal dihapus. Coba lagi ya.'); return }
    setContacts(prev => prev.filter(c => c.id !== id))
    toast.success('Tamunya sudah dihapus.')
  }

  async function markSent(ids: string[]) {
    await fetch('/api/guests/blast-sent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    }).catch(() => {})
    const now = new Date().toISOString()
    setContacts(prev => prev.map(c => ids.includes(c.id) ? { ...c, blast_sent_at: now } : c))
  }

  function openWa(contact: Guest) {
    const msg = defaultMessage(contact.name)
    window.open(generateWaLink(contact.phone, msg), '_blank')
    markSent([contact.id])
  }

  function blastAll() {
    const targets = contacts.filter(c => c.phone && !c.blast_sent_at)
    if (targets.length === 0) { toast.error('Semua tamu sudah dikirimi undangan.'); return }
    const ids: string[] = []
    targets.forEach(c => {
      window.open(generateWaLink(c.phone, defaultMessage(c.name)), '_blank')
      ids.push(c.id)
    })
    markSent(ids)
    toast.success(`${targets.length} pesan WhatsApp dibuka`)
    setShowBlast(false)
  }

  function exportCsv() {
    const rows = [['Nama', 'Nomor WA', 'Grup', 'RSVP', 'Status Blast', 'Catatan']]
    contacts.forEach(c => rows.push([
      c.name, c.phone, c.group ?? '',
      c.attending === true ? 'Hadir' : c.attending === false ? 'Berhalangan' : 'Belum RSVP',
      c.blast_sent_at ? 'Terkirim' : 'Belum', c.note ?? '',
    ]))
    const csv = rows.map(r => r.map(v => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `tamu-${invitation.slug}.csv`; a.click()
    URL.revokeObjectURL(url)
    toast.success('Daftar tamunya sudah diunduh!')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-stone-300" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Tamu', value: contacts.length, icon: Users, color: 'bg-blue-50 text-blue-600 border-blue-100' },
          { label: 'Hadir (RSVP)', value: stats.attending, icon: CheckCircle2, color: 'bg-green-50 text-green-600 border-green-100' },
          { label: 'Belum Blast', value: unsentCount, icon: Clock, color: 'bg-amber-50 text-amber-600 border-amber-100' },
          { label: 'Batas Paket', value: maxGuests === -1 ? '∞' : maxGuests, icon: Crown, color: 'bg-gold-50 text-gold-600 border-rose-100' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border p-4 ${s.color}`}>
            <s.icon size={16} className="mb-2 opacity-70" />
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs opacity-70 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Limit warning */}
      {isAtLimit && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <Lock size={16} className="text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="font-bold text-amber-900 text-sm">Batas {maxGuests} tamu tercapai</p>
            <p className="text-xs text-amber-700 mt-0.5">Upgrade paket untuk menambah lebih banyak tamu.</p>
            <button className="mt-2 text-xs text-amber-700 font-bold underline">Upgrade →</button>
          </div>
        </div>
      )}

      {/* Actions bar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setShowAddForm(p => !p)}
            disabled={isAtLimit}
            className="flex items-center gap-2 px-4 py-2.5 bg-gold-600 hover:bg-rose-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <Plus size={16} /> Tambah Tamu
          </button>

          {unsentCount > 0 && (
            <button
              onClick={() => setShowBlast(p => !p)}
              className="flex items-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              <Send size={16} /> Kirim Semua ({unsentCount})
            </button>
          )}

          <Button variant="secondary" onClick={exportCsv} disabled={contacts.length === 0}>
            <Download size={16} /> Export CSV
          </Button>

          <Button
            variant="secondary"
            onClick={() => {
              navigator.clipboard.writeText(invUrl)
              toast.success('Tautan undangan sudah disalin!')
            }}
          >
            <Copy size={16} /> Salin Link
          </Button>
        </div>

        {/* Add form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="border border-rose-100 rounded-2xl p-4 bg-gold-50/30 mb-4 space-y-3">
                <h4 className="font-bold text-gray-900 text-sm">Tambah Tamu Baru</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">Nama *</label>
                    <input
                      value={newGuest.name}
                      onChange={e => setNewGuest(p => ({ ...p, name: e.target.value }))}
                      placeholder="Nama tamu"
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">No. WhatsApp *</label>
                    <input
                      value={newGuest.phone}
                      onChange={e => setNewGuest(p => ({ ...p, phone: e.target.value }))}
                      placeholder="08xx-xxxx-xxxx"
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">Grup (opsional)</label>
                    <input
                      value={newGuest.group}
                      onChange={e => setNewGuest(p => ({ ...p, group: e.target.value }))}
                      placeholder="Keluarga, Teman, Kantor..."
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">Catatan (opsional)</label>
                    <input
                      value={newGuest.note}
                      onChange={e => setNewGuest(p => ({ ...p, note: e.target.value }))}
                      placeholder="Info tambahan..."
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={addGuest}
                    className="flex-1 py-2.5 bg-gold-600 text-white text-sm font-bold rounded-xl hover:bg-rose-700 transition-colors"
                  >
                    Tambah
                  </button>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Blast confirmation */}
        <AnimatePresence>
          {showBlast && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="border border-green-200 rounded-2xl p-4 bg-green-50 mb-4">
                <h4 className="font-bold text-green-900 text-sm mb-2 flex items-center gap-2">
                  <Send size={14} /> Kirim ke {unsentCount} Tamu Sekaligus
                </h4>
                <p className="text-xs text-green-700 mb-3">
                  Browser akan membuka {unsentCount} tab WhatsApp. Pastikan popup tidak diblokir browser kamu.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={blastAll}
                    className="flex-1 py-2.5 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-700 transition-colors"
                  >
                    Ya, Kirim Sekarang
                  </button>
                  <button
                    onClick={() => setShowBlast(false)}
                    className="px-4 py-2.5 text-sm text-gray-500"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search + filter */}
        {contacts.length > 0 && (
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2">
              <Search size={14} className="text-gray-400 shrink-0" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Cari nama atau nomor..."
                className="flex-1 text-sm outline-none bg-transparent"
              />
            </div>
            <select
              value={filterSent}
              onChange={e => setFilterSent(e.target.value as typeof filterSent)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-600 outline-none focus:ring-2 focus:ring-rose-400 bg-white"
            >
              <option value="all">Semua</option>
              <option value="unsent">Belum dikirim</option>
              <option value="sent">Sudah dikirim</option>
            </select>
          </div>
        )}
      </div>

      {/* Guest list */}
      {contacts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <div className="text-4xl mb-3">👥</div>
          <h3 className="font-bold text-gray-800 mb-2">Belum ada tamu</h3>
          <p className="text-sm text-gray-500 mb-4">Tambah daftar tamu dan kirim undangan personal via WhatsApp.</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-5 py-2.5 bg-gold-600 text-white text-sm font-semibold rounded-xl hover:bg-rose-700"
          >
            + Tambah Tamu Pertama
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-50 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700">
              {filtered.length} tamu {search || filterSent !== 'all' ? '(difilter)' : ''}
            </p>
            <p className="text-xs text-gray-400">
              {contacts.length}/{maxGuests === -1 ? '∞' : maxGuests} slot digunakan
            </p>
          </div>

          <div className="divide-y divide-gray-50">
            <AnimatePresence>
              {filtered.map((contact, i) => (
                <motion.div
                  key={contact.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="px-5 py-4 flex items-center gap-4 hover:bg-gray-50/50 transition-colors"
                >
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold-400 to-champagne-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {contact.name[0]?.toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900 text-sm truncate">{contact.name}</p>
                      {contact.group && (
                        <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full shrink-0">
                          {contact.group}
                        </span>
                      )}
                      {contact.attending === true && (
                        <span className="text-[10px] bg-green-100 text-green-600 px-2 py-0.5 rounded-full shrink-0">Hadir</span>
                      )}
                      {contact.attending === false && (
                        <span className="text-[10px] bg-red-100 text-red-500 px-2 py-0.5 rounded-full shrink-0">Berhalangan</span>
                      )}
                      {contact.source === 'rsvp' && (
                        <span className="text-[10px] bg-blue-100 text-blue-500 px-2 py-0.5 rounded-full shrink-0">RSVP</span>
                      )}
                    </div>
                    {contact.phone && <p className="text-xs text-gray-400 font-mono">{contact.phone}</p>}
                    {contact.note && <p className="text-xs text-gray-400 mt-0.5 italic">{contact.note}</p>}
                  </div>

                  {/* Status + Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {contact.blast_sent_at ? (
                      <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                        <CheckCircle2 size={12} /> Terkirim
                      </span>
                    ) : contact.phone ? (
                      <span className="flex items-center gap-1 text-xs text-amber-500">
                        <Clock size={12} /> Belum
                      </span>
                    ) : null}

                    {contact.phone && (
                      <button
                        onClick={() => openWa(contact)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold rounded-lg transition-colors"
                      >
                        <MessageSquare size={11} />
                        {contact.blast_sent_at ? 'Kirim Lagi' : 'Kirim WA'}
                      </button>
                    )}

                    <button
                      onClick={() => removeGuest(contact.id)}
                      className="p-1.5 text-gray-300 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {filtered.length === 0 && (
              <div className="px-5 py-8 text-center text-sm text-gray-400">
                Tidak ada tamu yang cocok
              </div>
            )}
          </div>
        </div>
      )}

      {/* Personalized link tip */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-5">
        <h4 className="font-bold text-blue-900 text-sm mb-2 flex items-center gap-2">
          <MessageSquare size={14} className="text-blue-500" />
          Kirim Undangan Personal via WhatsApp
        </h4>
        <p className="text-xs text-blue-700 mb-3">
          Setiap tamu mendapat pesan dengan namanya sendiri. Lebih personal dari blast biasa!
        </p>
        <div className="bg-white rounded-xl p-3 text-xs text-gray-600 font-mono leading-relaxed border border-blue-100">
          Assalamu&apos;alaikum Yth. <strong>[Nama Tamu]</strong>,<br />
          Kami mengundang kehadiran...<br />
          🔗 {invUrl}
        </div>
      </div>
    </div>
  )
}
