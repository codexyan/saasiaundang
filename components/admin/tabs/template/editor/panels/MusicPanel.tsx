'use client'

import { Volume2, Trash2, Play, Check } from 'lucide-react'
import { Field, inputCls } from '../parts/fields'
import { useEditor } from '../EditorContext'

/**
 * Tab "Musik" — memilih lagu latar dari perpustakaan admin dan mengatur
 * tampilan pemutarnya.
 *
 * Perpustakaannya sendiri dikelola di modul Musik; di sini hanya memilih.
 */
export default function MusicPanel() {
  const {
    musicCfg, musicLibrary, musicLibraryCats, musicLibraryCat, setMusicLibraryCat,
    musicPreviewId, setMusicPreviewId, musicAudioRef, toggleMusicPreview, updateMusic,
  } = useEditor()

  const selectedTrack = musicCfg.url
    ? musicLibrary.find(t => t.url === musicCfg.url)
    : undefined

  return (
    <div className="space-y-5">
      <p className="text-xs text-gray-500">
        Konfigurasi musik latar dan kontrol player untuk undangan.
      </p>

      {/* Aktifkan Musik */}
      <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-white">
        <div>
          <p className="text-sm font-medium text-gray-700">Aktifkan Musik</p>
          <p className="text-xs text-gray-400 mt-0.5">Tampilkan kontrol musik di undangan</p>
        </div>
        <button
          onClick={() => updateMusic({ enabled: !musicCfg.enabled })}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${musicCfg.enabled ? 'bg-purple-600' : 'bg-gray-200'}`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${musicCfg.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>

      {musicCfg.enabled && (
        <>
          {/* File Musik   Current Selection */}
          <div className="pt-4 border-t border-gray-100">
            <p className="text-[10px] font-semibold text-gray-500 mb-3">Musik Terpilih</p>
            {musicCfg.url ? (
              <div className="p-3 rounded-xl border border-purple-200 bg-purple-50 flex items-center gap-3">
                <button
                  onClick={() => toggleMusicPreview('selected', musicCfg.url!)}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                    musicPreviewId === 'selected'
                      ? 'bg-purple-700 text-white scale-105'
                      : 'bg-purple-500 text-white hover:bg-purple-600'
                  }`}
                  title={musicPreviewId === 'selected' ? 'Stop' : 'Preview'}
                >
                  {musicPreviewId === 'selected' ? (
                    <div className="flex items-end gap-[2px] h-4">
                      {[0, 0.15, 0.3, 0.1].map((d, i) => (
                        <span key={i} className="w-[2.5px] bg-white rounded-full animate-pulse" style={{ height: `${8 + (i % 2) * 8}px`, animationDelay: `${d}s` }} />
                      ))}
                    </div>
                  ) : (
                    <Play className="w-5 h-5 fill-current" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{musicCfg.title || 'Musik'}</p>
                  <p className="text-[9px] text-gray-400 truncate">
                    {musicPreviewId === 'selected' ? 'Sedang diputar...' : 'Klik ikon play untuk preview'}
                  </p>
                </div>
                <button onClick={() => { musicAudioRef.current?.pause(); setMusicPreviewId(null); updateMusic({ url: '', title: '' }) }}
                  className="w-7 h-7 rounded-lg bg-red-100 text-red-500 hover:bg-red-200 flex items-center justify-center transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="p-3 rounded-xl border border-dashed border-gray-300 bg-gray-50 text-center">
                <div className="text-xl mb-1">🎼</div>
                <p className="text-[10px] text-gray-500">Belum ada musik dipilih. Pilih satu dari perpustakaan di bawah.</p>
              </div>
            )}

            {/* Perpustakaan sengaja diambil dari endpoint admin yang memuat
                trek nonaktif juga — kalau disaring, template yang terlanjur
                memakai trek nonaktif akan kehilangan pilihannya tanpa
                penjelasan. Yang dilakukan di sini: memberi tahu. */}
            {musicCfg.url && selectedTrack && !selectedTrack.is_active && (
              <p className="mt-2 text-[10px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-2 leading-relaxed">
                Lagu ini <strong>dinonaktifkan</strong> di perpustakaan, jadi user tidak
                bisa memilihnya sendiri. Undangan yang memakai template ini tetap memutarnya.
              </p>
            )}
            {musicCfg.url && !selectedTrack && musicLibrary.length > 0 && (
              <p className="mt-2 text-[10px] text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-2 leading-relaxed">
                Lagu ini tidak ada di perpustakaan (URL manual atau sudah dihapus).
                Tetap diputar selama berkasnya masih bisa diakses.
              </p>
            )}

            <Field label="Judul Lagu">
              <input value={musicCfg.title ?? ''} onChange={e => updateMusic({ title: e.target.value })}
                className={inputCls} placeholder="Perfect - Ed Sheeran" />
            </Field>
          </div>

          {/*  Library Musik Admin  */}
          <div className="pt-4 border-t border-gray-100">
            <p className="text-[10px] font-bold text-purple-500 uppercase tracking-widest mb-1">Perpustakaan Musik</p>
            <p className="text-[9px] text-gray-400 mb-3">
              Lagu yang disediakan admin sebagai opsi untuk user. Klik untuk memilih.
            </p>

            {(() => {
              const allCats = ['Semua', ...musicLibraryCats]
              const filtered = musicLibraryCat === 'Semua' ? musicLibrary : musicLibrary.filter(m => m.category === musicLibraryCat)

              return (
                <>
                  {allCats.length > 1 && (
                    <div className="flex gap-1 flex-wrap mb-3">
                      {allCats.map(cat => (
                        <button key={cat} onClick={() => setMusicLibraryCat(cat)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                            musicLibraryCat === cat
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-100 text-gray-500 hover:bg-purple-50 hover:text-purple-600'
                          }`}>
                          {cat}
                        </button>
                      ))}
                    </div>
                  )}

                  {musicLibrary.length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-gray-300 bg-gray-50 text-center">
                      <p className="text-[10px] text-gray-500">Belum ada musik di perpustakaan. Tambahkan melalui tab Musik di sidebar admin.</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-[320px] overflow-y-auto scrollbar-hide pr-1">
                      {filtered.map(song => {
                        const selected = musicCfg.url === song.url
                        const isPreviewing = musicPreviewId === song.id
                        return (
                          <div key={song.id}
                            className={`flex items-center gap-2 p-2.5 rounded-xl transition-all ${
                              selected
                                ? 'bg-purple-100 border-2 border-purple-500 ring-1 ring-purple-300'
                                : 'bg-white border border-gray-100 hover:border-purple-200'
                            }`}>
                            <button
                              onClick={e => { e.stopPropagation(); toggleMusicPreview(song.id, song.url) }}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                                isPreviewing
                                  ? 'bg-purple-600 text-white scale-105'
                                  : selected
                                    ? 'bg-purple-400 text-white hover:bg-purple-500'
                                    : 'bg-gray-100 text-gray-400 hover:bg-purple-100 hover:text-purple-600'
                              }`}
                              title={isPreviewing ? 'Stop preview' : 'Preview lagu'}
                            >
                              {isPreviewing ? (
                                <div className="flex items-end gap-[2px] h-3.5">
                                  {[0, 0.15, 0.3, 0.1].map((d, i) => (
                                    <span key={i} className="w-[2px] bg-white rounded-full animate-pulse" style={{ height: `${8 + (i % 2) * 6}px`, animationDelay: `${d}s` }} />
                                  ))}
                                </div>
                              ) : (
                                <Play className="w-3.5 h-3.5 fill-current" />
                              )}
                            </button>
                            <button
                              onClick={() => updateMusic({ url: song.url, title: song.title })}
                              className="flex-1 min-w-0 text-left"
                            >
                              <p className={`text-[11px] font-semibold truncate ${selected ? 'text-purple-800' : 'text-gray-700'}`}>
                                {song.title}
                                {!song.is_active && (
                                  <span className="ml-1.5 text-[8px] font-bold text-gray-400 bg-gray-100 px-1 py-0.5 rounded align-middle">
                                    NONAKTIF
                                  </span>
                                )}
                              </p>
                              <p className={`text-[9px] truncate ${selected ? 'text-purple-500' : 'text-gray-400'}`}>
                                {song.artist ? `${song.artist} · ` : ''}{song.category}
                                {song.duration > 0 && ` · ${Math.floor(song.duration / 60)}:${String(Math.floor(song.duration % 60)).padStart(2, '0')}`}
                              </p>
                            </button>
                            {selected && (
                              <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center shrink-0">
                                <Check className="w-3.5 h-3.5 text-white" />
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </>
              )
            })()}
          </div>

          {/* Autoplay & Volume */}
          <div className="pt-4 border-t border-gray-100">
            <p className="text-[10px] font-semibold text-gray-500 mb-3">Pengaturan Putar</p>

            <div className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-white mb-3">
              <div>
                <p className="text-xs font-medium text-gray-700">Autoplay</p>
                <p className="text-[10px] text-gray-400">Putar otomatis saat undangan dibuka</p>
              </div>
              <button onClick={() => updateMusic({ autoplay: !musicCfg.autoplay })}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${musicCfg.autoplay ? 'bg-purple-600' : 'bg-gray-200'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${musicCfg.autoplay ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-white mb-3">
              <div>
                <p className="text-xs font-medium text-gray-700">Loop</p>
                <p className="text-[10px] text-gray-400">Ulangi musik dari awal setelah selesai</p>
              </div>
              <button onClick={() => updateMusic({ loop: !musicCfg.loop })}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${musicCfg.loop ? 'bg-purple-600' : 'bg-gray-200'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${musicCfg.loop ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            <Field label="Volume Default">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-gray-400 shrink-0" />
                <input type="range" min="0" max="100" value={Math.round(musicCfg.volume * 100)}
                  onChange={e => updateMusic({ volume: Number(e.target.value) / 100 })}
                  className="flex-1 h-1.5 bg-gray-200 rounded-full accent-purple-600 cursor-pointer" />
                <div className="flex items-center gap-0.5 shrink-0">
                  <input type="number" min={0} max={100} step={5}
                    value={Math.round(musicCfg.volume * 100)}
                    onChange={e => { const v = Number(e.target.value); if (v >= 0 && v <= 100) updateMusic({ volume: v / 100 }) }}
                    className="w-14 px-1 py-0.5 text-[10px] text-center border border-gray-200 rounded-md focus:border-purple-400 focus:outline-none font-mono" />
                  <span className="text-[8px] text-gray-400">%</span>
                </div>
              </div>
            </Field>
          </div>

          {/* Gaya Tampilan Player */}
          <div className="pt-4 border-t border-gray-100">
            <p className="text-[10px] font-semibold text-gray-500 mb-3">Gaya Tampilan Player</p>
            <div className="grid grid-cols-2 gap-2">
              {([
                { id: 'pill', icon: '💊', name: 'Pill', desc: 'Tombol + judul lagu' },
                { id: 'circle', icon: '⭕', name: 'Circle', desc: 'Tombol bulat sederhana' },
                { id: 'vinyl', icon: '💿', name: 'Vinyl', desc: 'Piringan berputar' },
                { id: 'minimal', icon: '▶', name: 'Minimal', desc: 'Ikon kecil saja' },
              ] as const).map(s => {
                const selected = musicCfg.player_style === s.id
                return (
                  <button key={s.id} onClick={() => updateMusic({ player_style: s.id })}
                    className={`p-3 rounded-xl text-center transition-all ${selected
                      ? 'bg-purple-50 border-2 border-purple-500 ring-1 ring-purple-500/20'
                      : 'bg-gray-50 border border-gray-200 hover:border-gray-300'}`}>
                    <span className="text-lg block mb-0.5">{s.icon}</span>
                    <p className={`text-[10px] font-semibold ${selected ? 'text-purple-700' : 'text-gray-700'}`}>{s.name}</p>
                    <p className={`text-[9px] ${selected ? 'text-purple-500' : 'text-gray-400'}`}>{s.desc}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Posisi Player */}
          <div className="pt-4 border-t border-gray-100">
            <p className="text-[10px] font-semibold text-gray-500 mb-3">Posisi Player</p>
            <div className="grid grid-cols-2 gap-2">
              {([
                { id: 'bottom-right', name: 'Kanan Bawah', icon: '↘' },
                { id: 'bottom-left', name: 'Kiri Bawah', icon: '↙' },
                { id: 'bottom-center', name: 'Tengah Bawah', icon: '↓' },
                { id: 'top-right', name: 'Kanan Atas', icon: '↗' },
              ] as const).map(p => {
                const selected = musicCfg.player_position === p.id
                return (
                  <button key={p.id} onClick={() => updateMusic({ player_position: p.id })}
                    className={`p-2.5 rounded-xl text-center transition-all ${selected
                      ? 'bg-purple-50 border-2 border-purple-500'
                      : 'bg-gray-50 border border-gray-200 hover:border-gray-300'}`}>
                    <span className="text-sm block">{p.icon}</span>
                    <p className={`text-[10px] font-semibold mt-0.5 ${selected ? 'text-purple-700' : 'text-gray-700'}`}>{p.name}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Animasi Masuk */}
          <div className="pt-4 border-t border-gray-100">
            <p className="text-[10px] font-semibold text-gray-500 mb-3">Animasi Masuk</p>
            <div className="grid grid-cols-2 gap-2">
              {([
                { id: 'fade-slide', name: 'Fade Slide', desc: 'Muncul halus dari bawah' },
                { id: 'scale-bounce', name: 'Scale Bounce', desc: 'Membesar dari titik' },
                { id: 'slide-up', name: 'Slide Up', desc: 'Geser dari bawah layar' },
                { id: 'none', name: 'Tanpa Animasi', desc: 'Langsung muncul' },
              ] as const).map(a => {
                const selected = musicCfg.player_animation === a.id
                return (
                  <button key={a.id} onClick={() => updateMusic({ player_animation: a.id })}
                    className={`p-2.5 rounded-xl text-left transition-all ${selected
                      ? 'bg-purple-50 border-2 border-purple-500'
                      : 'bg-gray-50 border border-gray-200 hover:border-gray-300'}`}>
                    <p className={`text-[10px] font-semibold ${selected ? 'text-purple-700' : 'text-gray-700'}`}>{a.name}</p>
                    <p className={`text-[9px] ${selected ? 'text-purple-500' : 'text-gray-400'}`}>{a.desc}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Ukuran Player */}
          <div className="pt-4 border-t border-gray-100">
            <p className="text-[10px] font-semibold text-gray-500 mb-3">Ukuran Player</p>
            <div className="grid grid-cols-3 gap-2">
              {([
                { id: 'sm', name: 'Kecil' },
                { id: 'md', name: 'Sedang' },
                { id: 'lg', name: 'Besar' },
              ] as const).map(sz => {
                const selected = musicCfg.player_size === sz.id
                return (
                  <button key={sz.id} onClick={() => updateMusic({ player_size: sz.id })}
                    className={`py-2 rounded-xl text-center transition-all ${selected
                      ? 'bg-purple-50 border-2 border-purple-500'
                      : 'bg-gray-50 border border-gray-200 hover:border-gray-300'}`}>
                    <p className={`text-[10px] font-semibold ${selected ? 'text-purple-700' : 'text-gray-700'}`}>{sz.name}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Tampilkan Judul */}
          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-white">
              <div>
                <p className="text-xs font-medium text-gray-700">Tampilkan Judul Lagu</p>
                <p className="text-[10px] text-gray-400">Pill label di samping tombol player</p>
              </div>
              <button onClick={() => updateMusic({ show_title: !musicCfg.show_title })}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${musicCfg.show_title ? 'bg-purple-600' : 'bg-gray-200'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${musicCfg.show_title ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
            <p className="text-[10px] text-blue-700 leading-relaxed">
              <strong>Info:</strong> Musik mulai diputar sejak halaman cover/opening. Jika browser memblokir autoplay,
              kontrol musik menampilkan animasi pulse mengundang tamu untuk tap. Musik otomatis aktif saat ada interaksi pertama.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
