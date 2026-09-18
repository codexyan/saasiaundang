// Memotret halaman per section, dalam keadaan section itu sudah terlihat.
//
//   node scripts/ui-check/shots.mjs http://localhost:3000/ 375 keluaran/
//
// Section diambil dari id yang ada di halaman. Halaman digulir sampai dasar
// lebih dulu supaya animasi masuk selesai, baru tiap section dipotret.

import { mkdir } from 'node:fs/promises'
import { bukaTab, jeda } from './cdp.mjs'

const URL_TARGET = process.argv[2] || 'http://localhost:3000/'
const LEBAR = Number(process.argv[3] || 1440)
const FOLDER = process.argv[4] || 'ui-shots'

const tab = await bukaTab()
await mkdir(FOLDER, { recursive: true })

await tab.ukuran(LEBAR)
await tab.buka(URL_TARGET)
await tab.gulirSampaiDasar()

const idSection = JSON.parse(await tab.eval(
  `JSON.stringify([...document.querySelectorAll('section[id], div[id]')].map(e => e.id).filter(Boolean))`,
))

const awalan = LEBAR < 500 ? 'm' : 'd'

await tab.eval('window.scrollTo(0, 0)')
await jeda(700)
await tab.potret(`${FOLDER}/${awalan}-atas.png`)
console.log(`${awalan}-atas.png`)

for (const id of idSection) {
  await tab.eval(`(() => { const el = document.getElementById(${JSON.stringify(id)}); if (el) { el.scrollIntoView({ block: 'start' }); window.scrollBy(0, -80) } })()`)
  await jeda(800)
  await tab.potret(`${FOLDER}/${awalan}-${id}.png`)
  console.log(`${awalan}-${id}.png`)
}

await tab.eval('window.scrollTo(0, document.body.scrollHeight)')
await jeda(700)
await tab.potret(`${FOLDER}/${awalan}-bawah.png`)
console.log(`${awalan}-bawah.png`)

tab.tutup()
