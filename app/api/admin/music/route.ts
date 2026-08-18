import { NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/route-guards'
import { musicTracks, musicCategories } from '@/lib/db'
import { readJsonBody } from '@/lib/request-body'
import { musicTrackCreateSchema, musicReorderSchema } from '@/lib/schemas/music'

export const dynamic = 'force-dynamic'

export const GET = withAdminAuth(async () => {
  // Satu sumber: findAllWithUsage() sudah membawa angka pemakaian nyata, jadi
  // topTracks tidak perlu query terpisah yang bisa berbeda hasilnya.
  const [tracks, cats] = await Promise.all([
    musicTracks.findAllWithUsage(),
    musicCategories.findAll(),
  ])
  const topTracks = tracks
    .filter(t => t.is_active && t.usage_count > 0)
    .sort((a, b) => b.usage_count - a.usage_count)
    .slice(0, 10)

  return NextResponse.json({ tracks, categories: cats, topTracks })
})

export const POST = withAdminAuth(async (req) => {
  const parsed = musicTrackCreateSchema.safeParse(await readJsonBody(req))
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Data lagu tidak valid' },
      { status: 400 },
    )
  }
  const body = parsed.data

  // URL yang sama berarti file yang sama. Tanpa cek ini, satu lagu bisa muncul
  // berkali-kali di daftar pilihan user dan angka pemakaiannya terbelah.
  const existing = (await musicTracks.findAll()).find(t => t.url === body.url)
  if (existing) {
    return NextResponse.json(
      { error: `Lagu dengan URL ini sudah ada di perpustakaan ("${existing.title}")` },
      { status: 409 },
    )
  }

  const track = await musicTracks.create({
    title: body.title,
    artist: body.artist ?? '',
    category: body.category ?? 'Lainnya',
    url: body.url,
    // Durasi dibaca browser dari metadata file saat upload lalu dikirim ke
    // sini. Sebelumnya tidak pernah ikut terkirim, jadi seluruh perpustakaan
    // menampilkan "0:00" — termasuk di daftar pilihan yang dilihat user.
    duration: body.duration ?? 0,
    file_size: body.file_size ?? 0,
  })
  return NextResponse.json({ track }, { status: 201 })
})

/** Simpan urutan hasil drag-and-drop. Kolom sort_order sudah lama ada di DB
 *  dan dipakai untuk mengurutkan, tapi belum pernah punya cara untuk diisi. */
export const PATCH = withAdminAuth(async (req) => {
  const parsed = musicReorderSchema.safeParse(await readJsonBody(req))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Daftar urutan tidak valid' }, { status: 400 })
  }
  await musicTracks.reorder(parsed.data.ids)
  return NextResponse.json({ ok: true })
})
