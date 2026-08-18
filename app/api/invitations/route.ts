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

/**
 * Batas jumlah undangan per akun.
 *
 * B2C: satu akun boleh punya banyak undangan (anak kedua, pesanan untuk
 * saudara, dst). Batas ini bukan aturan bisnis melainkan pagar penyalahgunaan —
 * tanpa batas, satu akun bisa memborong subdomain lewat trial gratis 7 hari
 * secara massal. Jalur berbayar (provisionPaidOrder) sengaja TIDAK tunduk pada
 * batas ini: pesanan yang sudah dibayar tidak boleh gagal disediakan.
 */
const MAX_INVITATIONS_PER_USER = 10

// GET /api/invitations   ambil undangan milik user yang login
export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Sesi kamu sudah berakhir. Silakan masuk lagi ya.' }, { status: 401 })

  const list = await invitations.findManyByUserId(session.userId)
  // `invitation` (tunggal) dipertahankan sebagai kompatibilitas mundur —
  // isinya undangan terbaru. Boleh dihapus setelah tidak ada lagi pemanggil
  // yang membacanya (per hari ini: tidak ada di dalam repo).
  return NextResponse.json({ invitations: list, invitation: list[0] ?? null })
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

  const ownedCount = await invitations.countByUserId(session.userId)
  if (ownedCount >= MAX_INVITATIONS_PER_USER) {
    return NextResponse.json(
      { error: `Satu akun maksimal ${MAX_INVITATIONS_PER_USER} undangan. Hapus undangan lama dulu, atau hubungi kami kalau butuh lebih.` },
      { status: 409 }
    )
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
  // Email "trial dimulai" hanya untuk undangan PERTAMA. Sekarang satu akun bisa
  // membuat sampai MAX_INVITATIONS_PER_USER undangan; mengirim email onboarding
  // yang sama sepuluh kali ke alamat yang sama adalah jalan cepat menuju folder
  // spam — dan reputasi domain pengirim berlaku untuk seluruh pelanggan.
  if (ownedCount === 0) {
    runAfterResponse(
      notifyUser('trial_started', session.email, { slug, name: session.email }),
      'notifyUser(trial_started)'
    )
  }

  return NextResponse.json({ invitation: inv }, { status: 201 })
}
