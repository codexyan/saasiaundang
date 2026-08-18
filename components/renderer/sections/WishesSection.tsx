'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { SectionConfig, NewInvitationData, TemplateMeta, Wish, RenderMode } from '@/lib/types'
import SectionWrapper, { resolveFont, fsh, fsb, hasMediaBg, cardBg } from '../SectionWrapper'
import SectionOrnament from '../SectionOrnament'
import { getComponentStyle, btnStyle, inputBorderStyle, cardRadius } from '@/lib/component-styles'
import { Loader2, Send } from 'lucide-react'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

interface Props {
  section: SectionConfig
  data: NewInvitationData
  meta: TemplateMeta
  invitationId: string
  initialWishes?: Wish[]
  /** Wajib. 'live' = kirim ke /api/wishes, 'preview' = simulasi lokal. */
  mode: RenderMode
}

function makePreviewWishes(): Wish[] {
  const now = Date.now()
  return [
    { id: 'pw1', invitation_id: 'preview', name: 'Aisyah Rahman', message: 'Barakallahu lakuma wa baraka alaikuma wa jama\'a bainakuma fi khair. Semoga menjadi keluarga sakinah mawaddah warahmah.', created_at: new Date(now - 1000 * 60 * 3).toISOString() },
    { id: 'pw2', invitation_id: 'preview', name: 'Budi Santoso', message: 'Selamat menempuh hidup baru! Semoga selalu bahagia dan dilimpahkan rezeki yang berkah. Aamiin.', created_at: new Date(now - 1000 * 60 * 12).toISOString() },
    { id: 'pw3', invitation_id: 'preview', name: 'Citra Dewi', message: 'Masya Allah, turut bahagia melihat kalian bersatu. Semoga cinta kalian abadi hingga Jannah. Selamat ya!', created_at: new Date(now - 1000 * 60 * 45).toISOString() },
    { id: 'pw4', invitation_id: 'preview', name: 'Dimas Pratama', message: 'Happy wedding! Semoga pernikahan ini menjadi awal dari perjalanan indah yang penuh keberkahan.', created_at: new Date(now - 1000 * 60 * 120).toISOString() },
    { id: 'pw5', invitation_id: 'preview', name: 'Fatimah Zahra', message: 'Selamat atas pernikahannya, semoga menjadi keluarga yang sakinah dan dikaruniai keturunan yang sholih sholihah.', created_at: new Date(now - 1000 * 60 * 300).toISOString() },
  ]
}

function Ornament({ accent }: { accent: string }) {
  return <SectionOrnament accent={accent} />
}

function StaticBubble({ wish, accent, text, headingFont, bodyFont }: {
  wish: Wish; accent: string; text: string; headingFont: string; bodyFont: string
}) {
  const initial = wish.name.trim().charAt(0).toUpperCase()
  let timeStr: string
  try {
    timeStr = formatDistanceToNow(parseISO(wish.created_at), { addSuffix: true, locale: localeId })
  } catch {
    timeStr = ''
  }

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '0 2px' }}>
      {/* Avatar */}
      <div style={{
        width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
        background: `${accent}18`, border: `1px solid ${accent}28`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginTop: 2,
      }}>
        <span style={{ fontSize: fsb(10.5), fontWeight: 600, color: accent, fontFamily: headingFont }}>
          {initial}
        </span>
      </div>

      {/* Bubble */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          position: 'relative',
          background: `${accent}10`,
          borderRadius: '2px 14px 14px 14px',
          padding: '10px 14px 8px',
          border: `1px solid ${accent}18`,
        }}>
          {/* Tail */}
          <div style={{
            position: 'absolute', top: 0, left: -6, width: 0, height: 0,
            borderTop: `6px solid ${accent}10`,
            borderLeft: '6px solid transparent',
          }} />

          {/* Name + time header */}
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4, gap: 8 }}>
            <p style={{
              fontSize: fsb(10), fontWeight: 600, color: accent,
              fontFamily: headingFont, letterSpacing: '0.01em',
            }}>
              {wish.name}
            </p>
            <p
              suppressHydrationWarning
              style={{
                fontSize: fsb(7), color: `${text}75`,
                fontFamily: bodyFont, whiteSpace: 'nowrap', flexShrink: 0,
              }}>
              {timeStr}
            </p>
          </div>

          {/* Message */}
          <p style={{
            fontSize: fsb(10.5), color: `${text}90`,
            fontFamily: bodyFont, lineHeight: 1.75,
          }}>
            {wish.message}
          </p>
        </div>
      </div>
    </div>
  )
}

function WishMarquee({ wishes, accent, text, headingFont, bodyFont }: {
  wishes: Wish[]; accent: string; text: string; headingFont: string; bodyFont: string
}) {
  const speed = Math.max(wishes.length * 5, 20)

  const animName = useMemo(() => `wish-scroll-${Math.random().toString(36).slice(2, 8)}`, [])

  return (
    <div style={{
      height: 340, overflow: 'hidden', position: 'relative',
      maskImage: 'linear-gradient(to bottom, transparent 0%, black 6%, black 94%, transparent 100%)',
      WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 6%, black 94%, transparent 100%)',
    }}>
      <style>{`
        @keyframes ${animName} {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
      `}</style>

      <div style={{
        display: 'flex', flexDirection: 'column', gap: 14,
        animation: `${animName} ${speed}s linear infinite`,
      }}>
        {wishes.map((w) => (
          <StaticBubble key={w.id} wish={w} accent={accent} text={text} headingFont={headingFont} bodyFont={bodyFont} />
        ))}
        {wishes.map((w) => (
          <StaticBubble key={`dup-${w.id}`} wish={w} accent={accent} text={text} headingFont={headingFont} bodyFont={bodyFont} />
        ))}
      </div>
    </div>
  )
}

export default function WishesSection({ section, data, meta, invitationId, initialWishes = [], mode }: Props) {
  const { accent, text } = meta.color_scheme
  const font = resolveFont(meta, section)
  const cs = getComponentStyle(meta.component_style)

  const isPreview = mode === 'preview'

  const [wishes,  setWishes]  = useState<Wish[]>(initialWishes)
  const [name,    setName]    = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [justSent, setJustSent] = useState(false)

  useEffect(() => {
    if (wishes.length === 0 && isPreview) setWishes(makePreviewWishes())
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !message.trim()) { setError('Mohon isi nama dan ucapan terlebih dahulu'); return }
    setLoading(true); setError('')

    if (isPreview) {
      await new Promise(r => setTimeout(r, 400))
      const localWish: Wish = {
        id: `local-${Date.now()}`,
        invitation_id: 'preview',
        name: name.trim(),
        message: message.trim(),
        created_at: new Date().toISOString(),
      }
      setWishes(prev => [localWish, ...prev])
      setName(''); setMessage('')
      setJustSent(true)
      setTimeout(() => setJustSent(false), 3000)
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/wishes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationId, name: name.trim(), message: message.trim() }),
      })
      // Sama seperti RSVPSection: pesan server jangan ditelan, karena itulah
      // yang membuat 400 dari validasi uuid tidak pernah terlihat.
      if (!res.ok) {
        const payload = await res.json().catch(() => null)
        throw new Error(payload?.error || 'Ucapannya gagal terkirim.')
      }
      const { wish } = await res.json()
      setWishes(prev => [wish, ...prev])
      setName(''); setMessage('')
      setJustSent(true)
      setTimeout(() => setJustSent(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan, coba lagi')
    }
    finally { setLoading(false) }
  }

  const MAX_MSG = 300
  const headingFont = `'${font.heading}', serif`
  const bodyFont = `'${font.body}', serif`

  const shouldMarquee = wishes.length >= 3

  return (
    <SectionWrapper section={section} className="px-6">
      <div className="max-w-[300px] mx-auto w-full py-14">

        {/* Header */}
        <div className="text-center" style={{ marginBottom: 36 }}>
          <motion.div variants={{ hidden: { opacity: 0, scaleX: 0 }, visible: { opacity: 1, scaleX: 1 } }}>
            <Ornament accent={accent} />
          </motion.div>

          <motion.p
            style={{ fontSize: fsb(9), letterSpacing: '0.3em', textTransform: 'uppercase', color: `${accent}70`, fontFamily: bodyFont, marginTop: 20, marginBottom: 10 }}
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}>
            Buku Ucapan
          </motion.p>

          <motion.h2
            style={{ fontSize: fsh(20), fontWeight: 400, color: text, fontFamily: headingFont, letterSpacing: '-0.01em', marginBottom: 12, lineHeight: 1.3 }}
            variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}>
            Doa &amp; Harapan
          </motion.h2>

          <motion.p
            style={{ fontSize: fsb(10), color: `${text}60`, fontFamily: bodyFont, lineHeight: 1.9, fontStyle: 'italic' }}
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}>
            Tuliskan doa dan ucapan terbaik<br />untuk kedua mempelai.
          </motion.p>
        </div>

        {/*  Form container  */}
        <motion.div
          variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { delay: 0.15 } } }}
          style={{
            padding: '24px 20px',
            ...(hasMediaBg(section.background)
              ? { ...cardBg(section.background) }
              : { border: `1px solid ${accent}25`, background: `${accent}08` }),
            marginBottom: 28,
          }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 20 }}>
              <input
                type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="Nama Anda"
                style={{
                  width: '100%',
                  background: 'transparent',
                  ...inputBorderStyle(cs.border, accent),
                  color: text, fontSize: fsb(12), fontFamily: headingFont,
                  outline: 'none', transition: 'border-color 0.2s',
                }}
                onFocus={e => Object.assign(e.target.style, inputBorderStyle(cs.border, accent, true))}
                onBlur={e => Object.assign(e.target.style, inputBorderStyle(cs.border, accent))}
              />
            </div>

            <div style={{ marginBottom: 20, position: 'relative' }}>
              <textarea
                value={message} onChange={e => setMessage(e.target.value.slice(0, MAX_MSG))}
                placeholder="Tuliskan doa dan ucapan selamat..."
                rows={3}
                style={{
                  width: '100%',
                  background: 'transparent',
                  ...inputBorderStyle(cs.border, accent),
                  color: text, fontSize: fsb(11), fontFamily: bodyFont,
                  outline: 'none', transition: 'border-color 0.2s',
                  resize: 'none', lineHeight: 1.8,
                }}
                onFocus={e => Object.assign(e.target.style, inputBorderStyle(cs.border, accent, true))}
                onBlur={e => Object.assign(e.target.style, inputBorderStyle(cs.border, accent))}
              />
              <span style={{
                position: 'absolute', bottom: 4, right: 0,
                fontSize: fsb(7.5), color: message.length > MAX_MSG * 0.9 ? '#c45' : `${text}70`,
              }}>
                {message.length}/{MAX_MSG}
              </span>
            </div>

            {error && (
              <p style={{ fontSize: fsb(9), color: '#c45', marginBottom: 12, fontFamily: bodyFont }}>{error}</p>
            )}

            <motion.button
              type="submit"
              disabled={loading || !name.trim() || !message.trim()}
              whileTap={{ scale: 0.97 }}
              style={{
                width: '100%',
                ...btnStyle(cs.button, cs.border, accent, text, { disabled: !name.trim() || !message.trim() }),
                fontFamily: bodyFont,
              }}>
              {loading
                ? <><Loader2 size={11} className="animate-spin" /> Mengirim</>
                : <><Send size={11} strokeWidth={1.8} /> Kirim Ucapan</>
              }
            </motion.button>

            <AnimatePresence>
              {justSent && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="text-center"
                  style={{ fontSize: fsb(9), color: `${accent}70`, fontFamily: bodyFont, fontStyle: 'italic', marginTop: 12 }}>
                  Terima kasih, ucapan Anda telah tersimpan.
                </motion.p>
              )}
            </AnimatePresence>
          </form>
        </motion.div>

        {/*  Chat wish list (below form)  */}
        {wishes.length > 0 && (
          <motion.div
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { delay: 0.25 } } }}>

            <div className="flex items-center gap-3" style={{ marginBottom: 14 }}>
              <span style={{ fontSize: fsb(8), color: `${text}60`, letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: bodyFont }}>
                {wishes.length} Ucapan
              </span>
            </div>

            {shouldMarquee ? (
              <WishMarquee
                wishes={wishes}
                accent={accent}
                text={text}
                headingFont={headingFont}
                bodyFont={bodyFont}
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {wishes.map((wish) => (
                  <StaticBubble
                    key={wish.id}
                    wish={wish}
                    accent={accent}
                    text={text}
                    headingFont={headingFont}
                    bodyFont={bodyFont}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {wishes.length === 0 && (
          <motion.p className="text-center"
            style={{ fontSize: fsb(10), color: `${text}60`, fontFamily: bodyFont, fontStyle: 'italic', lineHeight: 1.8, marginTop: 20 }}
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { delay: 0.3 } } }}>
            Belum ada ucapan.
          </motion.p>
        )}

      </div>
    </SectionWrapper>
  )
}
