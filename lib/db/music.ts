import { prisma } from '../prisma'
import type { MusicTrack, MusicCategory } from '../types'

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
    const m = await prisma.musicTrack.create({
      data: { title: data.title, artist: data.artist ?? '', category: data.category ?? 'Lainnya', url: data.url, duration: data.duration ?? 0, fileSize: data.file_size ?? 0 },
    })
    return mapMusicTrack(m)
  },

  async incrementUsage(id: string): Promise<void> {
    try { await prisma.musicTrack.update({ where: { id }, data: { usageCount: { increment: 1 } } }) } catch {}
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

  async delete(id: string): Promise<boolean> {
    try { await prisma.musicTrack.delete({ where: { id } }); return true } catch { return false }
  },

  async categories(): Promise<string[]> {
    const rows = await prisma.musicTrack.findMany({ select: { category: true }, distinct: ['category'], orderBy: { category: 'asc' } })
    return rows.map(r => r.category)
  },

  async topTracks(limit = 10): Promise<MusicTrack[]> {
    const rows = await prisma.musicTrack.findMany({ where: { isActive: true }, orderBy: { usageCount: 'desc' }, take: limit })
    return rows.map(mapMusicTrack)
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
    const m = await prisma.musicCategory.create({ data: { name } })
    return mapMusicCategory(m)
  },

  async update(id: string, data: Partial<{ name: string; sort_order: number }>): Promise<MusicCategory | null> {
    try {
      const m = await prisma.musicCategory.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.sort_order !== undefined && { sortOrder: data.sort_order }),
        },
      })
      return mapMusicCategory(m)
    } catch { return null }
  },

  async delete(id: string): Promise<boolean> {
    try { await prisma.musicCategory.delete({ where: { id } }); return true } catch { return false }
  },
}
