'use client'

import { useState, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { Trash2, Upload, Lock, Crown, X, ZoomIn, ChevronLeft, ChevronRight, ImagePlus } from 'lucide-react'
import type { Invitation, Gallery } from '@/lib/types'
import { getPackage, type PackageTier } from '@/lib/packages'

interface Props {
  invitation: Invitation
}

export default function GalleryManager({ invitation }: Props) {
  const [galleries, setGalleries] = useState<Gallery[]>([])
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [lightbox, setLightbox] = useState<number | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const tier = (invitation.package_tier ?? 'popular') as PackageTier
  const pkg = getPackage(tier)
  const maxPhotos = pkg.maxPhotos // -1 = unlimited
  const isAtLimit = maxPhotos !== -1 && galleries.length >= maxPhotos
  const isNearLimit = maxPhotos !== -1 && galleries.length >= maxPhotos - 3 && !isAtLimit

  useEffect(() => {
    fetch(`/api/galleries?invitationId=${invitation.id}`)
      .then(r => r.json())
      .then(({ galleries: g }) => setGalleries(g || []))
      .finally(() => setLoading(false))
  }, [invitation.id])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxSize: 5 * 1024 * 1024,
    maxFiles: maxPhotos === -1 ? 20 : Math.max(0, maxPhotos - galleries.length),
    disabled: uploading || isAtLimit,
    onDropAccepted: handleUpload,
    onDropRejected: (rejected) => {
      const first = rejected[0]
      if (first?.errors[0]?.code === 'file-too-large') toast.error('Fotonya terlalu besar. Maksimal 5MB ya.')
      else toast.error('Berkasnya belum sesuai. Coba pilih yang lain ya.')
    },
  })

  async function handleUpload(files: File[]) {
    setUploading(true)
    let count = 0

    for (const file of files) {
      const currentTotal = galleries.length + count
      if (maxPhotos !== -1 && currentTotal >= maxPhotos) break

      const formData = new FormData()
      formData.append('file', file)
      formData.append('invitationId', invitation.id)

      const res = await fetch('/api/galleries/upload', { method: 'POST', body: formData })
      if (!res.ok) { toast.error(`Gagal: ${file.name}`); continue }

      const { gallery } = await res.json()
      setGalleries(prev => [...prev, gallery])
      count++
    }

    setUploading(false)
    if (count > 0) toast.success(`${count} foto berhasil diupload! 🖼️`)
  }

  async function handleDelete(gallery: Gallery) {
    const res = await fetch(`/api/galleries/${gallery.id}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('Fotonya gagal dihapus. Coba lagi ya.'); return }
    setGalleries(prev => prev.filter(g => g.id !== gallery.id))
    setDeleteConfirm(null)
    if (lightbox !== null) setLightbox(null)
    toast.success('Fotonya sudah dihapus.')
  }

  function prevPhoto() {
    setLightbox(i => i !== null ? (i - 1 + galleries.length) % galleries.length : null)
  }
  function nextPhoto() {
    setLightbox(i => i !== null ? (i + 1) % galleries.length : null)
  }

  const limitPercent = maxPhotos === -1 ? 0 : Math.round((galleries.length / maxPhotos) * 100)

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-hairline p-10 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-ash">
          <div className="w-8 h-8 border-2 border-hairline border-t-rose-400 rounded-full animate-spin" />
          <span className="text-sm">Memuat galeri...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header + limit */}
      <div className="bg-white rounded-2xl border border-hairline p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-graphite">Galeri Foto</h3>
            <p className="text-sm text-concrete mt-0.5">
              {maxPhotos === -1
                ? `${galleries.length} foto diupload`
                : `${galleries.length} dari ${maxPhotos} foto`
              }
            </p>
          </div>

          <div className="text-right">
            <span className={`text-sm font-bold ${isAtLimit ? 'text-red-500' : isNearLimit ? 'text-amber-500' : 'text-concrete'}`}>
              {maxPhotos === -1 ? `${galleries.length} foto` : `${galleries.length}/${maxPhotos}`}
            </span>
            <p className="text-xs text-ash">{maxPhotos === -1 ? 'unlimited' : 'paket ' + pkg.name}</p>
          </div>
        </div>

        {/* Limit progress bar */}
        {maxPhotos !== -1 && (
          <div className="mb-4">
            <div className="h-2 bg-mist rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full transition-colors ${
                  isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-amber-400' : 'bg-forest'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${limitPercent}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-ash">
                {isAtLimit ? '⚠️ Batas foto tercapai' : isNearLimit ? '⚠️ Hampir penuh' : 'Kapasitas foto'}
              </span>
              <span className="text-xs text-ash">{limitPercent}%</span>
            </div>
          </div>
        )}

        {/* Upload zone */}
        {!isAtLimit ? (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              isDragActive
                ? 'border-forest bg-forest-50'
                : uploading
                ? 'border-hairline bg-ivory cursor-not-allowed'
                : 'border-hairline hover:border-forest-light hover:bg-forest-50/30'
            }`}
          >
            <input {...getInputProps()} />
            {uploading ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-2 border-hairline border-t-rose-400 rounded-full animate-spin" />
                <p className="text-sm text-concrete">Mengupload foto...</p>
              </div>
            ) : isDragActive ? (
              <div className="flex flex-col items-center gap-2">
                <Upload size={28} className="text-forest" />
                <p className="text-sm font-semibold text-gold-dark">Lepaskan file di sini!</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 bg-forest-50 rounded-2xl flex items-center justify-center">
                  <ImagePlus size={22} className="text-forest" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-graphite">Seret foto ke sini atau klik untuk pilih</p>
                  <p className="text-xs text-ash mt-1">
                    JPG, PNG, WebP · Max 5MB per foto
                    {maxPhotos !== -1 && ` · Sisa ${maxPhotos - galleries.length} foto`}
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* At limit   upgrade prompt */
          <div className="border-2 border-amber-200 rounded-2xl p-6 bg-amber-50 text-center">
            <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Lock size={20} className="text-amber-500" />
            </div>
            <h4 className="font-bold text-amber-900 mb-1">Batas {maxPhotos} foto tercapai</h4>
            <p className="text-sm text-amber-700 mb-4">
              Paket {pkg.name} kamu mendukung hingga {maxPhotos} foto.
              Upgrade untuk menambah lebih banyak foto.
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 text-sm text-amber-800">
                <Crown size={14} className="text-amber-500" />
                <span>Upgrade ke Popular: 20 foto</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-amber-800">
                <Crown size={14} className="text-amber-500" />
                <span>Upgrade ke Eksklusif: ∞ foto</span>
              </div>
            </div>
            <button className="mt-4 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl transition-colors w-full">
              Upgrade Sekarang →
            </button>
            <p className="text-xs text-amber-600 mt-2">atau hapus foto yang tidak dipakai</p>
          </div>
        )}
      </div>

      {/* Photo grid */}
      {galleries.length > 0 && (
        <div className="bg-white rounded-2xl border border-hairline p-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-graphite text-sm">Foto Terupload ({galleries.length})</h4>
            {galleries.length > 0 && (
              <p className="text-xs text-ash">Klik foto untuk preview · Klik 🗑️ untuk hapus</p>
            )}
          </div>

          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
            layout
          >
            <AnimatePresence>
              {galleries.map((gallery, index) => (
                <motion.div
                  key={gallery.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="relative group aspect-square rounded-xl overflow-hidden border border-hairline bg-ivory"
                >
                  <img
                    src={gallery.url}
                    alt={`Foto ${index + 1}`}
                    className="w-full h-full object-cover"
                  />

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() => setLightbox(index)}
                      className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                    >
                      <ZoomIn size={14} className="text-graphite" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(gallery.id)}
                      className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"
                    >
                      <Trash2 size={14} className="text-graphite group-hover:text-inherit" />
                    </button>
                  </div>

                  {/* Order badge */}
                  <div className="absolute top-2 left-2 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center">
                    <span className="text-ui-2xs text-white font-bold">{index + 1}</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      )}

      {galleries.length === 0 && !loading && (
        <div className="bg-white rounded-2xl border border-hairline p-8 text-center">
          <div className="text-4xl mb-3">📷</div>
          <p className="text-concrete text-sm">Belum ada foto. Upload foto di atas untuk mulai!</p>
        </div>
      )}

      {/* Delete confirm modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
            >
              <div className="text-center mb-4">
                <div className="text-4xl mb-3">🗑️</div>
                <h3 className="font-bold text-graphite mb-1">Hapus foto ini?</h3>
                <p className="text-sm text-concrete">Foto yang dihapus tidak bisa dikembalikan.</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-2.5 border border-hairline rounded-xl text-sm font-semibold text-concrete hover:bg-ivory"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    const g = galleries.find(x => x.id === deleteConfirm)
                    if (g) handleDelete(g)
                  }}
                  className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  Hapus
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
            onClick={() => setLightbox(null)}
          >
            <motion.img
              src={galleries[lightbox]?.url}
              alt=""
              className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
            />

            <button onClick={() => setLightbox(null)} className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white">
              <X size={18} />
            </button>

            {galleries.length > 1 && (
              <>
                <button onClick={(e) => { e.stopPropagation(); prevPhoto() }} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white">
                  <ChevronLeft size={20} />
                </button>
                <button onClick={(e) => { e.stopPropagation(); nextPhoto() }} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white">
                  <ChevronRight size={20} />
                </button>
              </>
            )}

            <div className="absolute bottom-4 flex items-center gap-3">
              <p className="text-white/60 text-sm">{(lightbox ?? 0) + 1} / {galleries.length}</p>
              <button
                onClick={(e) => { e.stopPropagation(); setDeleteConfirm(galleries[lightbox]?.id ?? '') }}
                className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300"
              >
                <Trash2 size={13} /> Hapus
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
