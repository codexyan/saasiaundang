import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getSession } from '@/lib/session-server'
import { isAdmin } from '@/lib/auth'
import { affiliates, referrals, affiliateWithdrawals, users } from '@/lib/db'
import { readJsonBody } from '@/lib/request-body'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (!isAdmin(session)) return NextResponse.json({ error: 'Sesi kamu sudah berakhir. Silakan masuk lagi ya.' }, { status: 401 })

  try {
    const [allAffiliates, allReferrals, allWithdrawals] = await Promise.all([
      affiliates.findAll(),
      referrals.findAll(),
      affiliateWithdrawals.findAll(),
    ])

    return NextResponse.json({ affiliates: allAffiliates, referrals: allReferrals, withdrawals: allWithdrawals })
  } catch (error) {
    console.error('Affiliates GET error:', error)
    return NextResponse.json({ error: 'Gagal memuat data affiliate' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!isAdmin(session)) return NextResponse.json({ error: 'Sesi kamu sudah berakhir. Silakan masuk lagi ya.' }, { status: 401 })

  try {
    const body = await readJsonBody(req)
    const { userId, email, password, name } = body

    let targetUserId = userId

    if (!targetUserId && email) {
      if (!password || password.length < 6) {
        return NextResponse.json({ error: 'Passwordnya minimal 6 karakter ya.' }, { status: 400 })
      }

      const existingUser = await users.findByEmail(email)
      if (existingUser) {
        return NextResponse.json({ error: 'Email ini sudah punya akun. Silakan masuk, atau pakai email lain.' }, { status: 409 })
      }

      const passwordHash = await bcrypt.hash(password, 10)
      const newUser = await users.create({ email, password_hash: passwordHash, role: 'affiliate' })
      targetUserId = newUser.id
    }

    if (!targetUserId) return NextResponse.json({ error: 'userId atau email wajib' }, { status: 400 })

    const user = await users.findById(targetUserId)
    if (!user) return NextResponse.json({ error: 'Akunnya tidak ditemukan.' }, { status: 404 })

    const existing = await affiliates.findByUserId(targetUserId)
    if (existing) return NextResponse.json({ error: 'User sudah jadi affiliate' }, { status: 409 })

    const codeName = (name || email || user.email).split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '')
    const code = codeName + Math.random().toString(36).slice(2, 6)
    const affiliate = await affiliates.create(targetUserId, code)

    if (user.role !== 'admin') {
      await users.updateRole(targetUserId, 'affiliate')
    }

    return NextResponse.json({ affiliate }, { status: 201 })
  } catch (error) {
    console.error('Affiliates POST error:', error)
    return NextResponse.json({ error: 'Gagal membuat affiliate' }, { status: 500 })
  }
}
