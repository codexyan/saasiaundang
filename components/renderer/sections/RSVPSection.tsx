'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { SectionConfig, NewInvitationData, TemplateMeta, RenderMode } from '@/lib/types'
import SectionWrapper, { resolveFont, fsh, fsb, hasMediaBg, cardBg } from '../SectionWrapper'
import SectionOrnament from '../SectionOrnament'
import { getComponentStyle, btnStyle, btnRadius, inputBorderStyle, cardRadius } from '@/lib/component-styles'
import { Loader2, Send } from 'lucide-react'

interface Props {
  section: SectionConfig
  data: NewInvitationData
  meta: TemplateMeta
  invitationId: string
  /** Wajib. 'live' = kirim ke /api/rsvp, 'preview' = simulasi lokal. */
  mode: RenderMode
}

function Ornament({ accent }: { accent: string }) {
  return <SectionOrnament accent={accent} />
}

export default function RSVPSection({ section, data, meta, invitationId, mode }: Props) {
  const { accent, text } = meta.color_scheme
  const font = resolveFont(meta, section)
  const cs = getComponentStyle(meta.component_style)
  const br = btnRadius(cs.border)

  const [name,        setName]        = useState('')
  const [attending,   setAttending]   = useState<boolean | null>(null)
  const [totalGuests, setTotalGuests] = useState(1)
  const [loading,     setLoading]     = useState(false)
  const [submitted,   setSubmitted]   = useState(false)
  const [error,       setError]       = useState('')

  const isPreview = mode === 'preview'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || attending === null) { setError('Mohon isi nama dan pilih konfirmasi kehadiran'); return }
    setLoading(true); setError('')

    if (isPreview) {
      await new Promise(r => setTimeout(r, 400))
      setSubmitted(true)
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationId, name: name.trim(), attending, totalGuests: attending ? totalGuests : 0 }),
      })
      // Pesan error server ikut ditampilkan. Sebelumnya semua kegagalan runtuh
      // jadi satu kalimat generik — itulah kenapa 400 dari validasi uuid tidak
      // pernah terlihat oleh siapa pun.
      if (!res.ok) {
        const payload = await res.json().catch(() => null)
        throw new Error(payload?.error || 'Konfirmasinya gagal terkirim.')
      }
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan, coba lagi')
    }
    finally { setLoading(false) }
  }

  const headingFont = `'${font.heading}', serif`
  const bodyFont = `'${font.body}', serif`

  const mediaBg = hasMediaBg(section.background)
  const panelStyle: React.CSSProperties = mediaBg
    ? { ...cardBg(section.background), padding: '28px 20px', marginTop: -8 }
    : {}

  return (
    <SectionWrapper section={section} className="px-6">
      <div className="max-w-[300px] mx-auto w-full py-14" style={panelStyle}>

        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div key="success"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col items-center text-center">

              <Ornament accent={accent} />

              <motion.p
                style={{ fontSize: fsb(9), letterSpacing: '0.3em', textTransform: 'uppercase', color: `${accent}70`, fontFamily: bodyFont, marginTop: 20, marginBottom: 14 }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
                Terima Kasih
              </motion.p>

              <motion.p
                style={{ fontSize: fsh(22), fontWeight: 400, color: text, fontFamily: headingFont, lineHeight: 1.3, letterSpacing: '-0.01em' }}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                {name.split(' ')[0]}
              </motion.p>

              <motion.p
                style={{ fontSize: fsb(10.5), color: `${text}65`, fontFamily: bodyFont, lineHeight: 1.9, fontStyle: 'italic', maxWidth: 240 }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                {attending
                  ? `Kami sangat menantikan kehadiran ${totalGuests > 1 ? `Anda bersama ${totalGuests - 1} orang` : 'Anda'} di hari bahagia kami.`
                  : 'Doa restu Anda sangat berarti bagi kami. Semoga silaturahmi kita tetap terjaga.'}
              </motion.p>
            </motion.div>

          ) : (
            <motion.form key="form" onSubmit={handleSubmit}
              initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }}
              variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07 } } }}>

              {/* Header */}
              <div className="text-center" style={{ marginBottom: 40 }}>
                <motion.div variants={{ hidden: { opacity: 0, scaleX: 0 }, visible: { opacity: 1, scaleX: 1 } }}>
                  <Ornament accent={accent} />
                </motion.div>

                <motion.p
                  style={{ fontSize: fsb(9), letterSpacing: '0.3em', textTransform: 'uppercase', color: `${accent}70`, fontFamily: bodyFont, marginTop: 20, marginBottom: 10 }}
                  variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}>
                  Reservasi
                </motion.p>

                <motion.h2
                  style={{ fontSize: fsh(20), fontWeight: 400, color: text, fontFamily: headingFont, letterSpacing: '-0.01em', marginBottom: 12, lineHeight: 1.3 }}
                  variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}>
                  Konfirmasi Kehadiran
                </motion.h2>

                <motion.p
                  style={{ fontSize: fsb(10), color: `${text}60`, fontFamily: bodyFont, lineHeight: 1.9, fontStyle: 'italic' }}
                  variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}>
                  Merupakan kehormatan bagi kami<br />apabila Anda berkenan hadir.
                </motion.p>
              </div>

              {/* Name   underline style */}
              <motion.div style={{ marginBottom: 32 }}
                variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}>
                <label style={{
                  display: 'block', fontSize: fsb(8), fontWeight: 500, letterSpacing: '0.2em',
                  textTransform: 'uppercase', color: `${text}70`, fontFamily: bodyFont, marginBottom: 10,
                }}>
                  Nama Lengkap
                </label>
                <input
                  type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="Masukkan nama Anda"
                  style={{
                    width: '100%',
                    background: 'transparent',
                    ...inputBorderStyle(cs.border, accent),
                    color: text, fontSize: fsb(13), fontFamily: headingFont,
                    outline: 'none', transition: 'border-color 0.2s',
                    letterSpacing: '0.01em',
                  }}
                  onFocus={e => Object.assign(e.target.style, inputBorderStyle(cs.border, accent, true))}
                  onBlur={e => Object.assign(e.target.style, inputBorderStyle(cs.border, accent))}
                />
              </motion.div>

              {/* Attendance   editorial radio cards */}
              <motion.div style={{ marginBottom: 28 }}
                variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}>
                <label style={{
                  display: 'block', fontSize: fsb(8), fontWeight: 500, letterSpacing: '0.2em',
                  textTransform: 'uppercase', color: `${text}60`, fontFamily: bodyFont, marginBottom: 12,
                }}>
                  Konfirmasi
                </label>
                <div style={{ display: 'flex', gap: 12 }}>
                  {([
                    { val: true,  label: 'Hadir',        sub: 'Saya akan datang' },
                    { val: false, label: 'Berhalangan',  sub: 'Maaf, tidak bisa' },
                  ] as const).map(opt => {
                    const active = attending === opt.val
                    return (
                      <motion.button key={String(opt.val)} type="button"
                        onClick={() => setAttending(opt.val)}
                        whileTap={{ scale: 0.97 }}
                        style={{
                          flex: 1, padding: '16px 12px',
                          background: active ? `${accent}15` : 'transparent',
                          border: `1px solid ${active ? `${accent}50` : `${accent}25`}`,
                          borderRadius: cardRadius(cs.border),
                          cursor: 'pointer', transition: 'all 0.25s',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                        }}>
                        <div style={{
                          width: 8, height: 8, borderRadius: '50%', marginBottom: 4,
                          border: `1.5px solid ${active ? accent : `${accent}40`}`,
                          background: active ? accent : 'transparent',
                          transition: 'all 0.25s',
                          boxShadow: active ? `0 0 0 3px ${accent}25` : 'none',
                        }} />
                        <span style={{
                          fontSize: fsb(11.5), fontWeight: 500, color: active ? text : `${text}75`,
                          fontFamily: headingFont, transition: 'color 0.2s',
                        }}>
                          {opt.label}
                        </span>
                        <span style={{
                          fontSize: fsb(8), color: active ? `${text}65` : `${text}75`,
                          fontFamily: bodyFont, letterSpacing: '0.05em', transition: 'color 0.2s',
                        }}>
                          {opt.sub}
                        </span>
                      </motion.button>
                    )
                  })}
                </div>
              </motion.div>

              {/* Guest stepper */}
              <AnimatePresence>
                {attending && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    style={{ overflow: 'hidden', marginBottom: 28 }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '14px 0',
                      borderTop: `1px solid ${accent}25`,
                      borderBottom: `1px solid ${accent}25`,
                    }}>
                      <span style={{ fontSize: fsb(8), fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', color: `${text}60`, fontFamily: bodyFont }}>
                        Jumlah Tamu
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                        <motion.button type="button"
                          onClick={() => setTotalGuests(g => Math.max(1, g - 1))}
                          whileTap={{ scale: 0.85 }}
                          style={{
                            width: 28, height: 28,
                            border: `1px solid ${accent}35`, background: 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', opacity: totalGuests <= 1 ? 0.25 : 1,
                            transition: 'opacity 0.15s', fontSize: 16, color: `${text}60`, lineHeight: 1,
                          }}>
                          &#8722;
                        </motion.button>
                        <motion.span
                          key={totalGuests}
                          initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                          style={{
                            fontSize: fsh(20), fontWeight: 400, color: text,
                            fontFamily: headingFont, minWidth: 20, textAlign: 'center',
                          }}>
                          {totalGuests}
                        </motion.span>
                        <motion.button type="button"
                          onClick={() => setTotalGuests(g => Math.min(10, g + 1))}
                          whileTap={{ scale: 0.85 }}
                          style={{
                            width: 28, height: 28,
                            border: `1px solid ${accent}35`, background: 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', opacity: totalGuests >= 10 ? 0.25 : 1,
                            transition: 'opacity 0.15s', fontSize: 16, color: `${text}60`, lineHeight: 1,
                          }}>
                          +
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {error && (
                <p style={{ fontSize: fsb(9), color: '#c45', marginBottom: 16, textAlign: 'center', fontFamily: bodyFont }}>{error}</p>
              )}

              {/* Submit   elegant bordered text button */}
              <motion.div className="text-center"
                variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
                <motion.button
                  type="submit"
                  disabled={loading || attending === null || !name.trim()}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    ...btnStyle(cs.button, cs.border, accent, text, { disabled: attending === null || !name.trim() }),
                    fontFamily: bodyFont,
                  }}>
                  {loading
                    ? <><Loader2 size={12} className="animate-spin" /> Mengirim</>
                    : <><Send size={12} strokeWidth={1.8} /> Kirim Konfirmasi</>
                  }
                </motion.button>
              </motion.div>

            </motion.form>
          )}
        </AnimatePresence>

      </div>
    </SectionWrapper>
  )
}
