/**
 * Edge-compatible JWT session   boleh diimpor dari middleware.ts.
 * Tidak boleh mengimpor 'next/headers' di sini.
 */
import { SignJWT, jwtVerify } from 'jose'
import type { NextRequest, NextResponse } from 'next/server'

export const SESSION_COOKIE_NAME = '__ku_session'
const EXPIRES_DAYS = 30

/**
 * Kunci penandatangan sesi.
 *
 * DULU: `process.env.SESSION_SECRET || 'iaundang-dev-secret-must-be-32chars!!'`
 * Padahal SESSION_SECRET tidak pernah didefinisikan di file env mana pun —
 * yang ada JWT_SECRET, dan itu tidak pernah dibaca kode. Artinya SETIAP token
 * produksi ditandatangani dengan konstanta yang ada di dalam repo: siapa pun
 * yang membacanya bisa membuat token `{ role: 'admin' }` sendiri dan lolos
 * seluruh pemeriksaan isAdmin(). Ini bypass autentikasi penuh.
 *
 * Sekarang: tidak ada nilai default. Kalau secret tidak ada, request GAGAL
 * dengan jelas — jauh lebih baik daripada diam-diam bisa dipalsukan.
 * JWT_SECRET tetap diterima sebagai alias supaya .env.local yang sudah ada
 * tidak perlu diubah.
 */
function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET || process.env.JWT_SECRET

  if (!secret) {
    throw new Error(
      'SESSION_SECRET (atau JWT_SECRET) belum diset. Sesi tidak bisa ' +
      'ditandatangani/diverifikasi tanpa itu.'
    )
  }
  if (secret.length < 32) {
    throw new Error('SESSION_SECRET terlalu pendek — minimal 32 karakter.')
  }

  return new TextEncoder().encode(secret)
}

export type SessionRole = 'admin' | 'content_writer' | 'affiliate' | 'user'

export interface SessionPayload {
  userId: string
  email: string
  /** Optional untuk backward-compat dengan token lama yang belum punya role.
   *  Helper isAdmin() di lib/auth.ts fallback ke email match jika undefined. */
  role?: SessionRole
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${EXPIRES_DAYS}d`)
    .sign(getSecret())
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  // getSecret() sengaja DI LUAR try: kesalahan konfigurasi harus mencuat,
  // bukan menyamar jadi "token tidak valid". Kalau ikut tertangkap, secret yang
  // lupa diset akan tampak seperti semua orang tiba-tiba logout tanpa petunjuk.
  const secret = getSecret()
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

/** Digunakan di middleware (Edge Runtime). */
export async function getSessionFromRequest(req: NextRequest): Promise<SessionPayload | null> {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value
  if (!token) return null
  return verifySessionToken(token)
}

export function setSessionCookie(res: NextResponse, token: string): void {
  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * EXPIRES_DAYS,
    path: '/',
  })
}

/** Header string untuk Set-Cookie di API route Response. */
export function buildSetCookieHeader(token: string): string {
  const maxAge = 60 * 60 * 24 * EXPIRES_DAYS
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return `${SESSION_COOKIE_NAME}=${token}; HttpOnly; SameSite=Lax; Max-Age=${maxAge}; Path=/${secure}`
}
