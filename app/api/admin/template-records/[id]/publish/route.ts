import { NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/route-guards'
import { templateRecords } from '@/lib/db'
import { readJsonBody } from '@/lib/request-body'
import { templatePublishSchema } from '@/lib/schemas/template-record'

export const dynamic = 'force-dynamic'

interface Params { params: Promise<{ id: string }> }

/**
 * Terbitkan: draft_config -> config, lalu draft dikosongkan.
 *
 * Satu-satunya jalan agar perubahan desain terlihat pengunjung. Sebelumnya
 * tidak ada pemisahan seperti ini — setiap simpan dari editor langsung
 * mengubah tampilan undangan yang SUDAH TERBIT milik pelanggan, di tengah
 * admin masih bereksperimen.
 */
export const POST = withAdminAuth<Params>(async (req, session, props) => {
  const { id } = await props.params

  const existing = await templateRecords.findById(id)
  if (!existing) return NextResponse.json({ error: 'Datanya tidak ditemukan.' }, { status: 404 })

  const parsed = templatePublishSchema.safeParse(await readJsonBody(req))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Status publikasi tidak valid' }, { status: 400 })
  }
  const nextStatus = parsed.data.status ?? existing.status

  const incoming = existing.draft_config ?? existing.config
  const hasSection = (incoming?.sections ?? []).some(s => s.enabled)
  if (nextStatus === 'active' && !hasSection) {
    return NextResponse.json(
      { error: 'Template belum punya seksi aktif — aktifkan minimal satu seksi sebelum dipublikasikan' },
      { status: 400 },
    )
  }

  // Template bawaan belum punya baris DB: publishDraft() akan mengembalikan
  // null, jadi jatuhkan ke upsert yang sekalian membuatkan barisnya.
  const saved = (await templateRecords.publishDraft(id, nextStatus))
    ?? (await templateRecords.upsert({ ...existing, config: incoming, draft_config: null, status: nextStatus }))

  return NextResponse.json({ record: saved })
})
