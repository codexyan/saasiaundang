/**
 * Membuang sisa data uji internal: akun uji dan berkas lagu yang terunggah
 * saat menguji layar Musik pelanggan.
 *
 * Undangan ujinya sendiri sudah dihapus lewat API. Yang tersisa hanya baris
 * akun (password acak yang tidak disimpan di mana pun, jadi tidak bisa
 * dipakai masuk) dan dua berkas mp3 di storage yang sekarang tidak dirujuk
 * undangan mana pun.
 *
 * Pakai:
 *   node scripts/bersihkan-uji.mjs          lihat saja, tidak menghapus
 *   node scripts/bersihkan-uji.mjs hapus    benar benar menghapus
 */
import { readFileSync } from 'node:fs'
import pg from 'pg'

const hapus = process.argv[2] === 'hapus'

const env = readFileSync('.env.local', 'utf8')
const ambil = (k) => {
  const b = env.split('\n').find(l => l.startsWith(k + '='))
  return b ? b.slice(k.length + 1).trim().replace(/^"|"$/g, '') : undefined
}

const dbUrl = ambil('DATABASE_URL')
const sbUrl = ambil('NEXT_PUBLIC_SUPABASE_URL')
const sbKey = ambil('SUPABASE_SERVICE_ROLE_KEY')
if (!dbUrl) { console.error('DATABASE_URL tidak ketemu di .env.local'); process.exit(1) }

const ID_USER = 'uji_user_kanvas'

const c = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } })
await c.connect()

const akun = await c.query('SELECT id, email FROM users WHERE id = $1', [ID_USER])
const undangan = await c.query('SELECT count(*) AS n FROM invitations WHERE user_id = $1', [ID_USER])

console.log('akun uji      :', akun.rows[0] ? akun.rows[0].email : '(sudah tidak ada)')
console.log('undangan milik:', undangan.rows[0].n)

/** Berkas lagu uji dikenali dari awalan namanya, bukan ditebak satu satu. */
let berkasUji = []
if (sbUrl && sbKey) {
  const r = await fetch(`${sbUrl}/storage/v1/object/list/uploads`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${sbKey}`, apikey: sbKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prefix: 'music', limit: 100 }),
  })
  const isi = await r.json()
  if (Array.isArray(isi)) berkasUji = isi.filter(x => x.name.startsWith('uji_user-')).map(x => `music/${x.name}`)
}
console.log('berkas lagu uji:', berkasUji.length ? berkasUji.join(', ') : '(tidak ada)')

if (!hapus) {
  console.log('\nIni baru pratinjau. Jalankan lagi dengan argumen: hapus')
  await c.end()
  process.exit(0)
}

if (Number(undangan.rows[0].n) > 0) {
  console.error('\nDibatalkan: akun uji masih punya undangan. Hapus undangannya dulu.')
  await c.end()
  process.exit(1)
}

const r1 = await c.query('DELETE FROM users WHERE id = $1', [ID_USER])
console.log(`akun uji dihapus: ${r1.rowCount} baris`)

if (berkasUji.length && sbUrl && sbKey) {
  const r2 = await fetch(`${sbUrl}/storage/v1/object/uploads`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${sbKey}`, apikey: sbKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prefixes: berkasUji }),
  })
  console.log(`berkas lagu uji: ${r2.ok ? 'terhapus' : 'gagal, status ' + r2.status}`)
}

const sisaU = await c.query('SELECT count(*) AS n FROM users')
const sisaI = await c.query('SELECT count(*) AS n FROM invitations')
console.log(`sisa di database: ${sisaU.rows[0].n} pengguna, ${sisaI.rows[0].n} undangan`)

await c.end()
process.exit(0)
