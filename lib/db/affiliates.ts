import { prisma } from '../prisma'

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

  // take:200 — lihat catatan di invitations.findAll() di atas.
  async findAll(): Promise<ReferralData[]> {
    const rows = await prisma.referral.findMany({ orderBy: { createdAt: 'desc' }, take: 200 })
    return rows.map(mapReferral)
  },
}

export const affiliateWithdrawals = {
  async findByAffiliateId(affiliateId: string): Promise<WithdrawalData[]> {
    const rows = await prisma.affiliateWithdrawal.findMany({ where: { affiliateId }, orderBy: { createdAt: 'desc' } })
    return rows.map(mapWithdrawal)
  },

  // take:200 — lihat catatan di invitations.findAll() di atas.
  async findAll(): Promise<WithdrawalData[]> {
    const rows = await prisma.affiliateWithdrawal.findMany({ orderBy: { createdAt: 'desc' }, take: 200 })
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
