'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Copy, Gift, Users, TrendingUp, Share2,
  CheckCircle2, Clock, Loader2, Link2,
} from 'lucide-react'
import toast from 'react-hot-toast'

interface ReferralData {
  referralCode: string
  referralLink: string
  stats: { total: number; completed: number; totalReward: number }
  referrals: { id: string; status: string; reward_value: number; created_at: string }[]
}

export default function ReferralPanel() {
  const [data, setData] = useState<ReferralData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/referral')
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function copyCode() {
    if (!data) return
    navigator.clipboard.writeText(data.referralCode)
    toast.success('Kode referral sudah disalin!')
  }

  function copyLink() {
    if (!data) return
    navigator.clipboard.writeText(data.referralLink)
    toast.success('Tautan referral sudah disalin!')
  }

  function shareWa() {
    if (!data) return
    const msg = `Hai! Aku pakai IAUndang buat bikin undangan digital pernikahan. Keren banget dan gampang! Coba di sini ya: ${data.referralLink}`
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-stone-300" />
      </div>
    )
  }

  if (!data) {
    return <div className="text-center py-20 text-gray-400 text-sm">Gagal memuat data referral.</div>
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-gray-900">Program Referral</h2>
        <p className="text-xs text-gray-400 mt-0.5">Ajak teman pakai IAUndang, dapatkan diskon Rp 15.000 per referral berhasil.</p>
      </div>

      {/* Referral code card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-rose-50 via-pink-50 to-orange-50 border border-rose-100 rounded-2xl p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Gift size={18} className="text-rose-500" />
          <h3 className="font-bold text-gray-900 text-sm">Kode Referral Kamu</h3>
        </div>

        <div className="bg-white rounded-xl border border-rose-100 p-4 flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Link2 size={16} className="text-rose-400" />
            <span className="font-mono font-bold text-lg text-gray-900 tracking-wider">{data.referralCode}</span>
          </div>
          <button onClick={copyCode} className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500 text-white text-xs font-semibold rounded-lg hover:bg-rose-600 transition-colors">
            <Copy size={12} /> Salin
          </button>
        </div>

        <div className="bg-white rounded-xl border border-rose-100 p-3 flex items-center justify-between mb-4">
          <p className="text-xs text-gray-500 font-mono truncate flex-1 mr-3">{data.referralLink}</p>
          <button onClick={copyLink} className="text-xs text-rose-500 font-semibold hover:text-rose-600 shrink-0">
            Salin Link
          </button>
        </div>

        <div className="flex gap-2">
          <button onClick={shareWa} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-500 text-white text-sm font-semibold rounded-xl hover:bg-green-600 transition-colors">
            <Share2 size={14} /> Bagikan via WA
          </button>
          <button onClick={copyLink} className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors">
            <Copy size={14} /> Salin Link
          </button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <Users size={16} className="text-blue-500 mb-2" />
          <p className="text-2xl font-bold text-gray-900">{data.stats.total}</p>
          <p className="text-xs text-gray-400 mt-0.5">Total Referral</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <TrendingUp size={16} className="text-green-500 mb-2" />
          <p className="text-2xl font-bold text-gray-900">{data.stats.completed}</p>
          <p className="text-xs text-gray-400 mt-0.5">Berhasil</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <Gift size={16} className="text-rose-500 mb-2" />
          <p className="text-2xl font-bold text-gray-900">
            {data.stats.totalReward > 0 ? `${(data.stats.totalReward / 1000).toFixed(0)}rb` : '0'}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">Total Reward</p>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="font-bold text-gray-900 text-sm mb-4">Cara Kerja</h3>
        <div className="space-y-4">
          {[
            { step: 1, title: 'Bagikan kode referral', desc: 'Kirim kode atau link ke teman yang akan menikah' },
            { step: 2, title: 'Teman mendaftar & order', desc: 'Teman memasukkan kode saat order undangan' },
            { step: 3, title: 'Dapatkan diskon Rp 15.000', desc: 'Reward otomatis setelah pembayaran teman dikonfirmasi' },
          ].map(item => (
            <div key={item.step} className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-rose-100 flex items-center justify-center text-xs font-bold text-rose-600 shrink-0">
                {item.step}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{item.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Referral history */}
      {data.referrals.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-bold text-gray-900 text-sm mb-4">Riwayat Referral</h3>
          <div className="space-y-2">
            {data.referrals.map(ref => (
              <div key={ref.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2">
                  {ref.status === 'completed' || ref.status === 'rewarded' ? (
                    <CheckCircle2 size={14} className="text-green-500" />
                  ) : (
                    <Clock size={14} className="text-amber-400" />
                  )}
                  <span className="text-sm text-gray-700">
                    {new Date(ref.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    ref.status === 'rewarded' ? 'bg-green-100 text-green-600' :
                    ref.status === 'completed' ? 'bg-blue-100 text-blue-600' :
                    'bg-amber-100 text-amber-600'
                  }`}>
                    {ref.status === 'rewarded' ? 'Diklaim' : ref.status === 'completed' ? 'Selesai' : 'Menunggu'}
                  </span>
                  <span className="text-xs text-gray-400 font-mono">Rp {ref.reward_value.toLocaleString('id-ID')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {data.referrals.length === 0 && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6 text-center">
          <div className="text-3xl mb-2">🎁</div>
          <h3 className="font-bold text-blue-900 text-sm mb-1">Belum ada referral</h3>
          <p className="text-xs text-blue-700">Bagikan kode referral kamu dan mulai kumpulkan reward!</p>
        </div>
      )}
    </div>
  )
}
