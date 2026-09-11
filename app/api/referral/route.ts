import { NextRequest, NextResponse } from 'next/server'
import { affiliates } from '@/lib/db'
import { readJsonBody } from '@/lib/request-body'
import { allowRequest } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

/**
 * Pencatat klik tautan AFILIASI yang dikirim ReferralCapture.
 *
 * Dulu route ini juga punya GET yang membuat kode referral PENGGUNA
 * (users.referral_code) beserta tautan /order?ref=KODE untuk tab Referral di
 * dashboard. Program itu tidak pernah bekerja: /order me-redirect ke
 * /templates dan membuang ?ref, POST di bawah hanya mengenal kode afiliasi
 * sehingga kode pengguna selalu 404, dan tidak ada kode yang mencatat referral
 * atau memberi diskon Rp 15.000 yang dijanjikan panelnya. GET itu dihapus
 * bersama tab dan panelnya. POST dibiarkan apa adanya karena cookie `ref` yang
 * dipasangnya dibaca /api/orders untuk atribusi komisi afiliasi.
 */
export async function POST(req: NextRequest) {
  const { code } = await readJsonBody(req)
  if (!code) return NextResponse.json({ error: 'Kode referralnya belum diisi.' }, { status: 400 })

  const affiliate = await affiliates.findByCode(code)
  if (!affiliate || !affiliate.isActive) {
    return NextResponse.json({ error: 'Kode referralnya tidak dikenali.' }, { status: 404 })
  }

  // Yang dibatasi HANYA penghitung kliknya, bukan seluruh request.
  //
  // Endpoint ini punya dua efek: menaikkan totalClicks (metrik, bisa
  // dipalsukan) dan memasang cookie atribusi 30 hari (uang — inilah yang
  // menentukan komisi afiliator dibayar atau tidak). Kalau seluruh request
  // ditolak saat limit tercapai, pengunjung yang SAH kehilangan atribusinya
  // dan afiliator kehilangan komisi sungguhan — kerugiannya lebih besar
  // daripada angka klik yang sedikit menggelembung. Jadi cookie selalu
  // dipasang, hanya penghitungnya yang berhenti naik.
  if (await allowRequest('COUNTER_RATE_LIMIT', `referral-click:${code}`)) {
    await affiliates.incrementClicks(affiliate.id)
  }

  const res = NextResponse.json({ ok: true, affiliateId: affiliate.id })
  res.cookies.set('ref', code, { maxAge: 60 * 60 * 24 * 30, path: '/', httpOnly: true, sameSite: 'lax' })
  return res
}
