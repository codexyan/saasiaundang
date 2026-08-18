'use client'

import { Instagram } from 'lucide-react'
import FormField from '../ui/FormField'
import SectionCard from '../ui/SectionCard'
import StudioImageField from '@/components/studio/ui/StudioImageField'

interface IGStoryFormProps {
  imageUrl: string
  onImageUrlChange: (val: string) => void
}

export default function IGStoryForm({ imageUrl, onImageUrlChange }: IGStoryFormProps) {
  return (
    <SectionCard title="IG Story" icon={Instagram} description="Gambar yang bisa diunduh tamu untuk di-share ke Instagram Story">
      <FormField label="Gambar IG Story" required hint="Ukuran ideal 1080×1920 px (9:16)">
        <StudioImageField
          value={imageUrl || undefined}
          onChange={(url) => onImageUrlChange(url || '')}
          hint="Upload gambar IG Story"
        />
      </FormField>
    </SectionCard>
  )
}
