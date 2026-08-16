'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MessageSquarePlus, Send, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function FeedbackWidget() {
  const [show, setShow] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [score, setScore] = useState<number | null>(null)
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/feedback')
      .then(r => r.json())
      .then(d => {
        if (!d.hasRecent) {
          setTimeout(() => setShow(true), 10000)
        }
      })
      .catch(() => {})
  }, [])

  function dismiss() {
    setDismissed(true)
    setShow(false)
  }

  async function submit() {
    if (score === null) { toast.error('Pilih nilainya dulu ya.'); return }
    setLoading(true)
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score, comment, page: 'dashboard', type: 'nps' }),
    })
    setLoading(false)
    if (res.ok) {
      setSubmitted(true)
      setTimeout(() => setShow(false), 3000)
    } else {
      toast.error('Masukannya gagal terkirim. Coba lagi ya.')
    }
  }

  if (dismissed || !show) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
      >
        {submitted ? (
          <div className="p-6 text-center">
            <CheckCircle2 size={32} className="text-green-500 mx-auto mb-3" />
            <h4 className="font-bold text-gray-900 text-sm">Terima kasih!</h4>
            <p className="text-xs text-gray-400 mt-1">Feedback kamu sangat berharga untuk kami.</p>
          </div>
        ) : (
          <>
            <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-gray-50">
              <div className="flex items-center gap-2">
                <MessageSquarePlus size={16} className="text-rose-500" />
                <h4 className="font-bold text-gray-900 text-sm">Seberapa puas kamu?</h4>
              </div>
              <button onClick={dismiss} className="text-gray-300 hover:text-gray-500 transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-gray-500">Seberapa besar kemungkinan kamu merekomendasikan IAUndang ke teman?</p>

              {/* NPS Score */}
              <div className="flex gap-1">
                {Array.from({ length: 11 }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setScore(i)}
                    className={`flex-1 aspect-square rounded-lg text-xs font-bold transition-all ${
                      score === i
                        ? i <= 6 ? 'bg-red-500 text-white scale-110' : i <= 8 ? 'bg-amber-500 text-white scale-110' : 'bg-green-500 text-white scale-110'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {i}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-gray-300">
                <span>Tidak mungkin</span>
                <span>Sangat mungkin</span>
              </div>

              {/* Comment */}
              {score !== null && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                >
                  <textarea
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder={score <= 6 ? 'Apa yang bisa kami perbaiki?' : score <= 8 ? 'Apa yang bisa lebih baik?' : 'Apa yang paling kamu suka?'}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-rose-400"
                  />
                </motion.div>
              )}

              <button
                onClick={submit}
                disabled={score === null || loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-rose-500 text-white text-sm font-semibold rounded-xl hover:bg-rose-600 disabled:opacity-50 transition-colors"
              >
                <Send size={14} />
                {loading ? 'Mengirim...' : 'Kirim Feedback'}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
