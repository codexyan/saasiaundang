'use client'

import { useState } from 'react'
import { Sparkles, Trash2 } from 'lucide-react'
import type { NewInvitationData, SectionConfig, DecorationAsset } from '@/lib/types'
import { BUILT_IN_ORNAMENTS, ORNAMENT_GROUPS, builtInUrl, resolveAssetUrl, type OrnamentGroup } from '@/lib/built-in-assets'
import { DECORATION_SLOTS, cariSlot, asetDariSlot } from '@/lib/decoration-slots'
import { SECTION_LABELS } from '@/components/admin/tabs/template/editor/parts/constants'
import SectionCard from '../ui/SectionCard'

interface Props {
  sections: SectionConfig[]
  data: NewInvitationData
  onUpdate: (patch: Partial<NewInvitationData>) => void
  /** -1 = tanpa batas. */
  maxAset: number
  warnaAksen: string
  warnaLatar: string
}

/**
 * Hiasan milik pembeli.
 *
 * Bedanya dengan kanvas admin disengaja: di sini tidak ada seret, tidak ada
 * ubah ukuran, tidak ada putar. Pembeli memilih ornamen, memilih salah satu
 * titik tempel, selesai. Ornamennya tidak bisa menabrak nama mempelai dan
 * tidak bisa dipasang miring, karena posisinya bukan urusan pembeli.
 *
 * Aset bawaan tema tidak pernah muncul di daftar ini. Pembeli hanya melihat
 * dan menghapus miliknya sendiri; hiasan yang datang dari tema adalah bagian
 * dari tema yang mereka beli.
 */
export default function DecorationForm({ sections, data, onUpdate, maxAset, warnaAksen, warnaLatar }: Props) {
  const seksiAktif = sections.filter(s => s.enabled)
  const [seksiId, setSeksiId] = useState<string>(seksiAktif[0]?.id ?? '')
  const [grup, setGrup] = useState<OrnamentGroup>('Sudut')
  const [warna, setWarna] = useState(warnaAksen)
  const [slotId, setSlotId] = useState<string>('kiri-atas')

  const semua = data.section_decoration_overrides ?? {}
  const milikSeksi = semua[seksiId] ?? []
  const totalTerpakai = Object.values(semua).reduce((n, arr) => n + (arr?.length ?? 0), 0)
  const penuh = maxAset >= 0 && totalTerpakai >= maxAset

  function tulis(next: DecorationAsset[]) {
    onUpdate({ section_decoration_overrides: { ...semua, [seksiId]: next } })
  }

  function pasang(bentuk: string, label: string) {
    if (penuh || !seksiId) return
    const slot = cariSlot(slotId)
    if (!slot) return
    const zAtas = milikSeksi.reduce((m, a) => Math.max(m, a.z_layer ?? 0), 0)
    tulis([...milikSeksi, asetDariSlot(slot, bentuk, label, warna, zAtas)])
  }

  function hapus(id: string) {
    tulis(milikSeksi.filter(a => a.id !== id))
  }

  if (seksiAktif.length === 0) {
    return (
      <SectionCard title="Hiasan" description="Belum ada bagian undangan yang bisa dihias." icon={Sparkles}>
        <p className="text-ui-xs text-graphite">
          Bagian undangan muncul di sini begitu temanya dimuat.
        </p>
      </SectionCard>
    )
  }

  return (
    <SectionCard
      title="Hiasan"
      description="Tambahkan ornamen kecil di sudut atau tengah tiap bagian undangan kalian."
      icon={Sparkles}
      badge={maxAset >= 0 ? `${totalTerpakai} dari ${maxAset}` : `${totalTerpakai} terpasang`}
    >
      <div className="space-y-4">
        {/* Bagian yang dihias */}
        <div>
          <label htmlFor="seksi-hiasan" className="block text-ui-xs font-semibold text-carbon mb-1.5">
            Bagian undangan
          </label>
          <select
            id="seksi-hiasan"
            value={seksiId}
            onChange={e => setSeksiId(e.target.value)}
            className="w-full px-3 py-2.5 sentuh:min-h-[44px] text-ui-sm bg-chalk border border-hairline rounded-card focus:outline-none focus:ring-2 focus:ring-forest/20"
          >
            {seksiAktif.map(s => (
              <option key={s.id} value={s.id}>
                {SECTION_LABELS[s.type] ?? s.type}
                {(semua[s.id]?.length ?? 0) > 0 ? ` (${semua[s.id]!.length})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Titik tempel */}
        <div>
          <p className="text-ui-xs font-semibold text-carbon mb-1.5">Mau ditaruh di mana</p>
          <div className="grid grid-cols-3 gap-1.5 max-w-[210px]">
            {Array.from({ length: 9 }, (_, i) => {
              const slot = DECORATION_SLOTS.find(s => s.petak === i)
              if (!slot) return <div key={i} aria-hidden className="aspect-square rounded-lg bg-ivory/60" />
              const aktif = slotId === slot.id
              return (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => setSlotId(slot.id)}
                  aria-pressed={aktif}
                  aria-label={slot.label}
                  title={slot.label}
                  className={`aspect-square sentuh:min-h-[44px] rounded-lg border transition-colors ${
                    aktif ? 'border-forest bg-forest-50' : 'border-hairline bg-chalk hover:border-concrete'
                  }`}
                >
                  <span
                    aria-hidden
                    className={`block w-2 h-2 rounded-full mx-auto ${aktif ? 'bg-forest' : 'bg-concrete'}`}
                  />
                </button>
              )
            })}
          </div>
          <p className="mt-1.5 text-ui-xs text-graphite">{cariSlot(slotId)?.label}</p>
        </div>

        {/* Warna ornamen */}
        <div className="flex items-center justify-between">
          <label htmlFor="warna-hiasan" className="text-ui-xs font-semibold text-carbon">Warna ornamen</label>
          <input
            id="warna-hiasan"
            type="color"
            value={warna}
            onChange={e => setWarna(e.target.value)}
            className="w-10 h-8 rounded-md border border-hairline bg-chalk p-0.5 cursor-pointer"
          />
        </div>

        {/* Pustaka ornamen */}
        <div>
          <div className="flex gap-1 overflow-x-auto scrollbar-hide -mx-1 px-1 mb-2">
            {ORNAMENT_GROUPS.map(g => (
              <button
                key={g}
                type="button"
                onClick={() => setGrup(g)}
                className={`shrink-0 px-2.5 py-1.5 sentuh:min-h-[44px] rounded-lg text-ui-xs font-semibold whitespace-nowrap transition-colors ${
                  grup === g ? 'bg-forest text-chalk' : 'bg-ivory text-graphite hover:text-carbon'
                }`}
              >
                {g}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {BUILT_IN_ORNAMENTS.filter(o => o.group === grup).map(o => (
              <button
                key={o.id}
                type="button"
                disabled={penuh}
                onClick={() => pasang(o.id, o.label)}
                aria-label={`Pasang ${o.label} di ${cariSlot(slotId)?.label}`}
                title={penuh ? 'Batas hiasan paket kalian sudah penuh' : `Pasang ${o.label}`}
                className="aspect-square rounded-lg border border-hairline hover:border-forest disabled:opacity-40 disabled:cursor-not-allowed overflow-hidden flex items-center justify-center p-1.5 transition-colors"
                style={{ backgroundColor: warnaLatar }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={resolveAssetUrl(builtInUrl(o.id, warna))} alt="" className="max-w-full max-h-full object-contain" />
              </button>
            ))}
          </div>

          {penuh && (
            <p className="mt-2 text-ui-xs text-carbon bg-ivory border border-hairline rounded-card px-3 py-2 leading-relaxed">
              Paket kalian memuat {maxAset} hiasan, dan {totalTerpakai} sudah terpasang.
              Hapus salah satu dulu untuk mengganti.
            </p>
          )}
        </div>

        {/* Yang sudah dipasang di bagian ini */}
        <div>
          <p className="text-ui-xs font-semibold text-carbon mb-1.5">
            Terpasang di bagian ini
          </p>
          {milikSeksi.length === 0 ? (
            <p className="text-ui-xs text-graphite">
              Belum ada. Pilih titik di atas, lalu ketuk salah satu ornamen.
            </p>
          ) : (
            <div className="space-y-1.5">
              {milikSeksi.map(a => (
                <div key={a.id} className="flex items-center gap-2.5 px-2.5 py-2 rounded-card border border-hairline bg-chalk">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={resolveAssetUrl(a.url)}
                    alt=""
                    className="w-7 h-7 object-contain rounded shrink-0"
                    style={{ backgroundColor: warnaLatar }}
                  />
                  <p className="flex-1 min-w-0 text-ui-xs font-medium text-carbon truncate">{a.label || 'Ornamen'}</p>
                  <button
                    type="button"
                    onClick={() => hapus(a.id)}
                    aria-label={`Hapus ${a.label || 'ornamen'}`}
                    title="Hapus"
                    className="shrink-0 inline-flex items-center justify-center w-9 h-9 sentuh:w-11 sentuh:h-11 rounded-lg text-graphite hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </SectionCard>
  )
}
