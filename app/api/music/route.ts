import { NextResponse } from 'next/server'
import { musicTracks, musicCategories } from '@/lib/db'

export const dynamic = 'force-dynamic'

/** Perpustakaan musik yang dilihat user di studio undangan. */
export async function GET() {
  const [tracks, cats] = await Promise.all([
    // findActive() memakai kolom usage_count yang selalu 0, padahal daftar ini
    // menampilkan "Nx dipilih" sebagai petunjuk lagu populer bagi user.
    // findAllWithUsage() menghitungnya dari data undangan yang sebenarnya.
    musicTracks.findAllWithUsage(),
    musicCategories.findAll(),
  ])
  return NextResponse.json({
    tracks: tracks.filter(t => t.is_active),
    categories: cats.map(c => c.name),
  })
}
