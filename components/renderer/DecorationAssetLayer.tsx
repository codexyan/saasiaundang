'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import type { Variants, TargetAndTransition, Transition } from 'framer-motion'
import type { DecorationAsset, AssetIdleAnimation, AssetExitAnimation, AssetKeyframeState, AssetKeyframeConfig, AssetKeyframeEasing } from '@/lib/types'
import { resolveAssetUrl } from '@/lib/built-in-assets'

interface LayerProps {
  assets: DecorationAsset[]
  animate?: boolean
  exiting?: boolean
}


type MotionTarget = TargetAndTransition

function keyframeToMotion(kf: AssetKeyframeState): MotionTarget {
  const result: MotionTarget = {}
  if (kf.opacity !== undefined) result.opacity = kf.opacity
  if (kf.x !== undefined) result.x = kf.x
  if (kf.y !== undefined) result.y = kf.y
  if (kf.scale !== undefined) result.scale = kf.scale
  if (kf.rotate !== undefined) result.rotate = kf.rotate
  if (kf.blur !== undefined) result.filter = `blur(${kf.blur}px)`
  return result
}

function keyframeEasingToMotion(easing?: AssetKeyframeEasing): number[] | string | undefined {
  switch (easing) {
    case 'ease':        return [0.25, 0.46, 0.45, 0.94]
    case 'ease-in':     return [0.42, 0, 1, 1]
    case 'ease-out':    return [0, 0, 0.58, 1]
    case 'ease-in-out': return [0.42, 0, 0.58, 1]
    case 'linear':      return 'linear'
    case 'spring':      return undefined
    default:            return [0.25, 0.46, 0.45, 0.94]
  }
}

function getEntryVariants(anim: string, keyframes?: AssetKeyframeConfig): Variants {
  if (anim === 'custom' && keyframes) {
    return {
      hidden: keyframeToMotion(keyframes.from),
      visible: keyframeToMotion(keyframes.to),
    }
  }
  switch (anim) {
    case 'fade-in':    return { hidden: { opacity: 0 },              visible: { opacity: 1 } }
    case 'slide-left': return { hidden: { opacity: 0, x: -60 },      visible: { opacity: 1, x: 0 } }
    case 'slide-right':return { hidden: { opacity: 0, x: 60 },       visible: { opacity: 1, x: 0 } }
    case 'slide-up':   return { hidden: { opacity: 0, y: 50 },       visible: { opacity: 1, y: 0 } }
    case 'slide-down': return { hidden: { opacity: 0, y: -50 },      visible: { opacity: 1, y: 0 } }
    case 'zoom-in':    return { hidden: { opacity: 0, scale: 0.4 },  visible: { opacity: 1, scale: 1 } }
    case 'rotate-in':  return { hidden: { opacity: 0, rotate: -120, scale: 0.3 }, visible: { opacity: 1, rotate: 0, scale: 1 } }
    default:           return { hidden: { opacity: 0 },              visible: { opacity: 1 } }
  }
}

function getExitTarget(anim: AssetExitAnimation, keyframes?: AssetKeyframeConfig): MotionTarget {
  if (anim === 'custom' && keyframes) {
    return keyframeToMotion(keyframes.to)
  }
  switch (anim) {
    case 'fade-out':       return { opacity: 0 }
    case 'slide-out-left': return { opacity: 0, x: -80 }
    case 'slide-out-right':return { opacity: 0, x: 80 }
    case 'slide-out-up':   return { opacity: 0, y: -80 }
    case 'slide-out-down': return { opacity: 0, y: 80 }
    case 'zoom-out':       return { opacity: 0, scale: 0.2 }
    case 'rotate-out':     return { opacity: 0, rotate: 120, scale: 0.3 }
    case 'shrink':         return { opacity: 0, scale: 0 }
    case 'blur-out':       return { opacity: 0, filter: 'blur(16px)' }
    default:               return {}
  }
}

function getIdleProps(idle: AssetIdleAnimation, speed: string, opacity: number): object {
  const dur = speed === 'slow' ? 4 : speed === 'fast' ? 1.5 : 2.5
  switch (idle) {
    case 'float':
      return { animate: { y: [0, -12, 0] }, transition: { duration: dur + 1, repeat: Infinity, ease: 'easeInOut' } }
    case 'pulse':
      return { animate: { scale: [1, 1.08, 1] }, transition: { duration: dur, repeat: Infinity, ease: 'easeInOut' } }
    case 'shimmer':
      return { animate: { opacity: [opacity / 100, (opacity / 100) * 0.45, opacity / 100] }, transition: { duration: dur, repeat: Infinity, ease: 'easeInOut' } }
    case 'sway':
      return { animate: { rotate: [-6, 6, -6] }, transition: { duration: dur + 0.5, repeat: Infinity, ease: 'easeInOut' } }
    case 'spin-slow':
      return { animate: { rotate: 360 }, transition: { duration: dur * 3, repeat: Infinity, ease: 'linear' } }
    case 'heartbeat':
      return { animate: { scale: [1, 1.15, 1, 1.08, 1] }, transition: { duration: dur * 0.6, repeat: Infinity, times: [0, 0.2, 0.4, 0.6, 1] } }
    case 'drift-right':
      return { animate: { x: [-6, 6, -6] }, transition: { duration: dur + 1, repeat: Infinity, ease: 'easeInOut' } }
    default:
      return {}
  }
}

//  Single asset item 
interface ItemProps {
  asset: DecorationAsset
  doAnimate: boolean
  exiting: boolean
}

function DecorationAssetItem({ asset, doAnimate, exiting }: ItemProps) {
  const [entryDone, setEntryDone] = useState(!doAnimate || asset.animation === 'none')

  useEffect(() => {
    if (doAnimate) setEntryDone(asset.animation === 'none')
  }, [doAnimate, asset.animation])

  const rotate    = asset.rotation ?? 0
  const flipH     = asset.flip_h ? -1 : 1
  const flipV     = asset.flip_v ? -1 : 1
  const opacity   = (asset.opacity ?? 100) / 100
  const delay     = (asset.animation_delay ?? 0) / 1000
  const idle      = asset.idle_animation ?? 'none'
  const idleSpeed = asset.idle_speed ?? 'normal'
  const zLayer    = asset.z_layer ?? 0
  const exitAnim  = asset.exit_animation ?? 'none'
  const exitDelay = (asset.exit_delay ?? 0) / 1000
  const src       = resolveAssetUrl(asset.url)

  /**
   * Penempatan dipisah dua lapis dengan sengaja.
   *
   * LUAR memegang posisi (left/top persen + translate(-50%,-50%) supaya x,y
   * berarti TITIK PUSAT aset). DALAM yang dianimasikan framer-motion.
   *
   * Kalau keduanya digabung seperti dulu, transform animasi milik motion
   * MENIMPA transform penempatan — anchor yang butuh translate (mis. 'center')
   * jadi meleset begitu animasinya jalan. Bug laten yang tidak pernah terlihat
   * hanya karena belum ada template yang memakai kombinasi itu.
   */
  const outerStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${asset.x}%`,
    top: `${asset.y}%`,
    width: `${asset.w}%`,
    ...(asset.h != null ? { height: `${asset.h}%` } : {}),
    transform: 'translate(-50%, -50%)',
    zIndex: 15 + zLayer,
  }

  const imgStyle: React.CSSProperties = {
    width: '100%',
    height: asset.h != null ? '100%' : 'auto',
    objectFit: asset.h != null ? 'fill' : undefined,
    opacity,
    transform: `rotate(${rotate}deg) scale(${flipH}, ${flipV})`,
    display: 'block',
  }

  // Exit animation override
  if (exiting && exitAnim !== 'none') {
    const exitKf = asset.exit_keyframes
    const exitTarget = getExitTarget(exitAnim, exitKf)
    const exitDur = (exitAnim === 'custom' && exitKf?.duration) ? exitKf.duration / 1000 : 0.7
    const exitEaseVal = exitAnim === 'custom' && exitKf?.easing
      ? (exitKf.easing === 'spring' ? undefined : keyframeEasingToMotion(exitKf.easing))
      : [0.4, 0, 0.2, 1]
    const isSpringExit = exitAnim === 'custom' && exitKf?.easing === 'spring'
    const exitTransition: Transition = {
      ...(isSpringExit ? { type: 'spring' as const, damping: 15 } : { duration: exitDur }),
      delay: exitDelay,
      ...(exitEaseVal ? { ease: exitEaseVal as [number, number, number, number] } : {}),
    }
    const hasCustomInit = exitAnim === 'custom' && exitKf
    return (
      <div style={outerStyle}>
        <motion.div
          {...(hasCustomInit ? { initial: keyframeToMotion(exitKf.from) as any } : {})}
          animate={exitTarget}
          transition={exitTransition}
        >
          <img src={src} alt="" draggable={false} style={imgStyle} />
        </motion.div>
      </div>
    )
  }

  const idleProps = entryDone && idle !== 'none' ? getIdleProps(idle, idleSpeed, asset.opacity ?? 100) : {}

  if (!doAnimate || asset.animation === 'none') {
    return (
      <div style={outerStyle}>
        <motion.div {...idleProps}>
          <img src={src} alt="" draggable={false} style={imgStyle} />
        </motion.div>
      </div>
    )
  }

  const entryKf = asset.entry_keyframes
  const anim = asset.animation ?? 'fade-in'
  const entryVariants = getEntryVariants(anim, entryKf)
  const entryDur = (anim === 'custom' && entryKf?.duration) ? entryKf.duration / 1000 : 0.9
  const entryEaseVal = anim === 'custom' && entryKf?.easing
    ? (entryKf.easing === 'spring' ? undefined : keyframeEasingToMotion(entryKf.easing))
    : [0.25, 0.46, 0.45, 0.94]
  const isSpringEntry = anim === 'custom' && entryKf?.easing === 'spring'
  const entryTransition: Transition = {
    ...(isSpringEntry ? { type: 'spring' as const, damping: 15 } : { duration: entryDur }),
    delay,
    ...(entryEaseVal ? { ease: entryEaseVal as [number, number, number, number] } : {}),
  }

  return (
    <div style={outerStyle}>
      <motion.div
        initial="hidden"
        /**
         * Tetap 'visible' sesudah animasi masuk selesai.
         *
         * Dulu nilainya dikembalikan ke undefined begitu entryDone true.
         * Dengan `initial="hidden"` masih terpasang, framer-motion menganggap
         * tidak ada target dan memulangkan elemen ke varian hidden, yaitu
         * opacity 0 — jadi setiap dekorasi muncul sebentar lalu lenyap, di
         * pratinjau maupun di undangan hidup. Terukur: opacity pembungkus
         * motion 0 sementara gambarnya sendiri opacity 1 dan posisinya benar.
         *
         * Animasi idle tetap menang karena idleProps disebar sesudah baris
         * ini dan membawa `animate` sendiri.
         */
        animate="visible"
        variants={entryVariants}
        transition={entryTransition}
        onAnimationComplete={() => setEntryDone(true)}
        {...(entryDone ? idleProps : {})}
      >
        <img src={src} alt="" draggable={false} style={imgStyle} />
      </motion.div>
    </div>
  )
}

//  Layer container 
export default function DecorationAssetLayer({ assets, animate = true, exiting = false }: LayerProps) {
  if (!assets || assets.length === 0) return null

  const sorted = [...assets].sort((a, b) => (a.z_layer ?? 0) - (b.z_layer ?? 0))

  return (
    <div className="absolute inset-0 pointer-events-none">
      {sorted.map(asset => (
        <DecorationAssetItem key={asset.id} asset={asset} doAnimate={animate} exiting={exiting} />
      ))}
    </div>
  )
}
