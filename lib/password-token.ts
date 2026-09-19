import { prisma } from './prisma'
import { randomHex } from './random'
import { SITE_URL } from './config'

/**
 * Tautan untuk menetapkan password, dari dua asal yang berbeda.
 *
 * `reset` lahir dari halaman Lupa password: pemiliknya sedang duduk di depan
 * layar dan menunggu emailnya, jadi satu jam cukup dan justru lebih aman.
 *
 * `purchase` lahir dari pembelian yang membuat akun baru. Pembeli sering
 * membayar lewat HP, menutup halaman, lalu membuka email berjam-jam kemudian.
 * Satu jam berarti sebagian dari mereka membayar lalu terkunci di luar akun
 * yang baru saja mereka beli, dan satu-satunya jalan keluarnya adalah menebak
 * bahwa ada halaman Lupa password.
 *
 * Dulu jalur pembelian tidak memakai tabel ini sama sekali: sistem membuat
 * password acak lalu mengirimkannya sebagai teks di dalam email, dan pada jalur
 * approve admin, password itu juga tampil di layar admin untuk diteruskan lewat
 * WhatsApp. Password yang dikirim lewat email dan WhatsApp hidup selamanya di
 * dua inbox yang tidak dikendalikan siapa pun.
 */

export const PASSWORD_TOKEN_PURPOSE = {
  reset: 'reset',
  purchase: 'purchase',
} as const

export type PasswordTokenPurpose = (typeof PASSWORD_TOKEN_PURPOSE)[keyof typeof PASSWORD_TOKEN_PURPOSE]

export const RESET_TTL_MS = 60 * 60 * 1000
export const PURCHASE_TTL_MS = 72 * 60 * 60 * 1000

/** Dipakai di email dan halaman, supaya angkanya tidak ditulis mati di copy. */
export function validityLabel(purpose: PasswordTokenPurpose): string {
  return purpose === PASSWORD_TOKEN_PURPOSE.purchase ? '72 jam' : '1 jam'
}

export function passwordTokenUrl(token: string): string {
  return `${SITE_URL}/reset-password?token=${token}`
}

export async function createPasswordToken(
  user: { id: string; email: string },
  purpose: PasswordTokenPurpose,
): Promise<string> {
  const token = randomHex(32)
  const ttl = purpose === PASSWORD_TOKEN_PURPOSE.purchase ? PURCHASE_TTL_MS : RESET_TTL_MS

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      email: user.email,
      token,
      purpose,
      expiresAt: new Date(Date.now() + ttl),
    },
  })

  return token
}
