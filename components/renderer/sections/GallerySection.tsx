'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { SectionConfig, NewInvitationData, TemplateMeta } from '@/lib/types'
import SectionWrapper, { resolveFont, fsh, fsb } from '../SectionWrapper'
import SectionOrnament from '../SectionOrnament'
import { usePreviewContext } from '../PreviewContext'
import { getOptimizedImageUrl, fallbackToOriginal } from '@/lib/image-utils'
import { X, ChevronLeft, ChevronRight, ImageIcon } from 'lucide-react'

interface Props {
  section: SectionConfig
  data: NewInvitationData
  meta: TemplateMeta
}

type StyleCtx = {
  accent: string; text: string; primary: string
  headingFont: string; bodyFont: string
  photos: string[]
  onOpen: (i: number) => void
}

// Campur warna hex ke arah hitam (blackRatio 0..1). Dipakai DramaticView untuk
// menurunkan warna dasar gelap yang senada tema, bukan hitam pekat universal.
function mixToBlack(hex: string, blackRatio: number): string {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h
  if (full.length !== 6) return '#0a0a0a'
  const keep = 1 - Math.min(Math.max(blackRatio, 0), 1)
  const ch = (i: number) => Math.round(parseInt(full.slice(i, i + 2), 16) * keep).toString(16).padStart(2, '0')
  return `#${ch(0)}${ch(2)}${ch(4)}`
}

function Ornament({ accent }: { accent: string }) {
  return <SectionOrnament accent={accent} />
}

function EditorialHeader({ accent, text, headingFont, bodyFont, mb = 28 }: {
  accent: string; text: string; headingFont: string; bodyFont: string; mb?: number
}) {
  return (
    <div className="text-center px-6 max-w-[300px] mx-auto" style={{ marginBottom: mb }}>
      <motion.div
        initial="hidden" whileInView="visible" viewport={{ once: true }}
        variants={{ hidden: { opacity: 0, scaleX: 0 }, visible: { opacity: 1, scaleX: 1 } }}>
        <Ornament accent={accent} />
      </motion.div>
      <motion.p
        initial="hidden" whileInView="visible" viewport={{ once: true }}
        style={{ fontSize: fsb(9), letterSpacing: '0.3em', textTransform: 'uppercase', color: `${accent}70`, fontFamily: bodyFont, marginTop: 20, marginBottom: 10 }}
        variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}>
        Galeri
      </motion.p>
      <motion.h2
        initial="hidden" whileInView="visible" viewport={{ once: true }}
        style={{ fontSize: fsh(20), fontWeight: 400, color: text, fontFamily: headingFont, letterSpacing: '-0.01em', lineHeight: 1.3, marginBottom: 12 }}
        variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}>
        Momen Kami
      </motion.h2>
      <motion.p
        initial="hidden" whileInView="visible" viewport={{ once: true }}
        style={{ fontSize: fsb(10), color: `${text}70`, fontFamily: bodyFont, lineHeight: 1.9, fontStyle: 'italic' }}
        variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}>
        Koleksi momen indah<br />perjalanan kami bersama.
      </motion.p>
    </div>
  )
}

function FooterOrnament({ accent, text, bodyFont, count }: { accent: string; text: string; bodyFont: string; count: number }) {
  return (
    <>
      <div className="text-center" style={{ marginTop: 20 }}>
        <p style={{ fontSize: fsb(8), color: `${text}60`, fontFamily: bodyFont, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          {count} Foto
        </p>
      </div>
      <div className="px-6" style={{ marginTop: 12 }}>
        <SectionOrnament accent={accent} placement="footer" />
      </div>
    </>
  )
}

//  Lightbox (shared) 

function Lightbox({ photos, index, onClose, onPrev, onNext }: {
  photos: string[]; index: number; onClose: () => void; onPrev: () => void; onNext: () => void
}) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.92)',
        }}>
        <motion.img
          key={index}
          // 1080, bukan 1440: sumbernya sendiri sudah dibatasi 1920 px oleh
          // kompresi unggah, dan tiap lebar tambahan adalah satu transformasi
          // unik lagi per foto per bulan (docs/REPORT_OPTIMASI.md §0.4).
          src={getOptimizedImageUrl(photos[index], 1080)}
          onError={fallbackToOriginal(photos[index])}
          alt="Foto"
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.94 }}
          transition={{ duration: 0.25 }}
          onClick={e => e.stopPropagation()}
          style={{ maxHeight: '82vh', maxWidth: '88vw', objectFit: 'contain', display: 'block' }}
        />
        <button onClick={onClose} style={{
          position: 'absolute', top: 16, right: 16, width: 36, height: 36,
          border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.4)',
          color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}><X size={18} /></button>
        {photos.length > 1 && (
          <>
            <button onClick={e => { e.stopPropagation(); onPrev() }} style={{
              position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
              width: 36, height: 36, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)',
              color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}><ChevronLeft size={20} /></button>
            <button onClick={e => { e.stopPropagation(); onNext() }} style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              width: 36, height: 36, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)',
              color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}><ChevronRight size={20} /></button>
          </>
        )}
        <span style={{
          position: 'absolute', bottom: 20, fontSize: 10, fontWeight: 500,
          letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)',
        }}>
          {String(index + 1).padStart(2, '0')} / {String(photos.length).padStart(2, '0')}
        </span>
      </motion.div>
    </AnimatePresence>
  )
}

//  DEFAULT: Editorial Masonry 

function DefaultView({ section, ctx }: { section: SectionConfig; ctx: StyleCtx }) {
  const { accent, text, headingFont, bodyFont, photos, onOpen } = ctx
  const gridPhotos = photos.slice(1)

  return (
    <SectionWrapper section={section}>
      <div className="w-full py-14">
        <EditorialHeader accent={accent} text={text} headingFont={headingFont} bodyFont={bodyFont} />

        {/* Hero photo */}
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
          style={{ marginBottom: gridPhotos.length > 0 ? 8 : 0, padding: '0 16px' }}>
          <button onClick={() => onOpen(0)} style={{
            display: 'block', width: '100%', position: 'relative', overflow: 'hidden',
            cursor: 'pointer', border: 'none', padding: 0, background: 'none',
          }}>
            <img
              src={getOptimizedImageUrl(photos[0], 1080)}
              onError={fallbackToOriginal(photos[0])}
              alt="Foto utama" loading="lazy" decoding="async"
              style={{ width: '100%', aspectRatio: '4 / 5', objectFit: 'cover', display: 'block' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, background: `linear-gradient(to top, ${accent}22, transparent)` }} />
          </button>
        </motion.div>

        {/* Masonry */}
        {gridPhotos.length > 0 && (
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }}
            style={{ display: 'flex', gap: 8, padding: '0 16px' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {gridPhotos.filter((_, i) => i % 2 === 0).map((url, ci) => {
                const idx = 1 + ci * 2
                return (
                  <motion.button key={idx}
                    variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } }}
                    onClick={() => onOpen(idx)}
                    style={{ display: 'block', overflow: 'hidden', cursor: 'pointer', border: 'none', padding: 0, background: 'none' }}>
                    <img
                      src={getOptimizedImageUrl(url, 480)}
                      onError={fallbackToOriginal(url)}
                      alt={`Foto ${idx + 1}`} loading="lazy" decoding="async"
                      style={{ width: '100%', display: 'block', objectFit: 'cover', aspectRatio: ci % 3 === 0 ? '3 / 4' : '1 / 1' }} />
                  </motion.button>
                )
              })}
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, marginTop: 24 }}>
              {gridPhotos.filter((_, i) => i % 2 === 1).map((url, ci) => {
                const idx = 1 + ci * 2 + 1
                return (
                  <motion.button key={idx}
                    variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } }}
                    onClick={() => onOpen(idx)}
                    style={{ display: 'block', overflow: 'hidden', cursor: 'pointer', border: 'none', padding: 0, background: 'none' }}>
                    <img
                      src={getOptimizedImageUrl(url, 480)}
                      onError={fallbackToOriginal(url)}
                      alt={`Foto ${idx + 1}`} loading="lazy" decoding="async"
                      style={{ width: '100%', display: 'block', objectFit: 'cover', aspectRatio: ci % 3 === 1 ? '3 / 4' : '1 / 1' }} />
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        )}

        <FooterOrnament accent={accent} text={text} bodyFont={bodyFont} count={photos.length} />
      </div>
    </SectionWrapper>
  )
}

//  DRAMATIC: Full-bleed cinematic horizontal IG-stories-style 

function DramaticView({ section, ctx }: { section: SectionConfig; ctx: StyleCtx }) {
  const { accent, text, headingFont, bodyFont, photos, onOpen, primary } = ctx
  const [current, setCurrent] = useState(0)
  const total = photos.length

  const goNext = useCallback(() => setCurrent(i => (i + 1) % total), [total])
  const goPrev = useCallback(() => setCurrent(i => (i - 1 + total) % total), [total])

  // Auto-advance   dimatikan kalau cuma ada <=1 foto (tidak berguna & bikin
  // interval + potensi re-render sia-sia)
  useEffect(() => {
    if (total <= 1) return
    const t = setInterval(goNext, 4000)
    return () => clearInterval(t)
  }, [goNext, total])

  // Warna dasar gelap untuk look IG-stories. Prioritaskan warna background section
  // eksplisit dari template; kalau tidak ada, turunkan dari primary yang digelapkan
  // (~85% ke hitam) supaya tetap senada tema, bukan hitam pekat yang bisa clash di
  // template pastel/terang.
  const bg = section.background
  const darkBase = bg.type === 'color' && bg.value ? bg.value : mixToBlack(primary, 0.85)

  // full-bleed: isi lebar & tinggi viewport, tapi tetap lewat SectionWrapper supaya
  // background/transition/padding/decoration dari config section tetap berlaku.
  const sectionCfg: SectionConfig = { ...section, content_layout: 'full-bleed' as const }

  return (
    <SectionWrapper section={sectionCfg}>
    <div style={{ position: 'relative', width: '100%', flex: 1, minHeight: '100%', overflow: 'hidden', background: darkBase }}>
      {/* Background photo  full bleed */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          style={{
            position: 'absolute', inset: 0,
            // Latar full-bleed. Tanpa onError seperti latar CSS lainnya —
            // lihat catatan di SectionWrapper.tsx.
            backgroundImage: `url(${getOptimizedImageUrl(photos[current], 1080)})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
          }}
        />
      </AnimatePresence>

      {/* Gradient overlays */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.75) 100%)',
      }} />
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1,
        background: 'linear-gradient(to right, rgba(0,0,0,0.3) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.3) 100%)',
      }} />

      {/* Touch zones */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex' }}>
        <div style={{ flex: 1 }} onClick={goPrev} />
        <div style={{ flex: 1 }} onClick={() => onOpen(current)} />
        <div style={{ flex: 1 }} onClick={goNext} />
      </div>

      {/* Progress bar at top */}
      <div style={{ position: 'relative', zIndex: 20, display: 'flex', gap: 4, padding: '18px 16px 0' }}>
        {photos.map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 2, background: i <= current ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.15)',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>

      {/* Bottom content overlay */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 15,
        padding: '0 24px 48px',
      }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4 }}>

            <p style={{
              fontSize: fsb(9), letterSpacing: '0.35em', textTransform: 'uppercase',
              color: `${accent}99`, fontFamily: bodyFont, marginBottom: 10,
            }}>
              Galeri
            </p>

            <h2 style={{
              fontSize: fsh(26), fontWeight: 400, color: '#fff', fontFamily: headingFont,
              textShadow: '0 2px 24px rgba(0,0,0,0.6)', letterSpacing: '-0.01em',
              lineHeight: 1.2, marginBottom: 16,
            }}>
              Momen Kami
            </h2>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{
                fontSize: 10, fontWeight: 600, letterSpacing: '0.2em',
                color: 'rgba(255,255,255,0.4)',
              }}>
                {String(current + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
              </span>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Thumbnail strip at bottom */}
      <div style={{
        position: 'absolute', bottom: 0, right: 0, zIndex: 16,
        display: 'flex', gap: 3, padding: '0 16px 16px', justifyContent: 'flex-end',
      }}>
        {photos.map((url, i) => (
          <button key={i} onClick={() => setCurrent(i)} style={{
            width: 32, height: 32, overflow: 'hidden', cursor: 'pointer',
            border: i === current ? '1.5px solid rgba(255,255,255,0.7)' : '1px solid rgba(255,255,255,0.12)',
            padding: 0, background: 'none', opacity: i === current ? 1 : 0.5,
            transition: 'all 0.3s',
          }}>
            {/* Pemilih 32x32 — bucket terkecil sudah lebih dari cukup. */}
            <img
              src={getOptimizedImageUrl(url, 320)}
              onError={fallbackToOriginal(url)}
              alt="" loading="lazy" decoding="async"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </button>
        ))}
      </div>
    </div>
    </SectionWrapper>
  )
}

//  MOSAIC: Asymmetric magazine-style grid

function MosaicView({ section, ctx }: { section: SectionConfig; ctx: StyleCtx }) {
  const { accent, text, headingFont, bodyFont, photos, onOpen } = ctx

  return (
    <SectionWrapper section={section}>
      <div className="w-full py-14">
        <EditorialHeader accent={accent} text={text} headingFont={headingFont} bodyFont={bodyFont} />

        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07 } } }}
          style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>

          {/* Render by pattern groups */}
          {(() => {
            const elements: React.ReactNode[] = []
            let i = 0
            let patternStep = 0

            while (i < photos.length) {
              const remaining = photos.length - i

              if (patternStep % 3 === 0 && remaining >= 3) {
                // Big left + 2 stacked right
                elements.push(
                  <div key={`g${i}`} style={{ display: 'flex', gap: 4, height: 280 }}>
                    <MosaicTile url={photos[i]} idx={i} onOpen={onOpen} style={{ flex: 1.15 }} />
                    <div style={{ flex: 0.85, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <MosaicTile url={photos[i + 1]} idx={i + 1} onOpen={onOpen} style={{ flex: 1 }} />
                      <MosaicTile url={photos[i + 2]} idx={i + 2} onOpen={onOpen} style={{ flex: 1 }} />
                    </div>
                  </div>
                )
                i += 3
              } else if (patternStep % 3 === 1 && remaining >= 3) {
                // 2 stacked left + big right
                elements.push(
                  <div key={`g${i}`} style={{ display: 'flex', gap: 4, height: 280 }}>
                    <div style={{ flex: 0.85, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <MosaicTile url={photos[i]} idx={i} onOpen={onOpen} style={{ flex: 1 }} />
                      <MosaicTile url={photos[i + 1]} idx={i + 1} onOpen={onOpen} style={{ flex: 1 }} />
                    </div>
                    <MosaicTile url={photos[i + 2]} idx={i + 2} onOpen={onOpen} style={{ flex: 1.15 }} />
                  </div>
                )
                i += 3
              } else if (patternStep % 3 === 2 && remaining >= 2) {
                // Wide + narrow
                elements.push(
                  <div key={`g${i}`} style={{ display: 'flex', gap: 4, height: 180 }}>
                    <MosaicTile url={photos[i]} idx={i} onOpen={onOpen} style={{ flex: 1.6 }} />
                    <MosaicTile url={photos[i + 1]} idx={i + 1} onOpen={onOpen} style={{ flex: 1 }} />
                  </div>
                )
                i += 2
              } else if (remaining === 2) {
                elements.push(
                  <div key={`g${i}`} style={{ display: 'flex', gap: 4, height: 200 }}>
                    <MosaicTile url={photos[i]} idx={i} onOpen={onOpen} style={{ flex: 1 }} />
                    <MosaicTile url={photos[i + 1]} idx={i + 1} onOpen={onOpen} style={{ flex: 1 }} />
                  </div>
                )
                i += 2
              } else {
                elements.push(
                  <div key={`g${i}`} style={{ height: 220 }}>
                    <MosaicTile url={photos[i]} idx={i} onOpen={onOpen} style={{ width: '100%', height: '100%' }} />
                  </div>
                )
                i += 1
              }
              patternStep++
            }
            return elements
          })()}
        </motion.div>

        <FooterOrnament accent={accent} text={text} bodyFont={bodyFont} count={photos.length} />
      </div>
    </SectionWrapper>
  )
}

function MosaicTile({ url, idx, onOpen, style }: {
  url: string; idx: number; onOpen: (i: number) => void; style?: React.CSSProperties
}) {
  return (
    <motion.button
      variants={{ hidden: { opacity: 0, scale: 0.96 }, visible: { opacity: 1, scale: 1 } }}
      onClick={() => onOpen(idx)}
      style={{
        overflow: 'hidden', cursor: 'pointer', border: 'none', padding: 0,
        background: 'none', position: 'relative', display: 'block', ...style,
      }}>
      <img
        src={getOptimizedImageUrl(url, 480)}
        onError={fallbackToOriginal(url)}
        alt={`Foto ${idx + 1}`} loading="lazy" decoding="async"
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
    </motion.button>
  )
}

//  FILMSTRIP: Horizontal scrolling cinematic strip 

function FilmstripView({ section, ctx }: { section: SectionConfig; ctx: StyleCtx }) {
  const { accent, text, headingFont, bodyFont, photos, onOpen } = ctx
  const scrollRef = useRef<HTMLDivElement>(null)
  const [scrollPct, setScrollPct] = useState(0)

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const pct = el.scrollWidth > el.clientWidth
      ? el.scrollLeft / (el.scrollWidth - el.clientWidth)
      : 0
    setScrollPct(pct)
  }, [])

  return (
    <SectionWrapper section={section}>
      <div className="w-full py-14">
        <EditorialHeader accent={accent} text={text} headingFont={headingFont} bodyFont={bodyFont} mb={20} />

        {/* Scroll progress bar */}
        <div style={{ padding: '0 40px', marginBottom: 16 }}>
          <div style={{ height: 1.5, background: `${accent}22`, position: 'relative', overflow: 'hidden' }}>
            <motion.div
              animate={{ width: `${Math.max(scrollPct * 100, 5)}%` }}
              transition={{ duration: 0.15 }}
              style={{ height: '100%', background: accent, position: 'absolute', left: 0, top: 0 }}
            />
          </div>
        </div>

        {/* Horizontal scroll strip */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          style={{
            display: 'flex', gap: 6, overflowX: 'auto', overflowY: 'hidden',
            scrollSnapType: 'x mandatory', paddingLeft: 16, paddingRight: 16,
            scrollbarWidth: 'none', msOverflowStyle: 'none',
          }}>
          {/* Spacer start */}
          <div style={{ minWidth: 24, flexShrink: 0 }} />

          {photos.map((url, i) => {
            const isFeature = i === 0 || i === Math.floor(photos.length / 2)
            return (
              <motion.button key={i}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={{ hidden: { opacity: 0, x: 20 }, visible: { opacity: 1, x: 0, transition: { delay: i * 0.05 } } }}
                onClick={() => onOpen(i)}
                style={{
                  flexShrink: 0, cursor: 'pointer', border: 'none', padding: 0, background: 'none',
                  scrollSnapAlign: 'center', position: 'relative', overflow: 'hidden',
                  width: isFeature ? 220 : 150,
                  height: isFeature ? 300 : 260,
                }}>
                <img
                  src={getOptimizedImageUrl(url, 480)}
                  onError={fallbackToOriginal(url)}
                  alt={`Foto ${i + 1}`} loading="lazy" decoding="async"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                {/* Number overlay */}
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  padding: '20px 10px 10px',
                  background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)',
                }}>
                  <span style={{
                    fontSize: 9, fontWeight: 600, letterSpacing: '0.2em',
                    color: 'rgba(255,255,255,0.5)',
                  }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>
              </motion.button>
            )
          })}

          {/* Spacer end */}
          <div style={{ minWidth: 24, flexShrink: 0 }} />
        </div>

        {/* Swipe hint */}
        <p className="text-center" style={{
          fontSize: fsb(8), color: `${text}60`, fontFamily: bodyFont,
          letterSpacing: '0.1em', marginTop: 14,
        }}>
          Geser untuk melihat
        </p>

        <FooterOrnament accent={accent} text={text} bodyFont={bodyFont} count={photos.length} />
      </div>
    </SectionWrapper>
  )
}

//  COLLAGE: Overlapping editorial spread 

function CollageView({ section, ctx }: { section: SectionConfig; ctx: StyleCtx }) {
  const { accent, text, headingFont, bodyFont, photos, onOpen } = ctx

  // Take up to 7 photos for the collage layout, rest go into a mini strip
  const collagePhotos = photos.slice(0, 7)
  const extraPhotos = photos.slice(7)

  // Layout: each photo gets a specific position/rotation for an editorial scattered look
  const layouts = [
    { top: 0, left: '8%', width: '55%', aspectRatio: '3 / 4', rotation: -2.5, zIndex: 2 },
    { top: 20, left: '38%', width: '58%', aspectRatio: '4 / 5', rotation: 2, zIndex: 3 },
    { top: 340, left: '4%', width: '48%', aspectRatio: '1 / 1', rotation: 1.5, zIndex: 4 },
    { top: 370, left: '46%', width: '50%', aspectRatio: '3 / 4', rotation: -1.8, zIndex: 5 },
    { top: 620, left: '12%', width: '76%', aspectRatio: '16 / 10', rotation: 0.5, zIndex: 6 },
    { top: 810, left: '2%', width: '46%', aspectRatio: '4 / 5', rotation: -2, zIndex: 7 },
    { top: 830, left: '50%', width: '46%', aspectRatio: '1 / 1', rotation: 1.2, zIndex: 8 },
  ]

  const totalHeight = collagePhotos.length <= 2 ? 420
    : collagePhotos.length <= 4 ? 680
    : collagePhotos.length <= 5 ? 820
    : 1060

  return (
    <SectionWrapper section={section}>
      <div className="w-full py-14">
        <EditorialHeader accent={accent} text={text} headingFont={headingFont} bodyFont={bodyFont} />

        {/* Collage area */}
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
          style={{ position: 'relative', marginLeft: 16, marginRight: 16, height: totalHeight }}>

          {collagePhotos.map((url, i) => {
            const lay = layouts[i] ?? layouts[layouts.length - 1]
            return (
              <motion.button key={i}
                variants={{
                  hidden: { opacity: 0, y: 30, rotate: 0 },
                  visible: { opacity: 1, y: 0, rotate: lay.rotation, transition: { duration: 0.6, ease: 'easeOut' } },
                }}
                onClick={() => onOpen(i)}
                style={{
                  position: 'absolute',
                  top: lay.top, left: lay.left, width: lay.width,
                  zIndex: lay.zIndex,
                  cursor: 'pointer', border: 'none', padding: 0, background: 'none',
                  transformOrigin: 'center center',
                }}>
                {/* Shadow border frame */}
                <div style={{
                  padding: 5, background: '#fff',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.1), 0 1px 4px rgba(0,0,0,0.06)',
                }}>
                  <img
                    src={getOptimizedImageUrl(url, 480)}
                    onError={fallbackToOriginal(url)}
                    alt={`Foto ${i + 1}`} loading="lazy" decoding="async"
                    style={{ width: '100%', aspectRatio: lay.aspectRatio, objectFit: 'cover', display: 'block' }} />
                </div>
              </motion.button>
            )
          })}
        </motion.div>

        {/* Extra photos as mini strip */}
        {extraPhotos.length > 0 && (
          <div style={{
            display: 'flex', gap: 4, padding: '0 16px', marginTop: 20,
            overflowX: 'auto', scrollbarWidth: 'none',
          }}>
            {extraPhotos.map((url, ci) => {
              const idx = 7 + ci
              return (
                <button key={idx} onClick={() => onOpen(idx)} style={{
                  flexShrink: 0, width: 72, height: 72, overflow: 'hidden',
                  cursor: 'pointer', border: 'none', padding: 0, background: 'none',
                }}>
                  {/* Strip mini 72x72 */}
                  <img
                    src={getOptimizedImageUrl(url, 320)}
                    onError={fallbackToOriginal(url)}
                    alt={`Foto ${idx + 1}`} loading="lazy" decoding="async"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </button>
              )
            })}
          </div>
        )}

        <FooterOrnament accent={accent} text={text} bodyFont={bodyFont} count={photos.length} />
      </div>
    </SectionWrapper>
  )
}

//  Empty state 

function EmptyPreview({ section, accent, text, headingFont, bodyFont }: {
  section: SectionConfig; accent: string; text: string; headingFont: string; bodyFont: string
}) {
  return (
    <SectionWrapper section={section}>
      <div className="w-full max-w-[300px] mx-auto px-6 py-14 text-center">
        <Ornament accent={accent} />
        <p style={{ fontSize: fsb(9), letterSpacing: '0.3em', textTransform: 'uppercase', color: `${accent}70`, fontFamily: bodyFont, marginTop: 20, marginBottom: 10 }}>Galeri</p>
        <p style={{ fontSize: fsh(20), fontWeight: 400, color: text, fontFamily: headingFont, letterSpacing: '-0.01em', marginBottom: 24 }}>Momen Kami</p>
        <div style={{ display: 'flex', gap: 8 }}>
          {[1, 2].map(col => (
            <div key={col} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} style={{
                  aspectRatio: i % 2 === 0 ? '3 / 4' : '1 / 1',
                  background: `${accent}18`, border: `1px solid ${accent}22`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <ImageIcon size={16} style={{ color: `${accent}25` }} />
                </div>
              ))}
            </div>
          ))}
        </div>
        <p style={{ fontSize: fsb(8), color: `${text}60`, fontFamily: bodyFont, marginTop: 16, letterSpacing: '0.1em' }}>
          Upload foto di tab Galeri
        </p>
      </div>
    </SectionWrapper>
  )
}

//  MAIN 

export default function GallerySection({ section, data, meta }: Props) {
  const { accent, text, primary } = meta.color_scheme
  const font = resolveFont(meta, section)
  const photos = data.gallery_photos ?? []
  const [lightbox, setLightbox] = useState<number | null>(null)
  const { isPreview } = usePreviewContext()

  const headingFont = `'${font.heading}', serif`
  const bodyFont = `'${font.body}', serif`

  if (photos.length === 0) {
    if (!isPreview) return null
    return <EmptyPreview section={section} accent={accent} text={text} headingFont={headingFont} bodyFont={bodyFont} />
  }

  const ctx: StyleCtx = {
    accent, text, primary, headingFont, bodyFont, photos,
    onOpen: (i: number) => setLightbox(i),
  }

  const prev = () => setLightbox(i => (i !== null ? (i - 1 + photos.length) % photos.length : null))
  const next = () => setLightbox(i => (i !== null ? (i + 1) % photos.length : null))

  const variant = section.style_variant ?? 'default'

  return (
    <>
      {variant === 'dramatic' ? (
        <DramaticView section={section} ctx={ctx} />
      ) : variant === 'mosaic' ? (
        <MosaicView section={section} ctx={ctx} />
      ) : variant === 'filmstrip' ? (
        <FilmstripView section={section} ctx={ctx} />
      ) : variant === 'collage' ? (
        <CollageView section={section} ctx={ctx} />
      ) : (
        <DefaultView section={section} ctx={ctx} />
      )}

      {lightbox !== null && (
        <Lightbox photos={photos} index={lightbox} onClose={() => setLightbox(null)} onPrev={prev} onNext={next} />
      )}
    </>
  )
}
