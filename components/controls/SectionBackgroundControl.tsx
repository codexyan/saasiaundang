'use client'

import type { BackgroundConfig } from '@/lib/types'
import ImageUploadField from '@/components/admin/ImageUploadField'
import VideoUploadField from '@/components/admin/VideoUploadField'

interface Props {
  value: BackgroundConfig
  onChange: (bg: BackgroundConfig) => void
  /** Warna default untuk color picker bila value belum di-set */
  defaultColor?: string
  /** Warna highlight tab aktif (indigo di admin, gold di studio) */
  accent?: string
  /**
   * Siapa yang memakai kontrol ini.
   *
   * Bukan sekadar penamaan: 'admin' mengunggah ke /api/admin/upload yang
   * dibungkus withAdminAuth. Kontrol ini dipakai BERSAMA oleh TemplateLab
   * (admin) dan Studio (pelanggan), dan sebelum prop ini ada, upload latar
   * dari Studio selalu membalas 403 untuk akun non-admin.
   */
  context?: 'admin' | 'studio'
}

/** Endpoint + folder per konteks. Folder harus ada di ALLOWED_FOLDERS route-nya. */
const UPLOAD_TARGET = {
  admin:  { url: '/api/admin/upload', image: 'covers', video: 'bg-videos' },
  studio: { url: '/api/user/upload',  image: 'photos', video: 'videos' },
} as const

const TYPES = [
  { id: 'color', label: 'Warna' },
  { id: 'image', label: 'Gambar' },
  { id: 'video', label: 'Video' },
] as const

/**
 * Kontrol latar belakang section (Warna / Gambar / Video + overlay opacity).
 * Diekstrak dari pola TemplateLab supaya bisa dipakai bersama di admin & Studio.
 */
export default function SectionBackgroundControl({
  value, onChange, defaultColor = '#1a1a1a', accent = '#6366f1', context = 'admin',
}: Props) {
  const type = value.type === 'gradient' ? 'color' : value.type
  const target = UPLOAD_TARGET[context]

  return (
    <div>
      {/* Tab tipe */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 12, background: '#f2f2f2', padding: 2, borderRadius: 10 }}>
        {TYPES.map(t => {
          const active = type === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange({ ...value, type: t.id, ...(t.id === 'color' ? { url: undefined } : {}) })}
              style={{
                flex: 1, padding: '6px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontSize: 11, fontWeight: 600, transition: 'all 0.15s',
                background: active ? '#FFFFFF' : 'transparent',
                color: active ? accent : '#737373',
                boxShadow: active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      {type === 'color' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input
            type="color"
            value={value.value ?? defaultColor}
            onChange={e => onChange({ ...value, type: 'color', value: e.target.value })}
            style={{ width: 36, height: 36, borderRadius: 10, cursor: 'pointer', border: '1px solid #e5e5e5', padding: 2, flexShrink: 0, background: '#fff' }}
          />
          <input
            value={value.value ?? defaultColor}
            onChange={e => onChange({ ...value, type: 'color', value: e.target.value })}
            placeholder="#000000"
            style={{
              flex: 1, minWidth: 0, fontSize: 11, fontFamily: 'monospace',
              background: '#FFFFFF', border: '1px solid #e5e5e5', borderRadius: 10, padding: '8px 10px', outline: 'none',
            }}
          />
        </div>
      )}

      {type === 'image' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <ImageUploadField
            value={value.url}
            onChange={url => onChange({ ...value, url, type: 'image' })}
            hint="JPG, PNG, WebP, atau GIF animasi"
            uploadUrl={target.url}
            folder={target.image}
          />
          {value.url && <OverlaySlider value={value} onChange={onChange} fallback={0.4} />}
        </div>
      )}

      {type === 'video' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <VideoUploadField
            value={value.url}
            onChange={url => onChange({ ...value, url, type: 'video' })}
            hint="MP4, WebM (maks 50MB)"
            uploadUrl={target.url}
            folder={target.video}
          />
          {value.url && <OverlaySlider value={value} onChange={onChange} fallback={0.45} />}
        </div>
      )}
    </div>
  )
}

function OverlaySlider({ value, onChange, fallback }: { value: BackgroundConfig; onChange: (bg: BackgroundConfig) => void; fallback: number }) {
  const op = value.overlay_opacity ?? fallback
  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #e5e5e5', borderRadius: 10, padding: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <p style={{ fontSize: 9, fontWeight: 600, color: '#737373' }}>Overlay Gelap</p>
        <span style={{ fontSize: 10, fontWeight: 700, color: '#171717', background: '#f2f2f2', padding: '1px 6px', borderRadius: 6 }}>
          {Math.round(op * 100)}%
        </span>
      </div>
      <input
        type="range" min={0} max={0.9} step={0.05} value={op}
        onChange={e => onChange({ ...value, overlay_opacity: Number(e.target.value) })}
        style={{ width: '100%', height: 6 }}
      />
    </div>
  )
}
