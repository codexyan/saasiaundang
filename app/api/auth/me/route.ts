import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session-server'
import { isAdmin, isWriter } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  // 200 dengan user null, bukan 401. Belum masuk bukan kesalahan, dan 401 di
  // sini muncul sebagai error merah di konsol setiap pengunjung anonim.
  // Pemanggil membedakannya lewat `user`, bukan lewat status.
  if (!session) {
    return NextResponse.json({ user: null })
  }
  return NextResponse.json({
    user: {
      id: session.userId,
      email: session.email,
      role: session.role ?? (isAdmin(session) ? 'admin' : 'user'),
      isAdmin: isAdmin(session),
      isWriter: isWriter(session),
    },
  })
}
