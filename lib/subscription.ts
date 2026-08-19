import { prisma } from './prisma'
import type { PackageTier } from './packages'
import { resolveExpiry } from './tiers'

// ─── Domain Types ────────────────────────────────────────────

export type SubscriptionStatus = 'active' | 'expiring_soon' | 'expired' | 'cancelled'

export const TRIAL_TIER = 'trial' as const
export type SubscriptionTier = PackageTier | typeof TRIAL_TIER

export interface SubscriptionRecord {
  id: string
  invitationId: string
  userId: string
  orderId: string | null
  tier: SubscriptionTier
  status: SubscriptionStatus
  startsAt: string
  expiresAt: string
  cancelledAt: string | null
  renewedFrom: string | null
  createdAt: string
}

export interface CreateSubscriptionInput {
  invitationId: string
  userId: string
  orderId?: string
  tier: PackageTier
}

// ─── Lifecycle Constants ─────────────────────────────────────

const EXPIRING_SOON_DAYS = 7
const TRIAL_DAYS = 7
const TRIAL_GRACE_DAYS = 14

// ─── Trial Limits ────────────────────────────────────────────

export const TRIAL_LIMITS = {
  maxPhotos: 5,
  maxGuests: 50,
  durationDays: TRIAL_DAYS,
  graceDays: TRIAL_GRACE_DAYS,
  showWatermark: true,
} as const

// ─── Status Resolution ───────────────────────────────────────

export function resolveStatus(expiresAt: Date, cancelledAt: Date | null): SubscriptionStatus {
  if (cancelledAt) return 'cancelled'
  const now = new Date()
  if (expiresAt < now) return 'expired'
  const daysLeft = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  if (daysLeft <= EXPIRING_SOON_DAYS) return 'expiring_soon'
  return 'active'
}

export function daysRemaining(expiresAt: string): number {
  const diff = new Date(expiresAt).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export function isActive(sub: SubscriptionRecord): boolean {
  return sub.status === 'active' || sub.status === 'expiring_soon'
}

// ─── Service Layer ───────────────────────────────────────────

export function isTrial(sub: SubscriptionRecord): boolean {
  return sub.tier === TRIAL_TIER
}

export function isInGracePeriod(sub: SubscriptionRecord): boolean {
  if (sub.tier !== TRIAL_TIER || sub.status !== 'expired') return false
  const expiredAt = new Date(sub.expiresAt)
  const graceEnd = new Date(expiredAt)
  graceEnd.setDate(graceEnd.getDate() + TRIAL_GRACE_DAYS)
  return new Date() < graceEnd
}

function toRecord(row: {
  id: string; invitationId: string; userId: string; orderId: string | null
  tier: string; status: string; startsAt: Date; expiresAt: Date
  cancelledAt: Date | null; renewedFrom: string | null; createdAt: Date
}): SubscriptionRecord {
  const status = resolveStatus(row.expiresAt, row.cancelledAt)
  return {
    id: row.id,
    invitationId: row.invitationId,
    userId: row.userId,
    orderId: row.orderId,
    tier: row.tier as SubscriptionTier,
    status,
    startsAt: row.startsAt.toISOString(),
    expiresAt: row.expiresAt.toISOString(),
    cancelledAt: row.cancelledAt?.toISOString() ?? null,
    renewedFrom: row.renewedFrom,
    createdAt: row.createdAt.toISOString(),
  }
}

export const subscriptions = {
  async createTrial(invitationId: string, userId: string): Promise<SubscriptionRecord> {
    const startsAt = new Date()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + TRIAL_DAYS)

    const row = await prisma.subscription.create({
      data: {
        invitationId,
        userId,
        tier: TRIAL_TIER,
        status: 'active',
        startsAt,
        expiresAt,
      },
    })
    return toRecord(row)
  },

  async create(input: CreateSubscriptionInput): Promise<SubscriptionRecord> {
    const startsAt = new Date()
    // validity_days dari pengaturan admin — satu satuan untuk seluruh sistem.
    const expiresAt = await resolveExpiry(input.tier, startsAt)

    const row = await prisma.subscription.create({
      data: {
        invitationId: input.invitationId,
        userId: input.userId,
        orderId: input.orderId ?? null,
        tier: input.tier,
        status: 'active',
        startsAt,
        expiresAt,
      },
    })
    return toRecord(row)
  },

  async findByInvitation(invitationId: string): Promise<SubscriptionRecord | null> {
    const row = await prisma.subscription.findFirst({
      where: { invitationId },
      orderBy: { createdAt: 'desc' },
    })
    return row ? toRecord(row) : null
  },

  async findByUser(userId: string): Promise<SubscriptionRecord[]> {
    const rows = await prisma.subscription.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
    return rows.map(toRecord)
  },

  async findExpiringSoon(withinDays = EXPIRING_SOON_DAYS): Promise<SubscriptionRecord[]> {
    const now = new Date()
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() + withinDays)

    const rows = await prisma.subscription.findMany({
      where: {
        status: 'active',
        expiresAt: { gte: now, lte: cutoff },
        cancelledAt: null,
      },
      orderBy: { expiresAt: 'asc' },
    })
    return rows.map(toRecord)
  },

  async findExpired(): Promise<SubscriptionRecord[]> {
    const rows = await prisma.subscription.findMany({
      where: {
        status: { in: ['active', 'expiring_soon'] },
        expiresAt: { lt: new Date() },
        cancelledAt: null,
      },
    })
    return rows.map(toRecord)
  },

  async renew(subscriptionId: string, tier?: PackageTier): Promise<SubscriptionRecord> {
    const old = await prisma.subscription.findUniqueOrThrow({
      where: { id: subscriptionId },
    })

    const renewTier = (tier ?? old.tier) as PackageTier
    const startsAt = new Date(Math.max(old.expiresAt.getTime(), Date.now()))
    const expiresAt = await resolveExpiry(renewTier, startsAt)

    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { status: 'expired' },
    })

    const row = await prisma.subscription.create({
      data: {
        invitationId: old.invitationId,
        userId: old.userId,
        tier: renewTier,
        status: 'active',
        startsAt,
        expiresAt,
        renewedFrom: subscriptionId,
      },
    })
    return toRecord(row)
  },

  async cancel(subscriptionId: string): Promise<SubscriptionRecord> {
    const row = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { status: 'cancelled', cancelledAt: new Date() },
    })
    return toRecord(row)
  },

  async markExpired(subscriptionId: string): Promise<void> {
    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { status: 'expired' },
    })
  },

  async syncExpiredStatuses(): Promise<number> {
    const result = await prisma.subscription.updateMany({
      where: {
        status: { in: ['active', 'expiring_soon'] },
        expiresAt: { lt: new Date() },
        cancelledAt: null,
      },
      data: { status: 'expired' },
    })
    return result.count
  },
}
