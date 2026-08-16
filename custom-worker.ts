/**
 * Entry Worker kustom.
 *
 * Memakai ulang fetch handler hasil build OpenNext, menambah scheduled()
 * supaya Cron Trigger Cloudflare bisa memanggil route cron yang SUDAH ADA
 * lewat HTTP internal (kode route-nya tidak berubah sama sekali), dan
 * menambah lapisan cache edge untuk halaman yang menandai dirinya cacheable.
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

interface ExecutionContextLike {
  waitUntil(promise: Promise<unknown>): void
}

/**
 * Lapisan cache edge untuk GET request yang responsnya sendiri MENGAKU
 * cacheable (lewat header Cache-Control yang membawa `s-maxage`).
 *
 * Kenapa perlu kode ini, bukan cukup header saja: berbeda dari origin
 * biasa, response yang DIHASILKAN Worker sendiri TIDAK otomatis disimpan
 * Cloudflare di edge hanya karena ada Cache-Control — itu cuma instruksi ke
 * BROWSER. Supaya permintaan berikutnya benar-benar dijawab dari edge tanpa
 * menjalankan Worker (tanpa menyentuh Hyperdrive/Prisma sama sekali), harus
 * dipanggil eksplisit lewat Cache API (`caches.default`).
 *
 * `next.config.mjs` (fungsi `headers()`) adalah SATU-SATUNYA tempat yang
 * memutuskan halaman mana yang cacheable dan berapa lama (lihat entri
 * /templates, /blog, /blog/:slug, /sitemap.xml). Di sini TIDAK ada daftar
 * path yang diduplikasi — kode ini murni menghormati apa pun yang sudah
 * diputuskan Next lewat header responsnya. Menambah halaman cacheable baru
 * cukup mengedit next.config.mjs, tidak perlu menyentuh file ini.
 */
async function fetchWithEdgeCache(
  request: Request,
  env: unknown,
  ctx: ExecutionContextLike
): Promise<Response> {
  // cache.put() melempar untuk method selain GET, dan permintaan
  // berbadan/non-idempoten tidak boleh di-cache sama sekali.
  if (request.method !== 'GET') {
    return handler.fetch(request, env, ctx)
  }

  const cache = (caches as unknown as { default: Cache }).default
  const cached = await cache.match(request)
  if (cached) return cached

  const response: Response = await handler.fetch(request, env, ctx)

  const cacheControl = response.headers.get('Cache-Control') ?? ''
  const isCacheable =
    response.status === 200 &&
    cacheControl.includes('s-maxage') &&
    !response.headers.has('Set-Cookie')

  if (isCacheable) {
    // clone() WAJIB: body Response cuma bisa dibaca sekali, dan di sini
    // dibaca dua kali (disimpan ke cache DAN dikembalikan ke pemanggil).
    ctx.waitUntil(cache.put(request, response.clone()))
  }

  return response
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
  fetch: fetchWithEdgeCache,

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
