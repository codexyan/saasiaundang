import { NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/route-guards'
import { templateRecords } from '@/lib/db'
import { readJsonBody } from '@/lib/request-body'
import { templateMetadataSchema } from '@/lib/schemas/template-record'
import { BUILT_IN_TEMPLATE_IDS } from '@/lib/built-in-data'

export const dynamic = 'force-dynamic'

interface Params { params: Promise<{ id: string }> }

const BUILT_IN_IDS = new Set<string>(BUILT_IN_TEMPLATE_IDS)

/**
 * Ubah METADATA saja: nama, slug, kategori, deskripsi, thumbnail, status,
 * urutan, harga, paket. Isi desain TIDAK bisa lewat sini — jalurnya
 * ./draft (autosave) lalu ./publish (terbitkan).
 *
 * Dulu handler ini melakukan `{ ...existing, ...body }` tanpa filter apa pun,
 * jadi field mana pun yang kebetulan ada di body — termasuk `config` setengah
 * jadi, `usage_count`, atau kunci sampah — langsung tertulis ke baris DB.
 */
export const PATCH = withAdminAuth<Params>(async (req, session, props) => {
  const { id } = await props.params

  const existing = await templateRecords.findById(id)
  if (!existing) return NextResponse.json({ error: 'Datanya tidak ditemukan.' }, { status: 404 })

  const parsed = templateMetadataSchema.safeParse(await readJsonBody(req))
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Data template tidak valid' },
      { status: 400 },
    )
  }
  const patch = parsed.data

  if (patch.slug && patch.slug !== existing.slug) {
    const other = await templateRecords.findBySlug(patch.slug)
    if (other && other.id !== existing.id) {
      return NextResponse.json({ error: 'Slug template sudah dipakai template lain' }, { status: 409 })
    }
  }

  // Menerbitkan template kosong berarti user melihat halaman undangan tanpa
  // satu pun seksi. Lebih baik ditolak di sini daripada ketahuan dari komplain.
  if (patch.status === 'active') {
    const live = existing.config
    const hasSection = (live?.sections ?? []).some(s => s.enabled)
    if (!hasSection) {
      return NextResponse.json(
        { error: 'Template belum punya seksi aktif — aktifkan minimal satu seksi sebelum dipublikasikan' },
        { status: 400 },
      )
    }
  }

  const updated = await templateRecords.upsert({ ...existing, ...patch })
  return NextResponse.json({ record: updated })
})

export const DELETE = withAdminAuth<Params>(async (_req, session, props) => {
  const { id } = await props.params

  const existing = await templateRecords.findById(id)
  if (!existing) return NextResponse.json({ error: 'Datanya tidak ditemukan.' }, { status: 404 })
  if (BUILT_IN_IDS.has(existing.id)) {
    return NextResponse.json({ error: 'Template bawaan tidak bisa dihapus' }, { status: 403 })
  }

  // Undangan yang sudah terbit menyimpan template_id, bukan salinan config-nya.
  // Menghapus template yang masih dipakai membuat halaman undangan milik user
  // langsung menampilkan "Template undangan tidak ditemukan".
  const usage = await templateRecords.usageCounts()
  const inUse = usage[existing.id] ?? 0
  if (inUse > 0) {
    return NextResponse.json(
      { error: `Masih dipakai ${inUse} undangan. Arsipkan saja supaya undangan yang sudah terbit tetap hidup.` },
      { status: 409 },
    )
  }

  await templateRecords.delete(id)
  return NextResponse.json({ success: true })
})
