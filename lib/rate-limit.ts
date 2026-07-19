import { getCloudflareContext } from '@opennextjs/cloudflare'

/**
 * Pembatas laju memakai binding Rate Limiting bawaan Cloudflare.
 *
 * Sebelumnya tidak ada pembatasan sama sekali di seluruh aplikasi: /api/auth/login
 * bisa ditebak-tebak tanpa batas (credential stuffing), dan /api/auth/forgot-password
 * bisa dipakai membanjiri email orang lain — tiap permintaan mengirim satu email
 * sungguhan lewat Resend, jadi sekalian menghabiskan kuota dan merusak reputasi
 * domain pengirim.
 *
 * Catatan penting soal binding ini:
 * - Hitungannya LOKAL per lokasi Cloudflare, bukan global. Jadi ini peredam
 *   serangan, bukan jaminan kuota yang presisi. Untuk tujuan anti-brute-force
 *   itu sudah memadai.
 * - `period` hanya boleh 10 atau 60 detik.
 */
interface RateLimiterBinding {
  limit(options: { key: string }): Promise<{ success: boolean }>
}

export type RateLimitName = 'LOGIN_RATE_LIMIT' | 'EMAIL_RATE_LIMIT' | 'UPLOAD_RATE_LIMIT'

/**
 * Mengembalikan true kalau permintaan boleh lanjut.
 *
 * SENGAJA fail-open: kalau binding tidak ada (mis. `next dev`, skrip Node) atau
 * pemanggilannya bermasalah, permintaan tetap diloloskan. Rate limiter yang
 * rusak tidak boleh mengunci semua orang keluar dari halaman login.
 */
const warned = new Set<string>()

/** Fail-open TAPI berisik. Pembatas yang diam-diam mati lebih buruk daripada
 *  tidak ada sama sekali, karena memberi rasa aman yang keliru. */
function warnOnce(name: string, reason: string): void {
  if (warned.has(name)) return
  warned.add(name)
  console.warn(`[rate-limit] ${name} TIDAK aktif (${reason}) — permintaan diloloskan.`)
}

export async function allowRequest(name: RateLimitName, key: string): Promise<boolean> {
  if (!key) return true

  try {
    const { env } = getCloudflareContext() as unknown as {
      env: Record<string, RateLimiterBinding | undefined>
    }
    const limiter = env?.[name]
    if (!limiter) {
      warnOnce(name, `binding tidak ada di env; kunci tersedia: ${Object.keys(env ?? {}).join(',')}`)
      return true
    }

    const { success } = await limiter.limit({ key })
    return success
  } catch (error) {
    warnOnce(name, `pemanggilan gagal: ${(error as Error)?.message ?? error}`)
    return true
  }
}
