import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session-server'
import { invitations, musicTracks } from '@/lib/db'
import { prisma } from '@/lib/prisma'
import { getTierFeatures } from '@/lib/packages'
import type { PackageTier } from '@/lib/packages'
import { readJsonBody } from '@/lib/request-body'

export const dynamic = 'force-dynamic'

interface Params { params: Promise<{ id: string }> }

export async function DELETE(_req: NextRequest, props: Params) {
  const params = await props.params;
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const inv = await invitations.findById(params.id)
    if (!inv || inv.user_id !== session.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await invitations.delete(params.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Invitation delete error:', error)
    return NextResponse.json({ error: 'Gagal menghapus undangan' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, props: Params) {
  const params = await props.params;
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const inv = await invitations.findById(params.id)
    if (!inv || inv.user_id !== session.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const rawBody = await readJsonBody(req)

    // ALLOWLIST — jangan pernah meneruskan body mentah ke invitations.update().
    //
    // update() menerima package_tier, is_paid, dan expires_at. Karena dulu
    // seluruh body diteruskan apa adanya, pemilik undangan gratis cukup mengirim
    // `{ is_paid: true, expires_at: "2099-01-01" }` ke endpoint miliknya sendiri
    // untuk membuka semua fitur berbayar tanpa membayar — dan
    // `{ package_tier: "eksklusif" }` untuk naik ke paket tertinggi.
    //
    // Ketiga field itu HANYA boleh diubah oleh jalur penyediaan pesanan
    // (lib/provision-order.ts) setelah pembayaran terverifikasi.
    // Tipe dibiarkan longgar seperti sebelumnya supaya penanganan body.data.*
    // di bawah tidak berubah; yang penting isinya sudah disaring.
    const body: Record<string, any> = {}
    for (const field of ['slug', 'template_id', 'data', 'is_published'] as const) {
      if (rawBody[field] !== undefined) body[field] = rawBody[field]
    }

    if (body.slug && body.slug !== inv.slug && (await invitations.slugExists(body.slug, params.id))) {
      return NextResponse.json({ error: 'Slug sudah dipakai' }, { status: 409 })
    }

    const newMusicUrl = body.data?.music?.url
    const oldMusicUrl = (inv.data as unknown as { music?: { url?: string } })?.music?.url
    if (newMusicUrl && newMusicUrl !== oldMusicUrl) {
      try {
        const track = await prisma.musicTrack.findFirst({ where: { url: newMusicUrl } })
        if (track) await musicTracks.incrementUsage(track.id)
      } catch { /* non-critical */ }
    }

    // Server-side tier enforcement for decoration overrides
    if (body.data?.section_decoration_overrides || body.data?.opening_decoration_overrides) {
      const tier = (inv as unknown as Record<string, unknown>).package_tier as PackageTier | undefined
      const features = getTierFeatures(tier)
      if (!features.decoration_editing) {
        delete body.data.section_decoration_overrides
        delete body.data.opening_decoration_overrides
      } else if (features.max_decoration_assets >= 0) {
        if (body.data.section_decoration_overrides) {
          const overrides = body.data.section_decoration_overrides as Record<string, unknown[]>
          for (const key of Object.keys(overrides)) {
            if (overrides[key]?.length > features.max_decoration_assets) {
              overrides[key] = overrides[key].slice(0, features.max_decoration_assets)
            }
          }
        }
        if (body.data.opening_decoration_overrides) {
          const arr = body.data.opening_decoration_overrides as unknown[]
          if (arr.length > features.max_decoration_assets) {
            body.data.opening_decoration_overrides = arr.slice(0, features.max_decoration_assets) as typeof body.data.opening_decoration_overrides
          }
        }
      }
    }

    const updated = await invitations.update(params.id, body)
    return NextResponse.json({ invitation: updated })
  } catch (error) {
    console.error('Invitation update error:', error)
    return NextResponse.json({ error: 'Gagal memperbarui undangan' }, { status: 500 })
  }
}
