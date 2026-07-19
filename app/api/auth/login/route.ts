import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { users } from '@/lib/db'
import { createSessionToken, buildSetCookieHeader, type SessionRole } from '@/lib/session'
import { isAdmin, isWriter, getAdminEmail } from '@/lib/auth'
import { readJsonBody } from '@/lib/request-body'

export const dynamic = 'force-dynamic'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(req: NextRequest) {
  const body = await readJsonBody(req)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 })
  }

  const { email, password } = parsed.data
  const user = await users.findByEmail(email)

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return NextResponse.json({ error: 'Email atau password salah' }, { status: 401 })
  }

  const role: SessionRole = (user.role as SessionRole) ?? (user.email === getAdminEmail() ? 'admin' : 'user')

  const token = await createSessionToken({ userId: user.id, email: user.email, role })
  const sessionPayload = { userId: user.id, email: user.email, role }

  return NextResponse.json(
    {
      user: {
        id: user.id,
        email: user.email,
        role,
        isAdmin: isAdmin(sessionPayload),
        isWriter: isWriter(sessionPayload),
      },
    },
    {
      headers: { 'Set-Cookie': buildSetCookieHeader(token) },
    }
  )
}
