/**
 * Membersihkan sisa `default_transaction_read_only = on` dari kolam koneksi.
 *
 * Kenapa perlu: skrip pemeriksaan sebelumnya menyetel flag itu supaya tidak
 * mungkin menulis apa pun. Niatnya benar, caranya salah. DATABASE_URL menunjuk
 * pgbouncer dalam mode transaksi, dan `SET` tanpa `RESET` menempel di koneksi
 * SERVER, bukan di klien. Koneksi itu lalu dipinjamkan ke aplikasi, dan setiap
 * UPDATE yang kebetulan mendarat di sana gagal dengan:
 *
 *   PostgresError 25006: cannot execute UPDATE in a read-only transaction
 *
 * Skrip ini membuka sejumlah koneksi berurutan, memeriksa flag-nya, dan
 * mematikannya kalau menyala. Tidak ada satu baris data pun yang disentuh.
 *
 * Pakai: node scripts/perbaiki-readonly.mjs [jumlah]
 */
import { readFileSync } from 'node:fs'
import pg from 'pg'

const jumlah = Number(process.argv[2] || 30)
const env = readFileSync('.env.local', 'utf8')
const baris = env.split('\n').find(l => l.startsWith('DATABASE_URL='))
if (!baris) { console.error('DATABASE_URL tidak ketemu'); process.exit(1) }
const url = baris.slice('DATABASE_URL='.length).trim().replace(/^"|"$/g, '')

let menyala = 0
let diperiksa = 0

for (let i = 0; i < jumlah; i++) {
  const c = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } })
  try {
    await c.connect()
    const sebelum = await c.query(`SELECT current_setting('default_transaction_read_only') AS ro, pg_backend_pid() AS pid`)
    diperiksa++
    if (sebelum.rows[0].ro === 'on') {
      menyala++
      await c.query('SET default_transaction_read_only = off')
      const sesudah = await c.query(`SELECT current_setting('default_transaction_read_only') AS ro`)
      console.log(`pid ${sebelum.rows[0].pid}: on -> ${sesudah.rows[0].ro}`)
    }
  } catch (e) {
    console.log('koneksi gagal:', e.message)
  } finally {
    try { await c.end() } catch { /* sudah tertutup */ }
  }
}

console.log(`diperiksa ${diperiksa} koneksi, yang masih read-only: ${menyala}`)
process.exit(0)
