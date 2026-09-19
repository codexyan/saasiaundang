import { readFileSync } from 'node:fs'
import pg from 'pg'
const env = readFileSync('.env.local', 'utf8')
const url = env.split('\n').find(l => l.startsWith('DATABASE_URL=')).slice(13).trim().replace(/^"|"$/g, '')
const c = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } })
await c.connect()
for (const t of ['users']) {
  const r = await c.query(
    `SELECT column_name, data_type, is_nullable, column_default
     FROM information_schema.columns WHERE table_name = $1 AND table_schema = 'public' ORDER BY ordinal_position`, [t])
  console.log('\n### ' + t)
  for (const x of r.rows) console.log(`  ${x.column_name.padEnd(18)} ${x.data_type.padEnd(28)} null=${x.is_nullable} default=${x.column_default ?? '-'}`)
}
await c.end(); process.exit(0)
