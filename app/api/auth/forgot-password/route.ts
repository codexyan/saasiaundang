import { NextRequest, NextResponse } from 'next/server'
import { randomHex } from '@/lib/random'
import { prisma } from '@/lib/prisma'
import { sendNotification } from '@/lib/notifications'
import { SITE_URL } from '@/lib/config'
import { readJsonBody } from '@/lib/request-body'
import { allowRequest } from '@/lib/rate-limit'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

/**
 * Pemeriksaan `typeof email !== 'string'` yang lama sudah aman soal tipe;
 * yang ditambahkan di sini batas panjangnya. Nilai ini dipakai LANGSUNG
 * sebagai kunci rate limit di bawah, jadi string sepanjang megabyte berarti
 * kunci sepanjang megabyte — pemanggilan limiter gagal, dan lib/rate-limit.ts
 * sengaja fail-open, sehingga justru pembatas email inilah yang mati persis
 * saat sedang disalahgunakan.
 */
const forgotSchema = z.object({
  email: z.string().min(1).max(200),
})

export async function POST(req: NextRequest) {
  try {
    const parsed = forgotSchema.safeParse(await readJsonBody(req))

    if (!parsed.success) {
      return NextResponse.json({ error: 'Emailnya belum diisi.' }, { status: 400 })
    }
    const { email } = parsed.data

    // Tiap permintaan yang berhasil MENGIRIM EMAIL SUNGGUHAN lewat Resend.
    // Tanpa batas, endpoint ini bisa dipakai membanjiri inbox orang lain
    // sekaligus menghabiskan kuota Resend dan merusak reputasi domain pengirim.
    //
    // Balasannya sengaja memakai kalimat netral yang sama seperti jalur sukses,
    // supaya 429 tidak berubah menjadi cara memastikan sebuah email terdaftar.
    if (!(await allowRequest('EMAIL_RATE_LIMIT', email.toLowerCase()))) {
      return NextResponse.json({
        message: 'Jika email terdaftar, link reset akan dikirim',
      })
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
      { error: 'Ada kendala di sistem kami. Coba beberapa saat lagi ya.' },
      { status: 500 }
    )
  }
}
