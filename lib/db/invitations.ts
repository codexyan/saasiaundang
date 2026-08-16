import { cache } from 'react'
import { prisma } from '../prisma'
import type { Invitation } from '../types'

function mapInvitation(i: {
  id: string; userId: string; slug: string; templateId: string; data: unknown;
  packageTier: string | null; isPublished: boolean; isPaid: boolean;
  expiresAt: Date | null; referredBy: string | null; createdAt: Date
}): Invitation {
  return {
    id: i.id, user_id: i.userId, slug: i.slug, template_id: i.templateId,
    data: i.data as Invitation['data'],
    package_tier: (i.packageTier ?? undefined) as Invitation['package_tier'],
    is_published: i.isPublished, is_paid: i.isPaid,
    expires_at: i.expiresAt ? i.expiresAt.toISOString() : null,
    referred_by: i.referredBy,
    created_at: i.createdAt.toISOString(),
  }
}

//  INVITATIONS

export const invitations = {
  // Dibungkus cache() dari 'react': halaman undangan memanggil ini dua kali
  // terpisah per load (sekali di generateMetadata, sekali di komponen
  // halaman). Tanpa dedup, itu dua round-trip Hyperdrive untuk data yang
  // sama. Pola ini sudah terbukti aman di lib/session-server.ts — dedupnya
  // per request/render, tidak bocor lintas request di Workers.
  findBySlug: cache(async (slug: string): Promise<Invitation | null> => {
    const i = await prisma.invitation.findUnique({ where: { slug } })
    return i ? mapInvitation(i) : null
  }),
  async findByUserId(userId: string): Promise<Invitation | null> {
    const i = await prisma.invitation.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } })
    return i ? mapInvitation(i) : null
  },
  async findById(id: string): Promise<Invitation | null> {
    const i = await prisma.invitation.findUnique({ where: { id } })
    return i ? mapInvitation(i) : null
  },
  // take:200 sebagai pagar pengaman, bukan pagination penuh — mencegah panel
  // admin diam-diam memuat ribuan baris seiring data produksi bertambah besar.
  async findAll(): Promise<Invitation[]> {
    const all = await prisma.invitation.findMany({ orderBy: { createdAt: 'desc' }, take: 200 })
    return all.map(mapInvitation)
  },
  async create(data: Omit<Invitation, 'id' | 'created_at'>): Promise<Invitation> {
    const i = await prisma.invitation.create({
      data: {
        userId: data.user_id, slug: data.slug, templateId: data.template_id,
        data: data.data as object,
        packageTier: data.package_tier ?? null,
        isPublished: data.is_published, isPaid: data.is_paid,
        expiresAt: data.expires_at ? new Date(data.expires_at) : null,
        referredBy: data.referred_by ?? null,
      },
    })
    return mapInvitation(i)
  },
  async update(id: string, data: Partial<Omit<Invitation, 'id' | 'created_at' | 'user_id'>>): Promise<Invitation | null> {
    try {
      const i = await prisma.invitation.update({
        where: { id },
        data: {
          ...(data.slug !== undefined && { slug: data.slug }),
          ...(data.template_id !== undefined && { templateId: data.template_id }),
          ...(data.data !== undefined && { data: data.data as object }),
          ...(data.package_tier !== undefined && { packageTier: data.package_tier }),
          ...(data.is_published !== undefined && { isPublished: data.is_published }),
          ...(data.is_paid !== undefined && { isPaid: data.is_paid }),
          ...(data.expires_at !== undefined && { expiresAt: data.expires_at ? new Date(data.expires_at) : null }),
        },
      })
      return mapInvitation(i)
    } catch {
      return null
    }
  },
  async delete(id: string): Promise<void> {
    await prisma.invitation.delete({ where: { id } })
  },
  async slugExists(slug: string, excludeId?: string): Promise<boolean> {
    const count = await prisma.invitation.count({ where: { slug, ...(excludeId && { id: { not: excludeId } }) } })
    return count > 0
  },
}
