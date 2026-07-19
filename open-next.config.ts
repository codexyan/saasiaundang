import { defineCloudflareConfig } from '@opennextjs/cloudflare'

/**
 * Konfigurasi minimal — DISENGAJA.
 *
 * Seluruh page & route di app ini memakai `export const dynamic = 'force-dynamic'`
 * (100 lokasi), jadi tidak ada ISR/SSG yang perlu di-cache. Incremental cache
 * (R2/KV), queue revalidasi (Durable Object), dan tag cache (D1) hanya menambah
 * resource Cloudflare yang tidak terpakai.
 *
 * Kalau nanti ada halaman yang dibuat statis/ISR, barulah tambahkan
 * `incrementalCache` di sini. Lihat https://opennext.js.org/cloudflare/caching
 */
export default defineCloudflareConfig()
