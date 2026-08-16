import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session-server'
import { isWriter, isAdmin } from '@/lib/auth'
import { writerProfiles } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Writer's own profile — mainly used by the editor to know whether this
// writer is trusted (can publish directly) or must go through review.
// Admins are always treated as trusted regardless of a WriterProfile row.
export async function GET() {
  const session = await getSession()
  if (!isWriter(session)) {
    return NextResponse.json({ error: 'Sesi kamu sudah berakhir. Silakan masuk lagi ya.' }, { status: 401 })
  }
  if (isAdmin(session)) {
    return NextResponse.json({ profile: { isTrusted: true, bio: '', avatarUrl: '', socialLinks: {} } })
  }
  const profile = await writerProfiles.findByUserId(session!.userId)
  return NextResponse.json({
    profile: profile ?? { isTrusted: false, bio: '', avatarUrl: '', socialLinks: {} },
  })
}
