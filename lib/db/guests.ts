import { prisma } from '../prisma'
import type { Guest } from '../types'

function mapGuest(g: {
  id: string; invitationId: string; name: string; phone: string; group: string; note: string; source: string
  attending: boolean | null; totalGuests: number; blastSentAt: Date | null; createdAt: Date
}): Guest {
  return {
    id: g.id, invitation_id: g.invitationId, name: g.name,
    phone: g.phone, group: g.group, note: g.note, source: g.source as Guest['source'],
    attending: g.attending, total_guests: g.totalGuests,
    blast_sent_at: g.blastSentAt?.toISOString() ?? null,
    created_at: g.createdAt.toISOString(),
  }
}

//  GUESTS

export const guests = {
  async findByInvitationId(invitationId: string): Promise<Guest[]> {
    const all = await prisma.guest.findMany({ where: { invitationId }, orderBy: { createdAt: 'desc' } })
    return all.map(mapGuest)
  },
  async create(data: Omit<Guest, 'id' | 'created_at' | 'blast_sent_at'>): Promise<Guest> {
    const g = await prisma.guest.create({
      data: {
        invitationId: data.invitation_id, name: data.name,
        phone: data.phone || '', group: data.group || '', note: data.note || '',
        source: data.source || 'manual',
        attending: data.attending, totalGuests: data.total_guests,
      },
    })
    return mapGuest(g)
  },
  async update(id: string, data: Partial<Pick<Guest, 'name' | 'phone' | 'group' | 'note' | 'attending' | 'total_guests'>>): Promise<Guest> {
    const g = await prisma.guest.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.group !== undefined && { group: data.group }),
        ...(data.note !== undefined && { note: data.note }),
        ...(data.attending !== undefined && { attending: data.attending }),
        ...(data.total_guests !== undefined && { totalGuests: data.total_guests }),
      },
    })
    return mapGuest(g)
  },
  async delete(id: string): Promise<void> {
    await prisma.guest.delete({ where: { id } })
  },
  /**
   * Apakah tamu ini benar milik undangan si user?
   *
   * update()/delete() di atas hanya menerima id, jadi route WAJIB memanggil ini
   * lebih dulu. Sebelumnya PATCH dan DELETE di /api/guests hanya memeriksa
   * "sudah login", tanpa memeriksa kepemilikan — siapa pun yang punya akun bisa
   * mengubah atau menghapus daftar tamu pasangan lain hanya dengan menebak id.
   */
  async isOwnedBy(id: string, userId: string): Promise<boolean> {
    const found = await prisma.guest.findFirst({
      where: { id, invitation: { userId } },
      select: { id: true },
    })
    return found !== null
  },
  /** Hanya menandai tamu yang benar-benar milik user. Mengembalikan jumlah yang tertandai. */
  async markBlastSent(ids: string[], userId: string): Promise<number> {
    const result = await prisma.guest.updateMany({
      where: { id: { in: ids }, invitation: { userId } },
      data: { blastSentAt: new Date() },
    })
    return result.count
  },
  async countByInvitation(invitationId: string): Promise<{ total: number; attending: number; declined: number; pending: number }> {
    const all = await prisma.guest.findMany({ where: { invitationId }, select: { attending: true } })
    return {
      total: all.length,
      attending: all.filter(g => g.attending === true).length,
      declined: all.filter(g => g.attending === false).length,
      pending: all.filter(g => g.attending === null).length,
    }
  },
}
