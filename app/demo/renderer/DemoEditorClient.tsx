'use client'

import { useState, useRef, useCallback, useMemo } from 'react'
import { Pencil, X, Camera, User, ImageIcon, ChevronUp } from 'lucide-react'
import InvitationRenderer from '@/components/renderer/InvitationRenderer'
import type { TemplateRecord, NewInvitationData, Wish } from '@/lib/types'

interface Props {
  template: TemplateRecord
  demoData: NewInvitationData
  demoWishes: Wish[]
}

export default function DemoEditorClient({ template, demoData, demoWishes }: Props) {
  const [groomNick, setGroomNick] = useState(demoData.opening_groom_name || demoData.groom_name.split(' ')[0])
  const [brideNick, setBrideNick] = useState(demoData.opening_bride_name || demoData.bride_name.split(' ')[0])
  const [groomFull, setGroomFull] = useState(demoData.groom_name)
  const [brideFull, setBrideFull] = useState(demoData.bride_name)
  const [groomParents, setGroomParents] = useState(demoData.groom_parents || '')
  const [brideParents, setBrideParents] = useState(demoData.bride_parents || '')
  const [coverPhoto, setCoverPhoto] = useState<string | null>(null)
  const [groomPhoto, setGroomPhoto] = useState<string | null>(null)
  const [bridePhoto, setBridePhoto] = useState<string | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [hasEdited, setHasEdited] = useState(false)

  const coverInputRef = useRef<HTMLInputElement>(null)
  const groomInputRef = useRef<HTMLInputElement>(null)
  const brideInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback((setter: (url: string) => void) => {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      if (!file.type.startsWith('image/')) return
      const url = URL.createObjectURL(file)
      setter(url)
      setHasEdited(true)
    }
  }, [])

  const mark = useCallback(() => setHasEdited(true), [])

  const editedData = useMemo<NewInvitationData>(() => ({
    ...demoData,
    groom_name: groomFull,
    bride_name: brideFull,
    groom_parents: groomParents,
    bride_parents: brideParents,
    ...(groomPhoto ? { groom_photo_url: groomPhoto } : {}),
    ...(bridePhoto ? { bride_photo_url: bridePhoto } : {}),
    ...(coverPhoto ? { couple_photo_url: coverPhoto } : {}),
  }), [demoData, groomFull, brideFull, groomParents, brideParents, groomPhoto, bridePhoto, coverPhoto])

  const editedTemplate = useMemo<TemplateRecord>(() => {
    if (!coverPhoto) return template
    return {
      ...template,
      config: {
        ...template.config,
        opening: {
          ...template.config.opening,
          cover_photo_url: coverPhoto,
        },
      },
    }
  }, [template, coverPhoto])

  return (
    <div style={{ width: '100%', maxWidth: 430, height: '100%', position: 'relative', overflow: 'hidden' }}>
      <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
      <InvitationRenderer
        invitationId={`demo-${template.id}`}
        mode="preview"
        invitationData={editedData}
        template={editedTemplate}
        initialWishes={demoWishes}
        musicUrl={editedTemplate.config.music?.url}
        contained
      />

      {/* Hidden file inputs */}
      <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect(setCoverPhoto)} />
      <input ref={groomInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect(setGroomPhoto)} />
      <input ref={brideInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect(setBridePhoto)} />

      {/* Floating edit toggle button */}
      {!panelOpen && (
        <button
          onClick={() => setPanelOpen(true)}
          className="absolute bottom-5 right-4 z-50 flex items-center gap-2 min-h-[44px] bg-chalk text-graphite rounded-pill pl-4 pr-5 py-2.5 text-button-sm font-semibold hover:bg-ivory transition-colors border border-hairline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40 focus-visible:ring-offset-2"
          style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)' }}
        >
          <Pencil className="w-4 h-4 text-forest-600" />
          <span>Coba dengan nama kalian</span>
        </button>
      )}

      {/* Editing panel   slides up from bottom */}
      {panelOpen && (
        <div
          className="absolute bottom-0 left-0 right-0 z-50"
          style={{ animation: 'slideUp 0.3s ease-out' }}
        >
          <div
            className="bg-white/[0.97] backdrop-blur-xl rounded-t-2xl shadow-2xl border-t border-stone-200/60"
            style={{ boxShadow: '0 -8px 40px rgba(0,0,0,0.15)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-stone-100">
              <div>
                <h3 className="text-sm font-bold text-stone-800">Personalisasi</h3>
                <p className="text-[11px] text-stone-400 mt-0.5">Coba isi nama & foto kalian</p>
              </div>
              <button
                onClick={() => setPanelOpen(false)}
                className="p-1.5 rounded-full hover:bg-stone-100 transition-colors text-stone-400"
              >
                <ChevronUp className="w-4 h-4 rotate-180" />
              </button>
            </div>

            {/* Form content */}
            <div className="px-5 py-4 space-y-4 max-h-[50vh] overflow-y-auto">
              {/*
                Nama panggilan TIDAK muncul di cover, walaupun labelnya dulu
                menjanjikan begitu: ketujuh belas komponen pembuka memakai
                groom_name dan bride_name apa adanya. Yang benar benar
                dilakukannya adalah mengisi awal form pesanan dan menjadi
                alamat undangan, dan itulah yang sekarang ditulis labelnya.
              */}
              <div>
                <label className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider mb-1.5 block">
                  Nama Panggilan <span className="normal-case font-normal text-stone-400">(jadi alamat undangan)</span>
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    value={groomNick}
                    onChange={e => { setGroomNick(e.target.value); mark() }}
                    placeholder="Pria"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-800 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-forest-500/30 focus:border-forest-400 transition-all"
                  />
                  <input
                    type="text"
                    value={brideNick}
                    onChange={e => { setBrideNick(e.target.value); mark() }}
                    placeholder="Wanita"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-800 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-forest-500/30 focus:border-forest-400 transition-all"
                  />
                </div>
              </div>

              {/* Full names   shown on profile section */}
              <div>
                <label className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider mb-1.5 block">
                  Nama Lengkap <span className="normal-case font-normal text-stone-400">(tampil di profil)</span>
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    value={groomFull}
                    onChange={e => { setGroomFull(e.target.value); mark() }}
                    placeholder="Nama lengkap pria"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-800 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-forest-500/30 focus:border-forest-400 transition-all"
                  />
                  <input
                    type="text"
                    value={brideFull}
                    onChange={e => { setBrideFull(e.target.value); mark() }}
                    placeholder="Nama lengkap wanita"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-800 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-forest-500/30 focus:border-forest-400 transition-all"
                  />
                </div>
              </div>

              {/* Parents */}
              <div>
                <label className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider mb-1.5 block">
                  Orang Tua
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={groomParents}
                    onChange={e => { setGroomParents(e.target.value); mark() }}
                    placeholder="Orang tua pria, cth: Bapak & Ibu Wijaya"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-800 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-forest-500/30 focus:border-forest-400 transition-all"
                  />
                  <input
                    type="text"
                    value={brideParents}
                    onChange={e => { setBrideParents(e.target.value); mark() }}
                    placeholder="Orang tua wanita, cth: Bapak & Ibu Santoso"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-800 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-forest-500/30 focus:border-forest-400 transition-all"
                  />
                </div>
              </div>

              {/* Photo uploads */}
              <div>
                <label className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider mb-2 block">
                  Foto
                </label>
                {/* Foto di sini tidak ikut terbawa ke pemesanan: ini blob di
                    browser yang mati begitu halaman berpindah, dan undangannya
                    sendiri baru ada setelah pembayaran. Dikatakan terus terang
                    di muka supaya tidak ada yang merasa kehilangan nanti. */}
                <p className="text-[11px] text-stone-400 mb-2 leading-relaxed">
                  Foto di sini untuk pratinjau saja. Nanti bisa diunggah beneran di editor setelah pemesanan.
                </p>
                <div className="grid grid-cols-3 gap-2.5">
                  {/* Cover / background photo */}
                  <button
                    onClick={() => coverInputRef.current?.click()}
                    className="group relative aspect-square rounded-xl border-2 border-dashed border-stone-200 hover:border-forest-400 bg-stone-50 hover:bg-forest-50/50 transition-all flex flex-col items-center justify-center gap-1 overflow-hidden"
                  >
                    {coverPhoto ? (
                      <>
                        <img src={coverPhoto} alt="" className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Camera className="w-5 h-5 text-white" />
                        </div>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-5 h-5 text-stone-300 group-hover:text-forest-500 transition-colors" />
                        <span className="text-[9px] text-stone-400 group-hover:text-forest-600 font-medium">Latar</span>
                      </>
                    )}
                  </button>

                  {/* Groom photo */}
                  <button
                    onClick={() => groomInputRef.current?.click()}
                    className="group relative aspect-square rounded-xl border-2 border-dashed border-stone-200 hover:border-forest-400 bg-stone-50 hover:bg-forest-50/50 transition-all flex flex-col items-center justify-center gap-1 overflow-hidden"
                  >
                    {groomPhoto ? (
                      <>
                        <img src={groomPhoto} alt="" className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Camera className="w-5 h-5 text-white" />
                        </div>
                      </>
                    ) : (
                      <>
                        <User className="w-5 h-5 text-stone-300 group-hover:text-forest-500 transition-colors" />
                        <span className="text-[9px] text-stone-400 group-hover:text-forest-600 font-medium">Pria</span>
                      </>
                    )}
                  </button>

                  {/* Bride photo */}
                  <button
                    onClick={() => brideInputRef.current?.click()}
                    className="group relative aspect-square rounded-xl border-2 border-dashed border-stone-200 hover:border-forest-400 bg-stone-50 hover:bg-forest-50/50 transition-all flex flex-col items-center justify-center gap-1 overflow-hidden"
                  >
                    {bridePhoto ? (
                      <>
                        <img src={bridePhoto} alt="" className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Camera className="w-5 h-5 text-white" />
                        </div>
                      </>
                    ) : (
                      <>
                        <User className="w-5 h-5 text-stone-300 group-hover:text-forest-500 transition-colors" />
                        <span className="text-[9px] text-stone-400 group-hover:text-forest-600 font-medium">Wanita</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Info note */}
              {/* Dulu: "Daftar gratis untuk menyimpan undanganmu." Pendaftaran
                  mandiri sudah ditutup. Undangan hanya lahir dari pemesanan,
                  dan isinya dilengkapi di editor setelah pembayaran. */}
              <p className="text-[10px] text-stone-400 text-center leading-relaxed">
                Perubahan hanya berlaku sementara untuk preview ini.
                <br />Untuk menyimpannya, pesan undangan ini. Isinya dilengkapi di editor setelah pembayaran.
              </p>
            </div>

            {/* Bottom CTA */}
            {hasEdited && (
              <div className="px-5 pb-4">
                <a
                  href={`/order?template=${template.id}`}
                  onClick={() => {
                    // Nama yang barusan diketik pengunjung dititipkan ke
                    // OrderForm lewat sessionStorage. Dulu tombol ini cuma
                    // membawa `template`, jadi orang mengetik nama mereka di
                    // sini, melihat undangannya hidup, lalu diminta mengetik
                    // nama yang sama lagi dari nol di halaman order.
                    //
                    // Sengaja HANYA nama. Data orang tua dan foto tetap di
                    // demo: keduanya isi undangan, bukan syarat transaksi, dan
                    // tempatnya di Studio editor setelah pemesanan. Foto juga
                    // tidak mungkin dibawa — ini blob URL yang mati begitu
                    // halaman berpindah, dan undangannya sendiri baru ada
                    // setelah pembayaran terkonfirmasi.
                    //
                    // sessionStorage, bukan query param: nama orang tidak
                    // perlu ikut tercatat di log server, analytics, dan header
                    // referrer.
                    try {
                      sessionStorage.setItem('iaundang:prefill', JSON.stringify({
                        groomName: groomFull,
                        brideName: brideFull,
                        groomNickname: groomNick,
                        brideNickname: brideNick,
                      }))
                    } catch {
                      // Kuota penuh atau storage diblokir. Bukan alasan untuk
                      // menahan pengunjung — order tetap bisa jalan, cuma
                      // namanya diketik ulang.
                    }
                  }}
                  className="block w-full text-center py-3 rounded-xl text-sm font-bold text-white bg-forest-500 hover:bg-forest-600 transition-colors shadow-sm"
                >
                  Suka? Buat undangan sekarang →
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
