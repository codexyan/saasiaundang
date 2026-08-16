import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/session-server'
import { userFeedback } from '@/lib/db'
import { readJsonBody } from '@/lib/request-body'

export const dynamic = 'force-dynamic'

/**
 * `score` SENGAJA tidak dimasukkan ke skema ini — penanganannya di bawah sudah
 * benar dan halus (konversi dulu, baru dibandingkan), dan pesan errornya
 * spesifik. Memindahkannya ke zod hanya akan menghilangkan pesan itu.
 *
 * Yang ditambahkan: batas panjang untuk teks bebas yang tersimpan dan dibaca
 * admin di panel feedback.
 */
const feedbackSchema = z.object({
  comment: z.string().max(2000).optional(),
  page: z.string().max(200).optional(),
  type: z.string().max(50).optional(),
})

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Sesi kamu sudah berakhir. Silakan masuk lagi ya.' }, { status: 401 })

  const body = await readJsonBody(req)
  const parsedText = feedbackSchema.safeParse(body)
  if (!parsedText.success) {
    return NextResponse.json({ error: 'Ada data yang belum sesuai. Coba periksa lagi ya.' }, { status: 400 })
  }
  const { score } = body
  const { comment, page, type } = parsedText.data

  // Dikonversi DULU baru dibandingkan. Dulu perbandingannya dilakukan pada
  // nilai JSON mentah: `null < 0` bernilai false dan `null > 10` juga false,
  // jadi null lolos dan tersimpan sebagai 0; sementara string non-numerik lolos
  // lalu menjadi NaN saat Number() di bawah.
  const numericScore = Number(score)
  if (!Number.isFinite(numericScore) || numericScore < 0 || numericScore > 10) {
    return NextResponse.json({ error: 'Nilainya harus angka antara 0 sampai 10.' }, { status: 400 })
  }

  const feedback = await userFeedback.create({
    user_id: session.userId,
    type: type || 'nps',
    score: numericScore,
    comment: comment || '',
    page: page || '',
  })

  return NextResponse.json({ feedback }, { status: 201 })
}

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Sesi kamu sudah berakhir. Silakan masuk lagi ya.' }, { status: 401 })

  const [hasRecent, history] = await Promise.all([
    userFeedback.hasRecentFeedback(session.userId),
    userFeedback.findByUserId(session.userId),
  ])

  return NextResponse.json({ hasRecent, history })
}
