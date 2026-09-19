/**
 * Mengganti em dash dan en dash di deskripsi tema dengan koma.
 *
 * Kenapa perlu: aturan rumah (antislop R-02) melarang em dash di teks yang
 * dilihat orang. Dua halaman publik sudah menggantinya saat merender
 * (components/landing/TemplatePreview.tsx dan halaman detail tema), jadi
 * pengunjung tidak pernah melihatnya. Tapi penggantian saat render hanya
 * menutupi: sumber teksnya masih em dash, dan setiap tempat baru yang
 * menampilkan deskripsi harus ingat menambahkan penggantian yang sama.
 * Memperbaiki sumbernya membuat penambal itu tidak lagi dibutuhkan.
 *
 * Hasil pindaian 19 September 2026: hanya SATU kemunculan di seluruh
 * database, yaitu deskripsi Javanese Gold. Tidak ada di config, draft_config,
 * maupun app_settings.
 *
 * Pakai:
 *   node scripts/rapikan-emdash.mjs            lihat saja, tidak menulis
 *   node scripts/rapikan-emdash.mjs terapkan   menulis perubahannya
 */
import { readFileSync } from 'node:fs'
import pg from 'pg'

const terapkan = process.argv[2] === 'terapkan'

const env = readFileSync('.env.local', 'utf8')
const baris = env.split('\n').find(l => l.startsWith('DATABASE_URL='))
if (!baris) { console.error('DATABASE_URL tidak ketemu di .env.local'); process.exit(1) }
const url = baris.slice('DATABASE_URL='.length).trim().replace(/^"|"$/g, '')

/** Em dash dan en dash, beserta spasi di sekitarnya, jadi koma plus satu spasi. */
function rapikan(teks) {
  return (teks ?? '').replace(/\s*[—–]\s*/g, ', ')
}

const c = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } })
await c.connect()

const r = await c.query('SELECT id, name, description FROM template_records ORDER BY sort_order')
const perlu = r.rows.filter(x => /[—–]/.test(x.description ?? ''))

if (perlu.length === 0) {
  console.log('Tidak ada em dash di deskripsi tema. Tidak ada yang perlu diubah.')
  await c.end()
  process.exit(0)
}

console.log(`${perlu.length} deskripsi memuat em dash:\n`)
for (const x of perlu) {
  console.log(`  ${x.name}`)
  console.log(`    sebelum : ${x.description}`)
  console.log(`    sesudah : ${rapikan(x.description)}\n`)
}

if (!terapkan) {
  console.log('Ini baru pratinjau. Jalankan lagi dengan: node scripts/rapikan-emdash.mjs terapkan')
  await c.end()
  process.exit(0)
}

for (const x of perlu) {
  await c.query('UPDATE template_records SET description = $1 WHERE id = $2', [rapikan(x.description), x.id])
  console.log(`diperbarui: ${x.name}`)
}

const cek = await c.query('SELECT count(*) AS sisa FROM template_records WHERE description ~ $1', ['[—–]'])
console.log(`sisa deskripsi yang masih memuat em dash: ${cek.rows[0].sisa}`)

await c.end()
process.exit(0)
