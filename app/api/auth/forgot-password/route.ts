import { NextRequest, NextResponse } from 'next/server'
import { randomHex } from '@/lib/random'
import { prisma } from '@/lib/prisma'
import { sendNotification } from '@/lib/notifications'
import { SITE_URL } from '@/lib/config'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'Email harus diisi' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!user) {
      return NextResponse.json({
        message: 'Jika email terdaftar, link reset akan dikirim',
      })
    }

    const token = randomHex(32)

    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } })

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        email: user.email,
        token,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    })

    const resetLink = `${SITE_URL}/reset-password?token=${token}`
    await sendNotification({
      type: 'password_reset',
      recipientEmail: user.email,
      data: { resetLink },
    })

    return NextResponse.json({
      message: 'Jika email terdaftar, link reset akan dikirim',
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
