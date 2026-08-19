import { prisma } from '../prisma'

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

function mapUser(u: { id: string; email: string; passwordHash: string; role: string; referralCode: string | null; createdAt: Date }): DbUser {
  return { id: u.id, email: u.email, password_hash: u.passwordHash, role: u.role as UserRole, referral_code: u.referralCode, created_at: u.createdAt.toISOString() }
}

//  USERS

export const users = {
  /**
   * Cari akun lewat email, TANPA cache — pola `NOW()` yang sama dengan
   * sessionEpoch() di bawah.
   *
   * Semua pemanggilnya bersifat akun-kritis: login, pendaftaran, pembuatan
   * akun afiliasi, dan penyediaan pesanan yang disetujui. Cache query
   * Hyperdrive (60 detik) merusak persis rangkaian itu, dan sudah dibuktikan
   * langsung di produksi:
   *
   *   provisionPaidOrder() memanggil findByEmail(email) -> belum ada.
   *   Hasil "tidak ada" itu tersimpan di cache. Akun lalu dibuat, admin
   *   meneruskan kata sandinya, dan login pembeli dalam ~60 detik berikutnya
   *   membaca jawaban lama yang sama: "Email atau passwordnya belum cocok."
   *   Diuji tiap 10 detik: 401 pada detik 0/10/20/30/40/50/60, baru 200 pada
   *   detik 70.
   *
   * Semua pemanggilnya jarang dan tidak pernah di jalur halaman publik, jadi
   * satu round-trip database di sini tidak terasa.
   */
  async findByEmail(email: string): Promise<DbUser | null> {
    const rows = await prisma.$queryRaw<{
      id: string; email: string; password_hash: string; role: string
      referral_code: string | null; created_at: Date
    }[]>`
      SELECT id, email, password_hash, role, referral_code, created_at, NOW() AS uncached_marker
      FROM users WHERE email = ${email.toLowerCase()} LIMIT 1
    `
    if (rows.length === 0) return null
    const u = rows[0]
    return mapUser({
      id: u.id, email: u.email, passwordHash: u.password_hash, role: u.role,
      referralCode: u.referral_code,
      createdAt: u.created_at instanceof Date ? u.created_at : new Date(u.created_at),
    })
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
