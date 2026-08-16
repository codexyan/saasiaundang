/**
 * Database layer   Prisma + Supabase PostgreSQL
 * Interface identik dengan versi JSON sebelumnya, semua fungsi sekarang async.
 */

import { prisma } from './prisma'
import { BUILT_IN_CATEGORIES, BUILT_IN_PRICE_TIERS, BUILT_IN_PALETTES } from './built-in-data'
import type { Invitation, Gallery, Guest, Wish, TemplateRecord, TemplatePackageRequirement, TemplateCategory, ColorPalette, PriceTier, TierFeatures, FlashSale, Coupon, MusicTrack, MusicCategory, Order } from './types'
import JAVANESE_GOLD from './template-configs/javanese-gold'
import ROSE_GARDEN from './template-configs/rose-garden'
import MIDNIGHT_LUXE from './template-configs/midnight-luxe'

//  TYPE EXPORTS 

export type UserRole = 'admin' | 'content_writer' | 'affiliate' | 'user'

export interface DbUser {
  id: string
  email: string
  password_hash: string
  role?: UserRole
  referral_code?: string | null
  created_at: string
}

export interface BankAccount {
  id: string
  bankName: string
  accountNumber: string
  accountName: string
  logoUrl: string
  isActive: boolean
}

export interface AdminTemplateConfig {
  id: string
  name: string
  description: string
  thumbnailUrl: string
  demoSlug: string
  tags: string[]
  enabled: boolean
  sortOrder: number
  themeColor: string
  isBuiltIn: boolean
  features: {
    gallery: boolean
    music: boolean
    countdown: boolean
    rsvp: boolean
    wishes: boolean
  }
  price: number
  required_package: TemplatePackageRequirement
}

export interface AppSettings {
  price: number
  packageName: string
  packageDuration: number
  promoEndDate: string
  templates: AdminTemplateConfig[]
  categories: TemplateCategory[]
  colorPalettes: ColorPalette[]
  priceTiers: PriceTier[]
  flashSales: FlashSale[]
  coupons: Coupon[]
  deletedCategoryIds: string[]
  deletedTierIds: string[]
  bankAccounts: BankAccount[]
  qrisImageUrl: string
  paymentInstructions: string
  confirmationWhatsapp: string
  siteName: string
  siteTagline: string
  logoHorizontalUrl: string
  logoVerticalUrl: string
  contactWhatsapp: string
  contactEmail: string
  socialInstagram: string
  socialTwitter: string
  socialGithub: string
  appDomain: string
  demoSubdomain: string
  maintenanceMode: boolean
}

export interface PaymentProof {
  id: string
  invitation_id: string
  user_id: string
  user_email: string
  slug: string
  amount: number
  bank_name: string
  transfer_date: string
  proof_url: string
  notes: string
  status: 'pending' | 'approved' | 'rejected'
  admin_notes: string
  created_at: string
  reviewed_at: string | null
}

//  MAPPERS 

function mapUser(u: { id: string; email: string; passwordHash: string; role: string; referralCode: string | null; createdAt: Date }): DbUser {
  return { id: u.id, email: u.email, password_hash: u.passwordHash, role: u.role as UserRole, referral_code: u.referralCode, created_at: u.createdAt.toISOString() }
}

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

function mapGallery(g: { id: string; invitationId: string; url: string; order: number }): Gallery {
  return { id: g.id, invitation_id: g.invitationId, url: g.url, order: g.order }
}

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

function mapWish(w: { id: string; invitationId: string; name: string; message: string; createdAt: Date }): Wish {
  return { id: w.id, invitation_id: w.invitationId, name: w.name, message: w.message, created_at: w.createdAt.toISOString() }
}

function mapTemplateRecord(t: {
  id: string; name: string; slug: string; category: string; config: unknown;
  thumbnailUrl: string; status: string; sortOrder: number; usageCount: number;
  price: number; requiredPackage: string; createdAt: Date
}): TemplateRecord {
  return {
    id: t.id, name: t.name, slug: t.slug, category: t.category,
    config: t.config as TemplateRecord['config'],
    thumbnail_url: t.thumbnailUrl, status: t.status as TemplateRecord['status'],
    sort_order: t.sortOrder, usage_count: t.usageCount, price: t.price,
    required_package: t.requiredPackage as TemplatePackageRequirement,
    created_at: t.createdAt.toISOString(),
  }
}

function mapPaymentProof(p: {
  id: string; invitationId: string; userId: string; userEmail: string; slug: string;
  amount: number; bankName: string; transferDate: string; proofUrl: string; notes: string;
  status: string; adminNotes: string; createdAt: Date; reviewedAt: Date | null
}): PaymentProof {
  return {
    id: p.id, invitation_id: p.invitationId, user_id: p.userId, user_email: p.userEmail,
    slug: p.slug, amount: p.amount, bank_name: p.bankName, transfer_date: p.transferDate,
    proof_url: p.proofUrl, notes: p.notes, status: p.status as PaymentProof['status'],
    admin_notes: p.adminNotes, created_at: p.createdAt.toISOString(),
    reviewed_at: p.reviewedAt ? p.reviewedAt.toISOString() : null,
  }
}

//  USERS 

export const users = {
  async findByEmail(email: string): Promise<DbUser | null> {
    const u = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
    return u ? mapUser(u) : null
  },
  async findById(id: string): Promise<DbUser | null> {
    const u = await prisma.user.findUnique({ where: { id } })
    return u ? mapUser(u) : null
  },
  async create(data: { email: string; password_hash: string; role?: UserRole }): Promise<DbUser> {
    const u = await prisma.user.create({
      data: { email: data.email.toLowerCase(), passwordHash: data.password_hash, role: data.role ?? 'user' },
    })
    return mapUser(u)
  },
  async findAll(): Promise<DbUser[]> {
    const all = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } })
    return all.map(mapUser)
  },
  async delete(id: string): Promise<void> {
    await prisma.user.delete({ where: { id } })
  },
  /**
   * Ganti password DAN cabut seluruh sesi lama sekaligus.
   *
   * Menaikkan sessionEpoch membuat semua token JWT yang sudah beredar untuk
   * user ini tidak berlaku lagi. Tanpa itu, token stateless berumur 30 hari
   * yang sudah dicuri tetap bisa dipakai SETELAH korban mereset passwordnya —
   * yaitu justru saat korban mengira dirinya sudah aman.
   *
   * Keduanya dalam satu update supaya tidak mungkin password berganti tanpa
   * sesinya ikut dicabut.
   */
  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { passwordHash, sessionEpoch: { increment: 1 } },
    })
  },
  /** Cabut semua sesi tanpa mengganti password. */
  async revokeSessions(id: string): Promise<void> {
    await prisma.user.update({ where: { id }, data: { sessionEpoch: { increment: 1 } } })
  },
  /**
   * Baca generasi sesi TANPA cache.
   *
   * Sengaja `$queryRaw` dan bukan findUnique: Hyperdrive meng-cache query SELECT
   * non-mutasi, dan itu terbukti membuat pencabutan sesi tertunda ~60 detik —
   * diuji langsung, token lama masih diterima 7 kali sebelum akhirnya ditolak.
   * Untuk kontrol autentikasi, lubang selama satu menit justru jatuh tepat pada
   * saat akun sedang disalahgunakan.
   *
   * NOW() bersifat volatile, dan Hyperdrive tidak meng-cache query yang memuat
   * fungsi volatile — itulah gunanya kolom itu di sini, nilainya sendiri tidak dipakai.
   *
   * Biayanya satu round-trip database per request terautentikasi. Masih murah
   * karena request terautentikasi hanya dashboard/admin; halaman undangan publik
   * tidak memanggil getSession() sama sekali.
   */
  async sessionEpoch(id: string): Promise<number | null> {
    const rows = await prisma.$queryRaw<{ session_epoch: number }[]>`
      SELECT session_epoch, NOW() AS uncached_marker FROM users WHERE id = ${id} LIMIT 1
    `
    return rows.length > 0 ? Number(rows[0].session_epoch) : null
  },
  async updateRole(id: string, role: UserRole): Promise<void> {
    await prisma.user.update({ where: { id }, data: { role } })
  },
  async findByReferralCode(code: string): Promise<DbUser | null> {
    const u = await prisma.user.findUnique({ where: { referralCode: code } })
    return u ? mapUser(u) : null
  },
  async setReferralCode(id: string, code: string): Promise<void> {
    await prisma.user.update({ where: { id }, data: { referralCode: code } })
  },
}

// ─── USER REFERRALS ──────────────────────────────────────────

export interface UserReferralRecord {
  id: string
  referrer_id: string
  referred_id: string
  order_id: string | null
  status: 'pending' | 'completed' | 'rewarded'
  reward_type: string
  reward_value: number
  claimed_at: string | null
  created_at: string
}

export const userReferrals = {
  async create(data: { referrer_id: string; referred_id: string; order_id?: string }): Promise<UserReferralRecord> {
    const r = await prisma.userReferral.create({
      data: {
        referrerId: data.referrer_id,
        referredId: data.referred_id,
        orderId: data.order_id || null,
        rewardType: 'discount',
        rewardValue: 15000,
      },
    })
    return mapUserReferral(r)
  },

  async findByReferrerId(referrerId: string): Promise<UserReferralRecord[]> {
    const all = await prisma.userReferral.findMany({
      where: { referrerId },
      orderBy: { createdAt: 'desc' },
    })
    return all.map(mapUserReferral)
  },

  async countByReferrer(referrerId: string): Promise<{ total: number; completed: number; totalReward: number }> {
    const all = await prisma.userReferral.findMany({
      where: { referrerId },
      select: { status: true, rewardValue: true },
    })
    return {
      total: all.length,
      completed: all.filter(r => r.status === 'completed' || r.status === 'rewarded').length,
      totalReward: all.filter(r => r.status === 'rewarded').reduce((s, r) => s + r.rewardValue, 0),
    }
  },

  async markCompleted(referrerId: string, referredId: string): Promise<void> {
    await prisma.userReferral.updateMany({
      where: { referrerId, referredId, status: 'pending' },
      data: { status: 'completed' },
    })
  },
}

function mapUserReferral(r: { id: string; referrerId: string; referredId: string; orderId: string | null; status: string; rewardType: string; rewardValue: number; claimedAt: Date | null; createdAt: Date }): UserReferralRecord {
  return {
    id: r.id, referrer_id: r.referrerId, referred_id: r.referredId,
    order_id: r.orderId, status: r.status as UserReferralRecord['status'],
    reward_type: r.rewardType, reward_value: r.rewardValue,
    claimed_at: r.claimedAt?.toISOString() ?? null,
    created_at: r.createdAt.toISOString(),
  }
}

//  INVITATIONS

export const invitations = {
  async findBySlug(slug: string): Promise<Invitation | null> {
    const i = await prisma.invitation.findUnique({ where: { slug } })
    return i ? mapInvitation(i) : null
  },
  async findByUserId(userId: string): Promise<Invitation | null> {
    const i = await prisma.invitation.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } })
    return i ? mapInvitation(i) : null
  },
  async findById(id: string): Promise<Invitation | null> {
    const i = await prisma.invitation.findUnique({ where: { id } })
    return i ? mapInvitation(i) : null
  },
  async findAll(): Promise<Invitation[]> {
    const all = await prisma.invitation.findMany({ orderBy: { createdAt: 'desc' } })
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

//  GIFT PROOFS 

export interface GiftProofRecord {
  id: string
  invitation_id: string
  name: string
  proof_url: string
  created_at: string
}

export const giftProofs = {
  async create(data: { invitation_id: string; name: string; proof_url: string }): Promise<GiftProofRecord> {
    const r = await prisma.giftProof.create({
      data: { invitationId: data.invitation_id, name: data.name, proofUrl: data.proof_url },
    })
    return { id: r.id, invitation_id: r.invitationId, name: r.name, proof_url: r.proofUrl, created_at: r.createdAt.toISOString() }
  },
  async findByInvitationId(invitationId: string): Promise<GiftProofRecord[]> {
    const all = await prisma.giftProof.findMany({ where: { invitationId }, orderBy: { createdAt: 'desc' } })
    return all.map((r) => ({
      id: r.id, invitation_id: r.invitationId, name: r.name, proof_url: r.proofUrl, created_at: r.createdAt.toISOString(),
    }))
  },
}

//  TEMPLATE RECORDS 

const BUILT_IN_TEMPLATE_RECORDS: TemplateRecord[] = [JAVANESE_GOLD, ROSE_GARDEN, MIDNIGHT_LUXE]

export const templateRecords = {
  async findAll(): Promise<TemplateRecord[]> {
    const dbRecords = await prisma.templateRecord.findMany({ orderBy: { sortOrder: 'asc' } })
    const mapped = dbRecords.map(mapTemplateRecord)
    // Merge built-ins: DB overrides built-in by id if exists
    const map = new Map<string, TemplateRecord>()
    for (const t of BUILT_IN_TEMPLATE_RECORDS) map.set(t.id, t)
    for (const t of mapped) map.set(t.id, t)
    return Array.from(map.values()).sort((a, b) => a.sort_order - b.sort_order)
  },
  async findById(id: string): Promise<TemplateRecord | null> {
    const builtIn = BUILT_IN_TEMPLATE_RECORDS.find(t => t.id === id)
    const db = await prisma.templateRecord.findUnique({ where: { id } })
    if (db) return mapTemplateRecord(db)
    return builtIn ?? null
  },
  async findBySlug(slug: string): Promise<TemplateRecord | null> {
    const builtIn = BUILT_IN_TEMPLATE_RECORDS.find(t => t.slug === slug)
    const db = await prisma.templateRecord.findUnique({ where: { slug } })
    if (db) return mapTemplateRecord(db)
    return builtIn ?? null
  },
  async findActive(): Promise<TemplateRecord[]> {
    const all = await this.findAll()
    return all.filter(t => t.status === 'active')
  },
  async upsert(record: TemplateRecord): Promise<TemplateRecord> {
    const db = await prisma.templateRecord.upsert({
      where: { id: record.id },
      update: {
        name: record.name, slug: record.slug, category: record.category,
        config: record.config as object, thumbnailUrl: record.thumbnail_url,
        status: record.status, sortOrder: record.sort_order,
        usageCount: record.usage_count, price: record.price,
        requiredPackage: record.required_package,
      },
      create: {
        id: record.id, name: record.name, slug: record.slug, category: record.category,
        config: record.config as object, thumbnailUrl: record.thumbnail_url,
        status: record.status, sortOrder: record.sort_order,
        usageCount: record.usage_count, price: record.price,
        requiredPackage: record.required_package,
      },
    })
    return mapTemplateRecord(db)
  },
  async delete(id: string): Promise<void> {
    await prisma.templateRecord.delete({ where: { id } })
  },
}

//  SETTINGS

// Data bawaan dipindah ke lib/built-in-data.ts supaya bisa diimpor komponen
// client tanpa ikut menyeret Prisma/pg. Di-re-export di sini agar kode server
// lama yang mengimpornya dari @/lib/db tetap jalan.
export { BUILT_IN_CATEGORIES, BUILT_IN_PRICE_TIERS, BUILT_IN_PALETTES }

const BUILT_IN_TEMPLATES: AdminTemplateConfig[] = [
  {
    id: 'modern-white', name: 'Modern White', description: 'Bersih, minimalis, elegan.',
    thumbnailUrl: '/templates/modern-white/thumbnail.jpg', demoSlug: 'demo-modern',
    tags: ['minimalis', 'modern', 'putih'], enabled: true, price: 0, required_package: 'all',
    sortOrder: 1, themeColor: '#e11d48', isBuiltIn: true,
    features: { gallery: true, music: true, countdown: true, rsvp: true, wishes: true },
  },
  {
    id: 'floral-garden', name: 'Floral Garden', description: 'Penuh bunga dan warna hangat.',
    thumbnailUrl: '/templates/floral-garden/thumbnail.jpg', demoSlug: 'demo-floral',
    tags: ['bunga', 'romantis', 'feminin'], enabled: true, price: 0, required_package: 'all',
    sortOrder: 2, themeColor: '#ec4899', isBuiltIn: true,
    features: { gallery: true, music: true, countdown: true, rsvp: true, wishes: true },
  },
  {
    id: 'dark-elegant', name: 'Dark Elegant', description: 'Gelap, mewah, dan berkesan.',
    thumbnailUrl: '/templates/dark-elegant/thumbnail.jpg', demoSlug: 'demo-dark',
    tags: ['gelap', 'mewah', 'elegan'], enabled: true, price: 0, required_package: 'all',
    sortOrder: 3, themeColor: '#f59e0b', isBuiltIn: true,
    features: { gallery: true, music: true, countdown: true, rsvp: true, wishes: true },
  },
]

const DEFAULT_SETTINGS: AppSettings = {
  price: 149000, packageName: 'Popular', packageDuration: 3, promoEndDate: '2026-08-31',
  templates: BUILT_IN_TEMPLATES, categories: BUILT_IN_CATEGORIES, colorPalettes: BUILT_IN_PALETTES,
  priceTiers: BUILT_IN_PRICE_TIERS, flashSales: [], coupons: [],
  deletedCategoryIds: [], deletedTierIds: [],
  bankAccounts: [
    { id: 'bca-1', bankName: 'BCA', accountNumber: '8730456192', accountName: 'PT Iaundang Digital', isActive: true, logoUrl: '' },
    { id: 'bsi-1', bankName: 'BSI', accountNumber: '7210384756', accountName: 'PT Iaundang Digital', isActive: true, logoUrl: '' },
  ],
  qrisImageUrl: '',
  paymentInstructions: 'Pastikan nominal transfer sesuai dengan total tagihan (termasuk kode unik) agar pembayaran dapat diverifikasi.\n\nLangkah pembayaran:\n1. Transfer ke salah satu rekening di atas sesuai nominal yang tertera\n2. Screenshot bukti transfer\n3. Klik tombol "Konfirmasi via WhatsApp" dan kirimkan bukti transfer\n4. Tim kami akan memverifikasi dalam 1×24 jam kerja\n5. Setelah diverifikasi, akun login akan dikirim via WhatsApp/email\n\nCatatan:\n• Pembayaran berlaku 1×24 jam sejak pesanan dibuat\n• Jika ada kendala, silakan hubungi admin via WhatsApp',
  confirmationWhatsapp: '628123456789', siteName: 'iaundang', siteTagline: 'Digital Wedding Invitation',
  logoHorizontalUrl: '/logos/logo-horizontal.png', logoVerticalUrl: '/logos/logo-vertical.png',
  contactWhatsapp: '628123456789', contactEmail: 'halo@iaundang.online',
  socialInstagram: 'ia.undang', socialTwitter: 'iaundang', socialGithub: 'iaundang',
  appDomain: 'iaundang.online', demoSubdomain: 'demo',
  maintenanceMode: false,
}

export const settings = {
  async get(): Promise<AppSettings> {
    const row = await prisma.appSetting.findUnique({ where: { key: 'main' } })
    const stored = (row?.value ?? {}) as Partial<AppSettings>

    let templates = BUILT_IN_TEMPLATES
    if (stored.templates && stored.templates.length > 0) {
      templates = stored.templates
      for (const b of BUILT_IN_TEMPLATES) {
        if (!templates.find(t => t.id === b.id)) templates.push(b)
      }
    }

    const deletedCatIds = new Set(stored.deletedCategoryIds ?? [])
    const deletedTierIds = new Set(stored.deletedTierIds ?? [])

    const storedCategories = (stored.categories ?? []) as TemplateCategory[]
    const categories: TemplateCategory[] = [
      ...BUILT_IN_CATEGORIES.filter(b => !deletedCatIds.has(b.slug)),
      ...storedCategories.filter(c => !BUILT_IN_CATEGORIES.find(b => b.slug === c.slug) && !deletedCatIds.has(c.slug)),
    ]

    const storedPalettes = (stored.colorPalettes ?? []) as ColorPalette[]
    const colorPalettes: ColorPalette[] = [
      ...BUILT_IN_PALETTES,
      ...storedPalettes.filter(p => !BUILT_IN_PALETTES.find(b => b.id === p.id)),
    ]

    const storedTiers = (stored.priceTiers ?? []) as PriceTier[]
    const priceTiers: PriceTier[] = [
      ...BUILT_IN_PRICE_TIERS.filter(b => !deletedTierIds.has(b.id)),
      ...storedTiers.filter(t => !BUILT_IN_PRICE_TIERS.find(b => b.id === t.id) && !deletedTierIds.has(t.id)),
    ]

    return { ...DEFAULT_SETTINGS, ...stored, templates, categories, colorPalettes, priceTiers, deletedCategoryIds: stored.deletedCategoryIds ?? [], deletedTierIds: stored.deletedTierIds ?? [], flashSales: stored.flashSales ?? [], coupons: stored.coupons ?? [], bankAccounts: stored.bankAccounts ?? [] }
  },
  async save(data: AppSettings): Promise<void> {
    await prisma.appSetting.upsert({
      where: { key: 'main' },
      update: { value: data as object },
      create: { key: 'main', value: data as object },
    })
  },
}

//  LANDING PAGE SETTINGS 

export interface LandingPageSettings {
  hero: {
    headline: string
    subheadline: string
    ctaPrimary: string
    ctaSecondary: string
    socialProofCount: string
    socialProofRating: string
  }
  heroMockup: {
    groomName: string
    brideName: string
    date: string
    venue: string
  }
  templateShowcase: {
    featured: { name: string; tagline: string; coverPhoto: string; primary: string; accent: string; href: string }
    comingSoon: { label: string; accent: string; bg: string }[]
  }
  personalisasiMockup: {
    guestName: string
    groomName: string
    brideName: string
  }
  trustBar: {
    items: { value: string; label: string }[]
  }
  testimonials: {
    items: { names: string; date: string; template: string; quote: string; initial: string; color: string }[]
  }
  faq: {
    items: { q: string; a: string }[]
  }
  howItWorks: {
    steps: { title: string; description: string }[]
  }
}

const DEFAULT_LANDING: LandingPageSettings = {
  hero: {
    headline: 'Undangan digital yang terasa personal sejak tamu membukanya',
    subheadline: 'Begitu tamu membuka undangan kalian, musik mengalir lembut dan nama mereka tersapa satu per satu. Kesan hangat yang terasa sejak detik pertama, tanpa perlu memasang aplikasi apa pun.',
    ctaPrimary: 'Mulai Buat Undangan',
    ctaSecondary: 'Lihat Demo',
    socialProofCount: '',
    socialProofRating: '',
  },
  heroMockup: {
    groomName: 'Rizky',
    brideName: 'Aulia',
    date: '12 · 04 · 2026',
    venue: 'Hotel Grand Ballroom, Jakarta',
  },
  templateShowcase: {
    featured: {
      name: 'Javanese Gold',
      tagline: 'Elegansi tradisi Jawa dalam sentuhan modern',
      coverPhoto: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=800&h=1200&fit=crop',
      primary: '#1a4a1a',
      accent: '#d4af37',
      href: '/demo/renderer?id=javanese-gold',
    },
    comingSoon: [
      { label: 'Modern Minimal', accent: '#64ffda', bg: '#060e1f' },
      { label: 'Romantic Bloom', accent: '#f5a0b5', bg: '#1a0810' },
    ],
  },
  personalisasiMockup: {
    guestName: 'Bapak & Ibu Hendra',
    groomName: 'Rizky',
    brideName: 'Aulia',
  },
  trustBar: {
    items: [
      { value: 'Gratis Preview', label: 'Coba sebelum bayar' },
      { value: '< 5 mnt', label: 'Cepat jadi' },
      { value: 'Sekali Bayar', label: 'Tanpa langganan' },
      { value: 'Tanpa Aplikasi', label: 'Langsung terbuka di HP' },
    ],
  },
  testimonials: {
    items: [
      { names: 'Rizky & Aulia', date: 'Maret 2026', template: 'Modern', quote: 'Tamunya banyak yang nanya "link undangannya keren banget, pakai apa?". Langsung kami rekomendasiin iaundang. Bikinnya cepat banget, kurang dari 30 menit sudah jadi.', initial: 'RA', color: '#2c4a34' },
      { names: 'Dimas & Nadia', date: 'Februari 2026', template: 'Casual', quote: 'Kami berdua kerja penuh waktu dan tidak ada waktu ngurusin undangan fisik. iaundang jadi jalan keluarnya: gampang, cantik, dan tamu bisa konfirmasi kehadiran langsung dari HP mereka.', initial: 'DN', color: '#9a7d3f' },
      { names: 'Fajar & Syifa', date: 'April 2026', template: 'Traditional', quote: 'Yang paling suka fitur nama tamu personalnya. Tamu merasa diperhatikan karena nama mereka muncul langsung di undangan. Banyak yang WA bilang terkesan.', initial: 'FS', color: '#4a6355' },
      { names: 'Hendra & Mita', date: 'Januari 2026', template: 'Modern', quote: 'Harga segini sudah dapat semua fitur lengkap, tidak ada tambahan biaya. Undangan kami masih bisa dibuka 6 bulan setelah nikah untuk kenangan.', initial: 'HM', color: '#5d7a6a' },
    ],
  },
  faq: {
    items: [
      { q: 'Bisa dilihat dulu hasilnya sebelum bayar?', a: 'Bisa. Pilih gaya yang kalian suka, masukkan nama kalian berdua, dan lihat sendiri hasilnya. Bayar hanya kalau sudah benar-benar cocok dan siap dibagikan ke tamu.' },
      { q: 'Tamu perlu download atau install sesuatu?', a: 'Tidak perlu sama sekali. Tamu cukup menyentuh tautan yang kalian kirim lewat WhatsApp, dan undangan langsung terbuka di HP mereka.' },
      { q: 'Berapa lama undangan bisa diakses setelah bayar?', a: '6 bulan penuh sejak tanggal pembelian. Lebih dari cukup untuk sebelum hari H, saat hari H, dan beberapa bulan setelahnya.' },
      { q: 'Bisa ganti foto atau detail acara setelah dibagikan?', a: 'Bisa, kapan saja dan sebanyak yang kalian mau. Ubah info acara, ganti foto, ganti musik, bahkan ganti gaya tampilan tanpa biaya tambahan.' },
      { q: 'Bagaimana cara tamu menerima undangan?', a: 'Setelah undangan kalian aktif, kalian dapat alamat sendiri seperti ikhwal-fani.iaundang.online. Tinggal salin dan kirim ke tamu lewat WhatsApp atau media apa pun.' },
      { q: 'Kalau ada yang membingungkan, ada yang bisa dihubungi?', a: 'Tentu. Hubungi kami lewat WhatsApp dan kami akan bantu dengan senang hati. Kami balas dalam 1 hari kerja.' },
    ],
  },
  howItWorks: {
    steps: [
      { title: 'Coba dulu, gratis', description: 'Tanpa daftar, tanpa bayar. Pilih template, masukkan nama, dan lihat hasilnya langsung.' },
      { title: 'Bayar sekali', description: 'Rp 149.000 untuk 6 bulan penuh. Tidak ada biaya tambahan atau langganan.' },
      { title: 'Isi detail & bagikan', description: 'Lengkapi detail acara, masukkan foto, pilih musik. Siap dalam kurang dari 30 menit.' },
    ],
  },
}

export const landingSettings = {
  async get(): Promise<LandingPageSettings> {
    const row = await prisma.appSetting.findUnique({ where: { key: 'landing' } })
    if (!row) return DEFAULT_LANDING
    const stored = row.value as Partial<LandingPageSettings>
    return {
      hero: { ...DEFAULT_LANDING.hero, ...stored.hero },
      heroMockup: { ...DEFAULT_LANDING.heroMockup, ...stored.heroMockup },
      templateShowcase: { ...DEFAULT_LANDING.templateShowcase, ...stored.templateShowcase },
      personalisasiMockup: { ...DEFAULT_LANDING.personalisasiMockup, ...stored.personalisasiMockup },
      trustBar: { ...DEFAULT_LANDING.trustBar, ...stored.trustBar },
      testimonials: { ...DEFAULT_LANDING.testimonials, ...stored.testimonials },
      faq: { ...DEFAULT_LANDING.faq, ...stored.faq },
      howItWorks: { ...DEFAULT_LANDING.howItWorks, ...stored.howItWorks },
    }
  },
  async save(data: LandingPageSettings): Promise<void> {
    await prisma.appSetting.upsert({
      where: { key: 'landing' },
      update: { value: data as object },
      create: { key: 'landing', value: data as object },
    })
  },
}

//  BLOG TYPOGRAPHY (global)

export interface BlogTypography {
  headingFont: string
  bodyFont: string
  bodySize: number   // px, paragraph base
  h2Scale: number    // multiplier of bodySize
  h3Scale: number
  lineHeight: number
}

export const DEFAULT_BLOG_TYPOGRAPHY: BlogTypography = {
  headingFont: 'var(--font-geist-sans), system-ui, sans-serif',
  bodyFont: 'var(--font-geist-sans), system-ui, sans-serif',
  bodySize: 17,
  h2Scale: 1.6,
  h3Scale: 1.3,
  lineHeight: 1.75,
}

export const blogTypography = {
  async get(): Promise<BlogTypography> {
    const row = await prisma.appSetting.findUnique({ where: { key: 'blog_typography' } })
    if (!row) return DEFAULT_BLOG_TYPOGRAPHY
    return { ...DEFAULT_BLOG_TYPOGRAPHY, ...(row.value as Partial<BlogTypography>) }
  },
  async save(data: BlogTypography): Promise<void> {
    await prisma.appSetting.upsert({
      where: { key: 'blog_typography' },
      update: { value: data as object },
      create: { key: 'blog_typography', value: data as object },
    })
  },
}

//  ARTICLES

export interface ArticleSettings {
  comments: {
    moderation: 'auto' | 'manual'
    bannedWords: string
    closeAfterDays: number
    requireLogin: boolean
    allowReplies: boolean
    maxLength: number
  }
  seo: {
    focusKeyword: string
    canonicalUrl: string
    ogImageUrl: string
    noIndex: boolean
  }
  ads: {
    enabled: boolean
    positions: string[]
    adCode: string
  }
  backlinks: {
    internal: string[]
    external: string[]
  }
  featured: boolean
  pinned: boolean
}

export const DEFAULT_ARTICLE_SETTINGS: ArticleSettings = {
  comments: {
    moderation: 'auto',
    bannedWords: '',
    closeAfterDays: 0,
    requireLogin: false,
    allowReplies: true,
    maxLength: 500,
  },
  seo: { focusKeyword: '', canonicalUrl: '', ogImageUrl: '', noIndex: false },
  ads: { enabled: false, positions: [], adCode: '' },
  backlinks: { internal: [], external: [] },
  featured: false,
  pinned: false,
}

export interface ArticleData {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  coverUrl: string
  authorId: string | null
  authorName: string
  authorAvatar: string
  isPublished: boolean
  publishedAt: string | null
  allowLikes: boolean
  allowComments: boolean
  likesCount: number
  viewsCount: number
  metaTitle: string
  metaDesc: string
  tags: string
  settings: ArticleSettings
  status: string
  submittedAt: string | null
  reviewNotes: string
  scheduledAt: string | null
  reviewedBy: string | null
  categoryId: string | null
  revisionSeenAt: string | null
  createdAt: string
  updatedAt: string
}

function mapArticle(row: {
  id: string; title: string; slug: string; excerpt: string; content: string;
  coverUrl: string; authorId: string | null; authorName: string; authorAvatar: string;
  isPublished: boolean; publishedAt: Date | null;
  allowLikes: boolean; allowComments: boolean; likesCount: number; viewsCount: number;
  metaTitle: string; metaDesc: string; tags: string; settings: import('@prisma/client').Prisma.JsonValue;
  status: string; submittedAt: Date | null; reviewNotes: string; scheduledAt: Date | null;
  reviewedBy: string | null; categoryId: string | null; revisionSeenAt: Date | null;
  createdAt: Date; updatedAt: Date;
}): ArticleData {
  const raw = (typeof row.settings === 'object' && row.settings !== null ? row.settings : {}) as Record<string, unknown>
  const settings: ArticleSettings = {
    ...DEFAULT_ARTICLE_SETTINGS,
    ...raw,
    comments: { ...DEFAULT_ARTICLE_SETTINGS.comments, ...(raw.comments as Record<string, unknown> ?? {}) },
    seo: { ...DEFAULT_ARTICLE_SETTINGS.seo, ...(raw.seo as Record<string, unknown> ?? {}) },
    ads: { ...DEFAULT_ARTICLE_SETTINGS.ads, ...(raw.ads as Record<string, unknown> ?? {}) },
    backlinks: { ...DEFAULT_ARTICLE_SETTINGS.backlinks, ...(raw.backlinks as Record<string, unknown> ?? {}) },
  }
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    content: row.content,
    coverUrl: row.coverUrl,
    authorId: row.authorId,
    authorName: row.authorName,
    authorAvatar: row.authorAvatar,
    isPublished: row.isPublished,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    allowLikes: row.allowLikes,
    allowComments: row.allowComments,
    likesCount: row.likesCount,
    viewsCount: row.viewsCount,
    metaTitle: row.metaTitle,
    metaDesc: row.metaDesc,
    tags: row.tags,
    settings,
    status: row.status,
    submittedAt: row.submittedAt?.toISOString() ?? null,
    reviewNotes: row.reviewNotes,
    scheduledAt: row.scheduledAt?.toISOString() ?? null,
    reviewedBy: row.reviewedBy,
    categoryId: row.categoryId,
    revisionSeenAt: row.revisionSeenAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export const articles = {
  async findAll(): Promise<ArticleData[]> {
    const rows = await prisma.article.findMany({ orderBy: { createdAt: 'desc' } })
    return rows.map(mapArticle)
  },

  async findPublished(): Promise<ArticleData[]> {
    const rows = await prisma.article.findMany({
      where: { isPublished: true },
      orderBy: { publishedAt: 'desc' },
    })
    return rows.map(mapArticle)
  },

  async findById(id: string): Promise<ArticleData | null> {
    const row = await prisma.article.findUnique({ where: { id } })
    return row ? mapArticle(row) : null
  },

  async findBySlug(slug: string): Promise<ArticleData | null> {
    const row = await prisma.article.findUnique({ where: { slug } })
    return row ? mapArticle(row) : null
  },

  async findByAuthorId(authorId: string): Promise<ArticleData[]> {
    const rows = await prisma.article.findMany({
      where: { authorId },
      orderBy: { createdAt: 'desc' },
    })
    return rows.map(mapArticle)
  },

  async incrementViews(id: string): Promise<void> {
    try { await prisma.article.update({ where: { id }, data: { viewsCount: { increment: 1 } } }) } catch {}
  },

  async incrementLikes(id: string): Promise<void> {
    try { await prisma.article.update({ where: { id }, data: { likesCount: { increment: 1 } } }) } catch {}
  },

  async create(data: {
    title: string; slug: string; excerpt: string; content: string; coverUrl?: string;
    authorId?: string; authorName?: string; authorAvatar?: string;
    allowLikes?: boolean; allowComments?: boolean; metaTitle?: string; metaDesc?: string; tags?: string;
    settings?: ArticleSettings; categoryId?: string | null;
  }): Promise<ArticleData> {
    const row = await prisma.article.create({
      data: {
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt,
        content: data.content,
        coverUrl: data.coverUrl ?? '',
        authorId: data.authorId ?? null,
        authorName: data.authorName ?? 'Tim iaundang',
        authorAvatar: data.authorAvatar ?? '',
        allowLikes: data.allowLikes,
        allowComments: data.allowComments,
        metaTitle: data.metaTitle ?? '',
        metaDesc: data.metaDesc ?? '',
        tags: data.tags ?? '',
        settings: (data.settings ?? DEFAULT_ARTICLE_SETTINGS) as unknown as import('@prisma/client').Prisma.InputJsonValue,
        categoryId: data.categoryId ?? null,
      },
    })
    return mapArticle(row)
  },

  async update(id: string, data: Partial<{
    title: string; slug: string; excerpt: string; content: string;
    coverUrl: string; authorId: string | null; authorName: string; authorAvatar: string;
    isPublished: boolean; publishedAt: string | null;
    allowLikes: boolean; allowComments: boolean; metaTitle: string; metaDesc: string; tags: string;
    settings: ArticleSettings; categoryId: string | null;
  }>): Promise<ArticleData> {
    const updateData: Record<string, unknown> = { ...data }
    if (data.publishedAt !== undefined) {
      updateData.publishedAt = data.publishedAt ? new Date(data.publishedAt) : null
    }
    const row = await prisma.article.update({ where: { id }, data: updateData })
    return mapArticle(row)
  },

  async delete(id: string): Promise<void> {
    await prisma.article.delete({ where: { id } })
  },

  //  Editorial workflow

  async submitForReview(id: string): Promise<ArticleData> {
    const row = await prisma.article.update({
      where: { id },
      data: { status: 'pending_review', submittedAt: new Date() },
    })
    return mapArticle(row)
  },

  async requestRevision(id: string, notes: string): Promise<ArticleData> {
    const row = await prisma.article.update({
      where: { id },
      // revisionSeenAt reset to null: this revision is "unseen" until the
      // writer opens the article again (drives the nav notification badge).
      data: { status: 'needs_revision', reviewNotes: notes, revisionSeenAt: null },
    })
    return mapArticle(row)
  },

  async approve(id: string, reviewedBy: string): Promise<ArticleData> {
    const existing = await prisma.article.findUnique({ where: { id }, select: { publishedAt: true } })
    const row = await prisma.article.update({
      where: { id },
      data: {
        status: 'published',
        isPublished: true,
        reviewedBy,
        publishedAt: existing?.publishedAt ?? new Date(),
      },
    })
    return mapArticle(row)
  },

  async schedule(id: string, scheduledAt: string | Date, reviewedBy: string): Promise<ArticleData> {
    const row = await prisma.article.update({
      where: { id },
      data: {
        status: 'scheduled',
        scheduledAt: new Date(scheduledAt),
        reviewedBy,
        isPublished: false,
      },
    })
    return mapArticle(row)
  },

  async archive(id: string): Promise<ArticleData> {
    const row = await prisma.article.update({
      where: { id },
      data: { status: 'archived', isPublished: false },
    })
    return mapArticle(row)
  },

  async findByStatus(status: string): Promise<ArticleData[]> {
    const rows = await prisma.article.findMany({
      where: { status },
      orderBy: { updatedAt: 'desc' },
    })
    return rows.map(mapArticle)
  },

  async findPendingCount(): Promise<number> {
    return prisma.article.count({ where: { status: 'pending_review' } })
  },

  async markRevisionSeen(id: string): Promise<ArticleData> {
    const row = await prisma.article.update({ where: { id }, data: { revisionSeenAt: new Date() } })
    return mapArticle(row)
  },

  async findUnseenRevisionCount(authorId: string): Promise<number> {
    return prisma.article.count({ where: { authorId, status: 'needs_revision', revisionSeenAt: null } })
  },

  // Cron helper: publish any 'scheduled' article whose scheduledAt has passed.
  async publishScheduledDue(): Promise<number> {
    const now = new Date()
    const res = await prisma.article.updateMany({
      where: { status: 'scheduled', scheduledAt: { lte: now } },
      data: { status: 'published', isPublished: true, publishedAt: now },
    })
    return res.count
  },
}

//  ARTICLE CATEGORIES

export interface ArticleCategoryData {
  id: string
  name: string
  slug: string
  sortOrder: number
  createdAt: string
}

function mapCategory(row: { id: string; name: string; slug: string; sortOrder: number; createdAt: Date }): ArticleCategoryData {
  return { id: row.id, name: row.name, slug: row.slug, sortOrder: row.sortOrder, createdAt: row.createdAt.toISOString() }
}

export const articleCategories = {
  async findAll(): Promise<ArticleCategoryData[]> {
    const rows = await prisma.articleCategory.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] })
    return rows.map(mapCategory)
  },

  async create(data: { name: string; slug: string; sortOrder?: number }): Promise<ArticleCategoryData> {
    const row = await prisma.articleCategory.create({
      data: { name: data.name, slug: data.slug, sortOrder: data.sortOrder ?? 0 },
    })
    return mapCategory(row)
  },

  async update(id: string, data: Partial<{ name: string; slug: string; sortOrder: number }>): Promise<ArticleCategoryData> {
    const row = await prisma.articleCategory.update({ where: { id }, data })
    return mapCategory(row)
  },

  async delete(id: string): Promise<void> {
    await prisma.articleCategory.delete({ where: { id } })
  },
}

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

//  PAYMENT PROOFS

export const paymentProofs = {
  async findAll(): Promise<PaymentProof[]> {
    const all = await prisma.paymentProof.findMany({ orderBy: { createdAt: 'desc' } })
    return all.map(mapPaymentProof)
  },
  async findByUserId(userId: string): Promise<PaymentProof[]> {
    const all = await prisma.paymentProof.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } })
    return all.map(mapPaymentProof)
  },
  async findByInvitationId(invitationId: string): Promise<PaymentProof[]> {
    const all = await prisma.paymentProof.findMany({ where: { invitationId }, orderBy: { createdAt: 'desc' } })
    return all.map(mapPaymentProof)
  },
  async findById(id: string): Promise<PaymentProof | null> {
    const p = await prisma.paymentProof.findUnique({ where: { id } })
    return p ? mapPaymentProof(p) : null
  },
  /**
   * Ubah status HANYA kalau masih 'pending'. Mengembalikan null kalau sudah
   * pernah diproses.
   *
   * Guard-nya ada di dalam `where` supaya atomik: hanya satu pemanggil yang
   * bisa memenangkan transisi. Dulu route menulis status tanpa syarat lalu
   * menjalankan efek sampingnya, jadi menyetujui bukti yang sama dua kali
   * membuat DUA baris langganan dan membayar komisi afiliasi DUA KALI.
   */
  async review(
    id: string,
    status: 'approved' | 'rejected',
    adminNotes: string
  ): Promise<PaymentProof | null> {
    const claimed = await prisma.paymentProof.updateMany({
      where: { id, status: 'pending' },
      data: { status, adminNotes, reviewedAt: new Date() },
    })
    if (claimed.count === 0) return null
    const p = await prisma.paymentProof.findUnique({ where: { id } })
    return p ? mapPaymentProof(p) : null
  },
  async create(data: Omit<PaymentProof, 'id' | 'created_at' | 'reviewed_at'>): Promise<PaymentProof> {
    const p = await prisma.paymentProof.create({
      data: {
        invitationId: data.invitation_id, userId: data.user_id, userEmail: data.user_email,
        slug: data.slug, amount: data.amount, bankName: data.bank_name,
        transferDate: data.transfer_date, proofUrl: data.proof_url, notes: data.notes,
        status: data.status, adminNotes: data.admin_notes,
      },
    })
    return mapPaymentProof(p)
  },
  async update(id: string, data: Partial<PaymentProof>): Promise<PaymentProof | null> {
    try {
      const p = await prisma.paymentProof.update({
        where: { id },
        data: {
          ...(data.status !== undefined && { status: data.status }),
          ...(data.admin_notes !== undefined && { adminNotes: data.admin_notes }),
          ...(data.reviewed_at !== undefined && { reviewedAt: data.reviewed_at ? new Date(data.reviewed_at) : null }),
          ...(data.proof_url !== undefined && { proofUrl: data.proof_url }),
          ...(data.amount !== undefined && { amount: data.amount }),
          ...(data.bank_name !== undefined && { bankName: data.bank_name }),
          ...(data.transfer_date !== undefined && { transferDate: data.transfer_date }),
          ...(data.notes !== undefined && { notes: data.notes }),
        },
      })
      return mapPaymentProof(p)
    } catch {
      return null
    }
  },
}

//  ORDERS

function mapOrder(o: any): Order {
  return {
    id: o.id, order_number: o.orderNumber, invitation_id: o.invitationId ?? null,
    email: o.email, phone: o.phone,
    groom_name: o.groomName, bride_name: o.brideName,
    groom_nickname: o.groomNickname, bride_nickname: o.brideNickname,
    groom_father: o.groomFather, groom_mother: o.groomMother,
    bride_father: o.brideFather, bride_mother: o.brideMother,
    groom_profession: o.groomProfession, bride_profession: o.brideProfession,
    subdomain: o.subdomain, template_id: o.templateId, package_tier: o.packageTier,
    amount: o.amount, unique_code: o.uniqueCode, total_amount: o.totalAmount,
    proof_url: o.proofUrl, notes: o.notes,
    status: o.status as Order['status'], admin_notes: o.adminNotes,
    referred_by: o.referredBy ?? null,
    mayar_transaction_id: o.mayarTransactionId ?? null,
    mayar_payment_link: o.mayarPaymentLink ?? null,
    payment_method: o.paymentMethod ?? null,
    created_at: o.createdAt instanceof Date ? o.createdAt.toISOString() : o.createdAt,
    reviewed_at: o.reviewedAt instanceof Date ? o.reviewedAt.toISOString() : o.reviewedAt ?? null,
  }
}

export const orders = {
  async findAll(): Promise<Order[]> {
    const all = await prisma.order.findMany({ orderBy: { createdAt: 'desc' } })
    return all.map(mapOrder)
  },
  async findById(id: string): Promise<Order | null> {
    const o = await prisma.order.findUnique({ where: { id } })
    return o ? mapOrder(o) : null
  },
  async findByEmail(email: string): Promise<Order[]> {
    const all = await prisma.order.findMany({ where: { email: email.toLowerCase() }, orderBy: { createdAt: 'desc' } })
    return all.map(mapOrder)
  },
  async findByOrderNumber(orderNumber: string): Promise<Order | null> {
    const o = await prisma.order.findUnique({ where: { orderNumber } })
    return o ? mapOrder(o) : null
  },
  async create(data: Omit<Order, 'id' | 'created_at' | 'reviewed_at'>): Promise<Order> {
    const o = await prisma.order.create({
      data: {
        orderNumber: data.order_number, email: data.email.toLowerCase(), phone: data.phone,
        groomName: data.groom_name, brideName: data.bride_name,
        groomNickname: data.groom_nickname, brideNickname: data.bride_nickname,
        groomFather: data.groom_father, groomMother: data.groom_mother,
        brideFather: data.bride_father, brideMother: data.bride_mother,
        groomProfession: data.groom_profession, brideProfession: data.bride_profession,
        subdomain: data.subdomain, templateId: data.template_id, packageTier: data.package_tier,
        amount: data.amount, uniqueCode: data.unique_code, totalAmount: data.total_amount,
        proofUrl: data.proof_url, notes: data.notes,
        status: data.status, adminNotes: data.admin_notes,
        referredBy: data.referred_by,
        mayarTransactionId: data.mayar_transaction_id,
        mayarPaymentLink: data.mayar_payment_link,
        paymentMethod: data.payment_method,
      },
    })
    return mapOrder(o)
  },
  async update(id: string, data: Partial<Order>): Promise<Order | null> {
    try {
      const o = await prisma.order.update({
        where: { id },
        data: {
          ...(data.status !== undefined && { status: data.status }),
          ...(data.admin_notes !== undefined && { adminNotes: data.admin_notes }),
          ...(data.proof_url !== undefined && { proofUrl: data.proof_url }),
          ...(data.invitation_id !== undefined && { invitationId: data.invitation_id }),
          ...(data.mayar_transaction_id !== undefined && { mayarTransactionId: data.mayar_transaction_id }),
          ...(data.mayar_payment_link !== undefined && { mayarPaymentLink: data.mayar_payment_link }),
          ...(data.payment_method !== undefined && { paymentMethod: data.payment_method }),
          ...(data.reviewed_at !== undefined && { reviewedAt: data.reviewed_at ? new Date(data.reviewed_at) : null }),
        },
      })
      return mapOrder(o)
    } catch { return null }
  },
  async subdomainExists(subdomain: string): Promise<boolean> {
    const count = await prisma.order.count({ where: { subdomain, status: { in: ['pending', 'paid', 'approved'] } } })
    return count > 0
  },
}

//  MUSIC LIBRARY

function mapMusicTrack(m: { id: string; title: string; artist: string; category: string; url: string; duration: number; fileSize: number; isActive: boolean; sortOrder: number; usageCount: number; createdAt: Date }): MusicTrack {
  return { id: m.id, title: m.title, artist: m.artist, category: m.category, url: m.url, duration: m.duration, file_size: m.fileSize, is_active: m.isActive, sort_order: m.sortOrder, usage_count: m.usageCount, created_at: m.createdAt.toISOString() }
}

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

//  AFFILIATES 

export interface AffiliateData {
  id: string
  userId: string
  userEmail: string
  referralCode: string
  commissionRate: number
  totalEarnings: number
  pendingBalance: number
  paidBalance: number
  totalClicks: number
  totalConversions: number
  isActive: boolean
  bankName: string
  accountNo: string
  accountName: string
  createdAt: string
}

export interface ReferralData {
  id: string
  affiliateId: string
  invitationId: string | null
  buyerEmail: string
  packageTier: string
  saleAmount: number
  commission: number
  status: string
  createdAt: string
}

export interface WithdrawalData {
  id: string
  affiliateId: string
  amount: number
  bankName: string
  accountNo: string
  accountName: string
  status: string
  adminNotes: string
  createdAt: string
  processedAt: string | null
}

export const affiliates = {
  async findByUserId(userId: string): Promise<AffiliateData | null> {
    const a = await prisma.affiliate.findUnique({ where: { userId }, include: { user: { select: { email: true } } } })
    if (!a) return null
    return { ...mapAffiliate(a), userEmail: a.user.email }
  },

  async findByCode(code: string): Promise<AffiliateData | null> {
    const a = await prisma.affiliate.findUnique({ where: { referralCode: code }, include: { user: { select: { email: true } } } })
    if (!a) return null
    return { ...mapAffiliate(a), userEmail: a.user.email }
  },

  async findAll(): Promise<AffiliateData[]> {
    const rows = await prisma.affiliate.findMany({ include: { user: { select: { email: true } } }, orderBy: { createdAt: 'desc' } })
    return rows.map(a => ({ ...mapAffiliate(a), userEmail: a.user.email }))
  },

  async create(userId: string, referralCode: string): Promise<AffiliateData> {
    const a = await prisma.affiliate.create({
      data: { userId, referralCode },
      include: { user: { select: { email: true } } },
    })
    return { ...mapAffiliate(a), userEmail: a.user.email }
  },

  async updateBank(id: string, data: { bankName: string; accountNo: string; accountName: string }): Promise<void> {
    await prisma.affiliate.update({ where: { id }, data })
  },

  async incrementClicks(id: string): Promise<void> {
    try { await prisma.affiliate.update({ where: { id }, data: { totalClicks: { increment: 1 } } }) } catch {}
  },

  async recordConversion(affiliateId: string, data: { invitationId: string; buyerEmail: string; packageTier: string; saleAmount: number; commission: number }): Promise<void> {
    await prisma.$transaction([
      prisma.referral.create({
        data: {
          affiliateId,
          invitationId: data.invitationId,
          buyerEmail: data.buyerEmail,
          packageTier: data.packageTier,
          saleAmount: data.saleAmount,
          commission: data.commission,
          status: 'converted',
        },
      }),
      prisma.affiliate.update({
        where: { id: affiliateId },
        data: {
          totalConversions: { increment: 1 },
          totalEarnings: { increment: data.commission },
          pendingBalance: { increment: data.commission },
        },
      }),
    ])
  },

  async toggleActive(id: string, isActive: boolean): Promise<void> {
    await prisma.affiliate.update({ where: { id }, data: { isActive } })
  },
}

export const referrals = {
  async findByAffiliateId(affiliateId: string): Promise<ReferralData[]> {
    const rows = await prisma.referral.findMany({ where: { affiliateId }, orderBy: { createdAt: 'desc' } })
    return rows.map(mapReferral)
  },

  async findAll(): Promise<ReferralData[]> {
    const rows = await prisma.referral.findMany({ orderBy: { createdAt: 'desc' } })
    return rows.map(mapReferral)
  },
}

export const affiliateWithdrawals = {
  async findByAffiliateId(affiliateId: string): Promise<WithdrawalData[]> {
    const rows = await prisma.affiliateWithdrawal.findMany({ where: { affiliateId }, orderBy: { createdAt: 'desc' } })
    return rows.map(mapWithdrawal)
  },

  async findAll(): Promise<WithdrawalData[]> {
    const rows = await prisma.affiliateWithdrawal.findMany({ orderBy: { createdAt: 'desc' } })
    return rows.map(mapWithdrawal)
  },

  /**
   * Saldo yang benar-benar bisa dicairkan = pendingBalance dikurangi seluruh
   * permintaan yang masih menunggu.
   *
   * create() hanya menyisipkan baris; pendingBalance baru berubah saat admin
   * approve/reject. Dulu route hanya membandingkan amount dengan
   * pendingBalance, jadi afiliator bersaldo Rp 100k bisa mengirim sepuluh
   * permintaan Rp 100k dan SEMUANYA lolos validasi. Kalau admin menyetujui
   * tiga, Rp 300k terbayar dan saldo jadi minus.
   */
  async availableBalance(affiliateId: string): Promise<number> {
    const [affiliate, pending] = await Promise.all([
      prisma.affiliate.findUnique({ where: { id: affiliateId }, select: { pendingBalance: true } }),
      prisma.affiliateWithdrawal.aggregate({
        where: { affiliateId, status: 'pending' },
        _sum: { amount: true },
      }),
    ])
    if (!affiliate) return 0
    return affiliate.pendingBalance - (pending._sum.amount ?? 0)
  },

  async create(data: { affiliateId: string; amount: number; bankName: string; accountNo: string; accountName: string }): Promise<WithdrawalData> {
    const w = await prisma.affiliateWithdrawal.create({ data })
    return mapWithdrawal(w)
  },

  /**
   * Mengembalikan false kalau permintaannya sudah tidak berstatus 'pending'.
   *
   * Dua perbaikan dibanding versi lama:
   * - Guard `status: 'pending'` ADA DI DALAM where updateMany, jadi hanya satu
   *   pemanggil yang bisa membalik pending->approved. Dulu admin yang
   *   mengklik dua kali membuat pendingBalance berkurang DUA KALI untuk satu
   *   pembayaran.
   * - Kedua penulisan dibungkus satu transaksi. Dulu terpisah: kalau update
   *   kedua gagal, statusnya terlanjur 'approved' padahal saldo tidak pernah
   *   didebit.
   */
  async approve(id: string, adminNotes?: string): Promise<boolean> {
    return prisma.$transaction(async tx => {
      const claimed = await tx.affiliateWithdrawal.updateMany({
        where: { id, status: 'pending' },
        data: { status: 'approved', adminNotes: adminNotes ?? '', processedAt: new Date() },
      })
      if (claimed.count === 0) return false

      const w = await tx.affiliateWithdrawal.findUniqueOrThrow({ where: { id } })
      await tx.affiliate.update({
        where: { id: w.affiliateId },
        data: {
          pendingBalance: { decrement: w.amount },
          paidBalance: { increment: w.amount },
        },
      })
      return true
    })
  },

  /** Sama seperti approve(): idempoten lewat guard status, dan atomik. */
  async reject(id: string, adminNotes: string): Promise<boolean> {
    return prisma.$transaction(async tx => {
      const claimed = await tx.affiliateWithdrawal.updateMany({
        where: { id, status: 'pending' },
        data: { status: 'rejected', adminNotes, processedAt: new Date() },
      })
      if (claimed.count === 0) return false

      // Ditolak = dana kembali tersedia. pendingBalance TIDAK dikurangi di sini:
      // saldo memang tidak pernah didebit saat permintaan dibuat, jadi
      // pengurangan pada versi lama justru menghanguskan komisi yang sah.
      return true
    })
  },
}

function mapAffiliate(a: {
  id: string; userId: string; referralCode: string; commissionRate: number;
  totalEarnings: number; pendingBalance: number; paidBalance: number;
  totalClicks: number; totalConversions: number; isActive: boolean;
  bankName: string; accountNo: string; accountName: string; createdAt: Date;
}): Omit<AffiliateData, 'userEmail'> {
  return {
    id: a.id, userId: a.userId, referralCode: a.referralCode,
    commissionRate: a.commissionRate, totalEarnings: a.totalEarnings,
    pendingBalance: a.pendingBalance, paidBalance: a.paidBalance,
    totalClicks: a.totalClicks, totalConversions: a.totalConversions,
    isActive: a.isActive, bankName: a.bankName, accountNo: a.accountNo,
    accountName: a.accountName, createdAt: a.createdAt.toISOString(),
  }
}

function mapReferral(r: {
  id: string; affiliateId: string; invitationId: string | null;
  buyerEmail: string; packageTier: string; saleAmount: number;
  commission: number; status: string; createdAt: Date;
}): ReferralData {
  return {
    id: r.id, affiliateId: r.affiliateId, invitationId: r.invitationId,
    buyerEmail: r.buyerEmail, packageTier: r.packageTier,
    saleAmount: r.saleAmount, commission: r.commission,
    status: r.status, createdAt: r.createdAt.toISOString(),
  }
}

function mapWithdrawal(w: {
  id: string; affiliateId: string; amount: number;
  bankName: string; accountNo: string; accountName: string;
  status: string; adminNotes: string; createdAt: Date; processedAt: Date | null;
}): WithdrawalData {
  return {
    id: w.id, affiliateId: w.affiliateId, amount: w.amount,
    bankName: w.bankName, accountNo: w.accountNo, accountName: w.accountName,
    status: w.status, adminNotes: w.adminNotes,
    createdAt: w.createdAt.toISOString(),
    processedAt: w.processedAt?.toISOString() ?? null,
  }
}

//  LANDING SECTIONS CONFIG 

export interface LandingSectionConfig {
  id: string
  label: string
  visible: boolean
  order: number
}

const DEFAULT_SECTIONS: LandingSectionConfig[] = [
  { id: 'hero', label: 'Hero', visible: true, order: 0 },
  { id: 'trustBar', label: 'Trust Bar', visible: true, order: 1 },
  { id: 'templatePreview', label: 'Template Preview', visible: true, order: 2 },
  { id: 'featureShowcase', label: 'Fitur Unggulan', visible: true, order: 3 },
  { id: 'howItWorks', label: 'Cara Kerja', visible: true, order: 4 },
  { id: 'testimonials', label: 'Testimoni', visible: true, order: 5 },
  { id: 'pricing', label: 'Harga', visible: true, order: 6 },
  { id: 'blogShowcase', label: 'Blog', visible: true, order: 7 },
  { id: 'faq', label: 'FAQ', visible: true, order: 8 },
  { id: 'closingCta', label: 'Closing CTA', visible: true, order: 9 },
]

export const landingSections = {
  async get(): Promise<LandingSectionConfig[]> {
    const row = await prisma.appSetting.findUnique({ where: { key: 'landing_sections' } })
    if (!row) return DEFAULT_SECTIONS
    const stored = row.value as unknown as LandingSectionConfig[]
    if (!Array.isArray(stored) || stored.length === 0) return DEFAULT_SECTIONS
    for (const def of DEFAULT_SECTIONS) {
      if (!stored.find(s => s.id === def.id)) stored.push(def)
    }
    return stored.sort((a, b) => a.order - b.order)
  },

  async save(sections: LandingSectionConfig[]): Promise<void> {
    await prisma.appSetting.upsert({
      where: { key: 'landing_sections' },
      update: { value: sections as unknown as import('@prisma/client').Prisma.InputJsonValue },
      create: { key: 'landing_sections', value: sections as unknown as import('@prisma/client').Prisma.InputJsonValue },
    })
  },
}

// ─── INVITATION VIEWS (analytics) ─────────────────────────────

export interface InvitationViewRecord {
  id: string
  invitation_id: string
  viewed_at: string
  referrer: string
  user_agent: string
  country: string
}

export const invitationViews = {
  async record(data: { invitation_id: string; referrer?: string; user_agent?: string }): Promise<void> {
    await prisma.invitationView.create({
      data: {
        invitationId: data.invitation_id,
        referrer: data.referrer || '',
        userAgent: data.user_agent || '',
      },
    })
  },

  async countByInvitation(invitationId: string): Promise<number> {
    return prisma.invitationView.count({ where: { invitationId } })
  },

  async countByDateRange(invitationId: string, from: Date, to: Date): Promise<number> {
    return prisma.invitationView.count({
      where: { invitationId, viewedAt: { gte: from, lte: to } },
    })
  },

  async dailyCounts(invitationId: string, days: number = 30): Promise<{ date: string; count: number }[]> {
    const since = new Date()
    since.setDate(since.getDate() - days)
    since.setHours(0, 0, 0, 0)

    const views = await prisma.invitationView.findMany({
      where: { invitationId, viewedAt: { gte: since } },
      select: { viewedAt: true },
      orderBy: { viewedAt: 'asc' },
    })

    const map = new Map<string, number>()
    for (let i = 0; i < days; i++) {
      const d = new Date(since)
      d.setDate(d.getDate() + i)
      map.set(d.toISOString().slice(0, 10), 0)
    }
    for (const v of views) {
      const key = v.viewedAt.toISOString().slice(0, 10)
      map.set(key, (map.get(key) ?? 0) + 1)
    }
    return Array.from(map.entries()).map(([date, count]) => ({ date, count }))
  },

  /**
   * Dulu SETIAP baris view ditarik lalu dikelompokkan di JS — untuk undangan
   * yang ramai itu bisa puluhan ribu baris masuk memori Worker hanya untuk
   * mengambil 10 teratas. groupBy menyerahkan penghitungan, pengurutan, dan
   * pembatasan ke Postgres.
   */
  async topReferrers(invitationId: string, limit: number = 10): Promise<{ referrer: string; count: number }[]> {
    const grouped = await prisma.invitationView.groupBy({
      by: ['referrer'],
      where: { invitationId, referrer: { not: '' } },
      _count: { _all: true },
      orderBy: { _count: { referrer: 'desc' } },
      take: limit,
    })
    return grouped.map(row => ({ referrer: row.referrer, count: row._count._all }))
  },
}

// ─── USER FEEDBACK ────────────────────────────────────────────

export interface FeedbackRecord {
  id: string
  user_id: string
  type: string
  score: number
  comment: string
  page: string
  created_at: string
}

export const userFeedback = {
  async create(data: { user_id: string; type?: string; score: number; comment?: string; page?: string }): Promise<FeedbackRecord> {
    const r = await prisma.userFeedback.create({
      data: {
        userId: data.user_id,
        type: data.type || 'nps',
        score: data.score,
        comment: data.comment || '',
        page: data.page || '',
      },
    })
    return { id: r.id, user_id: r.userId, type: r.type, score: r.score, comment: r.comment, page: r.page, created_at: r.createdAt.toISOString() }
  },

  async findByUserId(userId: string): Promise<FeedbackRecord[]> {
    const all = await prisma.userFeedback.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } })
    return all.map(r => ({ id: r.id, user_id: r.userId, type: r.type, score: r.score, comment: r.comment, page: r.page, created_at: r.createdAt.toISOString() }))
  },

  async hasRecentFeedback(userId: string, days: number = 30): Promise<boolean> {
    const since = new Date()
    since.setDate(since.getDate() - days)
    const count = await prisma.userFeedback.count({
      where: { userId, createdAt: { gte: since } },
    })
    return count > 0
  },

  async getAverageNps(): Promise<{ average: number; total: number; promoters: number; passives: number; detractors: number }> {
    const all = await prisma.userFeedback.findMany({
      where: { type: 'nps' },
      select: { score: true },
    })
    if (all.length === 0) return { average: 0, total: 0, promoters: 0, passives: 0, detractors: 0 }
    const promoters = all.filter(f => f.score >= 9).length
    const detractors = all.filter(f => f.score <= 6).length
    const passives = all.length - promoters - detractors
    const nps = Math.round(((promoters - detractors) / all.length) * 100)
    return { average: nps, total: all.length, promoters, passives, detractors }
  },

  async findAll(limit: number = 100): Promise<FeedbackRecord[]> {
    const all = await prisma.userFeedback.findMany({ orderBy: { createdAt: 'desc' }, take: limit })
    return all.map(r => ({ id: r.id, user_id: r.userId, type: r.type, score: r.score, comment: r.comment, page: r.page, created_at: r.createdAt.toISOString() }))
  },
}
