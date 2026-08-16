import { prisma } from '../prisma'

//  WRITER PROFILES

export interface WriterProfileData {
  id: string
  userId: string
  bio: string
  avatarUrl: string
  socialLinks: Record<string, unknown>
  isTrusted: boolean
  createdAt: string
}

function mapWriterProfile(row: {
  id: string; userId: string; bio: string; avatarUrl: string;
  socialLinks: import('@prisma/client').Prisma.JsonValue; isTrusted: boolean; createdAt: Date;
}): WriterProfileData {
  return {
    id: row.id,
    userId: row.userId,
    bio: row.bio,
    avatarUrl: row.avatarUrl,
    socialLinks: (typeof row.socialLinks === 'object' && row.socialLinks !== null ? row.socialLinks : {}) as Record<string, unknown>,
    isTrusted: row.isTrusted,
    createdAt: row.createdAt.toISOString(),
  }
}

export const writerProfiles = {
  async findByUserId(userId: string): Promise<WriterProfileData | null> {
    const row = await prisma.writerProfile.findUnique({ where: { userId } })
    return row ? mapWriterProfile(row) : null
  },

  async upsert(userId: string, data: Partial<{ bio: string; avatarUrl: string; socialLinks: Record<string, unknown>; isTrusted: boolean }>): Promise<WriterProfileData> {
    const row = await prisma.writerProfile.upsert({
      where: { userId },
      create: {
        userId,
        bio: data.bio ?? '',
        avatarUrl: data.avatarUrl ?? '',
        socialLinks: (data.socialLinks ?? {}) as import('@prisma/client').Prisma.InputJsonValue,
        isTrusted: data.isTrusted ?? false,
      },
      update: {
        ...(data.bio !== undefined ? { bio: data.bio } : {}),
        ...(data.avatarUrl !== undefined ? { avatarUrl: data.avatarUrl } : {}),
        ...(data.socialLinks !== undefined ? { socialLinks: data.socialLinks as import('@prisma/client').Prisma.InputJsonValue } : {}),
        ...(data.isTrusted !== undefined ? { isTrusted: data.isTrusted } : {}),
      },
    })
    return mapWriterProfile(row)
  },
}
