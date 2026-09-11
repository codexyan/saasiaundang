// ─── Email Templates ─────────────────────────────────────────
// Branded HTML templates for every notification type. Each function
// accepts the generic notification data record (same shape passed by
// the call sites via notifyUser) and returns a full HTML document.

export type EmailData = Record<string, string | number | boolean | undefined>

const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || 'iaundang.online'

function str(v: string | number | boolean | undefined, fallback = ''): string {
  return v === undefined || v === null ? fallback : String(v)
}

function money(v: string | number | boolean | undefined): string {
  if (typeof v === 'number') return v.toLocaleString('id-ID')
  return str(v)
}

function invitationUrl(slug: string | number | boolean | undefined): string {
  return slug ? `https://${slug}.${APP_DOMAIN}` : `https://${APP_DOMAIN}`
}

function button(href: string, label: string): string {
  return `<p style="margin:24px 0;">
      <a href="${href}" style="background:#1a4a1a;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">
        ${label}
      </a>
    </p>`
}

function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;padding:0;background-color:#f5f5f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="background:#1a4a1a;padding:24px 32px;text-align:center;">
              <span style="color:#ffffff;font-size:18px;font-weight:700;">iaundang</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;color:#1c1c1e;font-size:14px;line-height:1.6;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;background:#fafaf9;text-align:center;border-top:1px solid #e7e5e4;">
              <p style="margin:0;color:#a8a29e;font-size:12px;">
                iaundang &middot; Undangan digital premium<br>
                <a href="https://${APP_DOMAIN}" style="color:#1a4a1a;">${APP_DOMAIN}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

export function welcomeTemplate(d: EmailData): string {
  return baseTemplate(`
    <h2 style="margin:0 0 16px;color:#1a4a1a;">Selamat Datang di iaundang</h2>
    <p>Halo ${str(d.name, 'Kak')},</p>
    <p>Akun kalian sudah siap. Yuk mulai bikin undangan pertama kalian.</p>
    ${button(`https://${APP_DOMAIN}/dashboard`, 'Mulai Sekarang')}
  `)
}

export function orderCreatedTemplate(d: EmailData): string {
  return baseTemplate(`
    <h2 style="margin:0 0 16px;color:#1a4a1a;">Pesanan Kalian Sudah Kami Terima</h2>
    <p>Halo ${str(d.name, 'Kak')},</p>
    <p>Terima kasih! Pesanan dengan nomor <strong>${str(d.orderNumber)}</strong> sudah masuk.</p>
    <p>Total yang perlu dibayar: <strong>Rp ${money(d.amount)}</strong></p>
    <p>Silakan selesaikan pembayaran sesuai petunjuk, lalu undangan kalian langsung kami aktifkan.</p>
  `)
}

export function orderApprovedTemplate(d: EmailData): string {
  // Kredensial hanya disertakan untuk akun yang BARU dibuat (jalur pembayaran
  // otomatis Mayar, di mana tidak ada admin yang meneruskannya manual). Akun
  // yang sudah ada tetap memakai password lamanya dan tidak boleh dikirimi apa pun.
  const credentials = d.password
    ? `
    <div style="margin:20px 0;padding:16px;background:#f5f2ed;border:1px solid #e0d9cc;border-radius:8px;">
      <p style="margin:0 0 8px;font-weight:600;color:#1a4a1a;">Ini data untuk masuk ke akun kalian</p>
      <p style="margin:0 0 4px;">Email: <strong>${str(d.email)}</strong></p>
      <p style="margin:0 0 12px;">Password: <strong>${str(d.password)}</strong></p>
      <p style="margin:0;font-size:13px;color:#6b6b6b;">Sebaiknya ganti passwordnya setelah masuk pertama kali.</p>
    </div>`
    : ''

  return baseTemplate(`
    <h2 style="margin:0 0 16px;color:#1a4a1a;">Pembayaran Berhasil, Undangan Kalian Aktif!</h2>
    <p>Halo ${str(d.name, 'Kak')},</p>
    <p>Pembayaran untuk pesanan <strong>${str(d.orderNumber)}</strong> sudah kami terima. Undangan kalian siap dibagikan ke tamu.</p>
    ${credentials}
    ${button(invitationUrl(d.slug), 'Lihat Undangan Kalian')}
  `)
}

export function orderRejectedTemplate(d: EmailData): string {
  return baseTemplate(`
    <h2 style="margin:0 0 16px;color:#b91c1c;">Pesanan Kalian Belum Bisa Kami Proses</h2>
    <p>Halo ${str(d.name, 'Kak')},</p>
    <p>Mohon maaf, pesanan <strong>${str(d.orderNumber)}</strong> belum bisa kami proses.</p>
    <p>Alasannya: ${str(d.reason, 'Silakan hubungi kami lewat WhatsApp, dengan senang hati kami bantu.')}</p>
  `)
}

export function paymentReceivedTemplate(d: EmailData): string {
  return baseTemplate(`
    <h2 style="margin:0 0 16px;color:#1a4a1a;">Bukti Transfer Kalian Sudah Kami Terima</h2>
    <p>Halo ${str(d.name, 'Kak')},</p>
    <p>Bukti transfer untuk undangan kalian sudah masuk dan sedang kami periksa.</p>
    <p>Biasanya selesai dalam 1 hari kerja. Nanti kami kabari lagi lewat email ini.</p>
  `)
}

export function subscriptionActiveTemplate(d: EmailData): string {
  return baseTemplate(`
    <h2 style="margin:0 0 16px;color:#1a4a1a;">Paket ${str(d.tierName)} Kalian Sudah Aktif</h2>
    <p>Halo ${str(d.name, 'Kak')},</p>
    <p>Paket <strong>${str(d.tierName)}</strong> sudah aktif sampai <strong>${str(d.expiresAt)}</strong>.</p>
    <p>Selamat mempersiapkan hari bahagia kalian!</p>
    ${button(invitationUrl(d.slug), 'Lihat Undangan Kalian')}
  `)
}

export function subscriptionExpiringTemplate(d: EmailData): string {
  return baseTemplate(`
    <h2 style="margin:0 0 16px;color:#c9a961;">Masa Aktif Undangan Segera Berakhir</h2>
    <p>Halo ${str(d.name, 'Kak')},</p>
    <p>Masa aktif paket <strong>${str(d.tierName)}</strong> tinggal <strong>${str(d.daysLeft)} hari</strong> lagi, berakhir ${str(d.expiresAt)}.</p>
    <p>Perpanjang sekarang supaya undangan tetap bisa dibuka tamu.</p>
    ${button(`https://${APP_DOMAIN}/templates`, 'Perpanjang Sekarang')}
  `)
}

export function subscriptionExpiredTemplate(d: EmailData): string {
  return baseTemplate(`
    <h2 style="margin:0 0 16px;color:#b91c1c;">Masa Aktif Undangan Sudah Berakhir</h2>
    <p>Halo ${str(d.name, 'Kak')},</p>
    <p>Paket <strong>${str(d.tierName)}</strong> untuk undangan kalian sudah berakhir, jadi tamu belum bisa membukanya lagi.</p>
    <p>Perpanjang kapan saja untuk menghidupkannya kembali.</p>
    ${button(`https://${APP_DOMAIN}/templates`, 'Perpanjang Undangan')}
  `)
}

export function passwordResetTemplate(d: EmailData): string {
  return baseTemplate(`
    <h2 style="margin:0 0 16px;color:#1a4a1a;">Buat Password Baru</h2>
    <p>Halo ${str(d.name, 'Kak')},</p>
    <p>Kami menerima permintaan untuk mengganti password kalian. Klik tombol di bawah untuk membuat password baru. Tautannya berlaku 1 jam.</p>
    ${button(str(d.resetLink, `https://${APP_DOMAIN}`), 'Buat Password Baru')}
    <p style="color:#a8a29e;font-size:12px;">Kalau kalian tidak merasa meminta ini, abaikan saja email ini. Password lama kalian tetap aman.</p>
  `)
}
