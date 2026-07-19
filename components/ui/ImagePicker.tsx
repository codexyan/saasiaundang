'use client'

import { useRef, useState } from 'react'
import { Upload, X, Loader2, Link as LinkIcon, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { resizeArticleImage } from '@/lib/image-resize'

interface UploadMeta { width?: number; height?: number; bytes?: number; lowRes?: boolean }

interface Props {
  value: string
  onChange: (url: string) => void
  /** Upload endpoint. Admin uses /api/admin/upload, writer uses /api/user/upload. */
  uploadUrl?: string
  folder?: string
  /** Tailwind height class for the preview image, e.g. "h-48" (cover) or "h-32" (modal). */
  previewHeightClass?: string
  /** Article image variant → triggers browser-side resize + shows size guidance. */
  variant?: 'cover' | 'inline'
}

const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']

function fmtBytes(b?: number): string {
  if (!b) return ''
  return b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)}MB` : `${Math.round(b / 1024)}KB`
}

const HELP: Record<'cover' | 'inline', string> = {
  cover: 'Rekomendasi: 1200×630px, rasio 1.91:1, maksimal 2MB',
  inline: 'Rekomendasi: lebar maksimal 1600px, maksimal 2MB',
}

/**
 * Generic image input reused for article cover images and the "Sisipkan Gambar"
 * modal, in both the admin ArticlesTab and the writer dashboard. Supports uploading
 * a real file (drag-drop / click) or pasting an external URL via a small tab toggle.
 * When `variant` is set the file is resized/compressed in the browser before
 * upload (see lib/image-resize.ts) and the resulting dimensions are reported.
 */
export default function ImagePicker({
  value,
  onChange,
  uploadUrl = '/api/admin/upload',
  folder = 'covers',
  previewHeightClass = 'h-48',
  variant,
}: Props) {
  const [tab, setTab] = useState<'upload' | 'url'>('upload')
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [meta, setMeta] = useState<UploadMeta | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function uploadFile(file: File) {
    const isGif = file.type === 'image/gif'
    const maxSize = isGif ? 10 * 1024 * 1024 : 5 * 1024 * 1024
    if (file.size > maxSize) { toast.error(`File terlalu besar (maks ${isGif ? '10' : '5'}MB)`); return }
    if (!ALLOWED.includes(file.type)) { toast.error('Format tidak didukung. Gunakan JPG, PNG, WebP, atau GIF.'); return }

    setUploading(true)
    try {
      // Resize di browser (dulu dikerjakan server pakai sharp). Kalau gagal,
      // `resized` null dan file asli yang diupload — upload tidak pernah gagal
      // gara-gara langkah ini.
      const resized = variant ? await resizeArticleImage(file, variant) : null

      const formData = new FormData()
      formData.append('file', resized?.file ?? file)
      formData.append('folder', folder)
      if (resized) {
        formData.append('width', String(resized.width))
        formData.append('height', String(resized.height))
        formData.append('lowRes', String(resized.lowRes))
      }
      const res = await fetch(uploadUrl, { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Upload gagal')
      onChange(data.url)
      setMeta({ width: data.width, height: data.height, bytes: data.bytes, lowRes: data.lowRes })
      if (data.lowRes) {
        toast('Gambar di bawah resolusi rekomendasi — bisa tampak buram di layar besar.', { icon: '⚠️' })
      } else {
        toast.success('Gambar berhasil diupload!')
      }
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setUploading(false)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
    e.target.value = ''
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) uploadFile(file)
  }

  function clear() { onChange(''); setMeta(null) }

  return (
    <div className="space-y-2">
      {/* Preview gambar yang sudah dipilih */}
      {value && (
        <div className={`relative rounded-lg overflow-hidden border border-gray-200 bg-gray-100 group ${previewHeightClass}`}>
          <img src={value} alt="Preview" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.opacity = '0.3')} />
          <button
            type="button"
            onClick={clear}
            className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Hapus gambar"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Info dimensi hasil upload */}
      {value && meta && (meta.width || meta.bytes) && (
        <p className="text-[10px] text-gray-400">
          {meta.width && meta.height ? `${meta.width}×${meta.height}px` : ''}{meta.width && meta.bytes ? ' · ' : ''}{fmtBytes(meta.bytes)}
        </p>
      )}
      {value && meta?.lowRes && (
        <div className="flex items-start gap-1.5 text-[10px] text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1.5">
          <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
          <span>Gambar ini di bawah resolusi rekomendasi, bisa tampak buram di layar besar.</span>
        </div>
      )}

      {/* Tab kecil: Upload | URL */}
      <div className="flex items-center bg-gray-100 rounded-lg p-0.5 w-fit">
        <button type="button" onClick={() => setTab('upload')}
          className={`flex items-center gap-1 px-3 py-1.5 text-[11px] font-medium rounded-md transition-colors ${tab === 'upload' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          <Upload className="w-3 h-3" />Upload
        </button>
        <button type="button" onClick={() => setTab('url')}
          className={`flex items-center gap-1 px-3 py-1.5 text-[11px] font-medium rounded-md transition-colors ${tab === 'url' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          <LinkIcon className="w-3 h-3" />URL
        </button>
      </div>

      {tab === 'upload' ? (
        <div
          className={`relative border-2 border-dashed rounded-lg flex flex-col items-center justify-center py-6 px-4 cursor-pointer transition-colors ${
            dragging ? 'border-forest-400 bg-forest-50' : 'border-gray-200 hover:border-forest-300 hover:bg-gray-50'
          }`}
          onClick={() => !uploading && fileRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          {uploading ? <Loader2 className="w-6 h-6 text-forest-400 animate-spin mb-2" /> : <Upload className="w-6 h-6 text-gray-300 mb-2" />}
          <p className="text-xs font-medium text-gray-500">
            {uploading ? 'Mengupload & mengoptimasi...' : value ? 'Klik atau seret untuk ganti gambar' : 'Klik atau seret gambar ke sini'}
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">{variant ? HELP[variant] : 'JPG, PNG, WebP, GIF · Maks 5MB (GIF 10MB)'}</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </div>
      ) : (
        <>
          <input
            type="text"
            value={value}
            onChange={e => { onChange(e.target.value); setMeta(null) }}
            placeholder="https://images.unsplash.com/..."
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-forest-400 transition-colors"
          />
          {variant && <p className="text-[10px] text-gray-400">{HELP[variant]}</p>}
        </>
      )}
    </div>
  )
}
