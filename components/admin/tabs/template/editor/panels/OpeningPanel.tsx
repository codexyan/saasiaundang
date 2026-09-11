'use client'

import { useState } from 'react'
import { Check, Sparkles, MessageSquare, Heart, Type, Camera } from 'lucide-react'
import ImageUploadField from '@/components/admin/ImageUploadField'
import { Field, inputCls } from '../parts/fields'
import LoadingScreenPanel from '../parts/LoadingScreenPanel'
import { OPENING_TYPES, OPENING_META } from '../parts/constants'
import { useEditor } from '../EditorContext'

/** Lima kelompok navigasi internal panel Opening, meniru pola `settingsSection`
 *  di ArticlesTab.tsx (SettingsPanel). Cuma soal presentasi, tidak mengubah
 *  data yang tersimpan di EditorContext. */
type OpeningSection = 'gaya' | 'konten' | 'data' | 'tipografi' | 'foto'

/**
 * Tab "Opening" — halaman sampul yang dilihat tamu sebelum undangan terbuka,
 * plus layar loading di antaranya.
 */
export default function OpeningPanel() {
  const {
    setConfig, cfg, setPreviewMode, previewData, setPreviewData,
    previewGuestName, setPreviewGuestName, setPreviewKey, setDecorPreviewKey, updateOpening,
  } = useEditor()

  // Renderer memakai `show_opening !== false` untuk memutuskan apakah tamu
  // melihat halaman sampul. Sebelumnya field ini tidak punya kontrol sama
  // sekali — template bisa lahir tanpa sampul, tapi admin tidak bisa
  // mengaturnya dari mana pun.
  const showOpening = cfg.opening.show_opening !== false

  // Navigasi sub bagian, sama persis mekanismenya dengan NAV di
  // ArticlesTab.tsx: array of { id, icon, label }, active state lewat
  // perbandingan langsung, klik memanggil setter.
  const [openingSection, setOpeningSection] = useState<OpeningSection>('gaya')
  const OPENING_NAV: { id: OpeningSection; icon: typeof Sparkles; label: string }[] = [
    { id: 'gaya', icon: Sparkles, label: 'Gaya & Efek' },
    { id: 'konten', icon: MessageSquare, label: 'Konten' },
    { id: 'data', icon: Heart, label: 'Data Mempelai' },
    { id: 'tipografi', icon: Type, label: 'Tipografi & Layout' },
    { id: 'foto', icon: Camera, label: 'Foto & Transisi' },
  ]

  const openingToggle = (
    <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-white">
      <div className="min-w-0 pr-3">
        <p className="text-sm font-medium text-gray-700">Halaman Sampul</p>
        <p className="text-xs text-gray-400 mt-0.5 leading-snug">
          {showOpening
            ? 'Tamu melihat sampul dulu, lalu menekan tombol untuk membuka undangan'
            : 'Dimatikan — tamu langsung masuk ke isi undangan'}
        </p>
      </div>
      <button
        onClick={() => { updateOpening({ show_opening: !showOpening }); setPreviewMode(showOpening ? 'invitation' : 'opening'); setDecorPreviewKey(k => k + 1) }}
        aria-label={showOpening ? 'Matikan halaman sampul' : 'Nyalakan halaman sampul'}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${showOpening ? 'bg-indigo-600' : 'bg-gray-200'}`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${showOpening ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  )

  // Seluruh isi tab ini mengatur halaman sampul. Kalau sampulnya dimatikan,
  // menampilkan 800 baris kontrol yang tidak berefek apa pun hanya menyesatkan.
  if (!showOpening) {
    return (
      <div className="space-y-5">
        {openingToggle}
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center">
          <p className="text-sm font-semibold text-gray-500">Halaman sampul dimatikan</p>
          <p className="text-[11px] text-gray-400 mt-1.5 leading-relaxed max-w-xs mx-auto">
            Undangan langsung dibuka di seksi pertama. Nyalakan kembali untuk
            mengatur gaya, teks, dan dekorasi sampul.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {openingToggle}

      {/* Kerangka navigasi sub bagian (Phase 2). Sidebar dipersempit ke w-32
          dibanding w-48 di ArticlesTab karena panel ini hidup di kolom
          sempit editor, bukan halaman admin penuh — mekanismenya sama
          persis, cuma lebar yang disesuaikan ke konteks.
          Isi di bawah ini MASIH menampilkan kedelapan blok tanpa filter;
          pemindahan konten ke tiap section id di atas terjadi di Phase 3. */}
      <div className="flex gap-3">
        <div className="w-32 shrink-0 space-y-0.5">
          {OPENING_NAV.map(n => (
            <button key={n.id} type="button" onClick={() => setOpeningSection(n.id)}
              className={`w-full flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-left text-[10px] font-semibold transition-colors ${
                openingSection === n.id
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <n.icon className="w-3.5 h-3.5 shrink-0" />
              <span className="leading-tight">{n.label}</span>
            </button>
          ))}
        </div>

        <div className="flex-1 min-w-0 space-y-5">

      {/*  Pilih Gaya Opening  */}
      <div>
        <p className="text-[10px] font-semibold text-gray-500 mb-1">
          Gaya Tampilan
        </p>
        <p className="text-[9px] text-gray-400 mb-3">
          Animasi saat tamu pertama kali membuka undangan
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {OPENING_TYPES.map(ot => {
            const m = OPENING_META[ot]
            const active = cfg.opening.type === ot
            return (
              <button key={ot} type="button" title={m?.desc}
                onClick={() => { updateOpening({ type: ot }); setPreviewMode('opening'); setDecorPreviewKey(k => k + 1) }}
                className={`relative p-2.5 rounded-xl text-center transition-all ${
                  active
                    ? 'bg-indigo-50 border-2 border-indigo-500 ring-1 ring-indigo-500/20'
                    : 'bg-gray-50 border border-gray-200 hover:border-gray-300 hover:bg-gray-100'
                }`}
              >
                <span className="text-lg block mb-0.5">{m?.icon}</span>
                <p className={`text-[10px] font-semibold leading-tight ${active ? 'text-indigo-700' : 'text-gray-600'}`}>
                  {m?.label ?? ot}
                </p>
                {active && (
                  <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-indigo-500 flex items-center justify-center">
                    <Check className="w-2 h-2 text-white" />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Atribut khusus Fade Reveal. Ditampilkan bersyarat — sama seperti
          atribut Petal Fall di bawah — karena `duration_ms` HANYA dibaca oleh
          FadeRevealOpening (bar progres di bawah tombol). Kontrol global untuk
          field yang cuma berefek di 1 dari 17 gaya justru menyesatkan. */}
      {cfg.opening.type === 'fade-reveal' && (
        <div className="pt-4 border-t border-gray-100">
          <p className="text-[10px] font-semibold text-gray-500 mb-1">Bar Progres</p>
          <p className="text-[9px] text-gray-400 mb-2.5">
            Garis tipis di bawah tombol yang terisi perlahan
          </p>
          <div className="flex items-center gap-2">
            <input
              type="range" min={1000} max={10000} step={500}
              value={cfg.opening.duration_ms ?? 3000}
              onChange={e => updateOpening({ duration_ms: Number(e.target.value) })}
              className="flex-1 h-1.5 bg-gray-200 rounded-full accent-indigo-600 cursor-pointer"
            />
            <span className="text-[10px] font-mono text-gray-500 w-12 text-right shrink-0">
              {((cfg.opening.duration_ms ?? 3000) / 1000).toFixed(1)}s
            </span>
          </div>
        </div>
      )}

      {/*  Opening Content  */}
      <div className="pt-4 border-t border-gray-100">
        <p className="text-[10px] font-semibold text-gray-500 mb-3">
          Konten Opening
        </p>

        <div className="space-y-4">

          <Field label="Salam Pembuka">
            <input
              value={cfg.opening.subtitle ?? ''}
              onChange={e => updateOpening({ subtitle: e.target.value || undefined })}
              className={inputCls}
              placeholder="Assalamu'alaikum Wr. Wb."
            />
          </Field>

          {/* Teks Undangan: preset + kustom */}
          {(() => {
            const PRESETS = [
              { key: 'bahagia',   label: '🎉 Bahagia',     text: 'Dengan penuh kebahagiaan, kami mengundang kehadiran Bapak/Ibu/Saudara/i' },
              { key: 'islami',    label: '🤲 Islami',      text: 'Bismillahirrahmanirrahim. Dengan memohon rahmat dan ridha Allah SWT, kami mengundang Bapak/Ibu/Saudara/i' },
              { key: 'formal',    label: '🎩 Formal',      text: 'Merupakan suatu kehormatan dan kebahagiaan bagi kami untuk mengundang kehadiran Bapak/Ibu/Saudara/i' },
              { key: 'rendah',    label: '🙏 Rendah Hati', text: 'Dengan segala kerendahan hati, kami mengundang kehadiran Bapak/Ibu/Saudara/i' },
              { key: 'sukacita',  label: '💫 Sukacita',    text: 'Dengan penuh sukacita, kami mengundang kehadiran Bapak/Ibu/Saudara/i untuk turut merayakan momen bahagia kami' },
              { key: 'custom',    label: '✏️ Kustom',      text: null },
            ] as const
            const current = cfg.opening.invitation_text ?? ''
            const matchedPreset = PRESETS.slice(0, -1).find(p => p.text === current)
            const isCustom = !matchedPreset && current !== ''

            return (
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-2">Teks Undangan</p>
                {/* Preset chips */}
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {PRESETS.map(p => {
                    const active = p.key === 'custom' ? isCustom : matchedPreset?.key === p.key
                    return (
                      <button key={p.key} type="button"
                        onClick={() => {
                          if (p.key === 'custom') updateOpening({ invitation_text: '' })
                          else updateOpening({ invitation_text: p.text })
                        }}
                        className={`px-2.5 py-1.5 rounded-xl text-[10px] font-semibold transition-all border ${
                          active
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
                        }`}>
                        {p.label}
                      </button>
                    )
                  })}
                </div>
                {/* Textarea (always visible untuk edit / kustom) */}
                <textarea
                  value={current}
                  onChange={e => updateOpening({ invitation_text: e.target.value || undefined })}
                  rows={3}
                  className={inputCls + ' resize-none text-xs leading-relaxed'}
                  placeholder="Tulis teks undangan kustom..."
                />
                {!isCustom && matchedPreset && (
                  <p className="text-[9px] text-gray-400 mt-1">Edit textarea untuk membuat variasi kustom dari preset ini</p>
                )}
              </div>
            )
          })()}

          <Field label="Teks Tombol">
            <input
              value={cfg.opening.button_text ?? ''}
              onChange={e => updateOpening({ button_text: e.target.value || undefined })}
              className={inputCls}
              placeholder="Buka Undangan"
            />
          </Field>

          {/* Toggle: Tampilkan Nama Tamu */}
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-xs font-semibold text-gray-500">Tampilkan Nama Tamu</p>
              <p className="text-[10px] text-gray-400">Dari URL ?to=nama-tamu</p>
            </div>
            <button
              onClick={() => updateOpening({ show_guest_name: cfg.opening.show_guest_name === false ? true : false })}
              className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                cfg.opening.show_guest_name !== false ? 'bg-indigo-600' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                cfg.opening.show_guest_name !== false ? 'translate-x-[18px]' : 'translate-x-0.5'
              }`} />
            </button>
          </div>

          {/* Preview nama tamu (hanya di preview cover) */}
          {cfg.opening.show_guest_name !== false && (
            <Field label="Nama Tamu (untuk Preview)">
              <input
                value={previewGuestName}
                onChange={e => setPreviewGuestName(e.target.value)}
                className={inputCls}
                placeholder="dr. Gia dan Istri"
              />
              <p className="text-[10px] text-gray-400 mt-1">
                Hanya untuk preview admin. Di undangan asli dari URL ?to=
              </p>
            </Field>
          )}
        </div>
      </div>

      {/*  Data Mempelai  */}
      <div className="pt-4 border-t border-gray-100">
        <p className="text-[10px] font-semibold text-gray-500 mb-1">
          Data Mempelai
        </p>
        <p className="text-[9px] text-gray-400 mb-3">
          Isi data contoh untuk preview. User bisa mengubah saat membuat undangan.
        </p>

        {/* Pria */}
        <div className="rounded-xl border border-blue-100 bg-blue-50/30 p-3 mb-3">
          <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest mb-2">Mempelai Pria</p>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Nama Lengkap">
              <input type="text" value={previewData.groom_name}
                onChange={e => setPreviewData(d => ({ ...d, groom_name: e.target.value }))}
                placeholder="Nama lengkap..."
                className="w-full text-[11px] border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white" />
            </Field>
            <Field label="Nama Panggilan">
              <input type="text" value={previewData.groom_nickname ?? ''}
                onChange={e => setPreviewData(d => ({ ...d, groom_nickname: e.target.value || undefined }))}
                placeholder="Panggilan..."
                className="w-full text-[11px] border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white" />
            </Field>
            <Field label="Ayah">
              <input type="text" value={previewData.groom_father ?? ''}
                onChange={e => setPreviewData(d => ({ ...d, groom_father: e.target.value || undefined }))}
                placeholder="Nama ayah..."
                className="w-full text-[11px] border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white" />
            </Field>
            <Field label="Ibu">
              <input type="text" value={previewData.groom_mother ?? ''}
                onChange={e => setPreviewData(d => ({ ...d, groom_mother: e.target.value || undefined }))}
                placeholder="Nama ibu..."
                className="w-full text-[11px] border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white" />
            </Field>
          </div>
        </div>

        {/* Wanita */}
        <div className="rounded-xl border border-rose-100 bg-rose-50/30 p-3 mb-3">
          <p className="text-[9px] font-bold text-rose-600 uppercase tracking-widest mb-2">Mempelai Wanita</p>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Nama Lengkap">
              <input type="text" value={previewData.bride_name}
                onChange={e => setPreviewData(d => ({ ...d, bride_name: e.target.value }))}
                placeholder="Nama lengkap..."
                className="w-full text-[11px] border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white" />
            </Field>
            <Field label="Nama Panggilan">
              <input type="text" value={previewData.bride_nickname ?? ''}
                onChange={e => setPreviewData(d => ({ ...d, bride_nickname: e.target.value || undefined }))}
                placeholder="Panggilan..."
                className="w-full text-[11px] border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white" />
            </Field>
            <Field label="Ayah">
              <input type="text" value={previewData.bride_father ?? ''}
                onChange={e => setPreviewData(d => ({ ...d, bride_father: e.target.value || undefined }))}
                placeholder="Nama ayah..."
                className="w-full text-[11px] border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white" />
            </Field>
            <Field label="Ibu">
              <input type="text" value={previewData.bride_mother ?? ''}
                onChange={e => setPreviewData(d => ({ ...d, bride_mother: e.target.value || undefined }))}
                placeholder="Nama ibu..."
                className="w-full text-[11px] border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white" />
            </Field>
          </div>
        </div>

        {/* Nama tamu preview */}
        <Field label="Nama Tamu Preview">
          <input type="text" value={previewGuestName}
            onChange={e => setPreviewGuestName(e.target.value)}
            placeholder="dr. Gia dan Istri"
            className="w-full text-[11px] border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400" />
          <p className="text-[9px] text-gray-400 mt-1">Untuk preview saja. Di undangan asli dari URL ?to=</p>
        </Field>
      </div>

      {/*  Typography & Layout  */}
      <div className="pt-4 border-t border-gray-100">
        <p className="text-[10px] font-semibold text-gray-500 mb-3">
          Tipografi &amp; Layout
        </p>
        <div className="space-y-4">

          <Field label="Ukuran Font Salam">
            <div className="flex items-center gap-2">
              <input type="range" min={8} max={20} step={0.5}
                value={cfg.opening.greeting_font_size ?? 11}
                onChange={e => updateOpening({ greeting_font_size: Number(e.target.value) })}
                className="flex-1 accent-indigo-600"
              />
              <div className="flex items-center gap-1">
                <input type="number" min={8} max={20} step={0.5}
                  value={cfg.opening.greeting_font_size ?? 11}
                  onChange={e => { const v = Number(e.target.value); if (v >= 8 && v <= 20) updateOpening({ greeting_font_size: v }) }}
                  className="w-14 px-1.5 py-1 text-xs text-center border border-gray-200 rounded-lg focus:border-indigo-400 focus:outline-none"
                />
                <span className="text-[9px] text-gray-400">px</span>
              </div>
            </div>
          </Field>

          <Field label="Ukuran Font Nama">
            <div className="flex items-center gap-2">
              <input type="range" min={18} max={50} step={1}
                value={cfg.opening.couple_name_font_size ?? 32}
                onChange={e => updateOpening({ couple_name_font_size: Number(e.target.value) })}
                className="flex-1 accent-indigo-600"
              />
              <div className="flex items-center gap-1">
                <input type="number" min={18} max={50}
                  value={cfg.opening.couple_name_font_size ?? 32}
                  onChange={e => { const v = Number(e.target.value); if (v >= 18 && v <= 50) updateOpening({ couple_name_font_size: v }) }}
                  className="w-14 px-1.5 py-1 text-xs text-center border border-gray-200 rounded-lg focus:border-indigo-400 focus:outline-none"
                />
                <span className="text-[9px] text-gray-400">px</span>
              </div>
            </div>
          </Field>

          <Field label="Letter Spacing">
            <div className="flex items-center gap-2">
              <input type="range" min={0} max={0.25} step={0.01}
                value={cfg.opening.couple_name_letter_spacing ?? 0.08}
                onChange={e => updateOpening({ couple_name_letter_spacing: Number(e.target.value) })}
                className="flex-1 accent-indigo-600"
              />
              <div className="flex items-center gap-1">
                <input type="number" min={0} max={0.25} step={0.01}
                  value={cfg.opening.couple_name_letter_spacing ?? 0.08}
                  onChange={e => { const v = Number(e.target.value); if (v >= 0 && v <= 0.25) updateOpening({ couple_name_letter_spacing: v }) }}
                  className="w-16 px-1.5 py-1 text-xs text-center border border-gray-200 rounded-lg focus:border-indigo-400 focus:outline-none"
                />
                <span className="text-[9px] text-gray-400">em</span>
              </div>
            </div>
          </Field>

          <Field label="Gaya Huruf Nama">
            <div className="grid grid-cols-2 gap-1.5">
              {([
                { key: 'uppercase', label: 'UPPERCASE', desc: 'SEMUA KAPITAL' },
                { key: 'capitalize', label: 'Capitalize', desc: 'Huruf Awal Besar' },
                { key: 'lowercase', label: 'lowercase', desc: 'semua kecil' },
                { key: 'none', label: 'Asli', desc: 'Sesuai input' },
              ] as const).map(opt => {
                const current = cfg.opening.couple_name_text_transform ?? (cfg.opening.couple_name_uppercase !== false ? 'uppercase' : 'none')
                const active = current === opt.key
                return (
                  <button key={opt.key} type="button"
                    onClick={() => updateOpening({ couple_name_text_transform: opt.key, couple_name_uppercase: opt.key === 'uppercase' })}
                    className={`px-2 py-2 rounded-xl text-center transition-all border ${
                      active
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-sm'
                        : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200'
                    }`}
                  >
                    <p className="text-[11px] font-bold">{opt.label}</p>
                    <p className="text-[8px] text-gray-400 mt-0.5">{opt.desc}</p>
                  </button>
                )
              })}
            </div>
          </Field>

          <Field label="Ukuran Tombol">
            <select
              value={cfg.opening.button_size ?? 'lg'}
              onChange={e => updateOpening({ button_size: e.target.value as 'sm' | 'md' | 'lg' })}
              className={inputCls}
            >
              <option value="sm">Kecil</option>
              <option value="md">Sedang</option>
              <option value="lg">Besar</option>
            </select>
          </Field>

          <Field label="Padding Horizontal">
            <div className="flex items-center gap-2">
              <input type="range" min={12} max={56} step={2}
                value={cfg.opening.content_padding_x ?? 28}
                onChange={e => updateOpening({ content_padding_x: Number(e.target.value) })}
                className="flex-1 accent-indigo-600"
              />
              <div className="flex items-center gap-1">
                <input type="number" min={12} max={56} step={2}
                  value={cfg.opening.content_padding_x ?? 28}
                  onChange={e => { const v = Number(e.target.value); if (v >= 12 && v <= 56) updateOpening({ content_padding_x: v }) }}
                  className="w-14 px-1.5 py-1 text-xs text-center border border-gray-200 rounded-lg focus:border-indigo-400 focus:outline-none"
                />
                <span className="text-[9px] text-gray-400">px</span>
              </div>
            </div>
          </Field>

          <Field label="Padding Bawah">
            <div className="flex items-center gap-2">
              <input type="range" min={16} max={80} step={2}
                value={cfg.opening.content_padding_bottom ?? 48}
                onChange={e => updateOpening({ content_padding_bottom: Number(e.target.value) })}
                className="flex-1 accent-indigo-600"
              />
              <div className="flex items-center gap-1">
                <input type="number" min={16} max={80} step={2}
                  value={cfg.opening.content_padding_bottom ?? 48}
                  onChange={e => { const v = Number(e.target.value); if (v >= 16 && v <= 80) updateOpening({ content_padding_bottom: v }) }}
                  className="w-14 px-1.5 py-1 text-xs text-center border border-gray-200 rounded-lg focus:border-indigo-400 focus:outline-none"
                />
                <span className="text-[9px] text-gray-400">px</span>
              </div>
            </div>
          </Field>

          <Field label="Label Tamu">
            <input
              value={cfg.opening.guest_label ?? 'KEPADA YTH.'}
              onChange={e => updateOpening({ guest_label: e.target.value || undefined })}
              className={inputCls}
              placeholder="KEPADA YTH."
            />
          </Field>

          <Field label="Ukuran Font Label Tamu">
            <div className="flex items-center gap-2">
              <input type="range" min={6} max={14} step={0.5}
                value={cfg.opening.guest_label_font_size ?? 8.5}
                onChange={e => updateOpening({ guest_label_font_size: Number(e.target.value) })}
                className="flex-1 accent-indigo-600"
              />
              <div className="flex items-center gap-1">
                <input type="number" min={6} max={14} step={0.5}
                  value={cfg.opening.guest_label_font_size ?? 8.5}
                  onChange={e => { const v = Number(e.target.value); if (v >= 6 && v <= 14) updateOpening({ guest_label_font_size: v }) }}
                  className="w-14 px-1.5 py-1 text-xs text-center border border-gray-200 rounded-lg focus:border-indigo-400 focus:outline-none"
                />
                <span className="text-[9px] text-gray-400">px</span>
              </div>
            </div>
          </Field>

          <Field label="Gaya Pembatas">
            <div className="grid grid-cols-3 gap-1.5">
              {([
                { key: 'diamond', label: '◆ Diamond' },
                { key: 'dot', label: '● Dot' },
                { key: 'line', label: '― Line' },
                { key: 'floral', label: '❦ Floral' },
                { key: 'star', label: '✦ Star' },
                { key: 'wave', label: '〰 Wave' },
              ] as const).map(s => {
                const active = (cfg.opening.separator_style ?? 'diamond') === s.key
                return (
                  <button key={s.key} type="button"
                    onClick={() => updateOpening({ separator_style: s.key })}
                    className={`px-2 py-2 rounded-xl text-[10px] font-semibold transition-all border text-center ${
                      active
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
                    }`}>
                    {s.label}
                  </button>
                )
              })}
            </div>
          </Field>

          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-xs font-semibold text-gray-500">Pembatas Atas</p>
              <p className="text-[10px] text-gray-400">Garis ornamen setelah salam pembuka</p>
            </div>
            <button
              onClick={() => updateOpening({ show_top_separator: cfg.opening.show_top_separator === false ? true : false })}
              className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                cfg.opening.show_top_separator !== false ? 'bg-indigo-600' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                cfg.opening.show_top_separator !== false ? 'translate-x-[18px]' : 'translate-x-0.5'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-xs font-semibold text-gray-500">Pembatas Bawah</p>
              <p className="text-[10px] text-gray-400">Ornamen diamond sebelum nama pasangan</p>
            </div>
            <button
              onClick={() => updateOpening({ show_bottom_separator: cfg.opening.show_bottom_separator === false ? true : false })}
              className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                cfg.opening.show_bottom_separator !== false ? 'bg-indigo-600' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                cfg.opening.show_bottom_separator !== false ? 'translate-x-[18px]' : 'translate-x-0.5'
              }`} />
            </button>
          </div>

          <Field label="Gaya Penghubung Nama">
            <p className="text-[10px] text-gray-400 mb-2">Simbol antara nama mempelai pria & wanita</p>
            <div className="grid grid-cols-3 gap-1.5">
              {([
                { key: 'ampersand', label: '& Ampersand' },
                { key: 'heart', label: '♥ Heart' },
                { key: 'dot', label: '● Dot' },
                { key: 'dash', label: '  Dash' },
                { key: 'ring', label: '◎ Ring' },
                { key: 'flower', label: '✿ Flower' },
              ] as const).map(s => {
                const active = (cfg.opening.couple_name_connector ?? 'ampersand') === s.key
                return (
                  <button key={s.key} type="button"
                    onClick={() => updateOpening({ couple_name_connector: s.key })}
                    className={`px-2 py-2 rounded-xl text-[10px] font-semibold transition-all border text-center ${
                      active
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-sm'
                        : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200'
                    }`}
                  >
                    {s.label}
                  </button>
                )
              })}
            </div>
          </Field>

          <Field label="Ukuran Penghubung">
            <div className="flex items-center gap-2">
              <input type="range" min={14} max={40} step={1}
                value={cfg.opening.couple_name_connector_size ?? 26}
                onChange={e => updateOpening({ couple_name_connector_size: Number(e.target.value) })}
                className="flex-1 accent-indigo-600 h-1.5" />
              <div className="flex items-center gap-0.5 shrink-0">
                <input type="number" min={14} max={40} step={1}
                  value={cfg.opening.couple_name_connector_size ?? 26}
                  onChange={e => { const v = Number(e.target.value); if (v >= 14 && v <= 40) updateOpening({ couple_name_connector_size: v }) }}
                  className="w-14 px-1 py-0.5 text-[10px] text-center border border-gray-200 rounded-md focus:border-indigo-400 focus:outline-none font-mono" />
                <span className="text-[8px] text-gray-400">px</span>
              </div>
            </div>
          </Field>

          <Field label="Jarak Nama (px)">
            <div className="flex items-center gap-2">
              <input type="range" min={0} max={24} step={1}
                value={cfg.opening.couple_name_gap ?? 3}
                onChange={e => updateOpening({ couple_name_gap: Number(e.target.value) })}
                className="flex-1 accent-indigo-600 h-1.5" />
              <div className="flex items-center gap-0.5 shrink-0">
                <input type="number" min={0} max={24} step={1}
                  value={cfg.opening.couple_name_gap ?? 3}
                  onChange={e => { const v = Number(e.target.value); if (v >= 0 && v <= 24) updateOpening({ couple_name_gap: v }) }}
                  className="w-14 px-1 py-0.5 text-[10px] text-center border border-gray-200 rounded-md focus:border-indigo-400 focus:outline-none font-mono" />
                <span className="text-[8px] text-gray-400">px</span>
              </div>
            </div>
          </Field>

        </div>
      </div>

      <div className="pt-4 border-t border-gray-100">
        <p className="text-[10px] font-semibold text-gray-500 mb-3">
          Foto Pasangan
        </p>
        <div className="space-y-4">
          <ImageUploadField
            value={cfg.opening.cover_photo_url}
            onChange={url => updateOpening({ cover_photo_url: url })}
            hint="Foto pasangan akan ditampilkan di halaman cover undangan"
          />

          <Field label="Tampilan Foto">
            <select
              value={cfg.opening.cover_photo_display ?? 'background'}
              onChange={e => updateOpening({ cover_photo_display: e.target.value as 'background' | 'portrait' | 'banner' })}
              className={inputCls}
            >
              <option value="background">Background penuh</option>
              <option value="portrait">Portrait bulat (tengah)</option>
              <option value="banner">Banner atas</option>
            </select>
          </Field>

          {(cfg.opening.cover_photo_display ?? 'background') === 'background' && (
            <>
              <Field label="Opacity Foto">
                <div className="flex items-center gap-2">
                  <input type="range" min={5} max={80} step={5}
                    value={cfg.opening.cover_photo_opacity ?? 40}
                    onChange={e => updateOpening({ cover_photo_opacity: Number(e.target.value) })}
                    className="flex-1 accent-indigo-600 h-1.5"
                  />
                  <div className="flex items-center gap-0.5 shrink-0">
                    <input type="number" min={5} max={80} step={5}
                      value={cfg.opening.cover_photo_opacity ?? 40}
                      onChange={e => { const v = Number(e.target.value); if (v >= 5 && v <= 80) updateOpening({ cover_photo_opacity: v }) }}
                      className="w-14 px-1 py-0.5 text-[10px] text-center border border-gray-200 rounded-md focus:border-indigo-400 focus:outline-none font-mono" />
                    <span className="text-[8px] text-gray-400">%</span>
                  </div>
                </div>
                <div className="flex justify-between text-[9px] text-gray-400 mt-0.5">
                  <span>Transparan</span><span>Terang</span>
                </div>
              </Field>
              <Field label="Posisi Foto">
                <select value={cfg.opening.cover_photo_position ?? 'center'}
                  onChange={e => updateOpening({ cover_photo_position: e.target.value as 'top' | 'center' | 'bottom' })}
                  className={inputCls}>
                  <option value="top">Atas</option>
                  <option value="center">Tengah</option>
                  <option value="bottom">Bawah</option>
                </select>
              </Field>
              <Field label="Tebal Gradasi Bawah">
                <div className="flex items-center gap-2">
                  <input type="range" min={20} max={90} step={5}
                    value={cfg.opening.cover_gradient_height ?? 55}
                    onChange={e => updateOpening({ cover_gradient_height: Number(e.target.value) })}
                    className="flex-1 accent-indigo-600 h-1.5"
                  />
                  <div className="flex items-center gap-0.5 shrink-0">
                    <input type="number" min={20} max={90} step={5}
                      value={cfg.opening.cover_gradient_height ?? 55}
                      onChange={e => { const v = Number(e.target.value); if (v >= 20 && v <= 90) updateOpening({ cover_gradient_height: v }) }}
                      className="w-14 px-1 py-0.5 text-[10px] text-center border border-gray-200 rounded-md focus:border-indigo-400 focus:outline-none font-mono" />
                    <span className="text-[8px] text-gray-400">%</span>
                  </div>
                </div>
                <div className="flex justify-between text-[9px] text-gray-400 mt-0.5">
                  <span>Tipis</span><span>Tebal</span>
                </div>
              </Field>
              <Field label="Warna Gradasi">
                <div className="flex items-center gap-2">
                  <input type="color"
                    value={cfg.opening.cover_gradient_color ?? cfg.meta.color_scheme.primary}
                    onChange={e => updateOpening({ cover_gradient_color: e.target.value })}
                    className="w-10 h-9 rounded-lg cursor-pointer border border-gray-200 shrink-0"
                  />
                  <input
                    value={cfg.opening.cover_gradient_color ?? cfg.meta.color_scheme.primary}
                    onChange={e => updateOpening({ cover_gradient_color: e.target.value })}
                    className={inputCls + ' font-mono flex-1 text-xs'}
                    placeholder="Default: warna primer"
                  />
                  {cfg.opening.cover_gradient_color && (
                    <button onClick={() => updateOpening({ cover_gradient_color: undefined })}
                      className="text-gray-300 hover:text-gray-600 text-xs shrink-0" title="Reset ke primer">
                      ↺
                    </button>
                  )}
                </div>
              </Field>
            </>
          )}
        </div>
      </div>

      {/*  Petal Fall Attributes (hanya tampil saat type = petal-fall)  */}
      {cfg.opening.type === 'petal-fall' && (
        <div>
          <p className="text-[10px] font-semibold text-gray-500 mb-1">
            Pengaturan Petal Fall
          </p>
          <p className="text-[9px] text-gray-400 mb-3">
            Sesuaikan efek kelopak jatuh, glow tombol, dan Ken Burns
          </p>
          <div className="space-y-3 bg-pink-50/50 border border-pink-200/40 rounded-xl p-3">

            {/* Petal Count */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-semibold text-gray-600">Jumlah Kelopak</span>
                <span className="text-[10px] text-gray-400 tabular-nums">{cfg.opening.petal_count ?? 22}</span>
              </div>
              <input type="range" min={5} max={50} step={1}
                value={cfg.opening.petal_count ?? 22}
                onChange={e => updateOpening({ petal_count: Number(e.target.value) })}
                className="w-full h-1.5 bg-gray-200 rounded-full appearance-none accent-pink-500"
              />
            </div>

            {/* Petal Speed */}
            <div>
              <span className="text-[10px] font-semibold text-gray-600 block mb-1">Kecepatan Jatuh</span>
              <div className="flex gap-1.5">
                {(['slow', 'normal', 'fast'] as const).map(sp => (
                  <button key={sp} type="button"
                    onClick={() => updateOpening({ petal_speed: sp })}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                      (cfg.opening.petal_speed ?? 'normal') === sp
                        ? 'bg-pink-500 text-white shadow-sm' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {sp === 'slow' ? 'Lambat' : sp === 'normal' ? 'Normal' : 'Cepat'}
                  </button>
                ))}
              </div>
            </div>

            {/* Petal Size */}
            <div>
              <span className="text-[10px] font-semibold text-gray-600 block mb-1">Ukuran Kelopak</span>
              <div className="flex gap-1.5">
                {(['sm', 'md', 'lg'] as const).map(sz => (
                  <button key={sz} type="button"
                    onClick={() => updateOpening({ petal_size: sz })}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                      (cfg.opening.petal_size ?? 'md') === sz
                        ? 'bg-pink-500 text-white shadow-sm' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {sz === 'sm' ? 'Kecil' : sz === 'md' ? 'Sedang' : 'Besar'}
                  </button>
                ))}
              </div>
            </div>

            {/* Petal Shape */}
            <div>
              <span className="text-[10px] font-semibold text-gray-600 block mb-1">Bentuk Partikel</span>
              <div className="grid grid-cols-4 gap-1.5">
                {([
                  { id: 'petal', label: 'Kelopak', icon: '🌷' },
                  { id: 'sakura', label: 'Sakura', icon: '🌸' },
                  { id: 'leaf', label: 'Daun', icon: '🍃' },
                  { id: 'snowflake', label: 'Salju', icon: '❄️' },
                ] as const).map(sh => (
                  <button key={sh.id} type="button"
                    onClick={() => updateOpening({ petal_shape: sh.id })}
                    className={`py-2 rounded-lg text-center transition-all ${
                      (cfg.opening.petal_shape ?? 'petal') === sh.id
                        ? 'bg-pink-500 text-white shadow-sm' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-sm block">{sh.icon}</span>
                    <span className="text-[8px] font-bold">{sh.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Petal Opacity */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-semibold text-gray-600">Opacity Kelopak</span>
                <span className="text-[10px] text-gray-400 tabular-nums">{cfg.opening.petal_opacity ?? 30}%</span>
              </div>
              <input type="range" min={5} max={80} step={1}
                value={cfg.opening.petal_opacity ?? 30}
                onChange={e => updateOpening({ petal_opacity: Number(e.target.value) })}
                className="w-full h-1.5 bg-gray-200 rounded-full appearance-none accent-pink-500"
              />
            </div>

            {/* Petal Sway */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-semibold text-gray-600">Intensitas Ayunan</span>
                <span className="text-[10px] text-gray-400 tabular-nums">{cfg.opening.petal_sway ?? 50}%</span>
              </div>
              <input type="range" min={0} max={100} step={5}
                value={cfg.opening.petal_sway ?? 50}
                onChange={e => updateOpening({ petal_sway: Number(e.target.value) })}
                className="w-full h-1.5 bg-gray-200 rounded-full appearance-none accent-pink-500"
              />
            </div>

            {/* Petal Color */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-semibold text-gray-600">Warna Kelopak</span>
                <span className="text-[10px] text-gray-400">Kosongkan = warna aksen</span>
              </div>
              <div className="flex gap-2 items-center">
                <input type="color"
                  value={cfg.opening.petal_color ?? cfg.meta.color_scheme.accent}
                  onChange={e => updateOpening({ petal_color: e.target.value })}
                  className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer"
                />
                <input type="text"
                  value={cfg.opening.petal_color ?? ''}
                  onChange={e => updateOpening({ petal_color: e.target.value || undefined })}
                  placeholder="auto (accent)"
                  className="flex-1 px-2 py-1.5 text-[10px] bg-white border border-gray-200 rounded-lg"
                />
              </div>
            </div>

            {/* Scrim Opacity */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-semibold text-gray-600">Kegelapan Overlay</span>
                <span className="text-[10px] text-gray-400 tabular-nums">{cfg.opening.scrim_opacity ?? 33}%</span>
              </div>
              <input type="range" min={0} max={80} step={1}
                value={cfg.opening.scrim_opacity ?? 33}
                onChange={e => updateOpening({ scrim_opacity: Number(e.target.value) })}
                className="w-full h-1.5 bg-gray-200 rounded-full appearance-none accent-gray-500"
              />
            </div>

            {/* Toggles row */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {/* Button Glow */}
              <label className="flex items-center gap-2 cursor-pointer">
                <button type="button"
                  onClick={() => updateOpening({ show_button_glow: cfg.opening.show_button_glow === false ? true : false })}
                  className={`w-9 h-5 rounded-full transition-colors relative ${
                    cfg.opening.show_button_glow !== false ? 'bg-pink-500' : 'bg-gray-200'
                  }`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    cfg.opening.show_button_glow !== false ? 'translate-x-[18px]' : 'translate-x-0.5'
                  }`} />
                </button>
                <span className="text-[10px] font-semibold text-gray-600">Glow Tombol</span>
              </label>

              {/* Scroll Hint */}
              <label className="flex items-center gap-2 cursor-pointer">
                <button type="button"
                  onClick={() => updateOpening({ show_scroll_hint: cfg.opening.show_scroll_hint === false ? true : false })}
                  className={`w-9 h-5 rounded-full transition-colors relative ${
                    cfg.opening.show_scroll_hint !== false ? 'bg-pink-500' : 'bg-gray-200'
                  }`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    cfg.opening.show_scroll_hint !== false ? 'translate-x-[18px]' : 'translate-x-0.5'
                  }`} />
                </button>
                <span className="text-[10px] font-semibold text-gray-600">Scroll Hint</span>
              </label>

              {/* Ken Burns */}
              <label className="flex items-center gap-2 cursor-pointer">
                <button type="button"
                  onClick={() => updateOpening({ ken_burns_enabled: cfg.opening.ken_burns_enabled === false ? true : false })}
                  className={`w-9 h-5 rounded-full transition-colors relative ${
                    cfg.opening.ken_burns_enabled !== false ? 'bg-pink-500' : 'bg-gray-200'
                  }`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    cfg.opening.ken_burns_enabled !== false ? 'translate-x-[18px]' : 'translate-x-0.5'
                  }`} />
                </button>
                <span className="text-[10px] font-semibold text-gray-600">Ken Burns</span>
              </label>
            </div>

            {/* Ken Burns Speed (only if enabled) */}
            {cfg.opening.ken_burns_enabled !== false && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-semibold text-gray-600">Ken Burns Durasi</span>
                  <span className="text-[10px] text-gray-400 tabular-nums">{cfg.opening.ken_burns_speed ?? 20}s</span>
                </div>
                <input type="range" min={8} max={40} step={2}
                  value={cfg.opening.ken_burns_speed ?? 20}
                  onChange={e => updateOpening({ ken_burns_speed: Number(e.target.value) })}
                  className="w-full h-1.5 bg-gray-200 rounded-full appearance-none accent-pink-500"
                />
              </div>
            )}

            {/* Exit Blur */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-semibold text-gray-600">Exit Blur</span>
                <span className="text-[10px] text-gray-400 tabular-nums">{cfg.opening.exit_blur ?? 12}px</span>
              </div>
              <input type="range" min={0} max={30} step={1}
                value={cfg.opening.exit_blur ?? 12}
                onChange={e => updateOpening({ exit_blur: Number(e.target.value) })}
                className="w-full h-1.5 bg-gray-200 rounded-full appearance-none accent-gray-500"
              />
            </div>

          </div>
        </div>
      )}

      <LoadingScreenPanel
        cfg={cfg}
        setConfig={setConfig}
        setPreviewMode={setPreviewMode}
        setPreviewKey={setPreviewKey}
      />

        </div>
      </div>

    </div>
  )
}
