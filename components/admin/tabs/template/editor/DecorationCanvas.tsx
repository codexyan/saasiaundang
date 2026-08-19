'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { RotateCw } from 'lucide-react'
import type { DecorationAsset } from '@/lib/types'
import { resolveAssetUrl } from '@/lib/built-in-assets'

interface Props {
  assets: DecorationAsset[]
  onUpdate: (assets: DecorationAsset[]) => void
  selectedId: string | null
  onSelect: (id: string | null) => void
  /** Id aset yang disembunyikan sementara (khusus editor, tidak ikut tersimpan). */
  hiddenIds: Set<string>
  /** Id aset yang dikunci dari interaksi kanvas. */
  lockedIds: Set<string>
  /** Ukuran kanvas dalam piksel CSS — dipakai untuk konversi persen <-> piksel. */
  width: number
  height: number
}

/** Ambang menempel, dalam persen kanvas. */
const SNAP_PCT = 1.2
/** Nudge dengan panah, dalam persen. */
const NUDGE = 0.5
const NUDGE_BIG = 5

type Handle = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'w' | 'e'
type DragMode = { kind: 'move' } | { kind: 'resize'; handle: Handle } | { kind: 'rotate' }

interface DragState {
  id: string
  mode: DragMode
  startPx: { x: number; y: number }
  orig: { x: number; y: number; w: number; h: number; rotation: number }
  /** Rasio tinggi:lebar dalam satuan persen kanvas, untuk resize proporsional. */
  ratio: number
}

interface Guide { axis: 'x' | 'y'; at: number }

const HANDLES: { id: Handle; cx: number; cy: number; cursor: string }[] = [
  { id: 'nw', cx: 0,   cy: 0,   cursor: 'nwse-resize' },
  { id: 'n',  cx: 0.5, cy: 0,   cursor: 'ns-resize' },
  { id: 'ne', cx: 1,   cy: 0,   cursor: 'nesw-resize' },
  { id: 'e',  cx: 1,   cy: 0.5, cursor: 'ew-resize' },
  { id: 'se', cx: 1,   cy: 1,   cursor: 'nwse-resize' },
  { id: 's',  cx: 0.5, cy: 1,   cursor: 'ns-resize' },
  { id: 'sw', cx: 0,   cy: 1,   cursor: 'nesw-resize' },
  { id: 'w',  cx: 0,   cy: 0.5, cursor: 'ew-resize' },
]

/**
 * Kanvas dekorasi.
 *
 * Menggantikan "Moodboard" lama. Tiga perbedaan yang paling terasa:
 *
 * 1. SATU sistem koordinat. Semua posisi & ukuran dalam persen kanvas, jadi
 *    menyeret aset tidak lagi diam-diam menghapus pilihan anchor — karena
 *    anchor-nya memang sudah tidak ada. Nilai di luar 0-100 diizinkan supaya
 *    aset bisa menggantung keluar bingkai.
 * 2. Delapan handle, bukan satu. Sudut menjaga rasio, sisi meregangkan bebas
 *    (mengisi `h`), jadi tinggi akhirnya bisa dikendalikan — dulu tidak bisa
 *    sama sekali karena tinggi selalu `auto`.
 * 3. Keyboard sungguhan: panah menggeser, Shift mempercepat, Delete menghapus,
 *    Ctrl/Cmd+D menggandakan, Escape melepas pilihan.
 */
export default function DecorationCanvas({
  assets, onUpdate, selectedId, onSelect, hiddenIds, lockedIds, width, height,
}: Props) {
  const boardRef = useRef<HTMLDivElement>(null)
  const [drag, setDrag] = useState<DragState | null>(null)
  const [guides, setGuides] = useState<Guide[]>([])
  const [shift, setShift] = useState(false)

  const assetsRef = useRef(assets)
  assetsRef.current = assets

  const patch = useCallback((id: string, p: Partial<DecorationAsset>) => {
    onUpdate(assetsRef.current.map(a => (a.id === id ? { ...a, ...p } : a)))
  }, [onUpdate])

  const selected = useMemo(() => assets.find(a => a.id === selectedId) ?? null, [assets, selectedId])

  /** Tinggi efektif sebuah aset dalam persen kanvas. */
  const heightPct = useCallback((a: DecorationAsset) => {
    if (a.h != null) return a.h
    // Tanpa `h`, tinggi mengikuti rasio asli gambar. Kanvas tidak tahu rasio
    // itu sampai gambarnya termuat, jadi dipakai perkiraan 1:1 — cukup untuk
    // kotak seleksi, dan segera akurat begitu admin menyentuh handle sisi.
    return (a.w * width) / height
  }, [width, height])

  //  Menempel ke tepi, tengah, sepertiga, dan aset lain

  const snap = useCallback((x: number, y: number, w: number, h: number, selfId: string) => {
    if (shift) return { x, y, guides: [] as Guide[] }   // Shift = bebas, tanpa magnet

    const gs: Guide[] = []
    let sx = x, sy = y

    const xt = [0, 25, 50, 75, 100]
    const yt = [0, 25, 50, 75, 100]
    for (const a of assetsRef.current) {
      if (a.id === selfId || hiddenIds.has(a.id)) continue
      const ah = heightPct(a)
      xt.push(a.x, a.x - a.w / 2, a.x + a.w / 2)
      yt.push(a.y, a.y - ah / 2, a.y + ah / 2)
    }

    // Tepi kiri/pusat/kanan aset yang sedang digeser dicocokkan ke tiap target.
    for (const t of xt) {
      for (const [edge, delta] of [[x - w / 2, w / 2], [x, 0], [x + w / 2, -w / 2]] as const) {
        if (Math.abs(edge - t) < SNAP_PCT) { sx = t + delta; gs.push({ axis: 'x', at: t }); break }
      }
    }
    for (const t of yt) {
      for (const [edge, delta] of [[y - h / 2, h / 2], [y, 0], [y + h / 2, -h / 2]] as const) {
        if (Math.abs(edge - t) < SNAP_PCT) { sy = t + delta; gs.push({ axis: 'y', at: t }); break }
      }
    }
    return { x: sx, y: sy, guides: gs }
  }, [shift, hiddenIds, heightPct])

  //  Seret

  const begin = useCallback((e: React.PointerEvent, a: DecorationAsset, mode: DragMode) => {
    if (lockedIds.has(a.id)) return
    e.preventDefault()
    e.stopPropagation()
    onSelect(a.id)
    const h = heightPct(a)
    setDrag({
      id: a.id,
      mode,
      startPx: { x: e.clientX, y: e.clientY },
      orig: { x: a.x, y: a.y, w: a.w, h, rotation: a.rotation ?? 0 },
      ratio: h / a.w,
    })
  }, [lockedIds, onSelect, heightPct])

  useEffect(() => {
    if (!drag) return
    const board = boardRef.current
    if (!board) return
    const rect = board.getBoundingClientRect()

    const onMove = (e: PointerEvent) => {
      // Piksel layar -> persen kanvas. Dihitung dari rect sungguhan supaya
      // benar di zoom berapa pun tanpa perlu tahu faktor zoom-nya.
      const dxPct = ((e.clientX - drag.startPx.x) / rect.width) * 100
      const dyPct = ((e.clientY - drag.startPx.y) / rect.height) * 100
      const o = drag.orig

      if (drag.mode.kind === 'move') {
        const s = snap(o.x + dxPct, o.y + dyPct, o.w, o.h, drag.id)
        setGuides(s.guides)
        patch(drag.id, { x: round2(s.x), y: round2(s.y) })
        return
      }

      if (drag.mode.kind === 'rotate') {
        const cx = rect.left + (o.x / 100) * rect.width
        const cy = rect.top + (o.y / 100) * rect.height
        const now = Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI)
        const start = Math.atan2(drag.startPx.y - cy, drag.startPx.x - cx) * (180 / Math.PI)
        let deg = Math.round(o.rotation + (now - start))
        // Shift = kelipatan 15°, bukan sebaliknya: menahan Shift adalah isyarat
        // "aku mau presisi", bukan "aku mau bebas".
        if (shift) deg = Math.round(deg / 15) * 15
        else for (const s of [0, 45, 90, 135, 180, -45, -90, -135, -180]) {
          if (Math.abs(deg - s) < 4) { deg = s; break }
        }
        patch(drag.id, { rotation: ((deg + 540) % 360) - 180 })
        return
      }

      /**
       * Resize. Aset diubah ukurannya dari PUSAT (karena x,y adalah pusat),
       * jadi pergeseran pointer dikali 2.
       *
       *  sudut  -> rasio terjaga
       *  kiri/kanan -> hanya lebar
       *  atas/bawah -> hanya tinggi, dan ini yang menetapkan `h` eksplisit.
       *    Tanpa cabang ini tinggi selalu ikut rasio gambar dan tarikan admin
       *    terasa diabaikan — persis keluhan "kurang leluasa" pada model lama.
       */
      const hd = drag.mode.handle
      const signX = hd.includes('e') ? 1 : hd.includes('w') ? -1 : 0
      const signY = hd.includes('s') ? 1 : hd.includes('n') ? -1 : 0
      const corner = signX !== 0 && signY !== 0

      if (corner) {
        const w = Math.max(1, o.w + signX * dxPct * 2)
        patch(drag.id, {
          w: round2(w),
          // Aset yang tinggi kustomnya sudah diatur tetap dipertahankan
          // proporsional; yang belum, dibiarkan ikut rasio aslinya.
          ...(hasExplicitHeight(assetsRef.current, drag.id)
            ? { h: round2(w * drag.ratio) }
            : {}),
        })
      } else if (signX !== 0) {
        patch(drag.id, { w: round2(Math.max(1, o.w + signX * dxPct * 2)) })
      } else {
        patch(drag.id, { h: round2(Math.max(1, o.h + signY * dyPct * 2)) })
      }
    }

    const onUp = () => { setDrag(null); setGuides([]) }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [drag, patch, snap, shift])

  //  Keyboard

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setShift(true)

      const target = e.target as HTMLElement | null
      // Jangan bajak pengetikan di form mana pun.
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return
      if (target?.isContentEditable) return
      if (!selected || lockedIds.has(selected.id)) return

      const step = e.shiftKey ? NUDGE_BIG : NUDGE
      switch (e.key) {
        case 'ArrowLeft':  e.preventDefault(); patch(selected.id, { x: round2(selected.x - step) }); break
        case 'ArrowRight': e.preventDefault(); patch(selected.id, { x: round2(selected.x + step) }); break
        case 'ArrowUp':    e.preventDefault(); patch(selected.id, { y: round2(selected.y - step) }); break
        case 'ArrowDown':  e.preventDefault(); patch(selected.id, { y: round2(selected.y + step) }); break
        case 'Escape':     onSelect(null); break
        case 'Delete':
        case 'Backspace':
          e.preventDefault()
          onUpdate(assetsRef.current.filter(a => a.id !== selected.id))
          onSelect(null)
          break
        case 'd':
        case 'D':
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault()
            const clone: DecorationAsset = {
              ...selected,
              id: 'deco-' + Date.now().toString(36),
              label: (selected.label ?? 'Aset') + ' salinan',
              x: round2(selected.x + 4),
              y: round2(selected.y + 4),
            }
            onUpdate([...assetsRef.current, clone])
            onSelect(clone.id)
          }
          break
      }
    }
    const onKeyUp = (e: KeyboardEvent) => { if (e.key === 'Shift') setShift(false) }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [selected, patch, onSelect, onUpdate, lockedIds])

  const sorted = useMemo(
    () => [...assets].sort((a, b) => (a.z_layer ?? 0) - (b.z_layer ?? 0)),
    [assets],
  )

  return (
    <div
      ref={boardRef}
      className="absolute inset-0 z-30"
      onPointerDown={e => { if (e.target === boardRef.current) onSelect(null) }}
      style={{ cursor: drag?.mode.kind === 'move' ? 'grabbing' : 'default' }}
    >
      {/* Garis bantu */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-[60]" viewBox="0 0 100 100" preserveAspectRatio="none">
        <line x1={50} y1={0} x2={50} y2={100} stroke="#94a3b8" strokeWidth={0.15} opacity={0.25} strokeDasharray="1 2" vectorEffect="non-scaling-stroke" />
        <line x1={0} y1={50} x2={100} y2={50} stroke="#94a3b8" strokeWidth={0.15} opacity={0.25} strokeDasharray="1 2" vectorEffect="non-scaling-stroke" />
        {guides.map((g, i) => g.axis === 'x' ? (
          <line key={i} x1={g.at} y1={-20} x2={g.at} y2={120} stroke="#6366f1" strokeWidth={1} strokeDasharray="4 3" vectorEffect="non-scaling-stroke" />
        ) : (
          <line key={i} x1={-20} y1={g.at} x2={120} y2={g.at} stroke="#6366f1" strokeWidth={1} strokeDasharray="4 3" vectorEffect="non-scaling-stroke" />
        ))}
      </svg>

      {sorted.map(a => {
        if (hiddenIds.has(a.id)) return null
        const isSel = a.id === selectedId
        const isLocked = lockedIds.has(a.id)

        return (
          <div
            key={a.id}
            className="absolute"
            style={{
              left: `${a.x}%`,
              top: `${a.y}%`,
              width: `${a.w}%`,
              ...(a.h != null ? { height: `${a.h}%` } : {}),
              transform: 'translate(-50%, -50%)',
              zIndex: 15 + (a.z_layer ?? 0) + (isSel ? 200 : 0),
            }}
          >
            <div
              className={isLocked ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}
              onPointerDown={e => begin(e, a, { kind: 'move' })}
              style={{ position: 'relative', width: '100%', height: a.h != null ? '100%' : 'auto' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resolveAssetUrl(a.url)}
                alt={a.label ?? ''}
                draggable={false}
                className="select-none pointer-events-none block"
                style={{
                  width: '100%',
                  height: a.h != null ? '100%' : 'auto',
                  objectFit: a.h != null ? 'fill' : undefined,
                  opacity: (a.opacity ?? 100) / 100,
                  transform: `rotate(${a.rotation ?? 0}deg) scale(${a.flip_h ? -1 : 1}, ${a.flip_v ? -1 : 1})`,
                }}
              />

              {!isSel && !isLocked && (
                <div className="absolute -inset-px border border-transparent hover:border-indigo-400/60 hover:bg-indigo-500/5 rounded-sm transition-colors" />
              )}

              {isSel && (
                <>
                  <div className="absolute -inset-px border-2 border-indigo-500 rounded-[2px] pointer-events-none" />

                  {!isLocked && HANDLES.map(hd => (
                    <div
                      key={hd.id}
                      onPointerDown={e => begin(e, a, { kind: 'resize', handle: hd.id })}
                      title={hd.id.length === 2 ? 'Ubah ukuran (rasio terjaga)' : 'Regangkan satu sisi'}
                      style={{
                        position: 'absolute',
                        left: `${hd.cx * 100}%`,
                        top: `${hd.cy * 100}%`,
                        transform: 'translate(-50%, -50%)',
                        cursor: hd.cursor,
                        width: 10, height: 10,
                        background: '#fff',
                        border: '2px solid #6366f1',
                        borderRadius: hd.id.length === 2 ? 2 : 999,
                        zIndex: 10,
                      }}
                    />
                  ))}

                  {!isLocked && (
                    <div
                      onPointerDown={e => begin(e, a, { kind: 'rotate' })}
                      title="Putar (tahan Shift untuk kelipatan 15°)"
                      className="absolute left-1/2 -translate-x-1/2 -top-8 w-6 h-6 rounded-full bg-indigo-500 border-2 border-white shadow-md flex items-center justify-center cursor-alias hover:bg-indigo-600 transition-colors"
                      style={{ zIndex: 10 }}
                    >
                      <RotateCw className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <div className="absolute left-1/2 -translate-x-1/2 -top-3 w-px h-3 bg-indigo-400 pointer-events-none" />

                  <div className="absolute left-1/2 -translate-x-1/2 -bottom-6 whitespace-nowrap bg-gray-900 text-white text-[9px] font-mono px-1.5 py-0.5 rounded shadow-sm pointer-events-none tabular-nums">
                    {Math.round(a.x)},{Math.round(a.y)} · {Math.round(a.w)}%
                    {a.h != null && `×${Math.round(a.h)}%`}
                    {(a.rotation ?? 0) !== 0 && ` · ${a.rotation}°`}
                  </div>
                </>
              )}
            </div>
          </div>
        )
      })}

      {/* Petunjuk singkat — hanya saat belum ada yang dipilih */}
      {!selectedId && assets.length > 0 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[70] bg-gray-900/70 backdrop-blur-sm text-white/80 text-[9px] px-3 py-1.5 rounded-full shadow-lg pointer-events-none">
          Klik untuk memilih · seret untuk geser · panah untuk presisi
        </div>
      )}
      {selectedId && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[70] bg-gray-900/70 backdrop-blur-sm text-white/70 text-[9px] px-3 py-1.5 rounded-full shadow-lg pointer-events-none">
          Shift: bebas magnet · Del: hapus · Ctrl+D: gandakan · Esc: lepas
        </div>
      )}
    </div>
  )
}

/** Apakah aset ini punya tinggi eksplisit (pernah diregangkan dari sisi). */
function hasExplicitHeight(list: DecorationAsset[], id: string) {
  return list.find(a => a.id === id)?.h != null
}

function round2(n: number) {
  return Math.round(n * 100) / 100
}
