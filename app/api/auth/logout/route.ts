import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function POST() {
  const cookieStore = await cookies()
  cookieStore.set('__ku_session', '', { maxAge: 0, path: '/', httpOnly: true, sameSite: 'lax' })
  cookieStore.set('ref', '', { maxAge: 0, path: '/' })
  return NextResponse.json({ ok: true })
}
