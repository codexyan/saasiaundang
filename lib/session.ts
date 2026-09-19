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
/** Dipakai juga oleh token halaman status pesanan (lib/order-status.ts),
 *  supaya syarat panjang dan sumber rahasianya tidak bercabang. */
export function getSigningSecret(): Uint8Array {
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
  /**
   * Generasi sesi saat token dibuat, dicocokkan dengan users.session_epoch.
   *
   * Diverifikasi di getSession() (lib/session-server.ts), BUKAN di sini:
   * modul ini juga dipakai middleware yang berjalan tanpa akses database, dan
   * mengimpor Prisma ke sana akan menyeret seluruh lapisan database ke bundle
   * middleware. Konsekuensinya token yang sudah dicabut masih lolos pemeriksaan
   * kasar di middleware, tapi ditolak begitu ada kode yang benar-benar membaca
   * sesi — dan setiap halaman/route terproteksi memanggil getSession().
   *
   * Token lama tanpa field ini dianggap epoch 0, sama dengan default kolomnya.
   */
  epoch?: number
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${EXPIRES_DAYS}d`)
    .sign(getSigningSecret())
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  // getSigningSecret() sengaja DI LUAR try: kesalahan konfigurasi harus mencuat,
  // bukan menyamar jadi "token tidak valid". Kalau ikut tertangkap, secret yang
  // lupa diset akan tampak seperti semua orang tiba-tiba logout tanpa petunjuk.
  const secret = getSigningSecret()
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
  return `${SESSION_COOKIE_NAME}=${token}; HttpOnly; SameSite=Lax; Max-Age=${maxAge}; Path=/${cukupAman()}`
}

/**
 * Header untuk MENGHAPUS cookie sesi.
 *
 * Dipakai rute yang mencabut sesi tapi tidak menggantinya dengan sesi baru,
 * yaitu reset password. Tanpa ini, peramban tetap memegang token yang tanda
 * tangannya sah tapi generasinya sudah dicabut, dan akibatnya bukan sekadar
 * ditolak: middleware meloloskannya (ia tidak memeriksa epoch, lihat catatan
 * di SessionPayload), lalu /admin menolak dan melempar ke /dashboard,
 * /dashboard menolak dan melempar ke /login. Dua redirect beruntun, cookie
 * tidak pernah dibersihkan, dan orangnya terjebak di situ sampai ada login
 * yang kebetulan berhasil menimpanya. Terjadi sungguhan di produksi
 * 19 Sep 2026, tepat sesudah reset password.
 *
 * Atributnya harus sama dengan saat dipasang. Path yang berbeda berarti
 * peramban menghapus cookie lain, bukan yang ini.
 */
export function buildClearCookieHeader(): string {
  return `${SESSION_COOKIE_NAME}=; HttpOnly; SameSite=Lax; Max-Age=0; Path=/${cukupAman()}`
}

/** `; Secure` hanya di produksi: localhost memakai http dan peramban membuang
 *  cookie Secure di sana, sehingga login lokal tidak akan pernah menempel. */
function cukupAman(): string {
  return process.env.NODE_ENV === 'production' ? '; Secure' : ''
}
