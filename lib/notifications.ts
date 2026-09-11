// ─── Notification Domain ─────────────────────────────────────
// Foundation layer for all platform-to-user communication.
// Transport: Resend email (lib/email.ts), with branded HTML
// templates per notification type (lib/email-templates.ts).
// Falls back to a console log when RESEND_API_KEY is not set.

import { sendEmail } from './email'
import {
  welcomeTemplate,
  orderCreatedTemplate,
  orderApprovedTemplate,
  orderRejectedTemplate,
  paymentReceivedTemplate,
  subscriptionActiveTemplate,
  subscriptionExpiringTemplate,
  subscriptionExpiredTemplate,
  passwordResetTemplate,
  type EmailData,
} from './email-templates'

// ─── Types ───────────────────────────────────────────────────

// trial_started, trial_expiring, dan trial_expired dibuang bersama mesin
// trial. trial_started hanya dikirim POST /api/invitations (jalur gratis yang
// sudah ditutup), trial_expiring hanya dipilih cron untuk langganan tier
// 'trial' yang tidak lagi dibuat, dan trial_expired memang tidak pernah
// dikirim dari mana pun.
export type NotificationType =
  | 'welcome'
  | 'order_created'
  | 'order_approved'
  | 'order_rejected'
  | 'payment_received'
  | 'subscription_active'
  | 'subscription_expiring'
  | 'subscription_expired'
  | 'password_reset'

export type NotificationChannel = 'email' | 'in_app'

export interface NotificationPayload {
  type: NotificationType
  recipientEmail: string
  recipientName?: string
  channel?: NotificationChannel
  data: Record<string, string | number | boolean>
}

export interface NotificationResult {
  success: boolean
  channel: NotificationChannel
  messageId?: string
  error?: string
}

// ─── Templates ───────────────────────────────────────────────

interface NotificationTemplate {
  subject: string
  body: string
}

const TEMPLATES: Record<NotificationType, (data: Record<string, string | number | boolean>) => NotificationTemplate> = {
  welcome: (d) => ({
    subject: 'Selamat datang di iaundang!',
    body: `Halo ${d.name || 'Kak'}! Akun kalian sudah siap. Yuk mulai bikin undangan pertama kalian.`,
  }),
  order_created: (d) => ({
    subject: `Pesanan ${d.orderNumber} sudah kami terima`,
    body: `Terima kasih! Pesanan kalian sebesar Rp ${d.amount} sudah kami terima. Silakan lanjutkan pembayaran sesuai petunjuk yang tertera.`,
  }),
  order_approved: (d) => ({
    subject: 'Pembayaran berhasil, undangan kalian sudah aktif!',
    body: `Pembayaran untuk pesanan ${d.orderNumber} sudah kami terima. Undangan kalian sekarang aktif di ${d.slug}.iaundang.online. Masuk ke akun kalian pakai email ${d.email}.`,
  }),
  order_rejected: (d) => ({
    subject: 'Pesanan kalian belum bisa kami proses',
    body: `Mohon maaf, pesanan ${d.orderNumber} belum bisa kami proses. Alasannya: ${d.reason || 'Silakan hubungi kami lewat WhatsApp, dengan senang hati kami bantu.'}`,
  }),
  payment_received: (d) => ({
    subject: 'Bukti transfer kalian sudah kami terima',
    body: `Bukti transfer untuk undangan kalian sudah masuk dan sedang kami periksa. Biasanya selesai dalam 1 hari kerja, nanti kami kabari lagi lewat email ini.`,
  }),
  subscription_active: (d) => ({
    subject: `Paket ${d.tierName} kalian sudah aktif!`,
    body: `Paket ${d.tierName} sudah aktif sampai ${d.expiresAt}. Selamat mempersiapkan hari bahagia kalian!`,
  }),
  subscription_expiring: (d) => ({
    subject: `Masa aktif undangan tinggal ${d.daysLeft} hari lagi`,
    body: `Paket ${d.tierName} untuk undangan kalian akan berakhir ${d.expiresAt}, tinggal ${d.daysLeft} hari lagi. Perpanjang sekarang supaya undangan tetap bisa dibuka tamu.`,
  }),
  subscription_expired: (d) => ({
    subject: 'Masa aktif undangan sudah berakhir',
    body: `Paket ${d.tierName} untuk undangan kalian sudah berakhir, jadi tamu belum bisa membukanya lagi. Perpanjang kapan saja untuk menghidupkannya kembali.`,
  }),
  password_reset: (d) => ({
    subject: 'Buat password baru untuk akun iaundang',
    body: `Kami menerima permintaan untuk mengganti password kalian. Klik tautan ini untuk membuat password baru: ${d.resetLink}. Tautannya berlaku 1 jam. Kalau kalian tidak merasa meminta ini, abaikan saja email ini.`,
  }),
}

// ─── HTML Templates ──────────────────────────────────────────
// Maps each notification type to its branded HTML email template.

const HTML_TEMPLATES: Record<NotificationType, (d: EmailData) => string> = {
  welcome: welcomeTemplate,
  order_created: orderCreatedTemplate,
  order_approved: orderApprovedTemplate,
  order_rejected: orderRejectedTemplate,
  payment_received: paymentReceivedTemplate,
  subscription_active: subscriptionActiveTemplate,
  subscription_expiring: subscriptionExpiringTemplate,
  subscription_expired: subscriptionExpiredTemplate,
  password_reset: passwordResetTemplate,
}

// ─── Public API ──────────────────────────────────────────────

export async function sendNotification(payload: NotificationPayload): Promise<NotificationResult> {
  const subjectFn = TEMPLATES[payload.type]
  const htmlFn = HTML_TEMPLATES[payload.type]
  const channel = payload.channel ?? 'email'

  if (!subjectFn || !htmlFn) {
    return { success: false, channel, error: `Unknown notification type: ${payload.type}` }
  }

  if (channel !== 'email') {
    return { success: false, channel, error: `Channel ${channel} not implemented` }
  }

  const { subject } = subjectFn(payload.data)
  const html = htmlFn(payload.data)

  const result = await sendEmail({ to: payload.recipientEmail, subject, html })

  if (result.skipped) {
    console.log(`[Notification:email] To: ${payload.recipientEmail} | Subject: ${subject} (RESEND_API_KEY not set, skipped)`)
    return { success: true, channel: 'email', messageId: 'console_skipped' }
  }

  return { success: result.success, channel: 'email', messageId: result.id, error: result.error }
}

export async function notifyUser(
  type: NotificationType,
  email: string,
  data: Record<string, string | number | boolean>,
): Promise<NotificationResult> {
  return sendNotification({ type, recipientEmail: email, data })
}
