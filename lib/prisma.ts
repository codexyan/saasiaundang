/**
 * Prisma client — kompatibel Cloudflare Workers DAN Node.
 *
 * Kenapa tidak singleton biasa lagi:
 * Workers melarang objek I/O (socket TCP) dipakai lintas request. Satu
 * PrismaClient yang di-cache di module scope akan melempar
 * "Cannot perform I/O on behalf of a different request" pada request KEDUA.
 * Jadi di Workers client dibuat PER REQUEST, dikunci ke ExecutionContext lewat
 * WeakMap supaya ikut ter-GC begitu request selesai.
 *
 * Di Node (next dev, scripts/*.ts via tsx) tetap satu singleton per proses
 * seperti perilaku lama.
 *
 * Export `prisma` sengaja berupa Proxy supaya seluruh call site
 * `prisma.<model>.<op>()` di lib/db.ts dkk tidak perlu diubah sama sekali.
 */
// Sengaja menunjuk '.prisma/client/wasm', BUKAN '@prisma/client'.
//
// Kenapa: '@prisma/client' berujung ke peta export bersyarat `#main-entry-point`
// yang urutannya { node -> index.js, edge-light -> wasm.js, workerd -> wasm.js }.
// esbuild milik OpenNext memang menambahkan kondisi "workerd", TAPI juga
// memakai platform "node" — dan resolusi export bersyarat memilih kunci
// PERTAMA yang cocok sesuai urutan di package.json. "node" ada di urutan
// pertama, jadi selalu menang dan yang terpilih adalah build engine biner.
// Hasilnya saat runtime: "Could not locate the Query Engine for runtime
// debian-openssl-1.1.x" — padahal build dan deploy sukses tanpa keluhan.
//
// Export "./wasm" TIDAK bersyarat, jadi menunjuknya langsung melewati seluruh
// persoalan urutan kondisi itu.
//
// Build WASM ini TIDAK bisa dimuat Node biasa (Node menolak import .wasm:
// "Unknown file extension"). Karena itu next.config.mjs mengalihkannya kembali
// ke '@prisma/client' saat `next dev`, dan scripts/*.ts tetap memakai
// '@prisma/client' langsung. Jadi: Workers -> WASM, Node -> engine biner.
import { PrismaClient } from '.prisma/client/wasm'
import { PrismaPg } from '@prisma/adapter-pg'
import { getCloudflareContext } from '@opennextjs/cloudflare'

/** Bentuk minimal binding Hyperdrive yang kita pakai. */
interface HyperdriveBinding {
  connectionString: string
}

interface CloudflareRuntime {
  env: Record<string, unknown> | undefined
  ctx: object | undefined
}

/**
 * Melempar di luar Workers (mis. `tsx scripts/seed-admin.ts`), jadi selalu
 * dibungkus try/catch dan jatuh ke jalur Node.
 */
function cloudflareRuntime(): CloudflareRuntime | null {
  try {
    return getCloudflareContext() as unknown as CloudflareRuntime
  } catch {
    return null
  }
}

function connectionString(env: Record<string, unknown> | undefined): string {
  const hyperdrive = env?.HYPERDRIVE as HyperdriveBinding | undefined
  if (hyperdrive?.connectionString) return hyperdrive.connectionString

  const direct = process.env.DATABASE_URL
  if (direct) return direct

  throw new Error(
    'Database tidak terkonfigurasi: binding HYPERDRIVE tidak ada dan DATABASE_URL kosong.'
  )
}

function createClient(env: Record<string, unknown> | undefined): PrismaClient {
  return new PrismaClient({
    // Workers: maksimal 6 koneksi bersamaan per invocation — sisakan headroom.
    adapter: new PrismaPg({ connectionString: connectionString(env), max: 5 }),
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

/** Jalur Node: satu instance per proses. */
const globalForPrisma = globalThis as unknown as { __iaundangPrisma?: PrismaClient }

/** Jalur Workers: satu instance per request, dikunci ke ExecutionContext. */
const perRequestClients = new WeakMap<object, PrismaClient>()

function resolveClient(): PrismaClient {
  const runtime = cloudflareRuntime()

  if (runtime?.ctx) {
    let client = perRequestClients.get(runtime.ctx)
    if (!client) {
      client = createClient(runtime.env)
      perRequestClients.set(runtime.ctx, client)
    }
    return client
  }

  if (!globalForPrisma.__iaundangPrisma) {
    globalForPrisma.__iaundangPrisma = createClient(runtime?.env)
  }
  return globalForPrisma.__iaundangPrisma
}

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = resolveClient()
    const value = (client as unknown as Record<string | symbol, unknown>)[property]
    return typeof value === 'function' ? value.bind(client) : value
  },
})
