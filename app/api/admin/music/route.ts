import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session-server'
import { isAdmin } from '@/lib/auth'
import { musicTracks, musicCategories } from '@/lib/db'
import { readJsonBody } from '@/lib/request-body'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (!isAdmin(session)) return NextResponse.json({ error: 'Sesi kamu sudah berakhir. Silakan masuk lagi ya.' }, { status: 401 })
  const [tracks, cats, topTracks] = await Promise.all([
    musicTracks.findAll(),
    musicCategories.findAll(),
    musicTracks.topTracks(10),
  ])
  return NextResponse.json({ tracks, categories: cats, topTracks })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!isAdmin(session)) return NextResponse.json({ error: 'Sesi kamu sudah berakhir. Silakan masuk lagi ya.' }, { status: 401 })

  const body = await readJsonBody(req)
  const title = String(body?.title || '').trim()
  const url = String(body?.url || '').trim()
  if (!title || !url) return NextResponse.json({ error: 'Judul dan URL wajib diisi' }, { status: 400 })

  const track = await musicTracks.create({
    title,
    artist: String(body?.artist || '').trim(),
    category: String(body?.category || 'Lainnya').trim(),
    url,
    duration: Number(body?.duration) || 0,
    file_size: Number(body?.file_size) || 0,
  })
  return NextResponse.json({ track }, { status: 201 })
}
