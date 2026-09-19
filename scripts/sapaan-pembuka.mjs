/**
 * Menyamakan teks sampul ketiga tema di DATABASE dengan yang ada di
 * lib/template-configs/*.ts.
 *
 * Kenapa perlu skrip terpisah: lib/db/templates.ts memakai baris database
 * KALAU ADA, dan baru jatuh ke konfigurasi bawaan kalau tidak ada. Ketiga
 * tema sudah ada barisnya di produksi, jadi mengubah berkas TS saja tidak
 * mengubah apa pun yang dilihat tamu. Berkas TS itu hanya cetakan awal.
 *
 * Yang disentuh HANYA yang masih berbahasa Inggris: `subtitle` di ketiga
 * tema, dan `button_text` di Midnight Luxe.
 *
 * `invitation_text` sengaja TIDAK disentuh. Ketiganya sudah berbahasa
 * Indonesia, dan baris Javanese Gold di database ternyata sudah berbeda dari
 * konfigurasi di kode ("Dengan penuh kebahagiaan, kami mengundang kehadiran
 * Bapak/Ibu/Saudara/i"), yang berarti ada yang pernah menyuntingnya lewat
 * panel admin. Menimpanya berarti membuang suntingan orang tanpa diminta.
 *
 * Pakai:
 *   node scripts/sapaan-pembuka.mjs            lihat saja, tidak menulis
 *   node scripts/sapaan-pembuka.mjs terapkan   menulis perubahannya
 */
import { readFileSync } from 'node:fs'
import pg from 'pg'

const terapkan = process.argv[2] === 'terapkan'

const env = readFileSync('.env.local', 'utf8')
const baris = env.split('\n').find(l => l.startsWith('DATABASE_URL='))
if (!baris) { console.error('DATABASE_URL tidak ketemu di .env.local'); process.exit(1) }
const url = baris.slice('DATABASE_URL='.length).trim().replace(/^"|"$/g, '')

/** Sama persis dengan lib/template-configs/*.ts. Kalau salah satu berubah,
 *  yang satunya harus ikut, dan itu sengaja dibuat terlihat di satu layar. */
const TEKS = {
  'rose-garden':   { subtitle: 'Assalamualaikum Warahmatullahi Wabarakatuh' },
  'javanese-gold': { subtitle: 'Assalamualaikum Warahmatullahi Wabarakatuh' },
  'midnight-luxe': { subtitle: 'Salam sejahtera untuk kita semua', button_text: 'Buka Undangan' },
}

const c = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } })
await c.connect()

const r = await c.query('SELECT id, name, config FROM template_records ORDER BY sort_order')
let perlu = 0

for (const row of r.rows) {
  const mau = TEKS[row.id]
  if (!mau) { console.log(`${row.name}: bukan tema bawaan, dilewati`); continue }

  const kini = row.config?.opening ?? {}
  const beda = Object.keys(mau).filter(k => kini[k] !== mau[k])

  console.log(`\n${row.name}`)
  if (beda.length === 0) { console.log('  sudah sama, tidak ada yang diubah'); continue }
  perlu++
  for (const k of beda) {
    console.log(`  ${k}`)
    console.log(`    sebelum : ${kini[k] ?? '(kosong)'}`)
    console.log(`    sesudah : ${mau[k]}`)
  }

  if (!terapkan) continue

  const config = { ...row.config, opening: { ...kini, ...mau } }
  await c.query('UPDATE template_records SET config = $1::jsonb, updated_at = now() WHERE id = $2',
    [JSON.stringify(config), row.id])
  console.log('  ditulis')
}

if (!terapkan && perlu > 0) {
  console.log('\nIni baru pratinjau. Jalankan lagi dengan: node scripts/sapaan-pembuka.mjs terapkan')
}
if (perlu === 0) {
  console.log('\nSemua tema sudah sama dengan konfigurasi di kode.')
}

await c.end()
process.exit(0)
