'use client'

import { useRef, useState } from 'react'
import { Upload, X, Video, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface Props {
  value: string | undefined
  onChange: (url: string | undefined) => void
  hint?: string
  /**
   * Endpoint upload. Bawaannya endpoint ADMIN. Pemanggil dari sisi pelanggan
   * WAJIB mengoper '/api/user/upload' — /api/admin/upload dibungkus
   * withAdminAuth dan membalas 403 untuk akun biasa.
   */
  uploadUrl?: string
  /** Folder tujuan. Harus ada di ALLOWED_FOLDERS route yang dipakai. */
  folder?: string
}

export default function VideoUploadField({ value, onChange, hint, uploadUrl, folder = 'bg-videos' }: Props) {
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function uploadFile(file: File) {
    const allowed = ['video/mp4', 'video/webm', 'video/quicktime', 'video/ogg']
    const ext = file.name.split('.').pop()?.toLowerCase()
    const allowedExt = ['mp4', 'webm', 'mov', 'ogg']
    if (!allowed.includes(file.type) && !allowedExt.includes(ext ?? '')) {
      toast.error('Format tidak didukung. Gunakan MP4, WebM, atau MOV.')
      return
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.error('File terlalu besar (maks 50MB)')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', folder)
      const res  = await fetch(uploadUrl ?? '/api/admin/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Upload gagal')
      onChange(data.url)
      toast.success('Video berhasil diupload!')
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

  return (
    <div className="space-y-2">
      {/* Preview video yang sudah ada */}
      {value && (
        <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-black" style={{ height: 120 }}>
          <video
            src={value}
            className="w-full h-full object-cover opacity-90"
            autoPlay muted loop playsInline
          />
          <button
            onClick={() => onChange(undefined)}
            className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
            title="Hapus video"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1">
            <Video className="w-2.5 h-2.5" />
            <span>Video background</span>
          </div>
        </div>
      )}

      {/* Area upload */}
      {!value && (
        <div
          className={`relative border-2 border-dashed rounded-xl flex flex-col items-center justify-center py-5 px-4 cursor-pointer transition-colors ${
            dragging
              ? 'border-indigo-400 bg-indigo-50'
              : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
          }`}
          onClick={() => fileRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          {uploading ? (
            <Loader2 className="w-6 h-6 text-indigo-400 animate-spin mb-2" />
          ) : (
            <Video className="w-6 h-6 text-gray-300 mb-2" />
          )}
          <p className="text-xs font-medium text-gray-500">
            {uploading ? 'Mengupload video...' : 'Klik atau seret video ke sini'}
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">MP4, WebM, MOV · Maks 50MB</p>
          <input
            ref={fileRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime,video/ogg"
            className="hidden"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </div>
      )}

      {/* URL manual fallback */}
      <div className="flex items-center gap-2">
        <Video className="w-3.5 h-3.5 text-gray-300 shrink-0" />
        <input
          type="text"
          value={value ?? ''}
          onChange={e => onChange(e.target.value || undefined)}
          placeholder="Atau masukkan URL video langsung..."
          className="flex-1 text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-400 text-gray-600 placeholder:text-gray-300"
        />
      </div>

      {hint && <p className="text-[10px] text-gray-400">{hint}</p>}
    </div>
  )
}
