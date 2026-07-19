import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { readJsonBody } from '@/lib/request-body'

export const dynamic = 'force-dynamic'

// GET: Validate token
export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Token tidak ditemukan', valid: false },
        { status: 400 }
      )
    }

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    })

    if (!resetToken) {
      return NextResponse.json(
        { error: 'Token tidak valid', valid: false },
        { status: 404 }
      )
    }

    if (resetToken.expiresAt < new Date()) {
      await prisma.passwordResetToken.delete({ where: { id: resetToken.id } })
      return NextResponse.json(
        { error: 'Token sudah kadaluarsa', valid: false, expired: true },
        { status: 400 }
      )
    }

    return NextResponse.json({
      valid: true,
      email: resetToken.email,
    })
  } catch (error) {
    console.error('Token validation error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server', valid: false },
      { status: 500 }
    )
  }
}

// POST: Reset password
export async function POST(req: NextRequest) {
  try {
    const { token, password } = await readJsonBody(req)

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token dan password harus diisi' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password minimal 6 karakter' },
        { status: 400 }
      )
    }

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    })

    if (!resetToken) {
      return NextResponse.json(
        { error: 'Token tidak valid' },
        { status: 404 }
      )
    }

    if (resetToken.expiresAt < new Date()) {
      await prisma.passwordResetToken.delete({ where: { id: resetToken.id } })
      return NextResponse.json(
        { error: 'Token sudah kadaluarsa' },
        { status: 400 }
      )
    }

    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(password, salt)

    // sessionEpoch dinaikkan bersamaan dengan passwordnya — dalam transaksi yang
    // sama, supaya mustahil password berganti tanpa sesi lama ikut dicabut.
    //
    // Ini inti perbaikannya: tanpa kenaikan epoch, token JWT stateless berumur
    // 30 hari yang sudah dicuri tetap berlaku SETELAH korban mereset password.
    // Justru di saat korban mengira dirinya sudah aman, penyerang masih masuk.
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash, sessionEpoch: { increment: 1 } },
      }),
      prisma.passwordResetToken.delete({ where: { id: resetToken.id } }),
    ])

    return NextResponse.json({
      message: 'Password berhasil direset',
    })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
