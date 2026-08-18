import { NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/route-guards'
import { templateRecords } from '@/lib/db'
import { slugify } from '@/lib/schemas/template-record'

export const dynamic = 'force-dynamic'

interface Params { params: Promise<{ id: string }> }

/**
 * Salin template jadi draft baru.
 *
 * Alur paling sering dipakai admin: ambil tema yang sudah jadi, ubah warna dan
 * font, terbitkan sebagai varian. Sebelumnya satu-satunya cara adalah membuat
 * template dari nol lalu menyetel ulang puluhan field satu per satu.
 */
export const POST = withAdminAuth<Params>(async (_req, session, props) => {
  const { id } = await props.params

  const source = await templateRecords.findById(id)
  if (!source) return NextResponse.json({ error: 'Datanya tidak ditemukan.' }, { status: 404 })

  const name = `${source.name} (Salinan)`.slice(0, 80)
  const baseSlug = slugify(name) || `${source.slug}-salinan`
  let slug = baseSlug
  for (let n = 2; await templateRecords.findBySlug(slug); n++) {
    slug = `${baseSlug.slice(0, 36)}-${n}`
  }

  const all = await templateRecords.findAll()
  const maxOrder = all.reduce((m, t) => Math.max(m, t.sort_order), 0)

  const copy = await templateRecords.upsert({
    ...source,
    id: crypto.randomUUID().slice(0, 8),
    name,
    slug,
    // Salinan selalu lahir sebagai draft — menyalin template aktif tidak boleh
    // diam-diam menaruh tema setengah jadi di galeri publik.
    status: 'draft',
    // Desain sumber disalin dari versi TERBIT, bukan draft yang sedang digarap.
    config: source.config,
    draft_config: null,
    sort_order: maxOrder + 1,
    usage_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })

  return NextResponse.json({ record: copy }, { status: 201 })
})
