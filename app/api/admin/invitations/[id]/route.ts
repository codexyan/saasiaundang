import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withAdminAuth } from '@/lib/route-guards'
import { invitations } from '@/lib/db'
import { resolveExpiry } from '@/lib/tiers'
import { readJsonBody } from '@/lib/request-body'

export const dynamic = 'force-dynamic'

interface Params { params: Promise<{ id: string }> }

/**
 * Field yang boleh diubah admin dari panel.
 *
 * Dulu body request diteruskan MENTAH ke invitations.update(): apa pun yang
 * dikirim client tertulis ke baris undangan, termasuk `data` (seluruh isi
 * undangan), `user_id`, atau `slug`.
 *
 * `expires_at` sengaja TIDAK ada di sini — masa aktif dihitung server dari
 * paket undangannya, bukan dikirim client.
 */
const patchSchema = z.object({
  is_paid: z.boolean(),
  is_published: z.boolean(),
}).partial()

export const PATCH = withAdminAuth<Params>(async (req, session, props) => {
  const { id } = await props.params

  try {
    const parsed = patchSchema.safeParse(await readJsonBody(req))
    if (!parsed.success) {
      return NextResponse.json({ error: 'Data undangan tidak valid' }, { status: 400 })
    }

    const existing = await invitations.findById(id)
    if (!existing) return NextResponse.json({ error: 'Datanya tidak ditemukan.' }, { status: 404 })

    const patch: Record<string, unknown> = { ...parsed.data }

    /**
     * Masa aktif dihitung DI SINI, dari paket undangan yang bersangkutan.
     *
     * Panel dulu menghitungnya sendiri memakai `settings.packageDuration` —
     * satu angka global yang sama untuk semua paket. Akibatnya menandai lunas
     * lewat tombol ini memberi masa aktif berbeda dari menyetujui bukti
     * pembayaran, untuk paket yang sama persis.
     */
    if (parsed.data.is_paid === true) {
      const tier = (existing as unknown as Record<string, unknown>).package_tier as string | undefined
      try {
        patch.expires_at = (await resolveExpiry(tier)).toISOString()
      } catch {
        return NextResponse.json(
          { error: `Paket undangan ini ("${tier ?? 'kosong'}") tidak dikenal, jadi masa aktifnya tidak bisa dihitung.` },
          { status: 400 },
        )
      }
    }

    const updated = await invitations.update(id, patch)
    if (!updated) return NextResponse.json({ error: 'Datanya tidak ditemukan.' }, { status: 404 })
    return NextResponse.json({ invitation: updated })
  } catch (error) {
    console.error('Admin invitation PATCH error:', error)
    return NextResponse.json({ error: 'Perubahannya gagal disimpan. Coba lagi sebentar lagi ya.' }, { status: 500 })
  }
})
