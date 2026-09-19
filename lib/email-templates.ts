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
    <p>Pesanan dengan nomor <strong>${str(d.orderNumber)}</strong> sudah masuk.</p>
    <p>Total yang perlu dibayar: <strong>Rp ${money(d.amount)}</strong></p>
    ${d.statusUrl ? button(str(d.statusUrl), 'Lihat status dan lanjutkan pembayaran') : ''}
    <p>Begitu pembayarannya kami terima, kami kirim email berikutnya berisi langkah masuk ke akun kalian.</p>
  `)
}

export function orderApprovedTemplate(d: EmailData): string {
  // Dulu email ini mengirim password sebagai teks, menyebut undangannya sudah
  // "aktif" dan "siap dibagikan", lalu menautkan alamat undangan itu. Padahal
  // undangan dibuat dengan is_published false, jadi tombolnya menuju halaman
  // yang belum bisa dibuka siapa pun — dan passwordnya hidup selamanya di inbox
  // pembeli tanpa ada yang bisa menariknya kembali.
  const langkahMasuk = d.setupUrl
    ? `
    <p>Langkah berikutnya: buat password kalian sendiri. Tautannya berlaku ${str(d.setupValidity, '72 jam')}.</p>
    ${button(str(d.setupUrl), 'Buat Password')}
    <p style="font-size:13px;color:#6b6b6b;">Kalau tautannya sudah lewat masa berlaku, minta yang baru lewat halaman Lupa password.</p>`
    : `
    <p>Akun kalian yang sudah ada tetap memakai password yang lama.</p>
    ${button(
      d.invitationId
        // Sesudah editor undangan punya alamat sendiri, tautan ini bisa
        // membuka undangan yang benar langsung. Sebelumnya ia hanya sampai
        // ke dashboard, dan pembeli harus mencari undangannya sendiri.
        ? `https://${APP_DOMAIN}/dashboard?undangan=${encodeURIComponent(String(d.invitationId))}&tab=undangan`
        : `https://${APP_DOMAIN}/login`,
      'Buka Undangan Kalian',
    )}`

  return baseTemplate(`
    <h2 style="margin:0 0 16px;color:#1a4a1a;">Pembayaran Kalian Sudah Kami Terima</h2>
    <p>Halo ${str(d.name, 'Kak')},</p>
    <p>Pembayaran untuk pesanan <strong>${str(d.orderNumber)}</strong> sudah masuk, dan alamat <strong>${str(d.slug)}.${APP_DOMAIN}</strong> sudah kami kunci untuk kalian.</p>
    ${langkahMasuk}
    <p>Sesudah masuk, lengkapi isi undangannya lalu tekan publikasikan. Tamu baru bisa membukanya sesudah itu.</p>
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
    <p>Kami menerima permintaan untuk mengganti password kalian. Klik tombol di bawah untuk membuat password baru. Tautannya berlaku ${str(d.validityLabel, '1 jam')}.</p>
    ${button(str(d.resetLink, `https://${APP_DOMAIN}`), 'Buat Password Baru')}
    <p style="color:#a8a29e;font-size:12px;">Kalau kalian tidak merasa meminta ini, abaikan saja email ini. Password lama kalian tetap aman.</p>
  `)
}
