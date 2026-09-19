/**
 * Menjaga satu sifat: tema yang dibeli pelanggan tidak boleh ditimpa nilai
 * tanam dari studio.
 *
 * Ada karena sifat itu pernah benar benar patah. initData() di studio
 * mengisi primary_color #2c4a34 dan accent_color #c9a961 untuk undangan
 * mana pun. Selama warna pembeli tidak pernah dibaca, itu tidak terlihat.
 * Sejak lib/effective-template.ts membacanya, ketiga tema berubah jadi satu
 * palet hijau emas yang sama begitu studio dibuka.
 *
 * Pakai: npx tsx scripts/cek-tema-efektif.ts
 */
import rose from '../lib/template-configs/rose-garden'
import jawa from '../lib/template-configs/javanese-gold'
import malam from '../lib/template-configs/midnight-luxe'
import { temaEfektif } from '../lib/effective-template'
import { PALET_RUMAH } from '../lib/house-palettes'
import { BUILT_IN_PRICE_TIERS } from '../lib/built-in-data'
import type { TierFeatures } from '../lib/types'
import type { NewInvitationData } from '../lib/types'

const KUNCI = ['primary', 'accent', 'text', 'background'] as const

const PETA_SEKSI: Record<string, keyof TierFeatures> = {
  hero: 'hero', profiles: 'profiles', events: 'events', quote: 'quote',
  countdown: 'countdown', gallery: 'gallery', rsvp: 'rsvp', wishes: 'wishes',
  story: 'story', video: 'video', gift: 'gift', 'gift-registry': 'gift_registry',
  livestream: 'livestream', 'ig-story': 'ig_story', qrcode: 'qrcode', closing: 'closing',
}
const tema = [rose, jawa, malam]

function bandingkan(label: string, data: Partial<NewInvitationData>, harusSamaDenganTema: boolean) {
  let lolos = 0
  for (const t of tema) {
    const asli = t.config.meta.color_scheme
    const jadi = temaEfektif(t, data as NewInvitationData).config.meta.color_scheme
    const beda = KUNCI.filter(k => asli[k] !== jadi[k])
    const benar = harusSamaDenganTema ? beda.length === 0 : beda.length === KUNCI.length
    if (benar) lolos++
    console.log(`  ${benar ? 'OK  ' : 'GAGAL'} ${t.name.padEnd(15)} ${JSON.stringify(jadi)}`)
  }
  console.log(`  ${label}: ${lolos}/${tema.length}\n`)
  return lolos === tema.length
}

console.log('A. nilai tanam lama initData (#2c4a34 dst), semua tema ikut berubah:')
const lama = { primary_color: '#2c4a34', accent_color: '#c9a961', text_color: '#1a1a1a', background_color: '#fefdf8' }
const a = bandingkan('semua tema tertimpa, ini yang diperbaiki', lama, false)

console.log('B. nilai baru initData (kosong), palet tema utuh:')
const baru = { primary_color: '', accent_color: '', text_color: '', background_color: '' }
const b = bandingkan('palet tema tidak tersentuh', baru, true)

console.log('C. pembeli benar benar memilih warna, pilihannya tetap dipakai:')
const pilihan = { primary_color: '#123f8c', accent_color: '', text_color: '', background_color: '' }
let c = true
for (const t of tema) {
  const jadi = temaEfektif(t, pilihan as NewInvitationData).config.meta.color_scheme
  const benar = jadi.primary === '#123f8c' && jadi.accent === t.config.meta.color_scheme.accent
  if (!benar) c = false
  console.log(`  ${benar ? 'OK  ' : 'GAGAL'} ${t.name.padEnd(15)} primary=${jadi.primary} accent=${jadi.accent}`)
}
console.log(`  primer ikut, aksen tetap tema: ${c ? 'lolos' : 'gagal'}\n`)

console.log('D. salinan palet di lib/house-palettes.ts sama dengan konfigurasi tema:')
let d = true
for (const t of tema) {
  const salinan = PALET_RUMAH.find(p => p.id === t.id)
  if (!salinan) {
    console.log(`  GAGAL ${t.name.padEnd(15)} tidak ada salinannya di PALET_RUMAH`)
    d = false
    continue
  }
  const beda = KUNCI.filter(k => t.config.meta.color_scheme[k] !== salinan.warna[k])
  if (beda.length) d = false
  console.log(`  ${beda.length ? 'GAGAL' : 'OK  '} ${t.name.padEnd(15)} ${beda.length ? 'melenceng: ' + beda.join(', ') : 'sama persis'}`)
}
const yatim = PALET_RUMAH.filter(p => !tema.some(t => t.id === p.id))
if (yatim.length) {
  console.log(`  GAGAL salinan tanpa tema: ${yatim.map(p => p.id).join(', ')}`)
  d = false
}
console.log(`  salinan cocok: ${d ? 'lolos' : 'gagal'}
`)

console.log('E. gaya pembuka: kosong ikut tema, pilihan pembeli sampai ke halaman tamu:')
let e = true
for (const t of tema) {
  const asli = t.config.opening
  const kosong = temaEfektif(t, {} as NewInvitationData).config.opening
  const utuh = kosong.type === asli.type
    && kosong.subtitle === asli.subtitle
    && kosong.invitation_text === asli.invitation_text

  const pilih = temaEfektif(t, {
    opening_type: 'envelope',
    opening_greeting: 'Assalamualaikum',
  } as NewInvitationData).config.opening
  const ikut = pilih.type === 'envelope'
    && pilih.subtitle === 'Assalamualaikum'
    // Yang tidak dipilih pembeli harus tetap milik tema.
    && pilih.invitation_text === asli.invitation_text

  if (!utuh || !ikut) e = false
  console.log(`  ${utuh && ikut ? 'OK  ' : 'GAGAL'} ${t.name.padEnd(15)} kosong=${kosong.type} dipilih=${pilih.type}`)
}
console.log(`  pembuka: ${e ? 'lolos' : 'gagal'}
`)

console.log('F. layar loading pilihan pembeli sampai ke halaman tamu:')
let f = true
for (const t of tema) {
  const kosong = temaEfektif(t, {} as NewInvitationData).config.loading
  const utuh = kosong.duration_ms === t.config.loading.duration_ms
  const diatur = temaEfektif(t, { loading_config: { duration_ms: 1234 } } as NewInvitationData).config.loading
  const ikut = diatur.duration_ms === 1234
  if (!utuh || !ikut) f = false
  console.log(`  ${utuh && ikut ? 'OK  ' : 'GAGAL'} ${t.name.padEnd(15)} kosong=${kosong.duration_ms}ms diatur=${diatur.duration_ms}ms`)
}
console.log(`  loading: ${f ? 'lolos' : 'gagal'}
`)

console.log('G. seksi yang paketnya tidak beli tidak ikut dirender:')
let g = true
for (const tier of BUILT_IN_PRICE_TIERS) {
  for (const t of tema) {
    const hasil = temaEfektif(t, {} as NewInvitationData, tier.features as TierFeatures).config.sections
    const bocor = hasil.filter(s => {
      const k = PETA_SEKSI[s.type]
      return k && !(tier.features as TierFeatures)[k]
    })
    if (bocor.length) g = false
    console.log(`  ${bocor.length ? 'GAGAL' : 'OK  '} ${tier.label.padEnd(10)} ${t.name.padEnd(15)} ${hasil.length} seksi${bocor.length ? ', bocor: ' + bocor.map(s => s.type).join(', ') : ''}`)
  }
}
// Tanpa info paket tidak boleh ada yang disaring, sama seperti musik.
for (const t of tema) {
  const tanpa = temaEfektif(t, {} as NewInvitationData).config.sections.length
  const semua = t.config.sections.length
  if (tanpa !== semua) g = false
  console.log(`  ${tanpa === semua ? 'OK  ' : 'GAGAL'} tanpa paket ${t.name.padEnd(15)} ${tanpa}/${semua} seksi utuh`)
}
console.log(`  penyaringan seksi: ${g ? 'lolos' : 'gagal'}
`)

const lolos = a && b && c && d && e && f && g
console.log(lolos ? 'SEMUA LOLOS' : 'ADA YANG GAGAL')
process.exit(lolos ? 0 : 1)
