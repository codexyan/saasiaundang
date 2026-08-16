import { prisma } from '../prisma'
import type { Gallery } from '../types'

function mapGallery(g: { id: string; invitationId: string; url: string; order: number }): Gallery {
  return { id: g.id, invitation_id: g.invitationId, url: g.url, order: g.order }
}

//  GALLERIES

export const galleries = {
  async findByInvitationId(invitationId: string): Promise<Gallery[]> {
    const all = await prisma.gallery.findMany({ where: { invitationId }, orderBy: { order: 'asc' } })
    return all.map(mapGallery)
  },
  async findById(id: string): Promise<Gallery | null> {
    const g = await prisma.gallery.findUnique({ where: { id } })
    return g ? mapGallery(g) : null
  },
  async create(data: Omit<Gallery, 'id'>): Promise<Gallery> {
    const g = await prisma.gallery.create({
      data: { invitationId: data.invitation_id, url: data.url, order: data.order },
    })
    return mapGallery(g)
  },
  async delete(id: string): Promise<void> {
    await prisma.gallery.delete({ where: { id } })
  },
}
