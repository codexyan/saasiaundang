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

### ~~PrismaClient per-request tidak pernah ditutup~~ — DIUKUR, BUKAN KEBOCORAN
`lib/prisma.ts` · Asal: **baru** · Ditutup 16 Agu 2026, **tanpa perubahan kode**

Dugaan lamanya: `$disconnect()` tidak pernah dipanggil sehingga `pg.Pool`
internalnya tidak pernah `end()` dan koneksi menumpuk. Sudah diselidiki dan
diukur; dugaan itu tidak terbukti.

**Bukti dokumentasi Cloudflare:**
- "TCP sockets cannot be created in global scope and shared across requests.
  You should always create TCP sockets within a handler." — socket TIDAK BISA
  hidup melewati request, jadi tidak ada jalan untuk bocor antar-request.
- "Hyperdrive maintains the underlying database connection pool, so creating a
  new client on each request is fast and **recommended**" — pola per-request
  di `lib/prisma.ts` justru yang disarankan, bukan penyimpangan.
- `max: 5` pada PrismaPg sudah di bawah batas ~6 koneksi per invocation.

**Bukti pengukuran di produksi (16 Agu 2026):** jumlah koneksi di Postgres
dibaca lewat `pg_stat_activity` sebelum dan sesudah 30 request bersamaan ke
endpoint yang menyentuh database — hasilnya **identik**: `total=12 active=1
idle=10`, tidak bergerak sama sekali. Ditambah 40 request berurutan dan 40
bersamaan: nol kegagalan, tanpa degradasi latensi.

**Kesimpulan: jangan tambahkan `$disconnect()`.** Selain tidak perlu, lewat
`waitUntil` justru berbahaya — akan memutus koneksi saat pekerjaan
`runAfterResponse()` masih memakai database.

Batas bukti ini, supaya jujur: 30 request bersamaan itu beban ringan, bukan
load test sungguhan, dan angka `pg_stat_activity` memperlihatkan pool
Hyperdrive (bukan socket Worker secara langsung). Kalau trafik nanti naik
drastis, ukur ulang dengan cara yang sama sebelum menyimpulkan.

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

### ~~Endpoint penghitung tanpa autentikasi~~ — SELESAI

Kelimanya (`app/api/views`, `app/api/music/[id]/usage`,
`app/api/articles/[slug]/views`, `app/api/experiments/assign`,
`app/api/referral`) kini dibatasi `COUNTER_RATE_LIMIT` (60/60s, per key).

Catatan desain untuk `/api/referral`: yang dibatasi hanya penghitung kliknya,
bukan seluruh request — endpoint itu juga memasang cookie atribusi 30 hari
yang menentukan komisi afiliator, jadi memblokir request penuh justru merugikan
afiliator yang sah. Cookie selalu dipasang, hanya penghitungnya yang berhenti.

### Dua tombol Template Lab yang diam-diam tidak berfungsi
`components/admin/tabs/TemplateLab.tsx` · Asal: **lama** · Ditemukan 16 Agu 2026

Ditemukan saat menganalisis seam ekstraksi TemplateLab, diverifikasi langsung
dengan membaca kodenya (bukan asumsi):

**1. `coverPreviewMode` — dua tombol berbeda yang berperilaku identik.**
State-nya di-`set` di 5 tempat tapi **tidak pernah dibaca sekali pun**.
Akibatnya, di tab Decor tombol **"▶ Preview Masuk"** dan **"▶▶ Full Flow"**
hanya berbeda pada `setCoverPreviewMode('entry')` vs `('full-flow')` — sisanya
sama persis. Admin melihat dua tombol, hasilnya satu perilaku yang sama.
Hal yang sama membuat `onPreview` dan `onPreviewExit` pada
`DecorationLayerList` juga identik.

**2. `fullscreenPhase` — fase preview fullscreen tidak pernah dipakai.**
Di-`set` di 2 tempat, tidak pernah dibaca. Modal fullscreen selalu langsung
merender `InvitationRenderer` apa pun fasenya, jadi urutan opening -> loading
-> main tidak pernah terlihat di mode fullscreen.

**JANGAN hapus statenya untuk "membersihkan warning".** Keduanya berpola sama:
setter tersambung, pembacanya tidak pernah ditulis — ini fitur yang belum
selesai/putus, bukan sampah. Menghapusnya akan membekukan kerusakannya jadi
permanen dan menghilangkan jejaknya. Yang benar: sambungkan pembacanya, atau
hapus sekalian tombol/mode-nya kalau fiturnya memang dibatalkan.

Kode mati sungguhan yang aman dihapus (nol pembacaan, tidak menyiratkan fitur):
blok CRUD kategori di TemplateLab (`categoryList`, `catAdd`, `catDelete`,
`catEdit`, ~40 baris), `templateTags`, dan `openJsonTab()` yang badannya kosong.

Catatan kenapa semua ini lolos: `tsconfig.json` tidak mengaktifkan
`noUnusedLocals`, dan eslint hanya memakai `next/core-web-vitals`.

### `canUndo`/`canRedo` dihitung dari ref saat render
`components/admin/tabs/TemplateLab.tsx` · Asal: **lama**

Keduanya dihitung dari `historyRef.current`/`historyIndexRef.current` di badan
render. Ref tidak memicu re-render, jadi status aktif/nonaktif tombol Undo/Redo
bisa tertinggal dari keadaan sebenarnya sampai ada render lain yang kebetulan
terjadi. Perlu dipindah ke state kalau mau benar.

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

## Catatan arsitektur — direkomendasikan, sengaja belum dikerjakan (16 Agu 2026)

Dari audit arsitektur menyeluruh (4 fork paralel: lapisan data, API routes,
frontend/bundle, performa produksi). Tingkat 1 (performa/caching, 8 item) dan
Tingkat 2 (pecah `lib/db.ts` + `withAdminAuth`) sudah dikerjakan dan di-deploy.
Item di bawah ini BUKAN bug — nilainya nyata tapi risiko/usahanya besar untuk
aplikasi yang sedang melayani pembayaran sungguhan, jadi sengaja ditunda ke
sesi terpisah dengan fokus penuh:

- **Pecah `TemplateLab.tsx`** — **berjalan, 5914 → 4447 baris.** Sudah keluar:
  seluruh bagian stateless (konstanta, VariantThumb, DecorationLayerList,
  pembungkus field) + `LoadingScreenPanel` (panel stateful pertama, 4 prop).

  Seam berikutnya SUDAH dipetakan, tinggal dikerjakan, urut dari paling aman:
  1. `MusicTab` (324 baris) + hook `useMusicLibrary` — kluster paling
     terisolasi; hanya perlu expose `stopPreview()` untuk 2 titik sentuh.
  2. `SectionExpandedEditor` (512 baris → 8 prop + `section`) — rasio terbaik.
  3. `TampilanTab` (853 baris → 11 prop) — blok terbesar, `previewData` hanya
     dibaca.
  4. `OpeningPanel` (839 baris → 8 prop), `ReleaseModal` (115 → 8 prop).

  **JANGAN diekstrak** (rasio prop jelek, diverifikasi): panel preview kanan
  (26 prop), footer aksi (13 prop untuk 77 baris), tab decor (14 prop untuk 180
  baris), tab konten sebagai satu blok (23 prop).

  **Aturan wajib:** tiap hasil ekstraksi HARUS file terpisah. Komponen yang
  didefinisikan inline berganti identitas tiap render, dan semua `<input>`
  terkendali di dalamnya kehilangan fokus tiap ketikan — kegagalan runtime yang
  `tsc` tidak lihat.
- **Standardisasi Zod ke seluruh 88 route** — **semua route uang & auth
  pengguna sudah selesai** (16 Agu 2026): `/api/orders`, `/api/payment/proof`,
  `/api/affiliate` (PATCH), `/api/affiliate/withdrawals`,
  `/api/auth/reset-password`, `/api/auth/forgot-password`. Totalnya 14 route
  memakai zod.

  Sisanya (~47) sengaja bertahap. Prioritasnya sudah dinilai: mayoritas ada di
  `app/api/admin/**` yang berada di balik `withAdminAuth`, jadi penyerang harus
  sudah menjadi admin — risikonya jauh lebih rendah daripada route publik.
  Yang tersisa dan layak duluan kalau disentuh lagi:
  - `invitations/[id]` PATCH — sengaja dilewati: `data` berupa blob JSON besar
    dan normalisasi `slug` (yang jadi subdomain publik) butuh kehati-hatian
    terhadap data lama; tidak bisa diverifikasi lewat curl.
  - `tickets` POST, `writer/articles` POST/PATCH, `feedback` POST.
- ~~**`useApiMutation`/`useApiQuery` hook**~~ — **SELESAI dibuat**
  (`hooks/useApi.ts`, 16 Agu 2026), diadopsi di `ArticleCategoriesManager`
  sebagai bukti pakai. Migrasi ~145 pemanggilan `fetch()` lainnya sengaja
  organik: dikerjakan saat file itu memang sedang disentuh, bukan sekali-jalan.

  **Jebakan saat mengadopsi** (sudah kena sekali, dicatat supaya tidak
  terulang): kalau komponen punya state loading sendiri yang menggerakkan UI,
  PERTAHANKAN state itu dan abaikan `loading` dari hook. Satu instance hook
  yang dipakai beberapa aksi membuat `loading`-nya menyala untuk SEMUA aksi —
  tombol "Tambah" ikut berputar saat baris lain dihapus.
- ~~**Rasio 84% Client Component**~~ — **SUDAH DIAUDIT, sebagian besar temuan
  palsu.** Rasionya benar (149/180 = 83%), tapi hanya 6 file yang tidak punya
  fitur khusus klien, dan cuma 2 yang berguna diubah (MarkdownContent,
  DemoShell — sudah dikerjakan 16 Agu 2026). Sisanya gugur karena **diimpor
  Client Component lain, sehingga tetap masuk bundle klien** — mencabut
  `'use client'` di sana nol manfaat. Pelajaran untuk audit serupa ke depan:
  rasio agregat bukan indikator; yang menentukan adalah siapa pengimpornya.
- ~~**`PrismaClient` tanpa `$disconnect`**~~ — **SELESAI, tanpa perubahan kode.**
  Diukur langsung: koneksi Postgres tidak bertambah sama sekali sesudah burst.
  Lihat bagian P2 di atas untuk bukti lengkapnya.

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

Dua dari empat butir di sini sudah TERBUKTI setelah cutover DNS 20 Jul 2026 —
lihat bagian "Terverifikasi di produksi" di bawah.

- **Alur berbayar ujung-ke-ujung** — order → bayar Mayar → provisioning otomatis
  → login belum pernah dijalankan dengan transaksi sungguhan.
- **Upload gambar** ke Supabase Storage dari Worker (resize browser + magic byte)
  belum diuji dengan sesi login sungguhan.

---

## Terverifikasi di produksi (20 Jul 2026, iaundang.online)

- **Routing subdomain undangan** — `demo.iaundang.online` → 200, dan isinya
  benar "Undangan Belum Aktif" (undangan itu memang `is_published: false`).
  Rewrite host→slug di `middleware.ts` bekerja di domain asli.
- **Pembatas laju** — 12 percobaan login berturut-turut: percobaan ke-12 dibalas
  **429**. Di workers.dev ini tidak pernah terpicu; di zona domain asli aktif.
- **Worker yang melayani, bukan Vercel** — kelima header keamanan yang hanya ada
  di kode baru (`X-Content-Type-Options`, `X-Frame-Options`, HSTS,
  `Permissions-Policy`, `Referrer-Policy`) muncul di respons `iaundang.online`.
- **Universal SSL** terbit dan valid (`ssl_verify_result=0`), termasuk untuk
  subdomain — CAA yang membatasi CA ternyata tidak menghalangi.
- **Database lewat Hyperdrive** — `/api/payment/config` mengembalikan data asli,
  `/templates` merender ketiga template dari database.
- **Proteksi API** — `/api/auth/me`, `/api/admin/users`, `/api/gift-proof`
  semuanya 401 tanpa sesi.
- **Record Resend utuh** setelah pindah nameserver (DKIM, SPF, MX `send`).
