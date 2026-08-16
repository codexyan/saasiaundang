import { NextRequest, NextResponse } from 'next/server'
import { getSession } from './session-server'
import { isAdmin } from './auth'
import type { SessionPayload } from './session'

/**
 * Membungkus route handler admin: cek sesi + role sekali di sini, bukan
 * diulang identik di 38 file (getSession() lalu isAdmin(session) lalu
 * NextResponse.json 401 kalau gagal — dulu disalin persis di setiap handler).
 */
export function withAdminAuth<P = unknown>(
  handler: (req: NextRequest, session: SessionPayload, props: P) => Promise<NextResponse>
) {
  return async (req: NextRequest, props: P) => {
    const session = await getSession()
    if (!session || !isAdmin(session)) {
      return NextResponse.json({ error: 'Sesi kamu sudah berakhir. Silakan masuk lagi ya.' }, { status: 401 })
    }
    return handler(req, session, props)
  }
}
