import { z } from 'zod'

/**
 * Skema perpustakaan musik.
 *
 * Yang dijaga di sini bukan sekadar tipe. Form "tambah via URL" di panel admin
 * dulu meneruskan string apa pun sebagai `url`, dan nilai itu dipakai langsung
 * sebagai `src` pemutar audio di undangan yang dilihat publik — termasuk
 * `javascript:` dan `data:`. Karena itu skema URL di bawah membatasi protokol,
 * bukan hanya memastikan "ada isinya".
 */

/** Hanya http/https, atau path absolut milik domain sendiri. */
const trackUrl = z.string().trim().min(1).max(2000).refine(
  (v) => {
    if (v.startsWith('/')) return !v.startsWith('//')
    try {
      const protocol = new URL(v).protocol
      return protocol === 'http:' || protocol === 'https:'
    } catch {
      return false
    }
  },
  { message: 'URL lagu harus diawali http://, https://, atau / (path di domain ini)' },
)

export const musicTrackCreateSchema = z.object({
  title: z.string().trim().min(1, 'Judul lagu wajib diisi').max(150),
  artist: z.string().trim().max(150).optional(),
  category: z.string().trim().max(60).optional(),
  url: trackUrl,
  // 4 jam. Bukan pembatasan artistik — nilai di luar akal biasanya berarti
  // metadata rusak, dan angka itu akan merusak tampilan durasi di daftar.
  duration: z.number().int().min(0).max(14_400).optional(),
  file_size: z.number().int().min(0).optional(),
})

export const musicTrackUpdateSchema = z.object({
  title: z.string().trim().min(1).max(150),
  artist: z.string().trim().max(150),
  category: z.string().trim().max(60),
  url: trackUrl,
  duration: z.number().int().min(0).max(14_400),
  is_active: z.boolean(),
  sort_order: z.number().int().min(0).max(9999),
}).partial()

export const musicReorderSchema = z.object({
  ids: z.array(z.string().min(1).max(64)).min(1).max(500),
})

export const musicCategorySchema = z.object({
  name: z.string().trim().min(1, 'Nama kategori wajib diisi').max(60),
  sort_order: z.number().int().min(0).max(9999).optional(),
})
