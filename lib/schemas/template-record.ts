import { z } from 'zod'

/**
 * Skema untuk endpoint modul Template.
 *
 * Dipisah tegas jadi dua: METADATA (identitas, harga, publikasi) dan CONFIG
 * (isi desain). Dulu keduanya masuk lewat satu PATCH `{...existing, ...body}`
 * tanpa filter, sehingga body apa pun — termasuk `usage_count`, `created_at`,
 * atau kunci sampah — ikut tertulis ke baris DB.
 *
 * Config sendiri sengaja divalidasi longgar (.passthrough(), semua opsional)
 * dengan alasan yang sama seperti invitation-data.ts: editor terus bertambah
 * field, dan Zod default MEMBUANG kunci tak dikenal — pada autosave yang
 * mengirim seluruh objek, "membuang" artinya kehilangan desain permanen.
 * Yang dijaga di sini adalah BENTUK (config harus objek, sections harus array)
 * dan BATAS UKURAN, bukan kelengkapan.
 */

export const TEMPLATE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const slug = z.string().trim().min(3).max(40).regex(
  TEMPLATE_SLUG,
  'Slug hanya boleh huruf kecil, angka, dan strip di antara kata',
)

/** Bentuk minimal yang harus dipenuhi agar renderer tidak runtuh. */
export const templateConfigSchema = z.object({
  meta: z.object({}).passthrough(),
  opening: z.object({}).passthrough().optional(),
  loading: z.object({}).passthrough().optional(),
  music: z.object({}).passthrough().optional(),
  sections: z.array(z.object({}).passthrough()).max(64),
}).passthrough()

/** Field identitas & komersial. Semua opsional — PATCH bersifat parsial. */
export const templateMetadataSchema = z.object({
  name: z.string().trim().min(1).max(80),
  slug,
  category: z.string().trim().max(40),
  description: z.string().trim().max(500),
  thumbnail_url: z.string().trim().max(2000),
  status: z.enum(['draft', 'active', 'archived']),
  sort_order: z.number().int().min(0).max(9999),
  price: z.number().int().min(0).max(100_000_000),
  required_package: z.enum(['all', 'starter', 'popular', 'eksklusif']),
}).partial()

/** Body pembuatan template baru. */
export const templateCreateSchema = z.object({
  name: z.string().trim().min(1).max(80),
  slug: slug.optional(),
  category: z.string().trim().max(40).optional(),
  description: z.string().trim().max(500).optional(),
  config: templateConfigSchema,
})

export const templateDraftSchema = z.object({
  config: templateConfigSchema,
})

export const templatePublishSchema = z.object({
  status: z.enum(['draft', 'active', 'archived']).optional(),
})

export type TemplateMetadataPatch = z.infer<typeof templateMetadataSchema>

/** Ubah nama bebas jadi slug yang lolos TEMPLATE_SLUG. */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/, '')
}
