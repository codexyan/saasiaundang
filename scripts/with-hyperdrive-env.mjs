/**
 * Menjalankan perintah Cloudflare dengan connection string Hyperdrive lokal terisi.
 *
 * Kenapa perlu: `wrangler deploy` dan `opennextjs-cloudflare preview` sama-sama
 * menyalakan proxy platform lokal (miniflare) untuk membaca binding, dan proxy
 * itu MENOLAK jalan kalau binding Hyperdrive tidak punya connection string
 * lokal — walaupun deploy sendiri tidak pernah memakainya. Gagalnya:
 *   "When developing locally, you should use a local Postgres connection
 *    string to emulate Hyperdrive functionality."
 *
 * Nilai ini HANYA untuk emulasi lokal. Worker yang berjalan di Cloudflare tetap
 * memakai binding HYPERDRIVE sungguhan.
 *
 * Pemakaian:
 *   node scripts/with-hyperdrive-env.mjs wrangler deploy
 *   node scripts/with-hyperdrive-env.mjs opennextjs-cloudflare preview
 */
import { spawnSync } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

const BINDING_ENV = 'CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE'

const KNOWN_BINS = {
  wrangler: ['wrangler', 'bin/wrangler.js'],
  'opennextjs-cloudflare': ['@opennextjs/cloudflare', 'dist/cli/index.js'],
}

function readDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL
  for (const file of ['.env.local', '.env']) {
    if (!existsSync(file)) continue
    const match = readFileSync(file, 'utf8').match(/^DATABASE_URL\s*=\s*"?([^"\r\n]+)"?/m)
    if (match) return match[1].trim()
  }
  return null
}

/**
 * Paket-paket ini tidak mengekspor path bin-nya lewat "exports", jadi
 * require.resolve pada file bin langsung melempar ERR_PACKAGE_PATH_NOT_EXPORTED.
 * Yang bisa di-resolve adalah package.json-nya; path bin disusun dari situ.
 */
function resolveBin(pkg, relative) {
  const require = createRequire(import.meta.url)
  try {
    return join(dirname(require.resolve(`${pkg}/package.json`)), ...relative.split('/'))
  } catch {
    return join(process.cwd(), 'node_modules', ...pkg.split('/'), ...relative.split('/'))
  }
}

const [command, ...args] = process.argv.slice(2)

if (!command || !KNOWN_BINS[command]) {
  console.error(`Perintah tidak dikenal: ${command || '(kosong)'}. Pilihan: ${Object.keys(KNOWN_BINS).join(', ')}`)
  process.exit(1)
}

const databaseUrl = readDatabaseUrl()
if (!databaseUrl) {
  console.error(
    'DATABASE_URL tidak ditemukan (cek environment, .env.local, atau .env).\n' +
    'Hanya dipakai untuk emulasi Hyperdrive; Worker tetap memakai binding HYPERDRIVE.'
  )
  process.exit(1)
}

const binPath = resolveBin(...KNOWN_BINS[command])
if (!existsSync(binPath)) {
  console.error(`Tidak menemukan ${command} di ${binPath}. Jalankan npm install dulu.`)
  process.exit(1)
}

// Dipanggil LANGSUNG dengan node, bukan lewat npx: npx.cmd di Windows butuh
// shell dan bisa gagal tanpa pesan apa pun.
const result = spawnSync(process.execPath, [binPath, ...args], {
  stdio: 'inherit',
  env: { ...process.env, [BINDING_ENV]: databaseUrl },
})

if (result.error) {
  console.error(`Gagal menjalankan ${command}:`, result.error.message)
  process.exit(1)
}

process.exit(result.status ?? 1)
