import { NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/route-guards'
import { musicTracks } from '@/lib/db'
import { readJsonBody } from '@/lib/request-body'
import { musicTrackUpdateSchema } from '@/lib/schemas/music'

export const dynamic = 'force-dynamic'

interface Params { params: Promise<{ id: string }> }

export const PATCH = withAdminAuth<Params>(async (req, session, props) => {
  const { id } = await props.params

  // Dulu body diteruskan mentah ke musicTracks.update(). Field apa pun yang
  // kebetulan ikut — termasuk `url` berisi `javascript:` — langsung tersimpan.
  const parsed = musicTrackUpdateSchema.safeParse(await readJsonBody(req))
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Data lagu tidak valid' },
      { status: 400 },
    )
  }

  const track = await musicTracks.update(id, parsed.data)
  if (!track) return NextResponse.json({ error: 'Datanya tidak ditemukan.' }, { status: 404 })
  return NextResponse.json({ track })
})

export const DELETE = withAdminAuth<Params>(async (_req, session, props) => {
  const { id } = await props.params

  const all = await musicTracks.findAllWithUsage()
  const target = all.find(t => t.id === id)
  if (!target) return NextResponse.json({ error: 'Datanya tidak ditemukan.' }, { status: 404 })

  // Undangan menyimpan URL lagunya, bukan id trek. Menghapus baris trek tidak
  // mematikan undangan yang sudah terbit — tapi admin berhak tahu bahwa lagu
  // ini sedang dipakai sebelum menghilangkannya dari perpustakaan.
  if (target.usage_count > 0) {
    return NextResponse.json(
      {
        error: `"${target.title}" sedang dipakai ${target.usage_count} undangan. Nonaktifkan saja supaya tidak bisa dipilih lagi tanpa mengganggu undangan yang sudah jadi.`,
        usage_count: target.usage_count,
      },
      { status: 409 },
    )
  }

  const ok = await musicTracks.delete(id)
  if (!ok) return NextResponse.json({ error: 'Datanya tidak ditemukan.' }, { status: 404 })
  return NextResponse.json({ ok: true })
})
