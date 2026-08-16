import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { getSession } from '@/lib/session-server'
import { invitations, templateRecords } from '@/lib/db'
import { subscriptions } from '@/lib/subscription'
import { notifyUser } from '@/lib/notifications'
import { runAfterResponse } from '@/lib/after-response'
import { LEGACY_TEMPLATE_IDS } from '@/lib/types'
import type { InvitationData } from '@/lib/types'
import { readJsonBody } from '@/lib/request-body'

export const dynamic = 'force-dynamic'

const schema = z.object({
  slug: z.string().min(3).max(30).regex(/^[a-z0-9-]+$/, 'Hanya huruf kecil, angka, dan tanda hubung'),
  template_id: z.string().min(1),
  data: z.record(z.unknown()).optional().default({}),
})

// GET /api/invitations   ambil undangan milik user yang login
export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Sesi kamu sudah berakhir. Silakan masuk lagi ya.' }, { status: 401 })

  const inv = await invitations.findByUserId(session.userId)
  return NextResponse.json({ invitation: inv })
}

// POST /api/invitations   buat undangan baru
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Sesi kamu sudah berakhir. Silakan masuk lagi ya.' }, { status: 401 })

  const body = await readJsonBody(req)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ada data yang belum sesuai. Coba periksa lagi ya.', details: parsed.error.flatten() }, { status: 400 })
  }

  const { slug, template_id, data } = parsed.data

  // Validate template exists (legacy or new)
  const isLegacy = (LEGACY_TEMPLATE_IDS as string[]).includes(template_id)
  const isNewTemplate = !isLegacy && !!(await templateRecords.findById(template_id))
  if (!isLegacy && !isNewTemplate) {
    return NextResponse.json({ error: 'Desain undangan ini sudah tidak tersedia. Silakan pilih yang lain.' }, { status: 400 })
  }

  if (await invitations.findByUserId(session.userId)) {
    return NextResponse.json({ error: 'Kalian sudah punya undangan. Buka dari halaman utama untuk mengeditnya.' }, { status: 409 })
  }

  if (await invitations.slugExists(slug)) {
    return NextResponse.json({ error: 'Alamat undangan ini sudah dipakai. Coba nama lain ya.' }, { status: 409 })
  }

  const cookieStore = await cookies()
  const referralCode = cookieStore.get('ref')?.value || null

  const trialExpiresAt = new Date()
  trialExpiresAt.setDate(trialExpiresAt.getDate() + 7)

  const inv = await invitations.create({
    user_id: session.userId,
    slug,
    template_id,
    data: data as unknown as InvitationData,
    is_published: false,
    is_paid: false,
    expires_at: trialExpiresAt.toISOString(),
    referred_by: referralCode,
  })

  await subscriptions.createTrial(inv.id, session.userId)
  runAfterResponse(
    notifyUser('trial_started', session.email, { slug, name: session.email }),
    'notifyUser(trial_started)'
  )

  return NextResponse.json({ invitation: inv }, { status: 201 })
}
