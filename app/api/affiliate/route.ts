import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/session-server'
import { isAffiliate } from '@/lib/auth'
import { affiliates, referrals, affiliateWithdrawals } from '@/lib/db'
import { readJsonBody } from '@/lib/request-body'

export const dynamic = 'force-dynamic'

/**
 * Ini TUJUAN PENCAIRAN UANG afiliator, tapi dulu ditulis ke database tanpa
 * pemeriksaan tipe maupun batas panjang: `body.bankName || ''` meloloskan
 * objek/array (Prisma lalu melempar -> 500), dan tidak ada yang mencegah
 * nama rekening sepanjang megabyte tersimpan.
 *
 * Ketiganya `.optional()` supaya penjaga `bankName !== undefined` di bawah
 * tetap berperilaku persis sama: body tanpa bankName tetap dibalas ok tanpa
 * menulis apa pun, bukan berubah jadi 400.
 */
const bankSchema = z.object({
  bankName: z.string().max(100).optional(),
  accountNo: z.string().max(50).optional(),
  accountName: z.string().max(100).optional(),
})

export async function GET() {
  const session = await getSession()
  if (!isAffiliate(session)) return NextResponse.json({ error: 'Sesi kamu sudah berakhir. Silakan masuk lagi ya.' }, { status: 401 })

  const affiliate = await affiliates.findByUserId(session!.userId)
  if (!affiliate) return NextResponse.json({ affiliate: null, referrals: [], withdrawals: [] })

  const [refs, withdraws] = await Promise.all([
    referrals.findByAffiliateId(affiliate.id),
    affiliateWithdrawals.findByAffiliateId(affiliate.id),
  ])

  return NextResponse.json({ affiliate, referrals: refs, withdrawals: withdraws })
}

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!isAffiliate(session)) return NextResponse.json({ error: 'Sesi kamu sudah berakhir. Silakan masuk lagi ya.' }, { status: 401 })

  const affiliate = await affiliates.findByUserId(session!.userId)
  if (!affiliate) return NextResponse.json({ error: 'Akun ini belum terdaftar sebagai mitra afiliasi.' }, { status: 404 })

  const body = await readJsonBody(req)
  const parsed = bankSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Data rekeningnya belum sesuai. Coba periksa lagi ya.' }, { status: 400 })
  }

  if (parsed.data.bankName !== undefined) {
    await affiliates.updateBank(affiliate.id, {
      bankName: parsed.data.bankName || '',
      accountNo: parsed.data.accountNo || '',
      accountName: parsed.data.accountName || '',
    })
  }

  return NextResponse.json({ ok: true })
}
