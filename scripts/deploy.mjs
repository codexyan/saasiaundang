/**
 * Pembungkus `wrangler deploy`.
 *
 * Kenapa perlu: perkakas deploy menyalakan proxy platform lokal (miniflare)
 * untuk membaca binding, dan proxy itu MENUNTUT connection string Postgres
 * lokal untuk mengemulasi Hyperdrive — walaupun proses deploy sendiri tidak
 * pernah memakainya. Tanpa itu deploy berhenti dengan:
 *   "When developing locally, you should use a local Postgres connection
 *    string to emulate Hyperdrive functionality."
 *
 * Jadi di sini DATABASE_URL diambil dari environment (CI) atau dari .env.local
 * (mesin lokal), lalu diteruskan dengan nama yang diharapkan wrangler.
 */
import { spawnSync } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

const BINDING_ENV = 'CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE'

function readDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL

  for (const file of ['.env.local', '.env']) {
    if (!existsSync(file)) continue
    const match = readFileSync(file, 'utf8').match(/^DATABASE_URL\s*=\s*"?([^"\r\n]+)"?/m)
    if (match) return match[1].trim()
  }
  return null
}

const databaseUrl = readDatabaseUrl()

if (!databaseUrl) {
  console.error(
    'DATABASE_URL tidak ditemukan (cek environment, .env.local, atau .env).\n' +
    'Nilai ini hanya dipakai untuk memuaskan emulasi Hyperdrive saat deploy; ' +
    'Worker yang berjalan tetap memakai binding HYPERDRIVE.'
  )
  process.exit(1)
}

// Menjalankan entry wrangler LANGSUNG dengan node, bukan lewat `npx`.
// `npx`/`npx.cmd` di Windows perlu shell dan bisa gagal tanpa pesan apa pun.
//
// Path bin-nya tidak bisa di-resolve langsung: peta "exports" milik wrangler
// tidak memuat ./bin/*, jadi resolve('wrangler/bin/wrangler.js') melempar
// ERR_PACKAGE_PATH_NOT_EXPORTED. Yang bisa di-resolve adalah package.json-nya,
// lalu path bin disusun relatif terhadap itu.
function resolveWranglerBin() {
  const require = createRequire(import.meta.url)
  try {
    const pkgPath = require.resolve('wrangler/package.json')
    return join(dirname(pkgPath), 'bin', 'wrangler.js')
  } catch {
    return join(process.cwd(), 'node_modules', 'wrangler', 'bin', 'wrangler.js')
  }
}

const wranglerBin = resolveWranglerBin()

if (!existsSync(wranglerBin)) {
  console.error(`Tidak menemukan wrangler di ${wranglerBin}. Jalankan npm install dulu.`)
  process.exit(1)
}

const result = spawnSync(
  process.execPath,
  [wranglerBin, 'deploy', ...process.argv.slice(2)],
  {
    stdio: 'inherit',
    env: { ...process.env, [BINDING_ENV]: databaseUrl },
  }
)

if (result.error) {
  console.error('Gagal menjalankan wrangler:', result.error.message)
  process.exit(1)
}

process.exit(result.status ?? 1)
