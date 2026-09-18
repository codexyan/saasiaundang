import { SignJWT, jwtVerify } from 'jose'
import { getSigningSecret } from './session'
import type { Order } from './types'
import type { AppSettings } from './db/settings'

/**
 * Halaman status pesanan untuk pembeli yang belum punya sesi.
 *
 * Pembeli baru belum punya akun saat kembali dari halaman bayar Mayar, jadi
 * halaman statusnya tidak bisa dijaga sesi. Yang dipakai: satu token
 * bertanda tangan yang terikat ke satu pesanan, berumur pendek, dan hanya
 * memuat id pesanan. Nomor pesanan sengaja tidak dipakai sebagai kunci karena
 * berurutan dan gampang ditebak.
 *
 * Rahasianya sama dengan sesi (SESSION_SECRET), tapi klaim `purpose`
 * memisahkan keduanya: token status tidak lolos sebagai sesi, dan cookie sesi
 * tidak bisa dipakai membuka halaman status pesanan orang lain.
 */

const PURPOSE = 'order-status'

export const ORDER_STATUS_TOKEN_DAYS = 7

export async function createOrderStatusToken(orderId: string): Promise<string> {
  return new SignJWT({ orderId, purpose: PURPOSE })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${ORDER_STATUS_TOKEN_DAYS}d`)
    .sign(getSigningSecret())
}

export type OrderTokenResult =
  | { ok: true; orderId: string }
  | { ok: false }

export async function readOrderStatusToken(token: string): Promise<OrderTokenResult> {
  // getSigningSecret() sengaja di luar try, sama seperti verifySessionToken:
  // secret yang lupa diset harus mencuat sebagai error, bukan menyamar jadi
  // "tautannya tidak berlaku" untuk semua orang.
  const secret = getSigningSecret()
  try {
    const { payload } = await jwtVerify(token, secret)
    const claims = payload as { orderId?: unknown; purpose?: unknown }
    if (claims.purpose !== PURPOSE || typeof claims.orderId !== 'string') {
      return { ok: false }
    }
    return { ok: true, orderId: claims.orderId }
  } catch {
    // Kedaluwarsa dan tanda tangan palsu sengaja tidak dibedakan. Halamannya
    // memperlakukan keduanya sama, dan membedakannya hanya memberi petunjuk
    // kepada yang menebak-nebak token.
    return { ok: false }
  }
}

export type OrderStatusState = 'menunggu' | 'lunas' | 'ditolak'

export interface OrderStatusView {
  state: OrderStatusState
  orderNumber: string
  /** Disamarkan supaya halaman yang tautannya terusan tidak membocorkan email. */
  emailMasked: string
  totalAmount: number
  tierLabel: string
  subdomain: string
  /** Hanya untuk pesanan yang belum lunas. */
  paymentUrl: string | null
  /** Alasan dari admin, hanya untuk pesanan yang ditolak. */
  adminNotes: string | null
}

/** `fakhrian@gmail.com` menjadi `f******n@gmail.com`. */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!domain) return '***'
  if (local.length <= 2) return `${local[0] ?? '*'}***@${domain}`
  return `${local[0]}${'*'.repeat(local.length - 2)}${local[local.length - 1]}@${domain}`
}

export function toOrderStatusView(order: Order, appSettings: AppSettings): OrderStatusView {
  const state: OrderStatusState =
    order.status === 'approved' ? 'lunas'
    : order.status === 'rejected' ? 'ditolak'
    : 'menunggu'

  return {
    state,
    orderNumber: order.order_number,
    emailMasked: maskEmail(order.email),
    totalAmount: order.total_amount,
    tierLabel: appSettings.priceTiers.find(t => t.id === order.package_tier)?.label ?? order.package_tier,
    subdomain: order.subdomain,
    paymentUrl: state === 'menunggu' ? order.mayar_payment_link : null,
    adminNotes: state === 'ditolak' ? order.admin_notes : null,
  }
}
