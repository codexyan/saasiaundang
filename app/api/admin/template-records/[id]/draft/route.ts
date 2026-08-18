import { NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/route-guards'
import { templateRecords } from '@/lib/db'
import type { JsonTemplateConfig } from '@/lib/types'
import { readJsonBody } from '@/lib/request-body'
import { templateDraftSchema } from '@/lib/schemas/template-record'

export const dynamic = 'force-dynamic'

interface Params { params: Promise<{ id: string }> }

/**
 * Autosave editor.
 *
 * Menulis ke kolom `draft_config`, BUKAN `config`. Inilah yang membuat
 * autosave aman dijalankan pada template yang sedang aktif: pengunjung tetap
 * melihat versi terbit sampai admin menekan Terbitkan.
 */
export const PUT = withAdminAuth<Params>(async (req, session, props) => {
  const { id } = await props.params

  const existing = await templateRecords.findById(id)
  if (!existing) return NextResponse.json({ error: 'Datanya tidak ditemukan.' }, { status: 404 })

  const parsed = templateDraftSchema.safeParse(await readJsonBody(req))
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Konfigurasi template tidak valid' },
      { status: 400 },
    )
  }
  const draft = parsed.data.config as unknown as JsonTemplateConfig

  // Template bawaan belum punya baris DB. Autosave pertama membuatkan barisnya
  // supaya admin bisa memodifikasi template bawaan tanpa langkah tambahan.
  const saved = (await templateRecords.saveDraft(id, draft))
    ?? (await templateRecords.upsert({ ...existing, draft_config: draft }))

  return NextResponse.json({ record: saved, saved_at: new Date().toISOString() })
})

/** Buang salinan kerja, kembali ke versi terbit. */
export const DELETE = withAdminAuth<Params>(async (_req, session, props) => {
  const { id } = await props.params
  const record = await templateRecords.discardDraft(id)
  if (!record) return NextResponse.json({ error: 'Datanya tidak ditemukan.' }, { status: 404 })
  return NextResponse.json({ record })
})
