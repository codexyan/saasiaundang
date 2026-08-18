'use client'

import { BookOpen, Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import FormField from '../ui/FormField'
import { StudioInput, StudioTextarea } from '../ui/StudioInput'
import SectionCard from '../ui/SectionCard'
import StudioImageField from '@/components/studio/ui/StudioImageField'
import type { StoryChapter } from '@/lib/types'

interface StoryFormProps {
  storyTitle: string
  storyText: string
  chapters: StoryChapter[]
  onStoryTitleChange: (val: string) => void
  onStoryTextChange: (val: string) => void
  onChaptersChange: (chapters: StoryChapter[]) => void
}

const MAX_CHAPTERS = 10

export default function StoryForm({
  storyTitle, storyText, chapters,
  onStoryTitleChange, onStoryTextChange, onChaptersChange,
}: StoryFormProps) {

  function addChapter() {
    if (chapters.length >= MAX_CHAPTERS) return
    onChaptersChange([...chapters, { title: '', text: '', date: '' }])
  }

  function updateChapter(idx: number, field: keyof StoryChapter, value: string | number) {
    const updated = chapters.map((ch, i) => i === idx ? { ...ch, [field]: value } : ch)
    onChaptersChange(updated)
  }

  function removeChapter(idx: number) {
    onChaptersChange(chapters.filter((_, i) => i !== idx))
  }

  function moveChapter(idx: number, dir: -1 | 1) {
    const target = idx + dir
    if (target < 0 || target >= chapters.length) return
    const updated = [...chapters]
    ;[updated[idx], updated[target]] = [updated[target], updated[idx]]
    onChaptersChange(updated)
  }

  return (
    <SectionCard
      title="Kisah Cinta"
      icon={BookOpen}
      description="Ceritakan perjalanan cinta Anda dalam beberapa bab (opsional, maks. 10)"
    >
      <div className="space-y-4">
        <FormField label="Judul Kisah" hint="Contoh: Perjalanan Cinta Kami">
          <StudioInput
            type="text"
            value={storyTitle}
            onChange={e => onStoryTitleChange(e.target.value)}
            placeholder="Perjalanan Cinta"
          />
        </FormField>

        <FormField label="Deskripsi Singkat" hint="Ringkasan cerita cinta Anda (tampil jika tidak ada bab)">
          <StudioTextarea
            rows={3}
            value={storyText}
            onChange={e => onStoryTextChange(e.target.value)}
            placeholder="Kami pertama kali bertemu di..."
          />
        </FormField>

        <div className="border-t border-hairline pt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-graphite">
              Bab Kisah ({chapters.length}/{MAX_CHAPTERS})
            </h4>
            {chapters.length > 0 && (
              <span className="text-xs text-ash">
                Navigasi IG Stories di undangan
              </span>
            )}
          </div>

          {chapters.map((ch, idx) => (
            <div key={idx}
              className="relative p-4 border border-hairline rounded-xl space-y-3 mb-3 group hover:border-gold-dark/50 transition-colors">

              {/* Controls */}
              <div className="absolute top-3 right-3 flex items-center gap-1">
                <button type="button" onClick={() => moveChapter(idx, -1)}
                  disabled={idx === 0}
                  className="w-7 h-7 rounded-lg bg-mist text-concrete hover:bg-hairline flex items-center justify-center disabled:opacity-30 transition-all"
                  title="Pindah ke atas">
                  <ChevronUp size={14} />
                </button>
                <button type="button" onClick={() => moveChapter(idx, 1)}
                  disabled={idx === chapters.length - 1}
                  className="w-7 h-7 rounded-lg bg-mist text-concrete hover:bg-hairline flex items-center justify-center disabled:opacity-30 transition-all"
                  title="Pindah ke bawah">
                  <ChevronDown size={14} />
                </button>
                <button type="button" onClick={() => removeChapter(idx)}
                  className="w-7 h-7 rounded-lg bg-red-50 text-red-600 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all"
                  title="Hapus bab">
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-forest-50 text-gold-dark flex items-center justify-center text-xs font-bold">
                  {idx + 1}
                </div>
                <span className="text-sm font-semibold text-graphite">
                  Bab {idx + 1}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Tanggal">
                  <StudioInput type="text"
                    value={ch.date ?? ''}
                    onChange={e => updateChapter(idx, 'date', e.target.value)}
                    placeholder="Januari 2020" />
                </FormField>
                <FormField label="Judul Bab">
                  <StudioInput type="text"
                    value={ch.title ?? ''}
                    onChange={e => updateChapter(idx, 'title', e.target.value)}
                    placeholder="Pertama Bertemu" />
                </FormField>
              </div>

              <FormField label="Cerita">
                <StudioTextarea rows={3}
                  value={ch.text ?? ''}
                  onChange={e => updateChapter(idx, 'text', e.target.value)}
                  placeholder="Ceritakan momen ini..." />
              </FormField>

              <FormField label="Foto Latar" hint="Foto latar untuk bab ini">
                <StudioImageField
                  value={ch.photo_url}
                  onChange={(url) => updateChapter(idx, 'photo_url', url || '')}
                  hint="Opsional"
                />
              </FormField>
            </div>
          ))}

          {chapters.length < MAX_CHAPTERS && (
            <button type="button" onClick={addChapter}
              className="w-full py-3 border-2 border-dashed border-hairline rounded-xl flex items-center justify-center gap-2 text-sm font-semibold text-concrete hover:border-gold-dark/50 hover:text-forest hover:bg-forest-50/50 transition-all">
              <Plus size={18} />
              Tambah Bab ({chapters.length}/{MAX_CHAPTERS})
            </button>
          )}

          {chapters.length === 0 && (
            <div className="text-center py-6 text-ash">
              <BookOpen size={28} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                Belum ada bab kisah. Tambahkan bab untuk menampilkan kisah cinta bergaya IG Stories.
              </p>
            </div>
          )}
        </div>
      </div>
    </SectionCard>
  )
}
