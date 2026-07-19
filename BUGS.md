# BUGS.md — iaundang

Temuan terbuka. Diperbarui 19 Juli 2026 dari review adversarial multi-agen atas
branch `feat/cloudflare-migration` (36 temuan unik; yang sudah diperbaiki tidak
dicantumkan lagi).

Kolom **Asal**: `lama` = sudah ada sebelum migrasi Cloudflare, `baru` = muncul
dari perubahan migrasi.

---

## P1 — Blocking

### Webhook Mayar menyetujui pesanan padahal invitation_id masih null
`app/api/payment/mayar/webhook/route.ts:64` · Asal: **lama**

Order ditandai `approved` lebih dulu; blok yang membuat langganan dan menandai
undangan berbayar dibungkus `if (order.invitationId && pkg)`. Untuk pesanan yang
dibuat lewat `/api/orders`, `invitation_id` SELALU null (lihat
`app/api/orders/route.ts` — `invitation_id: null`), karena undangan baru dibuat
saat admin approve manual.

Akibatnya: pelanggan bayar lewat Mayar → webhook membalas 200 → order
`approved` → tidak ada undangan, tidak ada langganan. Dan karena statusnya sudah
`approved`, jalur approve manual admin menolak dengan 409 "Pesanan sudah
diapprove". Pelanggan membayar dan tidak mendapat apa pun, tanpa jalur pemulihan
selain intervensi database manual.

Repro: buat pesanan lewat /order, bayar lewat Mayar, cek tabel invitations.

### Pemilik undangan bisa menaikkan paketnya sendiri
`app/api/invitations/[id]/route.ts:83` · Asal: **lama**

PATCH menerima field dari body tanpa allowlist, termasuk `package_tier` (dan
kemungkinan `is_paid`/`expires_at`). Pemilik undangan gratis bisa mengirim
`{ package_tier: "eksklusif" }` dan mendapat seluruh fitur berbayar tanpa
membayar. Perlu allowlist field yang boleh diubah pemilik.

---

## P2 — Penting

### Reset password tidak mencabut sesi yang sudah ada
`app/api/auth/reset-password/route.ts:93` · Asal: **lama**

JWT stateless 30 hari. Setelah korban mereset password, token yang sudah dicuri
tetap berlaku sampai kedaluwarsa. Logout juga hanya menghapus cookie di sisi
klien. Perlu penanda versi sesi per user (mis. kolom `sessionEpoch`) yang ikut
diverifikasi.

### Upload anonim tanpa batas ke Supabase Storage
`app/api/gift-proof/upload/route.ts:50` · Asal: **lama**

Jalur `invitationId === 'preview'` sudah ditutup (kini wajib sesi), TAPI untuk
undangan yang benar-benar terbit endpoint ini memang sengaja tanpa login —
sehingga siapa pun yang tahu slug undangan publik bisa mengunggah berkas 10 MB
berulang kali ke storage berbayar. Perlu rate limit per invitationId dan/atau
batas jumlah bukti per undangan.

### PrismaClient per-request tidak pernah ditutup
`lib/prisma.ts:93` · Asal: **baru**

Client dibuat per request (wajib di Workers — socket tidak boleh lintas
request), tapi `$disconnect()` tidak pernah dipanggil sehingga `pg.Pool`
internalnya tidak pernah `end()`. Belum terbukti bermasalah pada trafik rendah,
tapi perlu diukur di bawah beban sebelum trafik produksi dialihkan. Catatan:
memanggil `$disconnect()` lewat `waitUntil` TIDAK benar — itu akan memutus
koneksi saat query masih berjalan.

### Klaim status bukti pembayaran terjadi sebelum efek sampingnya
`app/api/admin/proofs/[id]/route.ts:25` · Asal: **baru**

`paymentProofs.review()` membalik status ke `approved` secara atomik lebih dulu,
baru menjalankan pembuatan langganan dan komisi afiliasi. Kalau salah satu
langkah itu gagal (jaringan, timeout), statusnya terlanjur `approved` sehingga
percobaan ulang membalas 409 dan approval terkunci permanen tanpa langganan
pernah dibuat. Idempotensinya benar, urutannya yang salah.

### getSecret() melempar sehingga misconfigurasi = 500, bukan 401
`lib/session.ts:64` · Asal: **baru**, disengaja

Ini keputusan sadar: lebih baik mati terang-terangan daripada diam-diam bisa
dipalsukan. Tapi konsekuensinya SESSION_SECRET yang lupa diset membuat seluruh
situs 500, bukan sekadar pengguna logout. Perlu ditimbang ulang: mungkin
middleware sebaiknya membalas 503 dengan pesan jelas.

### Jalur admin-lewat-email kini tidak pernah terpakai
`lib/auth.ts:26` · Asal: **baru**

`isAdmin()` mengembalikan false untuk token apa pun yang punya field `role`, dan
login SELALU mengisi role (kolom `users.role` punya default "user"). Jadi
kecocokan ADMIN_EMAIL efektif mati. Saat ini AMAN karena akun admin sungguhan
(`mdcodeid@gmail.com`) memang `role="admin"` di database — tapi artinya
ADMIN_EMAIL tinggal berfungsi sebagai pelindung akun, bukan pemberi hak. Perlu
diputuskan: hapus jalur itu sepenuhnya, atau kembalikan sebagai fallback.

### UI approve/reject pencairan mengabaikan 409
`components/admin/tabs/AffiliatesTab.tsx:118` · Asal: **baru**

Backend kini membalas 409 kalau permintaan sudah diproses, tapi UI tetap
melaporkan sukses. Admin mengira klik keduanya berhasil.

### Komisi afiliasi memakai harga Popular saat tier tidak ditemukan
`app/api/admin/proofs/[id]/route.ts:67` · Asal: **baru**

`PACKAGES[tier] ?? PACKAGES.popular` sebagai fallback membuat tier kustom yang
lebih murah dibayar komisi setara Popular. Sebaiknya tolak dan catat, jangan
menebak harga.

### /api/orders menerima id tier apa pun dari priceTiers
`app/api/orders/route.ts:69` · Asal: **baru**

Halaman order hanya menawarkan starter/popular/eksklusif, tapi API menerima id
tier mana pun yang ada di settings. Pesanan dengan tier di luar ketiganya akan
gagal saat approval (`PACKAGES[tier]` undefined) setelah buktinya terlanjur
diklaim.

### Endpoint penghitung tanpa autentikasi
`app/api/views`, `app/api/referral`, `app/api/music/[id]/usage`,
`app/api/articles/[slug]/views`, `app/api/experiments/assign` · Asal: **lama**

Semua menerima tulisan tanpa login dan tanpa dedupe. Angka yang dipakai pemilik
undangan dan admin untuk mengambil keputusan (termasuk metrik klik afiliasi dan
hasil A/B test) bisa dipalsukan siapa saja.

### /api/feedback: cek rentang berjalan sebelum konversi angka
`app/api/feedback/route.ts:15` · Asal: **lama**

`score < 0 || score > 10` dievaluasi pada nilai JSON mentah. `null` lolos dan
tersimpan sebagai 0; string non-numerik melempar 500 yang tidak tertangani.

### proof_url tidak divalidasi lalu dirender ke href admin
`app/api/payment/proof/route.ts:44` · Asal: **lama**

Nilainya dikirim pembeli tanpa allowlist protokol, lalu ditampilkan langsung di
panel admin sebagai tautan. Pakai `safeUrl()` dari `lib/html-safe.ts`.

### Wishes bocor dari undangan yang belum terbit
`app/api/wishes/route.ts:40` · Asal: **lama**

GET tidak memeriksa `is_published`.

### Enumerasi pengguna saat registrasi
`app/api/auth/register/route.ts:25` · Asal: **lama**

409 "Email sudah terdaftar" membedakan akun yang ada. Trade-off UX vs privasi —
mitigasi yang lebih tepat adalah rate limit, bukan menghilangkan pesannya.

### custom-worker.ts tidak meneruskan export Durable Object
`custom-worker.ts:31` · Asal: **baru**

Belum berdampak karena open-next.config.ts tidak memakai DO queue/tag cache.
AKAN merusak deploy begitu incremental cache diaktifkan. Tambahkan
`export { DOQueueHandler, DOShardedTagCache } from './.open-next/worker.js'`
kalau nanti caching dinyalakan.

---

## P3 — Minor

- `app/api/admin/users/route.ts:85` — `role` ditulis apa adanya tanpa validasi enum (route `[id]` sudah memvalidasi).
- `app/api/user/upload/route.ts:14` — `ALLOWED_FOLDERS` memuat `'music'`, membiarkan pengguna biasa menulis ke namespace musik kurasi admin.
- `app/api/auth/register/route.ts:12` — minimum password 6 karakter, tanpa cek komposisi maupun kebocoran.
- `app/(app)/affiliate/page.tsx:301` — dashboard menampilkan `pendingBalance` mentah sebagai "Saldo tersedia", padahal API memakai `availableBalance` (saldo dikurangi permintaan yang masih pending). Angkanya bisa berbeda dari yang benar-benar bisa dicairkan.
- `lib/db.ts:1240` — `paymentProofs.update()` kini tidak dipakai lagi tapi masih bisa menulis status tanpa guard `pending`. Hapus supaya tidak dipakai ulang tanpa sadar.
- `wrangler.jsonc:11` — `compatibility_date` 2026-07-18 lebih baru dari workerd yang terbundel di wrangler 4.112, jadi runtime lokal dan produksi bisa berbeda perilaku.
- `next.config.mjs` — Next 16 akan mewajibkan `images.qualities`; saat ini muncul peringatan untuk quality 90 dan 100.

---

## Belum terverifikasi

- **Pembatas laju** — binding LOGIN_RATE_LIMIT / EMAIL_RATE_LIMIT terpasang dan tidak ada error di log, tapi 14 percobaan login berturut-turut TIDAK memicu 429. Konfigurasinya benar, penerapannya belum terbukti. Uji ulang setelah DNS pindah.
- **Rewrite subdomain** (`*.iaundang.online` → `/invitation/<slug>`) — tidak bisa diuji sebelum DNS pindah. Header Host yang dipalsukan ditolak 403 oleh edge Cloudflare.
- **Alur berbayar ujung-ke-ujung** — order → bayar → approve → login belum pernah dijalankan sungguhan di Cloudflare.
- **Upload gambar** ke Supabase Storage dari Worker (resize browser + magic byte) belum diuji dengan sesi login sungguhan.
