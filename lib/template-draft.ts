import type { JsonTemplateConfig } from './types'

/**
 * Apakah draf template benar-benar bisa dipakai.
 *
 * Kolom `draft_config` pernah terisi objek kosong `{}` oleh versi lama, sebelum
 * skema di `lib/schemas/template-record.ts` menolak bentuk yang tidak lengkap.
 * Satu baris seperti itu cukup untuk meruntuhkan seluruh editor: kodenya dulu
 * memeriksa `if (record.draft_config)`, dan `{}` itu truthy, jadi konfigurasi
 * kerja berubah menjadi objek kosong lalu pembacaan `meta.font` melempar
 * "Cannot read properties of undefined". Admin yang membuka tema itu hanya
 * melihat halaman error, tanpa petunjuk apa pun.
 *
 * Karena itu keberadaan draf diukur dari BENTUKNYA, bukan dari truthy-nya.
 * Data lama yang tidak memenuhi bentuk ini diperlakukan seperti tidak ada draf,
 * dan editor jatuh ke versi terbit yang selalu valid.
 */
export function drafValid(draft: unknown): draft is JsonTemplateConfig {
  if (!draft || typeof draft !== 'object') return false
  const d = draft as { meta?: unknown; sections?: unknown }
  return (
    !!d.meta
    && typeof d.meta === 'object'
    && Array.isArray(d.sections)
  )
}

/**
 * Membuang draf dari record sebelum dikirim ke halaman publik.
 *
 * `draft_config` adalah rancangan tema yang BELUM diterbitkan: pekerjaan admin
 * yang masih berjalan. Halaman depan dan halaman demo mengoper seluruh
 * TemplateRecord ke komponen klien, jadi draf itu ikut tercetak di sumber
 * halaman dan bisa dibaca siapa saja yang membuka view-source. Terukur 19 KB
 * untuk tiga tema, dan tidak satu pun dipakai merender halaman itu.
 *
 * Yang benar benar membutuhkan draf cuma panel admin, dan panel admin
 * mengambil recordnya sendiri lewat rute admin.
 */
export function tanpaDraf<T extends { draft_config?: unknown }>(record: T): T {
  return { ...record, draft_config: null }
}
