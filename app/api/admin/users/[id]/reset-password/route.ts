import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'
import { getSession } from '@/lib/session-server'
import { isAdmin, getAdminEmail } from '@/lib/auth'
import { users } from '@/lib/db'

export const dynamic = 'force-dynamic'

function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  const bytes = randomBytes(10)
  let password = ''
  for (let i = 0; i < 10; i++) {
    password += chars[bytes[i] % chars.length]
  }
  return password
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
