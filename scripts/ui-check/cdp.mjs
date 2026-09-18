// Klien Chrome DevTools Protocol seadanya, tanpa dependency.
//
// Kenapa bukan Playwright: mesin pengembangan proyek ini tidak punya Playwright
// maupun chromium-cli, dan memasangnya berarti mengunduh browser kedua sebesar
// ratusan megabyte. Chrome sudah terpasang, dan Node 22 sudah punya WebSocket
// dan fetch global, jadi cukup dua hal itu.

import { spawn } from 'node:child_process'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const PORT = Number(process.env.CDP_PORT || 9222)

const LOKASI_CHROME = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean)

export const jeda = (ms) => new Promise(r => setTimeout(r, ms))

async function browserHidup() {
  try {
    const r = await fetch(`http://127.0.0.1:${PORT}/json/version`)
    return r.ok
  } catch {
    return false
  }
}

/** Memakai Chrome yang sudah mendengarkan di port debug, atau menyalakan yang baru. */
export async function pastikanChrome() {
  if (await browserHidup()) return null

  const { existsSync } = await import('node:fs')
  const exe = LOKASI_CHROME.find(p => existsSync(p))
  if (!exe) {
    throw new Error(
      'Chrome tidak ditemukan. Set CHROME_PATH ke lokasi chrome.exe, atau jalankan sendiri dengan --remote-debugging-port=' + PORT,
    )
  }

  const profil = await mkdtemp(join(tmpdir(), 'iaundang-cdp-'))
  const anak = spawn(exe, [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profil}`,
    'about:blank',
  ], { detached: true, stdio: 'ignore' })
  anak.unref()

  for (let i = 0; i < 30; i++) {
    await jeda(400)
    if (await browserHidup()) return anak
  }
  throw new Error('Chrome tidak merespons di port debug setelah 12 detik.')
}

/**
 * Membuka satu tab baru dan mengembalikan pengendalinya.
 *
 * `pesanKonsol` ikut dikumpulkan sejak tab dibuka, termasuk peringatan hidrasi
 * React, yang hanya muncul di konsol dan tidak pernah tertangkap tsc.
 */
export async function bukaTab() {
  await pastikanChrome()
  const r = await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })
  const target = await r.json()
  const ws = new WebSocket(target.webSocketDebuggerUrl)

  let id = 0
  const menunggu = new Map()
  const pesanKonsol = []

  await new Promise((res, rej) => {
    ws.addEventListener('open', res, { once: true })
    ws.addEventListener('error', rej, { once: true })
  })

  ws.addEventListener('message', (ev) => {
    const p = JSON.parse(ev.data)
    if (p.id && menunggu.has(p.id)) {
      const { res, rej } = menunggu.get(p.id)
      menunggu.delete(p.id)
      p.error ? rej(new Error(p.error.message)) : res(p.result)
      return
    }
    if (p.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(p.params.type)) {
      pesanKonsol.push({ jenis: p.params.type, isi: (p.params.args || []).map(a => a.value || a.description || '').join(' ') })
    }
    if (p.method === 'Runtime.exceptionThrown') {
      pesanKonsol.push({ jenis: 'exception', isi: String(p.params.exceptionDetails.text) })
    }
  })

  const kirim = (method, params = {}) => {
    id += 1
    const kini = id
    return new Promise((res, rej) => {
      menunggu.set(kini, { res, rej })
      ws.send(JSON.stringify({ id: kini, method, params }))
    })
  }

  await kirim('Page.enable')
  await kirim('Runtime.enable')

  return {
    kirim,
    pesanKonsol,
    tutup: () => ws.close(),

    async ukuran(lebar, tinggi = lebar < 500 ? 812 : 900) {
      await kirim('Emulation.setDeviceMetricsOverride', {
        width: lebar, height: tinggi, deviceScaleFactor: 1, mobile: lebar < 500,
      })
    },

    /** 'reduce' atau 'no-preference'. Headless Chrome bawaannya 'reduce'. */
    async gerak(mode) {
      await kirim('Emulation.setEmulatedMedia', {
        features: [{ name: 'prefers-reduced-motion', value: mode }],
      })
    },

    async buka(url, tungguMs = 3500) {
      await kirim('Page.navigate', { url })
      await jeda(tungguMs)
    },

    async eval(ekspresi) {
      const hasil = await kirim('Runtime.evaluate', { expression: ekspresi, returnByValue: true })
      return hasil.result.value
    },

    /**
     * Menggulir bertahap sampai dasar. Animasi masuk memakai viewport-once,
     * jadi tanpa ini section yang belum pernah terlihat tetap transparan dan
     * setiap pemeriksaan di bawah lipatan jadi salah baca.
     */
    async gulirSampaiDasar() {
      const tinggi = await this.eval('document.body.scrollHeight')
      for (let y = 0; y < tinggi; y += 400) {
        await this.eval(`window.scrollTo(0, ${y})`)
        await jeda(250)
      }
      // Kembali ke atas sebelum diukur. Navbar menyembunyikan diri saat
      // menggulir turun, dan itu memasang gaya inline opacity 0 pada dirinya
      // sendiri. Tanpa langkah ini, perilaku yang memang disengaja terhitung
      // sebagai animasi yang tersangkut.
      await this.eval('window.scrollTo(0, 0)')
      await jeda(900)
    },

    async potret(berkas) {
      const { writeFile } = await import('node:fs/promises')
      const t = await kirim('Page.captureScreenshot', { format: 'png' })
      await writeFile(berkas, Buffer.from(t.data, 'base64'))
    },

    async tekanTab() {
      await kirim('Input.dispatchKeyEvent', { type: 'rawKeyDown', windowsVirtualKeyCode: 9, key: 'Tab', code: 'Tab' })
      await kirim('Input.dispatchKeyEvent', { type: 'keyUp', windowsVirtualKeyCode: 9, key: 'Tab', code: 'Tab' })
      await jeda(120)
    },
  }
}
