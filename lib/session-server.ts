/**
 * Server-only session helper   hanya untuk Server Components dan API Routes.
 * JANGAN diimpor dari middleware.ts (modul ini menyentuh database).
 */
import { cookies } from 'next/headers'
import { cache } from 'react'
import { verifySessionToken, SESSION_COOKIE_NAME, type SessionPayload } from './session'
import { users } from './db'

/**
 * Dibungkus React `cache()` supaya pemeriksaan epoch hanya sekali per request,
 * walau getSession() dipanggil beberapa kali dalam satu request (hal biasa:
 * layout, page, lalu route handler).
 */
export const getSession = cache(async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
  if (!token) return null

  const payload = await verifySessionToken(token)
  if (!payload?.userId) return null

  // Verifikasi generasi sesi. Inilah yang membuat reset password benar-benar
  // memutus akses token lama; tanda tangan JWT saja tidak cukup karena token
  // stateless tetap sah sampai kedaluwarsa (30 hari).
  let currentEpoch: number | null
  try {
    currentEpoch = await users.sessionEpoch(payload.userId)
  } catch (error) {
    // SENGAJA fail-open. Kalau database sedang bermasalah, aplikasi toh tidak
    // bisa berbuat banyak — memaksa logout massal hanya menambah kekacauan saat
    // gangguan sesaat. Dicatat supaya tidak hilang diam-diam.
    console.warn('[session] gagal memeriksa sessionEpoch, sesi diloloskan:', error)
    return payload
  }

  // Akun sudah dihapus.
  if (currentEpoch === null) return null

  // Token dari generasi lama -> sudah dicabut.
  if ((payload.epoch ?? 0) !== currentEpoch) return null

  return payload
})
