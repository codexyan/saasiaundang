import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getSession } from '@/lib/session-server'
import { isAdmin, getAdminEmail } from '@/lib/auth'
import { users } from '@/lib/db'
import { randomString } from '@/lib/random'

export const dynamic = 'force-dynamic'

// Tanpa karakter yang mudah tertukar (0/O, 1/l/I) karena password ini
// dibacakan/disalin manual oleh admin.
const PASSWORD_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'

function generatePassword(): string {
  return randomString(10, PASSWORD_ALPHABET)
}

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await getSession()
  if (!isAdmin(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const target = await users.findById(params.id)
    if (!target) return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })

    if (target.email === getAdminEmail()) {
      return NextResponse.json({ error: 'Gunakan menu profil untuk mengubah password admin' }, { status: 403 })
    }

    const newPassword = generatePassword()
    const hash = await bcrypt.hash(newPassword, 10)
    await users.updatePassword(params.id, hash)

    return NextResponse.json({ ok: true, password: newPassword, email: target.email })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json({ error: 'Gagal reset password' }, { status: 500 })
  }
}
