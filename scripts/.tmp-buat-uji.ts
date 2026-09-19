/**
 * SEMENTARA. Membuat satu akun uji dan satu undangan uji di database
 * produksi, supaya studio pelanggan bisa benar benar dibuka dan diklik.
 * Keduanya dihapus lagi lewat scripts/.tmp-hapus-uji.ts.
 */
import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { users, invitations, templateRecords } from '../lib/db'
import { createSessionToken } from '../lib/session'

const EMAIL = 'uji-internal@iaundang.test'
const SLUG = 'uji-internal-kanvas'

async function main() {
  const aktif = await templateRecords.findActive()
  if (aktif.length === 0) throw new Error('tidak ada tema aktif')

  let user = await users.findByEmail(EMAIL)
  if (user) {
    console.log('akun uji sudah ada:', user.id)
  } else {
    // Password acak yang tidak disimpan di mana pun. Masuknya lewat token
    // yang dicetak di bawah, bukan lewat form login.
    const acak = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
    user = await users.create({ email: EMAIL, password_hash: await bcrypt.hash(acak, 10), role: 'user' })
    console.log('akun uji dibuat:', user.id, user.email)
  }

  const adaSlug = await invitations.findBySlug(SLUG)
  let inv = adaSlug
  if (inv) {
    console.log('undangan uji sudah ada:', inv.id)
  } else {
    const setahun = new Date(); setahun.setDate(setahun.getDate() + 365)
    inv = await invitations.create({
      user_id: user.id,
      slug: SLUG,
      template_id: aktif[0].id,
      data: {
        groom_name: 'Uji',
        bride_name: 'Internal',
        akad: { date: '2026-12-12', time: '08:00', venue_name: 'Tempat Uji', venue_address: 'Alamat uji' },
      } as never,
      package_tier: 'popular',
      is_published: false,
      is_paid: true,
      expires_at: setahun.toISOString(),
      referred_by: null,
    } as never)
    console.log('undangan uji dibuat:', inv.id, inv.slug, 'tema:', aktif[0].name)
  }

  const token = await createSessionToken({ userId: user.id, email: user.email, role: 'user', epoch: 0 })
  console.log('ID_UNDANGAN=' + inv.id)
  console.log('TOKEN_PANJANG=' + token.length)
  const fs = await import('node:fs')
  fs.writeFileSync(process.env.CLAUDE_JOB_DIR + '/tmp/sesi-uji.txt', token, 'utf8')
  console.log('token ditulis ke berkas sementara, tidak dicetak di sini')
}

main().then(() => process.exit(0)).catch(e => { console.error('GAGAL:', e.message); process.exit(1) })
