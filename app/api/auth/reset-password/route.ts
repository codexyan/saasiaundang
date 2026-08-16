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
        { error: 'Tautannya tidak dikenali. Coba minta tautan baru dari halaman lupa password.', valid: false },
        { status: 400 }
      )
    }

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    })

    if (!resetToken) {
      return NextResponse.json(
        { error: 'Tautannya sudah tidak berlaku. Silakan minta tautan baru.', valid: false },
        { status: 404 }
      )
    }

    if (resetToken.expiresAt < new Date()) {
      await prisma.passwordResetToken.delete({ where: { id: resetToken.id } })
      return NextResponse.json(
        { error: 'Tautannya sudah lewat masa berlaku. Silakan minta tautan baru.', valid: false, expired: true },
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
      { error: 'Ada kendala di sistem kami. Coba beberapa saat lagi ya.', valid: false },
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
        { error: 'Password barunya belum diisi.' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Passwordnya minimal 6 karakter ya.' },
        { status: 400 }
      )
    }

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    })

    if (!resetToken) {
      return NextResponse.json(
        { error: 'Tautannya sudah tidak berlaku. Silakan minta tautan baru.' },
        { status: 404 }
      )
    }

    if (resetToken.expiresAt < new Date()) {
      await prisma.passwordResetToken.delete({ where: { id: resetToken.id } })
      return NextResponse.json(
        { error: 'Tautannya sudah lewat masa berlaku. Silakan minta tautan baru.' },
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
      { error: 'Ada kendala di sistem kami. Coba beberapa saat lagi ya.' },
      { status: 500 }
    )
  }
}
