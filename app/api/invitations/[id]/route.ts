import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session-server'
import { invitations } from '@/lib/db'
import { getTierFeatures } from '@/lib/packages'
import type { PackageTier } from '@/lib/packages'
import { readJsonBody } from '@/lib/request-body'
import { newInvitationDataSchema } from '@/lib/schemas/invitation-data'

export const dynamic = 'force-dynamic'

interface Params { params: Promise<{ id: string }> }

export async function DELETE(_req: NextRequest, props: Params) {
  const params = await props.params;
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Sesi kamu sudah berakhir. Silakan masuk lagi ya.' }, { status: 401 })

    const inv = await invitations.findById(params.id)
    if (!inv || inv.user_id !== session.userId) {
      return NextResponse.json({ error: 'Datanya tidak ditemukan.' }, { status: 404 })
    }

    await invitations.delete(params.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Invitation delete error:', error)
    return NextResponse.json({ error: 'Undangannya gagal dihapus. Coba lagi sebentar lagi ya.' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, props: Params) {
  const params = await props.params;
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Sesi kamu sudah berakhir. Silakan masuk lagi ya.' }, { status: 401 })

    const inv = await invitations.findById(params.id)
    if (!inv || inv.user_id !== session.userId) {
      return NextResponse.json({ error: 'Datanya tidak ditemukan.' }, { status: 404 })
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

    // VALIDASI JSONB — body.data dulu diteruskan MENTAH ke invitations.update().
    //
    // Allowlist di atas hanya menjaga FIELD MANA yang boleh ditulis, bukan
    // ISINYA. Payload seperti { data: { gallery_photos: "bukan-array" } } lolos
    // ke kolom JSONB, lalu halaman undangan publik runtuh saat GallerySection
    // memanggil .map() — kegagalan render yang hanya bisa dipulihkan lewat
    // perbaikan database manual.
    //
    // Skemanya sengaja permisif (semua field opsional + passthrough): yang
    // dijaga adalah tipe dan batas ukuran, bukan kelengkapan. Baca komentar
    // panjang di lib/schemas/invitation-data.ts sebelum memperketatnya —
    // autosave studio mengirim seluruh objek data, jadi skema yang membuang
    // field tak dikenal berarti kehilangan data permanen.
    if (body.data !== undefined) {
      if (typeof body.data !== 'object' || body.data === null || Array.isArray(body.data)) {
        return NextResponse.json({ error: 'Format data undangannya tidak sesuai.' }, { status: 400 })
      }
      const parsedData = newInvitationDataSchema.safeParse(body.data)
      if (!parsedData.success) {
        console.warn('Invitation PATCH: data ditolak', params.id, parsedData.error.flatten())
        return NextResponse.json(
          { error: 'Ada isian undangan yang formatnya tidak sesuai. Coba periksa lagi ya.', details: parsedData.error.flatten() },
          { status: 400 }
        )
      }
      body.data = parsedData.data
    }

    if (body.slug && body.slug !== inv.slug && (await invitations.slugExists(body.slug, params.id))) {
      return NextResponse.json({ error: 'Alamat undangan ini sudah dipakai. Coba nama lain ya.' }, { status: 409 })
    }

    // Blok penghitung pemakaian musik dihapus dari sini. Isinya membaca
    // `body.data.music.url` — bentuk bersarang yang TIDAK PERNAH dikirim
    // siapa pun: studio menulis `music_url` datar (lihat
    // lib/schemas/invitation-data.ts), jadi kondisinya selalu false dan
    // angka pemakaian permanen nol sejak dirilis. Sekarang angkanya dihitung
    // langsung dari tabel undangan di musicTracks.usageCounts(), yang selalu
    // benar tanpa perlu hook di jalur tulis mana pun.

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
    return NextResponse.json({ error: 'Perubahannya gagal disimpan. Coba lagi sebentar lagi ya.' }, { status: 500 })
  }
}
