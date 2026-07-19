import { getCloudflareContext } from '@opennextjs/cloudflare'

/**
 * Jalankan pekerjaan latar yang boleh selesai SETELAH response dikirim.
 *
 * Kenapa ini perlu:
 * Di Cloudflare Workers, promise yang tidak didaftarkan lewat `ctx.waitUntil()`
 * akan DIBATALKAN begitu handler mengembalikan response. Pola lama
 * `notifyUser(...).catch(() => {})` di Vercel biasanya sempat selesai karena
 * lambda-nya masih hidup; di Workers email-nya hilang diam-diam — paling parah
 * pada webhook pembayaran: pelanggan sudah membayar, webhook balas 200, lalu
 * email "pesanan disetujui" dibatalkan di tengah jalan.
 *
 * `.catch(() => {})` yang lama juga menelan error tanpa jejak. Di sini error
 * selalu dicatat supaya kegagalan pengiriman email bisa terlihat di log.
 */
export function runAfterResponse(work: Promise<unknown>, label: string): void {
  const guarded = work.catch((error: unknown) => {
    console.error(`[after-response] ${label} gagal:`, error)
  })

  try {
    const { ctx } = getCloudflareContext() as unknown as {
      ctx: { waitUntil(promise: Promise<unknown>): void }
    }
    ctx.waitUntil(guarded)
  } catch {
    // Di luar Workers (next dev, tsx) tidak ada waitUntil — proses tetap hidup,
    // jadi cukup biarkan promise-nya berjalan.
    void guarded
  }
}
