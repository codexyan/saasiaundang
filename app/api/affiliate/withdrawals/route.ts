import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session-server'
import { isAffiliate } from '@/lib/auth'
import { affiliates, affiliateWithdrawals } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!isAffiliate(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const affiliate = await affiliates.findByUserId(session!.userId)
    if (!affiliate) return NextResponse.json({ error: 'Not an affiliate' }, { status: 404 })

    const body = await req.json()
    const amount = Number(body.amount)

    if (!amount || amount < 50000) {
      return NextResponse.json({ error: 'Minimum pencairan Rp 50.000' }, { status: 400 })
    }
    // Dibandingkan dengan saldo TERSEDIA (pendingBalance dikurangi permintaan
    // yang masih menunggu), bukan pendingBalance mentah. Kalau memakai
    // pendingBalance, sepuluh permintaan berturut-turut sebesar seluruh saldo
    // semuanya lolos karena tidak ada satupun yang mengurangi saldo.
    const available = await affiliateWithdrawals.availableBalance(affiliate.id)
    if (amount > available) {
      return NextResponse.json(
        { error: `Saldo tidak cukup. Tersedia Rp ${available.toLocaleString('id-ID')} (permintaan yang masih diproses sudah dipotong).` },
        { status: 400 }
      )
    }
    if (!affiliate.bankName || !affiliate.accountNo) {
      return NextResponse.json({ error: 'Lengkapi data bank terlebih dahulu' }, { status: 400 })
    }

    const withdrawal = await affiliateWithdrawals.create({
      affiliateId: affiliate.id,
      amount,
      bankName: affiliate.bankName,
      accountNo: affiliate.accountNo,
      accountName: affiliate.accountName,
    })

    return NextResponse.json({ withdrawal }, { status: 201 })
  } catch (error) {
    console.error('Withdrawal error:', error)
    return NextResponse.json({ error: 'Gagal memproses pencairan' }, { status: 500 })
  }
}
