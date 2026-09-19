# Runbook Deploy: branch tier-unification

| | |
|---|---|
| Disusun | 19 September 2026 |
| Berlaku untuk | 25 commit di `tier-unification` yang belum di-push |
| Kenapa ada | Branch ini memuat DUA migrasi yang belum dijalankan, dan kode yang membaca salah satunya. Urutan yang salah membuat login produksi atau jalur buat password gagal |

## Urutan yang mengikat

Dua migrasi menunggu di `prisma/migrations`:

1. `20260911000000_drop_user_referral_program` — membuang sisa program referral pengguna. Disiapkan 11 Sep, sengaja ditahan sampai kode yang tidak lagi memakainya berada di produksi.
2. `20260918000000_password_token_purpose` — menambah kolom `purpose` di `password_reset_tokens`.

Kode di branch ini **membaca** kolom `purpose` (`app/api/auth/reset-password/route.ts`, `app/api/auth/forgot-password/route.ts`, `lib/password-token.ts`). Kalau kode dideploy sebelum migrasi kedua dijalankan, setiap permintaan lupa password dan setiap pembukaan tautan buat password akan gagal di query.

Karena itu urutannya terbalik dari kebiasaan: **migrasi kolom baru dijalankan SEBELUM kode yang membacanya naik**, sedangkan migrasi drop dijalankan SESUDAH kode yang tidak lagi memakainya naik.

```
1. Migrasi purpose        -> kolom baru, additive, aman untuk kode lama
2. Deploy kode            -> seluruh branch
3. Cek login produksi     -> sebelum menyentuh apa pun lagi
4. Migrasi drop referral  -> destruktif, hanya sesudah langkah 3 lolos
5. Cek ulang              -> pesanan dan dashboard
```

## Langkah

### 0. Sebelum mulai

- [ ] `npx tsc --noEmit` bersih di working tree.
- [ ] `node scripts/ui-check/audit.mjs` bersih untuk halaman publik yang tersentuh.
- [ ] Catat commit produksi yang sedang berjalan, untuk jalan mundur: `git rev-parse HEAD` di mesin yang terakhir deploy, atau lihat versi Worker di dashboard Cloudflare.
- [ ] Pastikan variabel rahasia produksi terisi: `SESSION_SECRET` (atau `JWT_SECRET`), `MAYAR_WEBHOOK_TOKEN`, `RESEND_API_KEY`, `CRON_SECRET`. Yang kosong bukan membuat deploy gagal, tapi membuat fiturnya diam-diam mati.

### 1. Migrasi kolom purpose

> **SUDAH DIKERJAKAN 19 September 2026.** Kolom `purpose` sudah ada di database
> produksi, dan migrasinya sudah tercatat `applied` di `_prisma_migrations`.
> Dijalankan lebih awal karena jalur Lupa password dibutuhkan untuk masuk ke
> panel admin, dan kolom tambahan dengan nilai bawaan aman untuk kode lama.
> Perintah yang dipakai: `prisma db execute --file` pada berkas migrasi itu
> saja, lalu `prisma migrate resolve --applied`. **JANGAN diulang.**
>
> Migrasi `20260911000000_drop_user_referral_program` sengaja TIDAK ikut
> dijalankan dan statusnya masih menunggu.


```bash
npx prisma migrate deploy
```

`migrate deploy` menjalankan migrasi yang belum pernah diterapkan, tanpa shadow database dan tanpa reset. Jangan memakai `migrate dev` ke produksi.

Perhatian: perintah itu akan menjalankan **semua** migrasi yang tertunda, termasuk drop referral. Kalau keduanya masih tertunda, jalankan yang purpose saja lebih dulu:

```bash
npx prisma migrate resolve --applied 20260911000000_drop_user_referral_program   # HANYA kalau isinya memang sudah pernah dijalankan manual
```

Kalau belum pernah dijalankan sama sekali, jalankan SQL-nya satu per satu sesuai urutan di atas, bukan lewat `migrate deploy` gabungan.

- [ ] Verifikasi kolomnya ada: `SELECT purpose FROM password_reset_tokens LIMIT 1;`

### 2. Deploy kode

```bash
npm run deploy
```

Perintah ini menjalankan `prisma generate`, build OpenNext, lalu `wrangler deploy` dengan env Hyperdrive.

- [ ] Sebelum deploy, ukur ukuran Worker: batasnya 3.072 KiB gzip, terakhir tercatat 2.916 KiB pada 16 Agu 2026. Sesi 18 Sep menambah satu font (Plus Jakarta Sans) dan beberapa komponen, jadi angkanya perlu dilihat lagi.
- [ ] Kalau build gagal karena EPERM Prisma di Windows, matikan dulu proses `next dev` yang masih hidup. Lihat catatan di `scripts/ui-check/README.md`.

### 3. Cek login produksi

Ini gerbangnya. Jangan lanjut ke langkah 4 sebelum semuanya lolos.

- [ ] Buka `https://iaundang.online`, halaman depan tampil.
- [ ] Masuk dengan akun yang ada. Sesi terbentuk, dashboard terbuka.
- [ ] Buka halaman Lupa password, kirim ke email sendiri, dan pastikan emailnya sampai serta tautannya bisa dibuka. Ini yang menguji kolom `purpose` di jalur nyata.
- [ ] Buka satu undangan yang sudah terbit, pastikan tampilannya tidak berubah.

Kalau ada yang gagal: rollback Worker ke versi sebelumnya dari dashboard Cloudflare. Kolom `purpose` boleh ditinggal, karena additive dan tidak mengganggu kode lama.

### 4. Migrasi drop referral

Hanya sesudah langkah 3 lolos seluruhnya. Migrasi ini destruktif.

- [ ] Jalankan migrasinya.
- [ ] Pastikan halaman afiliasi dan dashboard masih terbuka.

### 5. Cek ulang sesudahnya

- [ ] Buat satu pesanan uji sampai halaman bayar Mayar, lalu batalkan. Yang dicek: pesanan tercatat, email pesanan dibuat terkirim, dan tautan status pesanan di email itu bisa dibuka.
- [ ] Uji webhook Mayar (lihat K-6 di PRD). Ini syarat rilis MVP dan belum pernah lolos.

## Yang perlu dibereskan dari panel admin sesudah deploy

Kode sudah berhenti mengarang nilai-nilai ini, jadi yang tampil persis apa yang tersimpan:

- [ ] Nomor WhatsApp masih `628123456789`. Tautan WhatsApp di beranda dan halaman syarat menuju nomor itu.
- [ ] Tier kustom "Paket Joss" (Rp 32.000, aktif 90 hari) membuat kartu Starter tampak nyaris kosong, karena daftar fitur tiap paket dihitung sebagai selisih dari paket di bawahnya. Halaman detail tema juga menulis "Isi paket Joss".
- [ ] Deskripsi tema memakai em dash. Di halaman sudah diganti koma saat dirender, tapi sumber teksnya masih em dash.
- [ ] Masa aktif tier kustom belum ikut naik ke 365 hari. Tiga paket bawaan sudah, karena nilainya ada di kode.
