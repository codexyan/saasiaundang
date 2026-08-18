import { prisma } from '../prisma'
import type { MusicTrack, MusicCategory } from '../types'

/** Kategori tempat trek mendarat kalau kategorinya dihapus. */
export const MUSIC_FALLBACK_CATEGORY = 'Lainnya'

function mapMusicTrack(m: { id: string; title: string; artist: string; category: string; url: string; duration: number; fileSize: number; isActive: boolean; sortOrder: number; usageCount: number; createdAt: Date }): MusicTrack {
  return { id: m.id, title: m.title, artist: m.artist, category: m.category, url: m.url, duration: m.duration, file_size: m.fileSize, is_active: m.isActive, sort_order: m.sortOrder, usage_count: m.usageCount, created_at: m.createdAt.toISOString() }
}

//  MUSIC LIBRARY

export const musicTracks = {
  async findAll(): Promise<MusicTrack[]> {
    const rows = await prisma.musicTrack.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }] })
    return rows.map(mapMusicTrack)
  },

  async findActive(): Promise<MusicTrack[]> {
    const rows = await prisma.musicTrack.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }] })
    return rows.map(mapMusicTrack)
  },

  async create(data: { title: string; artist?: string; category?: string; url: string; duration?: number; file_size?: number }): Promise<MusicTrack> {
    // Trek baru ditaruh di akhir daftar, bukan menumpuk di sort_order 0 —
    // tanpa ini urutan manual admin acak setiap kali ada upload baru.
    const last = await prisma.musicTrack.findFirst({ orderBy: { sortOrder: 'desc' }, select: { sortOrder: true } })
    const m = await prisma.musicTrack.create({
      data: {
        title: data.title,
        artist: data.artist ?? '',
        category: data.category ?? MUSIC_FALLBACK_CATEGORY,
        url: data.url,
        duration: data.duration ?? 0,
        fileSize: data.file_size ?? 0,
        sortOrder: (last?.sortOrder ?? 0) + 1,
      },
    })
    return mapMusicTrack(m)
  },

  /**
   * Berapa undangan yang benar-benar memakai tiap lagu, dihitung dari data
   * undangan itu sendiri.
   *
   * Kolom `usage_count` yang lama dinaikkan lewat POST /api/music/[id]/usage —
   * dan satu-satunya pemanggilnya adalah komponen yang tidak pernah dipasang
   * di mana pun. Akibatnya seluruh tab Statistik permanen nol sejak dirilis.
   * Menghitung dari sumbernya juga membuat angka ikut turun saat undangan
   * dihapus atau lagunya diganti — hal yang tidak bisa dilakukan counter.
   */
  async usageCounts(): Promise<Record<string, number>> {
    const rows = await prisma.$queryRaw<{ url: string; n: bigint }[]>`
      SELECT data->>'music_url' AS url, COUNT(*) AS n
      FROM invitations
      WHERE COALESCE(data->>'music_url', '') <> ''
      GROUP BY 1
    `
    const byUrl: Record<string, number> = {}
    for (const r of rows) byUrl[r.url] = Number(r.n)
    return byUrl
  },

  /** findAll() + angka pemakaian nyata, dipetakan per URL trek. */
  async findAllWithUsage(): Promise<MusicTrack[]> {
    const [tracks, byUrl] = await Promise.all([this.findAll(), this.usageCounts()])
    return tracks.map(t => ({ ...t, usage_count: byUrl[t.url] ?? 0 }))
  },

  async update(id: string, data: Partial<{ title: string; artist: string; category: string; url: string; duration: number; is_active: boolean; sort_order: number }>): Promise<MusicTrack | null> {
    try {
      const m = await prisma.musicTrack.update({
        where: { id },
        data: {
          ...(data.title !== undefined && { title: data.title }),
          ...(data.artist !== undefined && { artist: data.artist }),
          ...(data.category !== undefined && { category: data.category }),
          ...(data.url !== undefined && { url: data.url }),
          ...(data.duration !== undefined && { duration: data.duration }),
          ...(data.is_active !== undefined && { isActive: data.is_active }),
          ...(data.sort_order !== undefined && { sortOrder: data.sort_order }),
        },
      })
      return mapMusicTrack(m)
    } catch { return null }
  },

  /** Tulis ulang urutan sesuai daftar id. Satu transaksi supaya tidak ada
   *  kondisi setengah jadi kalau salah satu update gagal. */
  async reorder(ids: string[]): Promise<void> {
    await prisma.$transaction(
      ids.map((id, index) => prisma.musicTrack.update({ where: { id }, data: { sortOrder: index + 1 } })),
    )
  },

  async delete(id: string): Promise<boolean> {
    try { await prisma.musicTrack.delete({ where: { id } }); return true } catch { return false }
  },

  async categories(): Promise<string[]> {
    const rows = await prisma.musicTrack.findMany({ select: { category: true }, distinct: ['category'], orderBy: { category: 'asc' } })
    return rows.map(r => r.category)
  },

  async topTracks(limit = 10): Promise<MusicTrack[]> {
    const withUsage = await this.findAllWithUsage()
    return withUsage
      .filter(t => t.is_active)
      .sort((a, b) => b.usage_count - a.usage_count)
      .slice(0, limit)
  },
}

//  MUSIC CATEGORIES

function mapMusicCategory(m: { id: string; name: string; sortOrder: number; createdAt: Date }): MusicCategory {
  return { id: m.id, name: m.name, sort_order: m.sortOrder, created_at: m.createdAt.toISOString() }
}

export const musicCategories = {
  async findAll(): Promise<MusicCategory[]> {
    const rows = await prisma.musicCategory.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] })
    return rows.map(mapMusicCategory)
  },

  async create(name: string): Promise<MusicCategory> {
    const last = await prisma.musicCategory.findFirst({ orderBy: { sortOrder: 'desc' }, select: { sortOrder: true } })
    const m = await prisma.musicCategory.create({ data: { name, sortOrder: (last?.sortOrder ?? 0) + 1 } })
    return mapMusicCategory(m)
  },

  /**
   * Ganti nama kategori SEKALIGUS memindahkan trek yang menempel padanya.
   *
   * MusicTrack.category adalah string, bukan foreign key. Sebelumnya rename
   * hanya menyentuh baris kategori, jadi seluruh trek lama tetap memegang nama
   * lama: hilang dari filter mana pun dan tidak bisa ditemukan lagi lewat UI.
   */
  async update(id: string, data: Partial<{ name: string; sort_order: number }>): Promise<MusicCategory | null> {
    const existing = await prisma.musicCategory.findUnique({ where: { id } })
    if (!existing) return null
    const nextName = data.name
    const renaming = nextName !== undefined && nextName !== existing.name

    try {
      const [m] = await prisma.$transaction([
        prisma.musicCategory.update({
          where: { id },
          data: {
            ...(nextName !== undefined && { name: nextName }),
            ...(data.sort_order !== undefined && { sortOrder: data.sort_order }),
          },
        }),
        ...(renaming
          ? [prisma.musicTrack.updateMany({ where: { category: existing.name }, data: { category: nextName as string } })]
          : []),
      ])
      return mapMusicCategory(m)
    } catch { return null }
  },

  /**
   * Hapus kategori; trek di dalamnya dipindahkan ke "Lainnya".
   *
   * Tanpa pemindahan ini trek jadi yatim: memegang nama kategori yang sudah
   * tidak ada, sehingga tidak muncul di chip filter mana pun dan praktis
   * hilang dari UI. Mengembalikan jumlah trek yang dipindahkan supaya panel
   * bisa memberitahu admin apa yang barusan terjadi.
   */
  async delete(id: string): Promise<{ ok: boolean; moved: number }> {
    const existing = await prisma.musicCategory.findUnique({ where: { id } })
    if (!existing) return { ok: false, moved: 0 }

    try {
      const [, moved] = await prisma.$transaction([
        prisma.musicCategory.delete({ where: { id } }),
        prisma.musicTrack.updateMany({
          where: { category: existing.name },
          data: { category: MUSIC_FALLBACK_CATEGORY },
        }),
      ])
      return { ok: true, moved: moved.count }
    } catch { return { ok: false, moved: 0 } }
  },
}
