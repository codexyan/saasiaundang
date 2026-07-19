# BUGS.md — iaundang

Temuan terbuka. Diperbarui 19 Juli 2026 dari review adversarial multi-agen atas
branch `feat/cloudflare-migration` (36 temuan unik).

Kolom **Asal**: `lama` = sudah ada sebelum migrasi Cloudflare, `baru` = muncul
dari perubahan migrasi.

---

## P1 — Blocking

Tidak ada. Dua P1 sebelumnya sudah diperbaiki (commit `fa48e4b`):

- **Webhook Mayar tidak menyediakan apa pun** — pesanan dari `/api/orders` selalu
  ber-`invitation_id` null, sehingga blok penyediaan dilewati tapi status
  terlanjur `approved` dan approve manual admin lalu menolak 409. Kini webhook
  dan approve admin memakai satu jalur bersama (`lib/provision-order.ts`), dan
  status pesanan baru diubah SETELAH penyediaan berhasil.
- **Pemilik undangan bisa menaikkan paketnya sendiri** — PATCH
  `/api/invitations/[id]` kini memakai allowlist field (`slug`, `template_id`,
  `data`, `is_published`). `handleSimulatePay()` di dashboard, yang mengirim
  `{ is_paid: true }` langsung dari browser, ikut dihapus.

**Sudah dicek di database produksi (19 Jul 2026): TIDAK ADA korban.** Kedua
pesanan yang ada berstatus `pending` dengan `payment_method` null — belum pernah
ada yang benar-benar melewati Mayar. Query pemeriksaan untuk dipakai lagi:

```sql
SELECT order_number, email, status FROM orders
WHERE status = 'approved' AND invitation_id IS NULL;
```

---

## P2 — Penting

### PrismaClient per-request tidak pernah ditutup
`lib/prisma.ts:93` · Asal: **baru**

Client dibuat per request (wajib di Workers — socket tidak boleh lintas
request), tapi `$disconnect()` tidak pernah dipanggil sehingga `pg.Pool`
internalnya tidak pernah `end()`. Belum terbukti bermasalah pada trafik rendah,
tapi perlu diukur di bawah beban sebelum trafik produksi dialihkan.

Catatan: memanggil `$disconnect()` lewat `waitUntil` TIDAK benar — itu akan
memutus koneksi saat query masih berjalan.

### getSecret() melempar sehingga misconfigurasi = 500, bukan 401
`lib/session.ts:64` · Asal: **baru**, disengaja

Keputusan sadar: lebih baik mati terang-terangan daripada diam-diam bisa
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

### Endpoint penghitung tanpa autentikasi
`app/api/views`, `app/api/referral`, `app/api/music/[id]/usage`,
`app/api/articles/[slug]/views`, `app/api/experiments/assign` · Asal: **lama**

Semua menerima tulisan tanpa login dan tanpa dedupe. Angka yang dipakai pemilik
undangan dan admin untuk mengambil keputusan (termasuk metrik klik afiliasi dan
hasil A/B test) bisa dipalsukan siapa saja. Binding rate limit sudah tersedia
(`lib/rate-limit.ts`) kalau mau dibatasi.

### Enumerasi pengguna saat registrasi
`app/api/auth/register/route.ts:25` · Asal: **lama**

409 "Email sudah terdaftar" membedakan akun yang ada. Trade-off UX vs privasi.
Mitigasi yang lebih tepat adalah rate limit, bukan menghilangkan pesannya.

### custom-worker.ts tidak meneruskan export Durable Object
`custom-worker.ts:31` · Asal: **baru**

Belum berdampak karena `open-next.config.ts` tidak memakai DO queue/tag cache.
AKAN merusak deploy begitu incremental cache diaktifkan. Tambahkan
`export { DOQueueHandler, DOShardedTagCache } from './.open-next/worker.js'`
kalau nanti caching dinyalakan.

---

## P3 — Minor

- `app/api/admin/users/route.ts:85` — `role` ditulis apa adanya tanpa validasi enum (route `[id]` sudah memvalidasi).
- `app/api/user/upload/route.ts:14` — `ALLOWED_FOLDERS` memuat `'music'`, membiarkan pengguna biasa menulis ke namespace musik kurasi admin.
- `app/api/auth/register/route.ts:12` — minimum password 6 karakter, tanpa cek komposisi maupun kebocoran.
- `app/(app)/affiliate/page.tsx:301` — dashboard menampilkan `pendingBalance` mentah sebagai "Saldo tersedia", padahal API memakai `availableBalance`.
- `lib/db.ts` — `paymentProofs.update()` kini hanya dipakai untuk MEMBATALKAN klaim saat efek samping gagal; jangan dipakai untuk approve (tidak punya guard `pending`).
- `wrangler.jsonc:11` — `compatibility_date` 2026-07-18 lebih baru dari workerd yang terbundel di wrangler 4.112, jadi runtime lokal dan produksi bisa berbeda perilaku.
- `next.config.mjs` — Next 16 akan mewajibkan `images.qualities`; saat ini muncul peringatan untuk quality 90 dan 100.
- **Drift schema Prisma** — kolom `users.referral_code` ada di database tapi tidak dibuat lewat migration mana pun. Akibatnya `prisma migrate dev` menganggap perlu MERESET seluruh skema ("All data will be lost"). Jangan pernah jalankan `migrate dev` terhadap database produksi. Migration baru dibuat manual lalu didaftarkan dengan `prisma migrate resolve --applied`.

---

## Sudah diperbaiki di ronde ini

- Reset password kini MENCABUT semua sesi lama (kolom `users.session_epoch`, ditanam di token, diverifikasi tiap request). Diuji end-to-end di deploy: token lama ditolak 401 seketika setelah epoch naik.
- Upload bukti hadiah anonim kini dibatasi 20/menit per undangan.
- Klaim status bukti pembayaran mengembalikan status ke `pending` kalau efek sampingnya gagal, jadi tidak lagi terkunci 409 permanen.
- Komisi afiliasi tidak lagi jatuh ke harga Popular saat tier tidak ditemukan.
- `/api/orders` menolak tier di luar PACKAGES.
- UI pencairan afiliasi menangani 409.
- `/api/feedback` mengonversi angka sebelum memeriksa rentang.
- `proof_url` disaring protokolnya sebelum disimpan.
- Ucapan pada undangan yang belum terbit hanya bisa dilihat pemiliknya.

---

## Belum terverifikasi

- **Pembatas laju** — binding terpasang dan tidak ada error di log, tapi 14 percobaan login berturut-turut TIDAK memicu 429. Konfigurasinya benar, penerapannya belum terbukti. Uji ulang setelah DNS pindah.
- **Rewrite subdomain** (`*.iaundang.online` → `/invitation/<slug>`) — tidak bisa diuji sebelum DNS pindah. Header Host yang dipalsukan ditolak 403 oleh edge Cloudflare.
- **Alur berbayar ujung-ke-ujung** — order → bayar → approve → login belum pernah dijalankan sungguhan di Cloudflare.
- **Upload gambar** ke Supabase Storage dari Worker (resize browser + magic byte) belum diuji dengan sesi login sungguhan.
