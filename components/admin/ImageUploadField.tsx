'use client'

import { useRef, useState } from 'react'
import { Upload, X, ImageIcon, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { compressUploadImage } from '@/lib/image-compress'

interface Props {
  value: string | undefined
  onChange: (url: string | undefined) => void
  label?: string
  hint?: string
  /**
   * Endpoint upload. Bawaannya endpoint ADMIN — komponen ini lahir di panel
   * admin. Pemanggil dari sisi pelanggan WAJIB mengoper '/api/user/upload',
   * karena /api/admin/upload dibungkus withAdminAuth dan membalas 403 untuk
   * akun biasa. Pakai <StudioImageField> supaya tidak perlu mengingatnya.
   */
  uploadUrl?: string
  /** Folder tujuan di bucket. Harus ada di ALLOWED_FOLDERS route yang dipakai. */
  folder?: string
}

export default function ImageUploadField({ value, onChange, label, hint, uploadUrl, folder = 'covers' }: Props) {
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function uploadFile(file: File) {
    const isGif = file.type === 'image/gif'
    const maxSize = isGif ? 10 * 1024 * 1024 : 5 * 1024 * 1024
    if (file.size > maxSize) { toast.error(`File terlalu besar (maks ${isGif ? '10' : '5'}MB)`); return }
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowed.includes(file.type)) { toast.error('Fotonya harus berformat JPG, PNG, WebP, atau GIF ya.'); return }

    setUploading(true)
    try {
      // Dikecilkan dulu di browser (maks 500 KB / 1920 px). Gagal = null, dan
      // file ASLI yang diupload — pola yang sama dengan GalleryManager dan
      // ImagePicker. Sebelumnya komponen ini mengirim berkas mentah, padahal
      // ia dipakai 5 form studio + kontrol latar section.
      const compressed = await compressUploadImage(file)

      const formData = new FormData()
      formData.append('file', compressed?.file ?? file)
      formData.append('folder', folder)
      if (compressed?.width && compressed?.height) {
        formData.append('width', String(compressed.width))
        formData.append('height', String(compressed.height))
      }
      // Session cookie (__ku_session) otomatis dikirim browser
      const res = await fetch(uploadUrl ?? '/api/admin/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Upload gagal')
      onChange(data.url)
      toast.success('Fotonya sudah masuk!')
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
      {label && <p className="text-xs font-semibold text-gray-500">{label}</p>}

      {/* Preview foto yang sudah ada */}
      {value && (
        <div className="relative rounded-xl overflow-hidden border border-gray-200" style={{ height: 140 }}>
          <img
            src={value}
            alt="Cover preview"
            className="w-full h-full object-cover"
          />
          <button
            onClick={() => onChange(undefined)}
            className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 sentuh:w-11 sentuh:h-11 flex items-center justify-center transition-colors"
            title="Hapus foto"
            aria-label="Hapus foto"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Area upload */}
      {!value && (
        <div
          className={`relative border-2 border-dashed rounded-xl flex flex-col items-center justify-center py-6 px-4 cursor-pointer transition-colors ${
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
            <Upload className="w-6 h-6 text-gray-300 mb-2" />
          )}
          <p className="text-xs font-medium text-gray-500">
            {uploading ? 'Mengupload...' : 'Klik atau seret foto ke sini'}
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">JPG, PNG, WebP, GIF · Maks 5MB (GIF 10MB)</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </div>
      )}

      {/* URL manual fallback */}
      <div className="flex items-center gap-2">
        <ImageIcon className="w-3.5 h-3.5 text-gray-300 shrink-0" />
        <input
          type="text"
          value={value ?? ''}
          onChange={e => onChange(e.target.value || undefined)}
          placeholder="Atau masukkan URL foto langsung..."
          className="flex-1 text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-400 text-gray-600 placeholder:text-gray-300"
        />
      </div>

      {hint && <p className="text-[10px] text-gray-400">{hint}</p>}
    </div>
  )
}
