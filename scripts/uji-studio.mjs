/**
 * Membuat, memeriksa, atau menghapus SATU akun uji dan SATU undangan uji di
 * database yang ditunjuk .env.local.
 *
 * Kenapa ada: studio pelanggan tidak bisa dibuka sama sekali selama belum ada
 * undangan. Tanpa satu baris uji, seluruh layar milik pembeli (Warna, Huruf,
 * Hiasan) hanya bisa dipastikan lewat type check, bukan lewat klik.
 *
 * Yang ditulis, tidak lebih dari ini:
 *
 *   users        1 baris, email uji-internal@iaundang.test, role user
 *   invitations  1 baris, slug uji-internal-kanvas, paket popular,
 *                is_published false, is_paid true
 *
 * Password akun itu acak dan tidak disimpan di mana pun, jadi tidak ada yang
 * bisa masuk lewat form login. Masuknya memakai token sesi yang dicetak
 * perintah ini ke berkas, bukan ke layar.
 *
 * Pakai:
 *   node scripts/uji-studio.mjs buat
 *   node scripts/uji-studio.mjs cek
 *   node scripts/uji-studio.mjs hapus
 *   node scripts/uji-studio.mjs paket starter|popular|eksklusif
 */
import { readFileSync, writeFileSync } from 'node:fs'
import pg from 'pg'
import bcrypt from 'bcryptjs'
import { SignJWT } from 'jose'

const EMAIL = 'uji-internal@iaundang.test'
const SLUG = 'uji-internal-kanvas'
const ID_USER = 'uji_user_kanvas'
const ID_INV = 'uji_inv_kanvas'

const perintah = process.argv[2]
if (!['buat', 'cek', 'hapus', 'paket'].includes(perintah)) {
  console.error('Pakai: node scripts/uji-studio.mjs buat|cek|hapus|paket <tier>')
  process.exit(1)
}

const paketBaru = process.argv[3]
if (perintah === 'paket' && !['starter', 'popular', 'eksklusif'].includes(paketBaru)) {
  console.error('Pakai: node scripts/uji-studio.mjs paket starter|popular|eksklusif')
  process.exit(1)
}

const env = readFileSync('.env.local', 'utf8')
const ambil = (k) => {
  const baris = env.split('\n').find(l => l.startsWith(k + '='))
  return baris ? baris.slice(k.length + 1).trim().replace(/^"|"$/g, '') : undefined
}

const url = ambil('DATABASE_URL')
const rahasia = ambil('SESSION_SECRET') || ambil('JWT_SECRET')
if (!url) { console.error('DATABASE_URL tidak ketemu di .env.local'); process.exit(1) }

const c = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } })
await c.connect()

async function cek() {
  const r = await c.query(
    `SELECT i.id, i.slug, i.package_tier, i.is_published, i.is_paid, i.template_id, u.email
       FROM invitations i JOIN users u ON u.id = i.user_id
      WHERE i.id = $1`, [ID_INV])
  if (r.rows.length === 0) { console.log('baris uji: belum ada'); return null }
  console.log('baris uji:', JSON.stringify(r.rows[0]))
  return r.rows[0]
}

if (perintah === 'paket') {
  // Mengganti paket undangan uji supaya keadaan terkunci bisa dilihat
  // sungguhan: gaya pembuka dasar, menu Analitik terkunci, unggah musik
  // tertutup. Hanya menyentuh baris uji, tidak menyentuh data lain.
  const r = await c.query('UPDATE invitations SET package_tier = $1 WHERE id = $2', [paketBaru, ID_INV])
  console.log(r.rowCount === 1 ? `paket undangan uji jadi ${paketBaru}` : 'baris uji tidak ketemu')
  await cek()
  await c.end()
  process.exit(0)
}

if (perintah === 'cek') {
  await cek()
  await c.end()
  process.exit(0)
}

if (perintah === 'hapus') {
  // Berkas yang sempat diunggah saat menguji ikut dibuang, kalau ada. Baris
  // database saja tidak cukup: lagunya hidup di storage, bukan di tabel.
  const sebelum = await c.query(`SELECT data->>'music_url' AS lagu FROM invitations WHERE id = $1`, [ID_INV])
  const lagu = sebelum.rows[0]?.lagu

  const inv = await c.query('DELETE FROM invitations WHERE id = $1', [ID_INV])
  const usr = await c.query('DELETE FROM users WHERE id = $1', [ID_USER])
  console.log(`dihapus: ${inv.rowCount} undangan, ${usr.rowCount} akun`)

  if (lagu && lagu.includes('/storage/v1/object/public/uploads/')) {
    const jalur = lagu.split('/storage/v1/object/public/uploads/')[1]
    const supabaseUrl = ambil('NEXT_PUBLIC_SUPABASE_URL')
    const serviceKey = ambil('SUPABASE_SERVICE_ROLE_KEY')
    if (supabaseUrl && serviceKey && jalur) {
      const res = await fetch(`${supabaseUrl}/storage/v1/object/uploads/${jalur}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey },
      })
      console.log(`berkas lagu uji (${jalur}): ${res.ok ? 'terhapus' : 'gagal dihapus, ' + res.status}`)
    } else {
      console.log('berkas lagu uji tidak dihapus: kunci Supabase tidak lengkap di .env.local')
      console.log('  jalurnya:', jalur)
    }
  }

  await c.end()
  process.exit(0)
}

// buat
const tema = await c.query(
  `SELECT id, name FROM template_records WHERE status = 'active' ORDER BY sort_order LIMIT 1`)
if (tema.rows.length === 0) { console.error('tidak ada tema aktif'); await c.end(); process.exit(1) }

const acak = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
const hash = await bcrypt.hash(acak, 10)

await c.query(
  `INSERT INTO users (id, email, password_hash, role, session_epoch)
        VALUES ($1, $2, $3, 'user', 0)
   ON CONFLICT (id) DO NOTHING`,
  [ID_USER, EMAIL, hash])

const setahun = new Date()
setahun.setDate(setahun.getDate() + 365)
const data = {
  groom_name: 'Uji',
  bride_name: 'Internal',
  akad: { date: '2026-12-12', time: '08:00', venue_name: 'Tempat Uji', venue_address: 'Alamat uji' },
}

await c.query(
  `INSERT INTO invitations (id, user_id, slug, template_id, data, package_tier,
                            is_published, is_paid, expires_at)
        VALUES ($1, $2, $3, $4, $5::jsonb, 'popular', false, true, $6)
   ON CONFLICT (id) DO NOTHING`,
  [ID_INV, ID_USER, SLUG, tema.rows[0].id, JSON.stringify(data), setahun])

const baris = await cek()
console.log('tema dipakai:', tema.rows[0].name)

if (rahasia && baris) {
  const token = await new SignJWT({ userId: ID_USER, email: EMAIL, role: 'user', epoch: 0 })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('2d')
    .sign(new TextEncoder().encode(rahasia))
  const tujuan = (process.env.CLAUDE_JOB_DIR || '.') + '/tmp/sesi-uji.txt'
  writeFileSync(tujuan, token, 'utf8')
  console.log('token sesi ditulis ke berkas, berlaku 2 hari, tidak dicetak di layar')
} else {
  console.log('SESSION_SECRET tidak ketemu, token tidak dibuat')
}

await c.end()
process.exit(0)
