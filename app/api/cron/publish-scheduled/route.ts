import { NextRequest, NextResponse } from 'next/server'
import { articles } from '@/lib/db'
import { verifyBearer } from '@/lib/secure-compare'

export const dynamic = 'force-dynamic'

// Menerbitkan artikel berstatus 'scheduled' yang waktunya sudah lewat.
//
// CATATAN: route ini tidak pernah benar-benar berjalan di Vercel — vercel.json
// hanya mendaftarkan cron sync-subscriptions, padahal komentar lama di sini
// menyebut "lihat vercel.json". Sekarang terdaftar di wrangler.jsonc (*/15).
export async function GET(req: NextRequest) {
  // Dulu perbandingan template string: CRON_SECRET yang kosong menghasilkan
  // "Bearer undefined" yang bisa ditebak siapa pun.
  if (!(await verifyBearer(req.headers.get('authorization'), process.env.CRON_SECRET))) {
    // Dipanggil Cron Trigger, bukan manusia: pesannya menyebut sebab sebenarnya.
    return NextResponse.json({ error: 'Token cron tidak cocok' }, { status: 401 })
  }

  const published = await articles.publishScheduledDue()

  return NextResponse.json({
    published,
    timestamp: new Date().toISOString(),
  })
}
