/**
 * Entry Worker kustom.
 *
 * Memakai ulang fetch handler hasil build OpenNext, lalu menambah scheduled()
 * supaya Cron Trigger Cloudflare bisa memanggil route cron yang SUDAH ADA
 * lewat HTTP internal — kode route-nya tidak berubah sama sekali.
 *
 * File ini di-exclude dari tsconfig.json: import di bawah menunjuk ke artefak
 * yang baru ada setelah `opennextjs-cloudflare build`, jadi tsc pada
 * `next build` tidak boleh ikut memeriksanya. esbuild milik wrangler tetap
 * membundelnya dengan benar.
 */

// @ts-ignore — dibuat saat build oleh opennextjs-cloudflare
import { default as handler } from './.open-next/worker.js'

interface Env {
  CRON_SECRET?: string
  NEXT_PUBLIC_APP_URL?: string
}

/**
 * Peta jadwal -> route. Kunci HARUS sama persis dengan triggers.crons di
 * wrangler.jsonc, karena controller.cron mengembalikan string mentahnya.
 */
const CRON_ROUTES: Record<string, string> = {
  '0 1 * * *': '/api/cron/sync-subscriptions',
  '*/15 * * * *': '/api/cron/publish-scheduled',
}

export default {
  fetch: handler.fetch,

  async scheduled(controller: { cron: string }, env: Env, ctx: unknown) {
    const path = CRON_ROUTES[controller.cron]
    if (!path) {
      console.error(`[cron] tidak ada route untuk jadwal "${controller.cron}"`)
      return
    }

    // Route cron memverifikasi bearer ini. Kalau secret tidak ada, jangan
    // panggil sama sekali — memanggil tanpa secret hanya akan menghasilkan 401
    // yang membingungkan di log.
    if (!env.CRON_SECRET) {
      console.error(`[cron] CRON_SECRET belum diset — ${path} dilewati`)
      return
    }

    // Origin publik dipakai dengan sengaja: middleware.ts menentukan rewrite
    // subdomain dari header host. Host asal-asalan (mis. localhost) akan
    // membuat request cron ikut ter-rewrite ke /invitation/<slug>.
    const origin = env.NEXT_PUBLIC_APP_URL || 'https://iaundang.online'

    const request = new Request(`${origin}${path}`, {
      method: 'GET',
      headers: { authorization: `Bearer ${env.CRON_SECRET}` },
    })

    try {
      const response = await handler.fetch(request, env, ctx)
      const body = await response.text()
      if (!response.ok) {
        console.error(`[cron] ${path} -> HTTP ${response.status}: ${body.slice(0, 500)}`)
      } else {
        console.log(`[cron] ${path} -> OK: ${body.slice(0, 500)}`)
      }
    } catch (error) {
      console.error(`[cron] ${path} gagal:`, error)
    }
  },
}
