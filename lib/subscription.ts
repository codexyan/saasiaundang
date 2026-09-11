import { prisma } from './prisma'
import { resolveExpiry } from './tiers'

// ─── Domain Types ────────────────────────────────────────────

export type SubscriptionStatus = 'active' | 'expiring_soon' | 'expired' | 'cancelled'

/** Tier langganan. `string` karena admin bisa membuat paket sendiri lewat
 *  panel Paket & Promo — id-nya tidak lagi terbatas starter/popular/eksklusif.
 */
export type SubscriptionTier = string

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
  tier: string
}

// ─── Lifecycle Constants ─────────────────────────────────────

// Mesin trial (TRIAL_TIER, TRIAL_DAYS, TRIAL_GRACE_DAYS, TRIAL_LIMITS,
// createTrial, isTrial, isInGracePeriod) dibuang. Satu-satunya pembuat
// langganan trial adalah POST /api/invitations, jalur undangan gratis yang
// sudah ditutup, jadi langganan sekarang hanya lahir dari pembelian lewat
// provisionPaidOrder. TRIAL_LIMITS pun tidak pernah dibaca kode penegak batas
// mana pun, cuma ikut dikirim /api/user/subscription tanpa ada yang membacanya.
const EXPIRING_SOON_DAYS = 7

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

  async renew(subscriptionId: string, tier?: string): Promise<SubscriptionRecord> {
    const old = await prisma.subscription.findUniqueOrThrow({
      where: { id: subscriptionId },
    })

    const renewTier = tier ?? old.tier
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
