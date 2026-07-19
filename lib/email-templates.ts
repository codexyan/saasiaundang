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
    <p>Akun kamu sudah aktif. Mulai buat undangan digital pertamamu sekarang.</p>
    ${button(`https://${APP_DOMAIN}/dashboard`, 'Buka Dashboard')}
  `)
}

export function trialStartedTemplate(d: EmailData): string {
  return baseTemplate(`
    <h2 style="margin:0 0 16px;color:#1a4a1a;">Free Trial 7 Hari Dimulai</h2>
    <p>Halo ${str(d.name, 'Kak')},</p>
    <p>Undangan "<strong>${str(d.slug)}</strong>" sudah dibuat. Kamu punya 7 hari untuk mencoba semua fitur dasar.</p>
    <p>Upgrade kapan saja untuk membuka fitur premium.</p>
    ${button(invitationUrl(d.slug), 'Lihat Undangan')}
  `)
}

export function trialExpiringTemplate(d: EmailData): string {
  return baseTemplate(`
    <h2 style="margin:0 0 16px;color:#c9a961;">Trial Akan Segera Berakhir</h2>
    <p>Halo ${str(d.name, 'Kak')},</p>
    <p>Free trial untuk "<strong>${str(d.slug)}</strong>" akan berakhir dalam <strong>${str(d.daysLeft)} hari</strong>.</p>
    <p>Upgrade sekarang agar undangan tetap aktif dan bisa diakses tamu.</p>
    ${button(`https://${APP_DOMAIN}/templates`, 'Upgrade Sekarang')}
  `)
}

export function trialExpiredTemplate(d: EmailData): string {
  return baseTemplate(`
    <h2 style="margin:0 0 16px;color:#1a4a1a;">Free Trial Berakhir</h2>
    <p>Halo ${str(d.name, 'Kak')},</p>
    <p>Free trial untuk "<strong>${str(d.slug)}</strong>" telah berakhir. Undangan masih tersimpan selama 14 hari.</p>
    <p>Upgrade untuk mengaktifkan kembali.</p>
    ${button(`https://${APP_DOMAIN}/templates`, 'Aktifkan Kembali')}
  `)
}

export function orderCreatedTemplate(d: EmailData): string {
  return baseTemplate(`
    <h2 style="margin:0 0 16px;color:#1a4a1a;">Pesanan Diterima</h2>
    <p>Halo ${str(d.name, 'Kak')},</p>
    <p>Pesanan kamu dengan nomor <strong>${str(d.orderNumber)}</strong> sudah kami terima.</p>
    <p>Total: <strong>Rp ${money(d.amount)}</strong></p>
    <p>Silakan selesaikan pembayaran untuk mengaktifkan undangan kamu.</p>
  `)
}

export function orderApprovedTemplate(d: EmailData): string {
  // Kredensial hanya disertakan untuk akun yang BARU dibuat (jalur pembayaran
  // otomatis Mayar, di mana tidak ada admin yang meneruskannya manual). Akun
  // yang sudah ada tetap memakai password lamanya dan tidak boleh dikirimi apa pun.
  const credentials = d.password
    ? `
    <div style="margin:20px 0;padding:16px;background:#f5f2ed;border:1px solid #e0d9cc;border-radius:8px;">
      <p style="margin:0 0 8px;font-weight:600;color:#1a4a1a;">Akun kamu sudah dibuat</p>
      <p style="margin:0 0 4px;">Email: <strong>${str(d.email)}</strong></p>
      <p style="margin:0 0 12px;">Password: <strong>${str(d.password)}</strong></p>
      <p style="margin:0;font-size:13px;color:#6b6b6b;">Segera ganti passwordnya setelah masuk.</p>
    </div>`
    : ''

  return baseTemplate(`
    <h2 style="margin:0 0 16px;color:#1a4a1a;">Pembayaran Berhasil</h2>
    <p>Halo ${str(d.name, 'Kak')},</p>
    <p>Pesanan <strong>${str(d.orderNumber)}</strong> sudah aktif. Undangan kamu siap digunakan.</p>
    ${credentials}
    ${button(invitationUrl(d.slug), 'Lihat Undangan')}
  `)
}

export function orderRejectedTemplate(d: EmailData): string {
  return baseTemplate(`
    <h2 style="margin:0 0 16px;color:#b91c1c;">Pesanan Tidak Dapat Diproses</h2>
    <p>Halo ${str(d.name, 'Kak')},</p>
    <p>Pesanan <strong>${str(d.orderNumber)}</strong> tidak dapat diproses.</p>
    <p>Alasan: ${str(d.reason, 'Silakan hubungi admin.')}</p>
  `)
}

export function paymentReceivedTemplate(d: EmailData): string {
  return baseTemplate(`
    <h2 style="margin:0 0 16px;color:#1a4a1a;">Bukti Pembayaran Diterima</h2>
    <p>Halo ${str(d.name, 'Kak')},</p>
    <p>Bukti pembayaran untuk "<strong>${str(d.slug)}</strong>" sudah kami terima dan sedang diverifikasi.</p>
    <p>Proses biasanya memakan waktu 1x24 jam.</p>
  `)
}

export function subscriptionActiveTemplate(d: EmailData): string {
  return baseTemplate(`
    <h2 style="margin:0 0 16px;color:#1a4a1a;">Paket ${str(d.tierName)} Aktif</h2>
    <p>Halo ${str(d.name, 'Kak')},</p>
    <p>Paket <strong>${str(d.tierName)}</strong> untuk "<strong>${str(d.slug)}</strong>" sudah aktif hingga <strong>${str(d.expiresAt)}</strong>.</p>
    <p>Selamat membuat undangan impianmu.</p>
    ${button(invitationUrl(d.slug), 'Lihat Undangan')}
  `)
}

export function subscriptionExpiringTemplate(d: EmailData): string {
  return baseTemplate(`
    <h2 style="margin:0 0 16px;color:#c9a961;">Undangan Akan Segera Berakhir</h2>
    <p>Halo ${str(d.name, 'Kak')},</p>
    <p>Masa aktif paket <strong>${str(d.tierName)}</strong> untuk "<strong>${str(d.slug)}</strong>" tinggal <strong>${str(d.daysLeft)} hari</strong> lagi (${str(d.expiresAt)}).</p>
    <p>Perpanjang sekarang agar undangan tetap bisa diakses tamu.</p>
    ${button(`https://${APP_DOMAIN}/templates`, 'Perpanjang Sekarang')}
  `)
}

export function subscriptionExpiredTemplate(d: EmailData): string {
  return baseTemplate(`
    <h2 style="margin:0 0 16px;color:#b91c1c;">Langganan Berakhir</h2>
    <p>Halo ${str(d.name, 'Kak')},</p>
    <p>Paket <strong>${str(d.tierName)}</strong> untuk "<strong>${str(d.slug)}</strong>" telah berakhir. Undangan tidak lagi bisa diakses oleh tamu.</p>
    <p>Perpanjang untuk mengaktifkan kembali.</p>
    ${button(`https://${APP_DOMAIN}/templates`, 'Aktifkan Kembali')}
  `)
}

export function passwordResetTemplate(d: EmailData): string {
  return baseTemplate(`
    <h2 style="margin:0 0 16px;color:#1a4a1a;">Reset Password</h2>
    <p>Halo ${str(d.name, 'Kak')},</p>
    <p>Klik tombol berikut untuk mereset password kamu. Link berlaku 1 jam.</p>
    ${button(str(d.resetLink, `https://${APP_DOMAIN}`), 'Reset Password')}
    <p style="color:#a8a29e;font-size:12px;">Abaikan email ini jika kamu tidak meminta reset password.</p>
  `)
}
