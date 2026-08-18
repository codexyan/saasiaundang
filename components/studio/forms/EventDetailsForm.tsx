'use client'

import { MapPin } from 'lucide-react'
import FormField from '../ui/FormField'
import { StudioInput, StudioTextarea } from '../ui/StudioInput'
import SectionCard from '../ui/SectionCard'
import StudioImageField from '@/components/studio/ui/StudioImageField'

interface EventData {
  date: string
  time: string
  venue_name: string
  venue_address: string
  maps_url?: string
  venue_photo_url?: string
}

interface EventDetailsFormProps {
  akad?: EventData
  resepsi?: EventData
  onAkadChange: (data: Partial<EventData>) => void
  onResepsiChange: (data: Partial<EventData>) => void
}

const EMPTY_EVENT: EventData = { date: '', time: '', venue_name: '', venue_address: '' }

function EventBlock({
  label, badge, badgeColor, event, onChange, showSameDate, onSameDate,
}: {
  label: string; badge: string; badgeColor: string; event: EventData
  onChange: (d: Partial<EventData>) => void
  showSameDate?: boolean; onSameDate?: () => void
}) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        <span className={`w-5 h-5 rounded text-ui-2xs font-bold text-chalk flex items-center justify-center ${badgeColor}`}>{badge}</span>
        <p className="text-ui-sm font-semibold text-graphite">{label}</p>
        {showSameDate && onSameDate && (
          <label className="ml-auto flex items-center gap-1.5 text-ui-2xs text-concrete cursor-pointer hover:text-graphite">
            <input type="checkbox" className="w-3.5 h-3.5 accent-forest cursor-pointer"
              onChange={onSameDate} />
            <span>Sama dengan Akad</span>
          </label>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <FormField label="Tanggal" required>
          <StudioInput type="date" value={event.date}
            onChange={(e) => onChange({ date: e.target.value })} />
        </FormField>
        <FormField label="Waktu" required>
          <StudioInput type="time" value={event.time}
            onChange={(e) => onChange({ time: e.target.value })} />
        </FormField>
      </div>

      <FormField label="Nama Tempat" required>
        <StudioInput type="text" value={event.venue_name}
          onChange={(e) => onChange({ venue_name: e.target.value })}
          placeholder="Masjid / Gedung / Ballroom" />
      </FormField>

      <FormField label="Alamat Lengkap" required>
        <StudioTextarea rows={2} value={event.venue_address}
          onChange={(e) => onChange({ venue_address: e.target.value })}
          placeholder="Jl. Contoh No. 123, Kota" />
      </FormField>

      <div className="grid grid-cols-2 gap-2.5">
        <FormField label="Link Google Maps">
          <StudioInput type="url" value={event.maps_url || ''}
            onChange={(e) => onChange({ maps_url: e.target.value })}
            placeholder="https://maps.app.goo.gl/..." />
        </FormField>
        <FormField label="Foto Tempat">
          <StudioImageField value={event.venue_photo_url}
            onChange={(url) => onChange({ venue_photo_url: url || '' })} hint="Opsional" />
        </FormField>
      </div>
    </div>
  )
}

export default function EventDetailsForm({
  akad: akadProp, resepsi: resepsiProp,
  onAkadChange, onResepsiChange,
}: EventDetailsFormProps) {
  const akad = akadProp ?? EMPTY_EVENT
  const resepsi = resepsiProp ?? EMPTY_EVENT

  return (
    <SectionCard title="Detail Acara" icon={MapPin} required description="Waktu dan lokasi pernikahan">
      <EventBlock label="Akad Nikah" badge="1" badgeColor="bg-forest"
        event={akad} onChange={onAkadChange} />

      <div className="border-t border-hairline pt-3 mt-1">
        <EventBlock label="Resepsi" badge="2" badgeColor="bg-gold-dark"
          event={resepsi} onChange={onResepsiChange}
          showSameDate onSameDate={() => { if (akad.date) onResepsiChange({ date: akad.date }) }} />
      </div>
    </SectionCard>
  )
}
