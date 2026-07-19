import type { SessionPayload } from './session'

/**
 * Email admin. TIDAK ada nilai default.
 *
 * Dulu: `process.env.ADMIN_EMAIL || 'admin@iaundang.online'`, dan isAdmin()
 * mengembalikan true hanya berdasarkan kecocokan email. Kalau ADMIN_EMAIL lupa
 * diset di produksi, siapa pun yang mendaftar memakai alamat default itu
 * langsung jadi admin. Sekarang tanpa ADMIN_EMAIL, jalur email dimatikan
 * sepenuhnya dan hanya role di token yang menentukan.
 */
export function getAdminEmail(): string | null {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  return email ? email : null
}

export function isAdmin(session: SessionPayload | null | undefined): boolean {
  if (!session) return false

  // Jalur utama: role dari token.
  if (session.role === 'admin') return true

  // Jalur warisan: token lama belum punya field `role`. Dipertahankan supaya
  // sesi lama tidak langsung putus, tapi HANYA kalau ADMIN_EMAIL benar-benar
  // diset — dan tidak berlaku untuk token yang sudah punya role lain.
  if (session.role !== undefined) return false

  const adminEmail = getAdminEmail()
  if (!adminEmail) return false
  return session.email?.trim().toLowerCase() === adminEmail
}

export function isWriter(session: SessionPayload | null | undefined): boolean {
  if (!session) return false
  return session.role === 'content_writer' || isAdmin(session)
}

export function canManageArticles(session: SessionPayload | null | undefined): boolean {
  return isWriter(session)
}

export function isAffiliate(session: SessionPayload | null | undefined): boolean {
  if (!session) return false
  return session.role === 'affiliate' || isAdmin(session)
}
