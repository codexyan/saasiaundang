# Audit PRD Rombak UI dan Jalur Sesudah Bayar

| | |
|---|---|
| Objek audit | `docs/PRD_ROMBAK_UI_SESUDAH_BAYAR_2026-09.md` (Draf 1, 15 Sep 2026) |
| Tanggal audit | 18 September 2026 |
| Branch | `tier-unification`, commit `49c8e4b` ditambah 3 berkas yang belum di-commit |
| Metode | Baca ulang tiap klaim PRD ke kode di branch ini, `npx tsc --noEmit`, `npx next build`, dan pembacaan dokumentasi Mayar |
| Tidak diaudit | Angka database produksi (tidak ada akses dari sesi ini) dan ukuran Worker gzip (butuh `npm run cf:build`) |

Hasil singkat: dari 22 TBD di PRD, **13 ditutup dari kode**, **6 ditutup lewat keputusan Fakhrian pada hari yang sama** (bagian 4), dan **3 sisanya butuh data produksi atau uji sandbox** (bagian 5). Ditemukan **5 hal yang mengubah rencana** dan **7 koreksi** atas klaim PRD. Semuanya sudah dituangkan ke PRD, yang kini berstatus Draf 2.

---

## 1. Temuan yang mengubah rencana

### T-1. Pemeriksaan event di webhook Mayar belum tentu pernah cocok

`app/api/payment/mayar/webhook/route.ts:27` membaca tipe event begini:

```ts
const eventType = body?.event?.received
if (eventType !== 'payment.received') {
  return NextResponse.json({ ok: true, skipped: true })
}
```

Baris itu hanya cocok kalau Mayar mengirim `{"event": {"received": "payment.received"}}`. Kalau Mayar mengirim `{"event": "payment.received"}` sebagai string biasa, `body.event.received` bernilai `undefined`, dan **setiap pembayaran dilewati dengan balasan 200**. Tidak ada yang gagal, tidak ada log error, pesanan tetap `pending` selamanya.

Yang sudah dicek:

- Baris ini tidak pernah berubah sejak commit integrasi Mayar pertama (`dc84d2e`). Tidak ada satu pun tes atau contoh payload di repo.
- Dokumentasi Mayar (`docs.mayar.id/integration/webhook`) menulis parameternya sebagai `event.received | String | Event type`, tanpa contoh JSON utuh. Notasi itu bisa dibaca dua arah.
- Contoh dari integrasi pihak ketiga yang beredar memakai bentuk string.
- Catatan proyek: 0 pesanan pernah lewat Mayar. Jadi kalau bentuknya memang string, kerusakan ini memang belum pernah terlihat.

Dampak ke PRD: US-1 sampai US-5 semuanya berdiri di atas webhook yang berjalan. Selama bentuk payload belum dipastikan, semua pekerjaan jalur sesudah bayar berisiko dinyatakan selesai padahal tidak pernah terpicu.

Usul: terima kedua bentuk sekaligus (`typeof body.event === 'string' ? body.event : body.event?.received`), catat bentuk yang tidak dikenal ke log beserta kunci payload-nya, lalu pastikan dengan satu uji dari dashboard Mayar. Ini butuh akses dashboard Mayar, jadi hanya Fakhrian yang bisa menutupnya.

### T-2. Mayar tidak mendokumentasikan pengiriman ulang webhook

US-5 di PRD bertumpu pada asumsi "Mayar mengirim ulang kalau dibalas non-2xx", dengan status TBD. Hasil penelusuran: halaman webhook Mayar **tidak memuat penjelasan retry, timeout, jumlah percobaan, maupun interval**. Yang mudah ditemukan justru kebijakan retry Midtrans, penyedia lain, dan itu tidak berlaku di sini.

Artinya perubahan yang sudah ditulis di working tree (webhook membalas 500 saat provisioning gagal) memperbaiki kejujuran status, tetapi **tidak menjamin pesanan lunas akan pulih sendiri**.

Usul: jangan menggantungkan pemulihan pada retry Mayar. Infrastruktur cron sudah ada (`wrangler.jsonc` mendaftarkan `0 1 * * *` dan `*/15 * * * *`, dengan `app/api/cron/sync-subscriptions` dan `publish-scheduled`). Tambahkan satu jalur rekonsiliasi: pesanan berstatus `pending` yang punya `mayarTransactionId` dicek ulang secara berkala, atau daftar pesanan gagal provisioning ditampilkan di panel admin. Retry Mayar, kalau ternyata ada, menjadi bonus dan bukan syarat.

### T-3. Tabel `password_reset_tokens` tidak punya kolom untuk membedakan asal token

PRD menandai TBD "cara membedakan token pembelian dari token reset". Kondisi kode (`prisma/schema.prisma:368-379`): kolomnya hanya `id`, `user_id`, `email`, `token`, `expires_at`, `created_at`. Tidak ada tempat menyimpan asal token.

Tiga jalan, dengan konsekuensi masing-masing:

| Opsi | Cara | Konsekuensi |
|---|---|---|
| A. Kolom `purpose` | Tambah kolom di `password_reset_tokens`, isi `purchase` atau `reset` | Butuh migrasi baru. Paling bersih dan tahan lama |
| B. Parameter URL | Email lunas memakai `/reset-password?token=...&dari=pesanan`, hanya untuk mengganti copy | Tanpa migrasi. Penanda bisa dihapus pengguna dari URL, jadi copy tidak dijamin benar |
| C. Tabel terpisah | Tabel `purchase_password_tokens` sendiri | Butuh migrasi dan menduplikasi logika verifikasi yang sudah teruji |

Catatan urutan rilis: migrasi drop program referral masih menunggu deploy `tier-unification` (catatan proyek 12 Sep). Kalau opsi A dipilih, migrasi `purpose` ini harus mengantre sesudah urusan itu beres, bukan digabung.

### T-4. Minta lupa password menghapus token pembelian

`app/api/auth/forgot-password/route.ts:57` menghapus **semua** token milik satu pengguna sebelum membuat yang baru:

```ts
await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } })
```

Dengan rencana US-2, pembeli baru yang tautan buat passwordnya belum sempat dibuka lalu menekan "Lupa password" akan kehilangan token pembelian itu. Perilaku ini bisa diterima (token baru menggantikan yang lama, tujuannya sama), tetapi copy di halaman dan email harus mengikuti, dan kalau opsi A di T-3 dipilih, penghapusan ini harus dibatasi ke `purpose: 'reset'` supaya pembelian kedua tidak membatalkan tautan pembelian pertama.

Terkait: `lib/notifications.ts` menulis mati "Tautannya berlaku 1 jam" di badan email `password_reset`. Kalau token pembelian berlaku 72 jam, kalimat itu wajib jadi parameter, bukan teks tetap. Ini tidak tercatat di PRD.

### T-5. Balasan 401 webhook dan cron memakai kalimat untuk manusia

`app/api/payment/mayar/webhook/route.ts:24` dan `app/api/cron/sync-subscriptions/route.ts:17` sama-sama membalas token yang salah dengan `"Sesi kamu sudah berakhir. Silakan masuk lagi ya."` Pemanggilnya mesin, bukan pembeli. Saat debugging integrasi, pesan ini menyesatkan. Kecil, tapi masuk lingkup "copy yang menyatakan keadaan sebenarnya" (US-4) dan belum terdaftar di Lampiran A.

---

## 2. Koreksi atas isi PRD

### K-1. Lampiran D salah soal typecheck

PRD menulis fase yang belum di-commit "belum lolos `tsc` ulang". Hasil `npx tsc --noEmit` pada 18 Sep 2026 di working tree lengkap: **0 error**. Kalimat itu perlu dicabut. Yang benar tersisa: `fromPayment` di `app/(auth)/login/page.tsx` sudah dihitung tapi belum dipakai di tampilan.

### K-2. CTA di kerangka demo sebenarnya sudah membawa template

Lampiran A.3 menandai "CTA di kerangka demo menuju `/templates` dan membuang template" sebagai belum dicek. Hasil cek:

| Berkas | Isi | Status |
|---|---|---|
| `app/demo/[template]/DemoPreviewClient.tsx:74`, `:145` | tautan ke `/order?template=<id>` | Sudah benar |
| `app/demo/renderer/DemoEditorClient.tsx:285` | tautan ke `/order?template=<id>` | Sudah benar |
| `app/demo/renderer/DemoShell.tsx:32`, `:52`, `:55` | `/templates` | Tautan navigasi dan kembali, bukan CTA pesan |

Jadi US-7 mengecil: yang benar-benar membuang pilihan adalah tombol di bagian harga, bukan CTA demo. Klaim di PRD perlu dikoreksi supaya tidak ada pekerjaan yang dikerjakan dua kali.

### K-3. Tombol paket memang membuang pilihan, dan `/order` memang belum bisa menerimanya

`components/landing/Pricing.tsx:102` mengarah ke `/templates` tanpa membawa paket, dan `app/(main)/order/page.tsx:12` hanya membaca satu parameter: `template`. Jadi TBD "nama parameter paket" bukan sekadar penamaan, melainkan parameter yang memang belum ada di mana pun. Usul: `paket`, sejalan dengan bahasa yang dipakai di UI, dan divalidasi ke daftar `priceTiers` dengan jatuh diam ke pilihan bawaan kalau nilainya asing.

### K-4. Harga di landing sudah dari database, yang hardcoded hanya jalur cadangan

PRD US-8 meminta "semua harga yang tampil berasal dari `startingPrice()` atau `computePrice()`", seolah sekarang semuanya ditulis mati. Keadaan sebenarnya:

- `components/landing/Pricing.tsx:167-168` menerima `priceTiers` dari database lewat `app/(main)/page.tsx:29`, dan memakainya kalau isinya ada.
- `PRICING_CONFIG` di `lib/pricing-config.ts` hanya dipakai sebagai cadangan saat `priceTiers` kosong (`Pricing.tsx:233-248`). Berkas itu tidak diimpor di tempat lain mana pun.
- Pola yang sama berlaku di `components/landing/TemplatePreview.tsx:77-92`: daftar template hardcoded hanya cadangan, template asli dikirim dari `app/(main)/page.tsx:27`.

Jadi pekerjaannya bukan mengganti sumber harga, melainkan memutuskan nasib jalur cadangan: dihapus supaya kegagalan terlihat terang, atau dipertahankan dengan angka yang tidak mungkin basi. Ini keputusan yang belum ada di Lampiran C.

### K-5. Daftar kontak mati di Lampiran A.2 kurang lengkap dan mencampur dua hal berbeda

`628123456789` muncul di 14 tempat, bukan 4:

| Jenis | Lokasi |
|---|---|
| Benar-benar mati | `components/ui/Footer.tsx:24`, `:129`, `app/not-found.tsx:84`, `app/error.tsx:87` |
| Nilai cadangan dari pengaturan | `app/(main)/page.tsx:48`, `app/(main)/privacy/page.tsx:22`, `app/(main)/terms/page.tsx:22`, `components/landing/ClosingCTA.tsx:9`, `components/landing/FAQ.tsx:22` |
| Nilai bawaan pengaturan | `lib/db/settings.ts:62`, `:64` |
| Placeholder panel admin | `components/admin/AdminPanel.tsx:412`, `components/admin/tabs/SettingsTab.tsx:539` |

Empat yang pertama memang cacat. Sembilan sisanya adalah rantai cadangan yang sama dengan K-4, dan nasibnya sebaiknya diputuskan sekali untuk semua.

### K-6. Ada klaim tak berdasar yang belum masuk Lampiran A.1

Lampiran A.1 sendiri akurat: 13 baris yang dikutip cocok persis dengan kode. Tambahan yang ditemukan dalam audit ini:

| Lokasi | Isi | Kenyataan di kode |
|---|---|---|
| `app/(main)/privacy/page.tsx:99-102` | "data undangan disimpan hingga 12 bulan setelah masa aktif berakhir, lalu dihapus secara permanen" | Tidak ada pekerjaan penghapusan terjadwal. Cron yang terdaftar hanya `sync-subscriptions` dan `publish-scheduled` |
| `components/landing/FAQ.tsx:11` | "membalas dalam 1 hari kerja" | Janji layanan tanpa dasar di kode, setara R-18 |
| `lib/notifications.ts` (`payment_received`), `lib/email-templates.ts:122-129` | "Bukti transfer kalian sudah kami terima" | Sisa alur transfer manual. Sesudah checkout murni, tidak ada pemanggilnya |
| `components/landing/FeatureShowcase.tsx` | "Upload hingga 20 foto" | Batas nyata dibaca per paket dari pengaturan (`app/api/galleries/upload/route.ts:55`), bukan 20 tetap |

### K-7. Janji masa tenggang memang tanpa dasar, dan alasannya sekarang tercatat

`app/(main)/terms/page.tsx:73-78` dan `app/(main)/privacy/page.tsx:97-103` menjanjikan grace period. Mesin trial beserta `TRIAL_GRACE_DAYS` sudah dibuang (`lib/subscription.ts:36-37`), jadi tidak ada masa tenggang dalam bentuk apa pun. D-8 tetap keputusan Fakhrian, tetapi pilihan "implementasikan" berarti membangun mesin baru, bukan menghidupkan yang lama.

---

## 3. TBD yang bisa ditutup sekarang

| TBD di PRD | Jawaban | Bukti |
|---|---|---|
| Rahasia penanda tangan token halaman status | Pakai `SESSION_SECRET` (cadangan `JWT_SECRET`) lewat `jose` yang sudah dipakai sesi, dengan klaim pembeda supaya token status tidak bisa dipakai sebagai sesi. Tanpa env baru, tanpa dependency baru | `lib/session.ts:27-36`, `:66`, `:79` |
| Masa berlaku token reset sekarang | 1 jam, dari satu tempat | `app/api/auth/forgot-password/route.ts:64` |
| Perlu migrasi untuk masa berlaku token yang lebih panjang? | Tidak. `expires_at` sudah per baris | `prisma/schema.prisma:373` |
| Cara membedakan token pembelian dari token reset | Belum ada kolomnya. Tiga opsi di T-3 | `prisma/schema.prisma:368-379` |
| Nama parameter paket ke `/order` | Belum ada parameter apa pun selain `template`. Usul `paket` | `app/(main)/order/page.tsx:12` |
| Email tanpa pemanggil | Benar 4: `welcome`, `payment_received`, `subscription_active`, `subscription_expired`. Catatan: `subscription_expiring` punya pemanggil di cron, jadi jangan ikut dibuang | `lib/notifications.ts:28-38` dibanding hasil telusur pemanggil `notifyUser` dan `sendNotification` |
| Mayar mengirim ulang pada non-2xx? | Tidak terjawab dari dokumentasi Mayar. Lihat T-2 | `docs.mayar.id/integration/webhook` |
| Pesanan pending mengunci subdomain selamanya? | Benar. Pengecekan menghitung status `pending`, `paid`, `approved`, dan tidak ada pekerjaan yang mengedaluwarsakan pesanan | `lib/db/orders.ts:91`, daftar cron di `wrangler.jsonc:116-119` |
| Studio hanya mengenal tiga konfigurasi? | Benar | `components/dashboard/TemplateModule.tsx:36-38`, pesan gagal di `:92` |
| Galeri tidak sampai ke renderer? | Benar. Halaman undangan hanya mengirim `invitation.data`, tabel `galleries` tidak pernah dibaca di jalur itu | `app/invitation/[slug]/page.tsx:109-119` |
| `GET /api/orders` tidak cocok dipanggil dari `redirectUrl`? | Benar, wajib nomor pesanan dan email | `app/api/orders/route.ts:341-347` |
| Analitik pengunjung | Benar tidak ada satu pun | Telusur gtag, Plausible, Umami, PostHog, Mixpanel, Amplitude, Clarity di `app`, `components`, `lib` |
| Aturan kelayakan paket dipakai bersama | Sudah ada dan sudah ditegakkan di server (`app/api/orders/route.ts:156-161`, `lib/pricing.ts:182-191`). Yang kurang hanya penandaan di layar Paket | `app/(main)/order/OrderForm.tsx:414-440` tidak memeriksa `required_package` |

---

## 4. Keputusan yang diambil 18 September 2026

Semua keputusan terbuka ditutup pada hari audit. Sudah tertulis di Lampiran C PRD.

| ID | Keputusan | Hasil |
|---|---|---|
| D-1 | Penulis arah desain | Selesai sebelum audit. `DESIGN.md` ada di root sejak 15 Sep, memuat Design Read ENERGY 3 / RHYTHM 3 / MOTION 2 |
| D-2 | Mode antislop | Mode 1, diterapkan selama pengerjaan |
| D-3 | Tema | Terang saja, alasannya ditulis di `DESIGN.md` sesuai R-21 |
| D-4 | Studio memuat semua template aktif | Masuk MVP |
| D-5 | Analitik pengunjung | Cloudflare Web Analytics, dipasang di MVP |
| D-6 | Masa berlaku token | 7 hari untuk token status, 72 jam untuk token buat password |
| D-7 | Email tanpa pemanggil | `welcome`, `payment_received`, `subscription_active` dibuang; `subscription_expired` diberi pemanggil di cron `sync-subscriptions`. Usulan penyusun, belum dikonfirmasi ulang |
| D-8 | Janji masa tenggang | Dihapus dari teks, termasuk janji penghapusan data 12 bulan |
| D-9 | Jalur cadangan hardcoded | Dihapus semua |
| D-10 | Pembeda token pembelian | Kolom `purpose`, migrasi mengantre sesudah migrasi drop referral |
| T-1 | Bentuk payload webhook | Kode menerima dua bentuk sekarang, uji sandbox menyusul sebagai syarat rilis |
| T-2 | Pemulihan pesanan gagal | Cron rekonsiliasi dan daftar gagal di panel admin, keduanya |

Target angka K-1 dan K-2 tetap tidak bisa ditetapkan sebelum ada data pengunjung.

---

## 5. Yang butuh data produksi atau uji sandbox

| Butir | Cara menutup |
|---|---|
| Bentuk payload `payment.received` (T-1) | Satu uji kirim dari dashboard Mayar ke endpoint webhook, lalu baca log |
| Perilaku retry Mayar (T-2) | Uji sandbox: balas 500 sekali, lihat apakah ada kiriman ulang |
| Jumlah akun, pesanan, dan template aktif | Query ke database produksi |
| Worker gzip | `npm run cf:build` lalu `wrangler deploy --dry-run` |
| Urutan section landing yang tersimpan di database | Query `landingSettings` produksi |

---

## 6. Baseline yang berhasil diukur ulang

Diukur 18 September 2026 dengan `npx next build` di branch `tier-unification` beserta perubahan yang belum di-commit. Menggantikan angka Juli 2026 di Lampiran B.

| Halaman | First Load JS | Angka lama di PRD |
|---|---|---|
| `/` | 177 kB | 166 kB (5 Jul 2026) |
| `/order` | 127 kB | 110 kB (5 Jul 2026) |
| `/login` | 152 kB | 142 kB (auth, 5 Jul 2026) |
| `/forgot-password` | 152 kB | sama dengan auth |
| `/reset-password` | 152 kB | sama dengan auth |
| `/dashboard` | 264 kB | 257 kB (Jul 2026) |
| `/invitation/[slug]` | 264 kB | tidak tercatat |
| `/demo/renderer` | 225 kB | tidak tercatat |
| `/writer` | 316 kB | tidak tercatat |
| Shared semua halaman | 103 kB | tidak tercatat |
| Middleware | 40,1 kB | tidak tercatat |

Typecheck: `npx tsc --noEmit` selesai tanpa error.

---

## 7. Catatan metode

Selama audit, pencarian frasa gabungan ke seluruh repo (`grep -rn -e ... -e ... app components lib`) pernah **berhenti diam-diam dengan exit code 134 dan keluaran kosong**, seolah tidak ada yang cocok, padahal frasanya jelas ada. Pencarian per direktori yang lebih kecil berjalan benar.

Konsekuensi untuk PRD: kriteria "pencarian frasa Lampiran A.1 kembali kosong" tidak cukup sebagai bukti. Laporan tiap permukaan harus mencantumkan exit code pencarian, atau membuktikan dulu pola yang sama cocok sebelum perbaikan dan kosong sesudahnya.
