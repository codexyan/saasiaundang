import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { users } from '@/lib/db'
import { createSessionToken, buildSetCookieHeader } from '@/lib/session'
import { readJsonBody } from '@/lib/request-body'

export const dynamic = 'force-dynamic'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export async function POST(req: NextRequest) {
  const body = await readJsonBody(req)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ada data yang belum sesuai. Coba periksa lagi ya.' }, { status: 400 })
  }

  const { email, password } = parsed.data

  if (await users.findByEmail(email)) {
    return NextResponse.json({ error: 'Email ini sudah punya akun. Silakan masuk, atau pakai email lain.' }, { status: 409 })
  }

  const password_hash = await bcrypt.hash(password, 10)
  const user = await users.create({ email, password_hash, role: 'user' })
  const token = await createSessionToken({ userId: user.id, email: user.email, role: 'user' })

  return NextResponse.json(
    { user: { id: user.id, email: user.email, role: 'user', isAdmin: false } },
    {
      status: 201,
      headers: { 'Set-Cookie': buildSetCookieHeader(token) },
    }
  )
}
