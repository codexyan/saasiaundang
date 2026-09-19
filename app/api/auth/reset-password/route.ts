import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { readJsonBody } from '@/lib/request-body'

export const dynamic = 'force-dynamic'

/**
 * Dulu `password.length < 6` dipakai tanpa memastikan password itu string.
 * Untuk `{"password": 123456}`, `.length` bernilai undefined dan
 * `undefined < 6` itu FALSE — jadi pemeriksaan panjangnya terlewat begitu
 * saja. Yang menyelamatkan justru bcryptjs di bawah, yang menolak argumen
 * non-string ("Illegal arguments: number, string"). Jadi password lemah
 * tidak pernah benar-benar tersimpan — TAPI pemakainya melihat 500 "ada
 * kendala di sistem kami", seolah server yang rusak, padahal kiriman
 * merekalah yang salah bentuk. Sekarang ditolak 400 dengan pesan jelas.
 *
 * `token` juga dulu diteruskan mentah ke findUnique; tipe non-string membuat
 * Prisma melempar, lagi-lagi 500.
 */
const resetSchema = z.object({
  token: z.string().min(1).max(200),
  password: z.string().min(6).max(200),
})

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
      // Menentukan kalimat di halaman: pembeli baru MEMBUAT password
      // pertamanya, sedangkan pemilik akun lama MENGGANTI yang sudah ada.
      purpose: resetToken.purpose,
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
    const body = await readJsonBody(req)
    const parsed = resetSchema.safeParse(body)
    if (!parsed.success) {
      // Kedua pesan lama dipertahankan apa adanya: "terlalu pendek" hanya
      // dipakai kalau passwordnya memang ada tapi kurang panjang, bukan untuk
      // body yang kosong — supaya yang dibaca pengguna tetap menolong.
      const tooShort =
        typeof body?.password === 'string' &&
        body.password.length > 0 &&
        body.password.length < 6
      return NextResponse.json(
        { error: tooShort ? 'Passwordnya minimal 6 karakter ya.' : 'Password barunya belum diisi.' },
        { status: 400 }
      )
    }
    const { token, password } = parsed.data

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
