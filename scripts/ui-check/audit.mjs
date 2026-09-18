// Memeriksa satu halaman di lima lebar: gulir horizontal, area sentuh, jalur
// keyboard, dan error konsol termasuk peringatan hidrasi.
//
//   node scripts/ui-check/audit.mjs http://localhost:3000/
//
// Keluar dengan kode 1 kalau ada temuan, supaya bisa dipakai sebagai gerbang.

import { bukaTab, jeda } from './cdp.mjs'

const URL_TARGET = process.argv[2] || 'http://localhost:3000/'
const LEBAR = [375, 390, 768, 1024, 1440]

const PEMERIKSA = `(() => {
  const docW = document.documentElement.clientWidth
  const tombolKecil = []
  for (const el of document.querySelectorAll('a, button, [role="button"], input, select, textarea')) {
    const r = el.getBoundingClientRect()
    if (r.width === 0 || r.height === 0) continue
    if (r.height >= 44 && r.width >= 44) continue
    // Yang dihitung hanya yang TERLIHAT sebagai tombol, bukan yang kebetulan
    // memakai nama kelas tertentu. Patokannya bentuk visual: elemen button,
    // role button, atau tautan yang punya latar atau garis tepi. Tautan teks
    // biasa, termasuk judul yang bisa diklik, memang dikecualikan WCAG.
    const g = getComputedStyle(el)
    // Tanpa regex. Isi pemeriksa ini hidup di dalam template literal, dan di
    // sana backslash adalah karakter escape: /rgba\(/ sampai ke halaman
    // sebagai /rgba(/ dan berubah jadi grup tangkap yang tidak pernah cocok.
    const latar = g.backgroundColor
    const punyaLatar = !!latar && latar !== 'rgba(0, 0, 0, 0)' && latar !== 'transparent'
    // Garis tepi harus mengelilingi, bukan sekadar garis bawah. Tautan teks
    // sering memakai border-bottom sebagai garis bawah, dan itu bukan tombol.
    const sisi = ['borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth']
    const punyaGaris = sisi.every(s => parseFloat(g[s] || '0') > 0)
    const sepertiTombol = el.tagName === 'BUTTON' || el.getAttribute('role') === 'button' || punyaLatar || punyaGaris
    if (!sepertiTombol) continue
    tombolKecil.push({
      tag: el.tagName.toLowerCase(),
      w: Math.round(r.width), h: Math.round(r.height),
      teks: (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 32),
    })
  }
  return JSON.stringify({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: docW,
    adaScrollHorizontal: document.documentElement.scrollWidth > docW + 1,
    tombolKecil,
    // Hanya gaya INLINE opacity 0 yang dihitung, karena itulah tanda tangan
    // animasi masuk yang tidak pernah selesai. Opacity 0 dari kelas CSS
    // (overlay hover, navbar yang menyembunyikan diri) memang disengaja.
    tersangkutTransparan: [...document.querySelectorAll('body *')].filter(e => {
      const gaya = (e.getAttribute('style') || '').split(' ').join('')
      return gaya.includes('opacity:0') && !gaya.includes('opacity:0.')
    }).length,
  })
})()`

const FOKUS = `(() => {
  const el = document.activeElement
  if (!el || el === document.body) return JSON.stringify({ ada: false })
  const g = getComputedStyle(el)
  return JSON.stringify({
    ada: true,
    tag: el.tagName.toLowerCase(),
    teks: (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 40),
    terlihat: g.outlineStyle !== 'none' || g.boxShadow !== 'none',
  })
})()`

const tab = await bukaTab()
const temuan = []

for (const lebar of LEBAR) {
  await tab.ukuran(lebar)
  await tab.buka(URL_TARGET)
  await tab.gulirSampaiDasar()
  const h = JSON.parse(await tab.eval(PEMERIKSA))

  const catatan = []
  if (h.adaScrollHorizontal) {
    catatan.push(`gulir horizontal: scrollWidth ${h.scrollWidth} lawan clientWidth ${h.clientWidth}`)
  }
  if (h.tombolKecil.length > 0) {
    catatan.push(`${h.tombolKecil.length} tombol di bawah 44px: ` + h.tombolKecil.map(t => `${t.teks || t.tag} ${t.w}x${t.h}`).join('; '))
  }
  if (h.tersangkutTransparan > 0) {
    catatan.push(`${h.tersangkutTransparan} elemen tersangkut di gaya inline opacity 0 setelah digulir`)
  }

  console.log(`${String(lebar).padStart(5)}px  ${catatan.length === 0 ? 'bersih' : catatan.join(' | ')}`)
  for (const c of catatan) temuan.push(`${lebar}px: ${c}`)
}

// Jalur keyboard, di lebar desktop.
await tab.ukuran(1440)
await tab.buka(URL_TARGET)
const tanpaFokus = []
let perhentian = 0
for (let i = 0; i < 14; i++) {
  await tab.tekanTab()
  const f = JSON.parse(await tab.eval(FOKUS))
  // `nextjs-portal` adalah overlay pengembangan Next.js dan tidak ada di
  // produksi. Fokus yang jatuh ke body sesudah elemen terakhir juga bukan
  // cacat: itu memang titik keluar halaman menuju antarmuka browser.
  if (!f.ada || f.tag === 'nextjs-portal') break
  perhentian += 1
  if (!f.terlihat) tanpaFokus.push(`perhentian ${perhentian} (${f.teks || f.tag}): fokus tidak terlihat`)
}
if (perhentian === 0) tanpaFokus.push('tidak ada satu pun elemen yang bisa dicapai dengan Tab')
console.log(`keyboard  ${tanpaFokus.length === 0 ? `${perhentian} perhentian, semua fokusnya terlihat` : tanpaFokus.join(' | ')}`)
temuan.push(...tanpaFokus)

// Error konsol, termasuk peringatan hidrasi React.
await jeda(500)
const penting = tab.pesanKonsol.filter(p => p.jenis !== 'warning' || /hydrat|didn't match|did not match/i.test(p.isi))
console.log(`konsol    ${penting.length === 0 ? 'bersih' : penting.length + ' pesan'}`)
for (const p of penting) {
  console.log(`          ${p.jenis}: ${p.isi.slice(0, 160)}`)
  temuan.push(`konsol ${p.jenis}: ${p.isi.slice(0, 120)}`)
}

tab.tutup()
console.log(temuan.length === 0 ? '\nBERSIH' : `\n${temuan.length} TEMUAN`)
process.exit(temuan.length === 0 ? 0 : 1)
