import { prisma } from '../prisma'

//  TYPE EXPORTS

// Satu-satunya daftar role yang sah. Kolom users.role di skema berupa String
// biasa, bukan enum, jadi database menerima nilai apa pun dan penjaganya hanya
// kode. Dulu daftar ini cuma ditulis di PATCH /api/admin/users/[id], sementara
// POST /api/admin/users menyimpan role apa pun yang dikirim, termasuk salah
// ketik yang tidak cocok dengan satu pun pemeriksaan di lib/auth.ts.
export const USER_ROLES = ['admin', 'content_writer', 'affiliate', 'user'] as const

export type UserRole = (typeof USER_ROLES)[number]

// Tanpa referral_code. Kolom itu dijatuhkan migrasi
// 20260911000000_drop_user_referral_program bersama program referral pengguna
// yang sudah dibuang. Jangan memilihnya lagi di query mana pun, termasuk
// $queryRaw findByEmail di bawah: begitu migrasi diterapkan, query yang masih
// memilihnya langsung gagal dan login ikut mati.
export interface DbUser {
  id: string
  email: string
  password_hash: string
  role?: UserRole
  created_at: string
}

function mapUser(u: { id: string; email: string; passwordHash: string; role: string; createdAt: Date }): DbUser {
  return { id: u.id, email: u.email, password_hash: u.passwordHash, role: u.role as UserRole, created_at: u.createdAt.toISOString() }
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
      id: string; email: string; password_hash: string; role: string; created_at: Date
    }[]>`
      SELECT id, email, password_hash, role, created_at, NOW() AS uncached_marker
      FROM users WHERE email = ${email.toLowerCase()} LIMIT 1
    `
    if (rows.length === 0) return null
    const u = rows[0]
    return mapUser({
      id: u.id, email: u.email, passwordHash: u.password_hash, role: u.role,
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
  /**
   * Ganti role DAN cabut seluruh sesi lama dalam satu update.
   *
   * Role tidak dibaca ulang dari database pada setiap request: isAdmin,
   * isWriter, dan isAffiliate (lib/auth.ts) membaca role yang tertanam di token
   * JWT berumur 30 hari. Dulu fungsi ini hanya mengganti kolom role, jadi admin
   * yang diturunkan menjadi user tetap lolos withAdminAuth (lib/route-guards.ts)
   * dengan token lamanya sampai token itu kedaluwarsa. Sama halnya dengan
   * content_writer dan affiliate yang dicabut.
   *
   * Menaikkan sessionEpoch membuat getSession() menolak token lama. User harus
   * masuk lagi, dan login menanam role serta epoch terbaru ke token baru. Pada
   * promosi (misalnya user menjadi content_writer) efeknya juga benar: user
   * keluar sekali lalu langsung mendapat akses barunya, bukan tertahan di role
   * lama sampai ia logout sendiri.
   *
   * Satu update, sama seperti updatePassword, supaya role tidak mungkin berganti
   * tanpa sesinya ikut dicabut.
   */
  async updateRole(id: string, role: UserRole): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { role, sessionEpoch: { increment: 1 } },
    })
  },
  // findByReferralCode, setReferralCode, dan seluruh userReferrals dibuang
  // bersama program referral pengguna, yang tidak pernah mencatat satu referral
  // pun (lihat komentar di app/api/referral/route.ts).
}
