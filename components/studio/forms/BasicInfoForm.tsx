'use client'

import { useState, useRef } from 'react'
import { Upload, Loader2, Trash2, Image as ImageIcon, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import FormField from '../ui/FormField'
import { StudioInput } from '../ui/StudioInput'
import SectionCard from '../ui/SectionCard'
import ImageUploadField from '@/components/admin/ImageUploadField'

interface BasicInfoFormProps {
  groomName: string
  brideName: string
  groomNickname?: string
  brideNickname?: string
  groomFather?: string
  groomMother?: string
  brideFather?: string
  brideMother?: string
  couplePhotoUrl?: string
  tagline?: string
  groomPhotoUrl?: string
  bridePhotoUrl?: string
  groomBio?: string
  brideBio?: string
  onGroomNameChange: (value: string) => void
  onBrideNameChange: (value: string) => void
  onGroomNicknameChange: (value: string) => void
  onBrideNicknameChange: (value: string) => void
  onGroomFatherChange: (value: string) => void
  onGroomMotherChange: (value: string) => void
  onBrideFatherChange: (value: string) => void
  onBrideMotherChange: (value: string) => void
  onCouplePhotoChange: (url: string) => void
  onTaglineChange: (value: string) => void
  onGroomPhotoChange: (url: string | undefined) => void
  onBridePhotoChange: (url: string | undefined) => void
  onGroomBioChange: (value: string) => void
  onBrideBioChange: (value: string) => void
}

export default function BasicInfoForm({
  groomName, brideName, groomNickname, brideNickname,
  groomFather, groomMother, brideFather, brideMother,
  couplePhotoUrl, tagline,
  groomPhotoUrl, bridePhotoUrl, groomBio, brideBio,
  onGroomNameChange, onBrideNameChange,
  onGroomNicknameChange, onBrideNicknameChange,
  onGroomFatherChange, onGroomMotherChange,
  onBrideFatherChange, onBrideMotherChange,
  onCouplePhotoChange, onTaglineChange,
  onGroomPhotoChange, onBridePhotoChange,
  onGroomBioChange, onBrideBioChange,
}: BasicInfoFormProps) {
  const [uploading, setUploading] = useState(false)
  const photoRef = useRef<HTMLInputElement>(null)

  async function handleUpload(file: File) {
    setUploading(true)
    const form = new FormData()
    form.append('file', file)
    form.append('folder', 'hero')
    try {
      const res = await fetch('/api/user/upload', { method: 'POST', body: form })
      if (!res.ok) throw new Error('Upload failed')
      const { url } = await res.json()
      onCouplePhotoChange(url)
      toast.success('Fotonya sudah masuk!')
    } catch {
      toast.error('Fotonya gagal dikirim. Coba lagi ya.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <SectionCard
      title="Data Mempelai"
      icon={Sparkles}
      required
      description="Nama, foto, dan informasi keluarga"
    >
      {/* Foto Pembuka */}
      <div>
        <input ref={photoRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => { const file = e.target.files?.[0]; if (file) handleUpload(file) }} />
        <label className="block text-ui-eyebrow text-concrete mb-1.5">Foto Pembuka <span className="text-gold-dark">*</span></label>
        {couplePhotoUrl ? (
          <div className="relative rounded-card overflow-hidden group" style={{ aspectRatio: '16/9' }}>
            <img src={couplePhotoUrl} alt="Foto pasangan" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-forest-deep/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button type="button" onClick={() => photoRef.current?.click()}
                className="flex items-center gap-1.5 bg-chalk text-graphite px-3 py-1.5 rounded-button text-ui-xs font-medium hover:bg-mist transition-colors">
                <Upload size={13} /> Ganti
              </button>
              <button type="button" onClick={() => onCouplePhotoChange('')}
                className="flex items-center gap-1.5 bg-red-600 text-white px-3 py-1.5 rounded-button text-ui-xs font-medium hover:bg-red-700 transition-colors">
                <Trash2 size={13} /> Hapus
              </button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => photoRef.current?.click()} disabled={uploading}
            className="w-full py-8 border-2 border-dashed border-hairline rounded-card flex flex-col items-center gap-2 text-ash hover:border-gold-dark/50 hover:text-forest hover:bg-forest-50/40 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40">
            {uploading ? (
              <><Loader2 size={24} className="animate-spin text-forest" /><span className="text-ui-xs">Mengupload...</span></>
            ) : (
              <><ImageIcon size={24} /><span className="text-ui-xs font-medium">Upload foto pasangan</span></>
            )}
          </button>
        )}
      </div>

      {/* Mempelai Pria */}
      <div className="space-y-2.5 pt-2">
        <p className="text-ui-sm font-semibold text-forest flex items-center gap-1.5">
          <span className="w-5 h-5 rounded bg-forest text-chalk flex items-center justify-center text-ui-2xs font-bold">P</span>
          Mempelai Pria
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          <FormField label="Nama Lengkap" required>
            <StudioInput type="text" value={groomName}
              onChange={(e) => onGroomNameChange(e.target.value)} placeholder="Ahmad Budi Santoso" />
          </FormField>
          <FormField label="Panggilan">
            <StudioInput type="text" value={groomNickname ?? ''}
              onChange={(e) => onGroomNicknameChange(e.target.value)} placeholder="Budi" />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <FormField label="Nama Ayah">
            <StudioInput type="text" value={groomFather ?? ''}
              onChange={(e) => onGroomFatherChange(e.target.value)} placeholder="Bpk. Ahmad" />
          </FormField>
          <FormField label="Nama Ibu">
            <StudioInput type="text" value={groomMother ?? ''}
              onChange={(e) => onGroomMotherChange(e.target.value)} placeholder="Ibu Sri" />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <FormField label="Foto Profil">
            <ImageUploadField value={groomPhotoUrl} onChange={onGroomPhotoChange} hint="Opsional" />
          </FormField>
          <FormField label="Bio Singkat">
            <StudioInput type="text" value={groomBio ?? ''}
              onChange={(e) => onGroomBioChange(e.target.value)} placeholder="Software Engineer" />
          </FormField>
        </div>
      </div>

      {/* Mempelai Wanita */}
      <div className="space-y-2.5 pt-1 border-t border-hairline">
        <p className="text-ui-sm font-semibold text-gold-700 flex items-center gap-1.5 pt-2">
          <span className="w-5 h-5 rounded bg-gold-dark text-chalk flex items-center justify-center text-ui-2xs font-bold">W</span>
          Mempelai Wanita
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          <FormField label="Nama Lengkap" required>
            <StudioInput type="text" value={brideName}
              onChange={(e) => onBrideNameChange(e.target.value)} placeholder="Siti Aisyah Rahayu" />
          </FormField>
          <FormField label="Panggilan">
            <StudioInput type="text" value={brideNickname ?? ''}
              onChange={(e) => onBrideNicknameChange(e.target.value)} placeholder="Aisyah" />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <FormField label="Nama Ayah">
            <StudioInput type="text" value={brideFather ?? ''}
              onChange={(e) => onBrideFatherChange(e.target.value)} placeholder="Bpk. Hendra" />
          </FormField>
          <FormField label="Nama Ibu">
            <StudioInput type="text" value={brideMother ?? ''}
              onChange={(e) => onBrideMotherChange(e.target.value)} placeholder="Ibu Dewi" />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <FormField label="Foto Profil">
            <ImageUploadField value={bridePhotoUrl} onChange={onBridePhotoChange} hint="Opsional" />
          </FormField>
          <FormField label="Bio Singkat">
            <StudioInput type="text" value={brideBio ?? ''}
              onChange={(e) => onBrideBioChange(e.target.value)} placeholder="Desainer" />
          </FormField>
        </div>
      </div>
    </SectionCard>
  )
}
