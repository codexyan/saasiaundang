import { prisma } from '../prisma'
import type { Wish } from '../types'

function mapWish(w: { id: string; invitationId: string; name: string; message: string; createdAt: Date }): Wish {
  return { id: w.id, invitation_id: w.invitationId, name: w.name, message: w.message, created_at: w.createdAt.toISOString() }
}

//  WISHES

export const wishes = {
  async findByInvitationId(invitationId: string): Promise<Wish[]> {
    const all = await prisma.wish.findMany({ where: { invitationId }, orderBy: { createdAt: 'desc' } })
    return all.map(mapWish)
  },
  async create(data: Omit<Wish, 'id' | 'created_at'>): Promise<Wish> {
    const w = await prisma.wish.create({
      data: { invitationId: data.invitation_id, name: data.name, message: data.message },
    })
    return mapWish(w)
  },
  async delete(id: string): Promise<void> {
    await prisma.wish.delete({ where: { id } })
  },
}
