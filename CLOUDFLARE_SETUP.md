# Deploy iaundang ke Cloudflare Workers

Panduan operasional migrasi dari Vercel ke Cloudflare. Ikuti berurutan —
langkah 5 (DNS) adalah yang paling berisiko dan paling mudah salah.

Stack setelah migrasi:

| Bagian | Sebelum | Sesudah |
|---|---|---|
| Runtime | Vercel Serverless (Node) | Cloudflare Workers (`workerd`) |
| Adapter | — | `@opennextjs/cloudflare` 1.20.1 |
| Framework | Next.js 14.2.35 | Next.js 15.5.20 + React 19 |
| Koneksi DB | pooler Supabase langsung | Hyperdrive → Supabase Postgres |
| ORM | Prisma 5.22 (engine biner) | Prisma 6.19.3 + `@prisma/adapter-pg` |
| Cron | `vercel.json` | Cron Trigger → `scheduled()` |
| Resize gambar | `sharp` di server | canvas di browser |
| Storage file | Supabase Storage | Supabase Storage (tidak berubah) |

---

## 0. Prasyarat

- Akun Cloudflare (paket Free sudah cukup untuk memulai).
- Akses **registrar** domain `iaundang.online` untuk mengganti nameserver.
  Ini kuncinya — bukan akses Vercel. Kalau DNS saat ini dikelola Vercel,
  domainnya tetap bisa dipindah selama registrar masih bisa diakses.
- Nilai secret produksi. Semuanya masih ada di `.env.local` di mesin ini, jadi
  tidak perlu login ke Vercel untuk mengambilnya.

```bash
npx wrangler login
```

> **Rotasi dulu sebelum deploy.** `SESSION_SECRET` produksi selama ini adalah
> konstanta yang ada di dalam repo (lihat catatan di `lib/session.ts`), jadi
> harus dianggap bocor. Selagi rotasi, sekalian putar `CRON_SECRET`,
> `MAYAR_WEBHOOK_TOKEN`, dan `SUPABASE_SERVICE_ROLE_KEY`.

---

## 1. Buat Hyperdrive — ✅ SUDAH DIKERJAKAN

Hyperdrive menyatukan koneksi dari Workers ke Supabase. Tanpa ini, tiap isolate
membuka koneksi Postgres sendiri dan pool Supabase cepat habis.

Config sudah dibuat dan id-nya sudah terpasang di `wrangler.jsonc`:

```
iaundang-db  ->  ccaa0aea299f4410a1973117d3b15dd8
```

Perintah yang dipakai (untuk referensi kalau perlu dibuat ulang):

```bash
npx wrangler hyperdrive create iaundang-db \
  --connection-string="postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres"
```

**Pakai DIRECT connection (port 5432), bukan pooler.** Hyperdrive melakukan
poolingnya sendiri; menaruhnya di depan pgbouncer Supabase berarti pooling
ganda. Perhatikan bedanya dengan `DATABASE_URL` di `.env.local` yang memang
memakai transaction pooler `...pooler.supabase.com:6543` — itu untuk dev lokal
dan `prisma migrate`, bukan untuk Hyperdrive.

Catatan: host direct Supabase (`db.<ref>.supabase.co`) hanya punya record
**IPv6**. Sudah diuji dan Hyperdrive bisa menjangkaunya. Kalau suatu saat
bermasalah, alternatifnya **session** pooler
(`aws-1-ap-south-1.pooler.supabase.com:5432`, user `postgres.<ref>`) yang
ber-IPv4 — jangan transaction pooler 6543, karena mode transaksi tidak
mendukung prepared statement.

---

## 2. Set secret — ✅ SUDAH DIKERJAKAN

Keenam secret sudah terpasang di Worker `iaundang`. `SESSION_SECRET` dan
`CRON_SECRET` **dibuat baru** (nilai lama harus dianggap bocor);
`SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `MAYAR_API_KEY`, dan
`MAYAR_WEBHOOK_TOKEN` disalin dari `.env.local`.

`MAYAR_WEBHOOK_TOKEN` sengaja TIDAK diputar — memutarnya tanpa memperbarui
dashboard Mayar akan membuat webhook pembayaran berhenti bekerja. Kalau ingin
memutarnya, lakukan bersamaan dengan langkah 7.

Referensi perintahnya:

Yang tidak rahasia sudah ada di `vars` dalam `wrangler.jsonc`. Yang rahasia
dimasukkan satu per satu (nilainya tidak akan muncul di log):

```bash
npx wrangler secret put SESSION_SECRET            # WAJIB, min. 32 karakter, PUTAR BARU
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY # WAJIB
npx wrangler secret put CRON_SECRET               # WAJIB, PUTAR BARU
npx wrangler secret put RESEND_API_KEY            # kosong = email hanya masuk log
npx wrangler secret put MAYAR_API_KEY
npx wrangler secret put MAYAR_WEBHOOK_TOKEN       # PUTAR BARU, lalu update di dashboard Mayar
```

Membuat `SESSION_SECRET` baru:

```bash
node -e "console.log(crypto.randomUUID().replace(/-/g,'')+crypto.randomUUID().replace(/-/g,''))"
```

**Semua pengguna akan logout** begitu secret ini berganti. Itu memang tujuannya:
token apa pun yang dibuat dengan secret lama (termasuk yang dipalsukan) langsung
tidak berlaku.

Cek daftarnya:

```bash
npx wrangler secret list
```

---

## 3. Variabel build

`NEXT_PUBLIC_*` **ditanam saat build**, bukan dibaca saat runtime. Kalau deploy
lewat Workers Builds (CI dari GitHub), isi juga di
**Workers & Pages → Settings → Build → Variables and secrets**:

| Variabel | Nilai |
|---|---|
| `NEXT_PUBLIC_APP_URL` | `https://iaundang.online` |
| `NEXT_PUBLIC_APP_DOMAIN` | `iaundang.online` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://[ref].supabase.co` |
| `DATABASE_URL` | pooler Supabase — dipakai `prisma generate` saat build |

Deploy dari laptop tidak perlu ini; `.env.local` sudah dibaca.

---

## 4. Deploy percobaan ke workers.dev — ✅ SUDAH JALAN

Live di **https://iaundang.mdcodeid.workers.dev** dan sudah diverifikasi
memakai database produksi:

| Cek | Hasil |
|---|---|
| Halaman depan | 200, 159 KB HTML |
| `/api/payment/config` | 200, data asli dari DB |
| `/templates` | 200, ketiga template dari DB tampil (Rose Garden, Midnight Luxe, Javanese Gold) |
| `/blog` | 200 (kosong — DB memang punya 0 artikel) |
| `/sitemap.xml` | 200, 5 URL (5 statis + 0 artikel + 0 undangan terbit) |
| `/order?template=...` | 200 |
| POST `/api/auth/login` password salah | 401 JSON — bcrypt jalan tanpa kena batas CPU |
| POST `/api/orders` body kosong | 400 "Data tidak lengkap" |
| Cron `*/15` | terpicu sesuai jadwal, handler `scheduled()` jalan dan mencatat hasilnya |

### Deploy dari mesin lokal

`opennextjs-cloudflare deploy` menyalakan proxy platform lokal dan menuntut
connection string Hyperdrive lokal, walaupun deploy sendiri tidak memakainya.
Jadi sediakan dulu:

```bash
export CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE="<DATABASE_URL dari .env.local>"
npx wrangler deploy
```

Tanpa itu deploy berhenti dengan:
*"When developing locally, you should use a local Postgres connection string to
emulate Hyperdrive functionality."*

### Yang belum bisa diuji di sini

- Subdomain undangan (`*.iaundang.online`) — butuh domain sungguhan, lihat langkah 5
- Login sampai tembus dashboard — perlu kredensial pengguna
- Upload gambar ke Supabase Storage
- Alur pesanan sungguhan sampai pembayaran

Kalau ada yang gagal:

```bash
npx wrangler tail
```

`observability` sudah aktif, jadi log juga tersimpan di dashboard.

> Subdomain undangan (`*.iaundang.online`) **belum** bisa diuji di sini —
> perlu domain sungguhan. Itu langkah berikutnya. Untuk uji cepat, jalur
> localhost masih berlaku: `?slug=<slug>` (lihat `middleware.ts`).

---

## 5. DNS dan routing domain ⚠️

Langkah paling berisiko. Baca sampai habis sebelum mulai.

**5a. Tambahkan zona.** Di dashboard Cloudflare: **Add a site** →
`iaundang.online`. Cloudflare akan menyalin record DNS yang ada — **periksa
hasil salinannya** sebelum lanjut, terutama record MX/email. Kalau ada yang
hilang, tambahkan manual sekarang, jangan setelah nameserver pindah.

**5b. Ganti nameserver di registrar** ke dua nameserver yang diberikan
Cloudflare. Propagasi biasanya beberapa menit sampai beberapa jam.

**5c. Record DNS yang dibutuhkan** (semuanya **Proxied / orange cloud**):

| Tipe | Nama | Isi | Proxy |
|---|---|---|---|
| AAAA | `@` | `100::` | Proxied |
| AAAA | `www` | `100::` | Proxied |
| AAAA | `*` | `100::` | Proxied |

`100::` adalah alamat IPv6 pembuangan. Isinya tidak pernah dihubungi — record
ini hanya perlu ada supaya Cloudflare mau menerima permintaannya, lalu route
Worker yang menanganinya. Record `*` inilah yang membuat subdomain undangan
hidup.

**5d. Nyalakan route.** Buka blok `routes` di `wrangler.jsonc` (hapus tanda
komentarnya), lalu deploy ulang:

```bash
npm run deploy
```

Tiga pola itu diperlukan:

- `iaundang.online/*` — situs utama
- `www.iaundang.online/*` — pengalihan www
- `*.iaundang.online/*` — **undangan pelanggan**

Yang terakhir sering terlupakan, dan gagalnya tidak kentara: situs utama tetap
normal sementara SETIAP undangan pelanggan mati. `middleware.ts` membaca header
host, mengambil slug dari subdomain, lalu me-rewrite ke `/invitation/<slug>`.

**5e. Verifikasi:**

```bash
curl -sI https://iaundang.online | head -3
curl -sI https://www.iaundang.online | head -3
curl -sI https://<slug-yang-ada>.iaundang.online | head -3   # harus 200, bukan 404
```

---

## 6. Cron

Sudah ikut terdaftar saat deploy, lewat `triggers.crons` di `wrangler.jsonc`:

| Jadwal (UTC) | Route | Kegunaan |
|---|---|---|
| `0 1 * * *` | `/api/cron/sync-subscriptions` | Tandai langganan kedaluwarsa + email peringatan |
| `*/15 * * * *` | `/api/cron/publish-scheduled` | Terbitkan artikel terjadwal |

Yang kedua **belum pernah berjalan** selama di Vercel: `vercel.json` hanya
mendaftarkan satu cron, padahal route-nya sudah ada dan berfungsi. Artinya
artikel berstatus `scheduled` tidak pernah terbit. Setelah deploy ini, artikel
yang menumpuk akan terbit dalam 15 menit — **periksa dulu daftar artikel
terjadwal** kalau ada yang sudah tidak relevan.

Cek di **Workers & Pages → iaundang → Settings → Trigger Events**.
Propagasi bisa sampai 15 menit.

Uji lokal:

```bash
npx wrangler dev
curl "http://localhost:8787/__scheduled?cron=0+1+*+*+*"
```

---

## 7. Webhook Mayar

Arahkan URL webhook di dashboard Mayar ke:

```
https://iaundang.online/api/payment/mayar/webhook
```

Kalau `MAYAR_WEBHOOK_TOKEN` diputar (langkah 2), **perbarui juga di sisi Mayar**
— kalau tidak, pembayaran akan masuk tapi pesanan tidak pernah otomatis
disetujui.

Token kosong sekarang selalu ditolak. Dulu justru sebaliknya: token kosong
membuat webhook palsu diterima.

---

## 8. Setelah live

- [ ] Pantau `npx wrangler tail` beberapa jam pertama
- [ ] Coba satu pesanan sungguhan dari ujung ke ujung (order → bayar → approve → login)
- [ ] Pastikan email keluar (Resend) — cari baris `[after-response]` di log kalau gagal
- [ ] Cek Hyperdrive di dashboard: connection pooling terlihat aktif
- [ ] Baru setelah semua beres: matikan proyek Vercel lama

**Jangan hapus akun Vercel sampai langkah di atas hijau.** Selama DNS sudah
pindah, deployment Vercel yang lama sudah tidak menerima trafik dan tidak
mengganggu.

---

## Rollback

DNS masih di Vercel (belum langkah 5b)
: Belum ada yang berubah bagi pengguna. Perbaiki, deploy ulang.

DNS sudah pindah, aplikasi bermasalah
: Nameserver dikembalikan ke Vercel di registrar. Propagasi butuh waktu, jadi
  perbaiki maju ke depan biasanya lebih cepat daripada mundur.

Deploy Worker bermasalah
: `npx wrangler rollback` — kembali ke versi sebelumnya dalam hitungan detik.
  Ini jalur rollback tercepat dan paling sering yang Anda butuhkan.

---

## Perintah harian

```bash
npm run dev            # dev Next biasa
npx wrangler dev       # jalankan di runtime Worker sungguhan (lebih dekat produksi)
npm run preview        # build + preview lokal via adapter
npm run deploy         # build + deploy
npx wrangler tail      # log langsung
npx wrangler rollback  # kembali ke versi sebelumnya
npx wrangler versions list
```

---

## Catatan & jebakan

**Prisma harus memakai build WASM — ini jebakan terbesar di migrasi ini.**
Gejalanya menyesatkan: `tsc`, `next build`, `opennextjs-cloudflare build`, dan
`wrangler deploy` SEMUA sukses tanpa satu pun peringatan, lalu setiap route yang
menyentuh database membalas 500 dengan
*"Could not locate the Query Engine for runtime debian-openssl-1.1.x ...
generated for windows"*.

Sebabnya: `@prisma/client` berujung ke peta export bersyarat yang urutannya
`{ node → index.js, edge-light → wasm.js, workerd → wasm.js }`. esbuild milik
OpenNext memang menambahkan kondisi `workerd`, tapi juga memakai
`platform: "node"` — dan resolusi export bersyarat memilih kunci **pertama**
yang cocok menurut urutan di package.json. `node` ada di urutan pertama, jadi
selalu menang dan yang terpilih engine biner.

`serverExternalPackages` saja TIDAK cukup (walaupun itu yang disarankan dokumen
OpenNext) — pada Prisma 6.19 urutan petanya membuat `node` tetap menang. Tiga
hal yang membuatnya jalan, ketiganya harus ada:

1. `lib/prisma.ts` mengimpor `.prisma/client/wasm` — export `"./wasm"` TIDAK
   bersyarat, jadi melewati seluruh persoalan urutan kondisi.
2. `next.config.mjs` menandai subpath itu eksternal terhadap webpack
   (`serverExternalPackages` hanya cocok per NAMA PAKET, tidak mencakup
   subpath), supaya webpack tidak mencoba mem-parse `query_engine_bg.wasm`.
3. `outputFileTracingIncludes` menyalin seluruh isi `.prisma/client`, karena
   penelusuran file Next mengikuti kondisi `node` dan kalau dibiarkan hanya
   menyalin engine biner sambil meninggalkan varian WASM-nya.

Build WASM tidak bisa dimuat Node biasa, jadi `next dev` dialihkan kembali ke
`@prisma/client` lewat alias webpack, dan `scripts/*.ts` tetap memakai
`@prisma/client` langsung. Ringkasnya: **Workers → WASM, Node → engine biner.**

Kalau nanti Prisma dinaikkan versinya, uji lagi endpoint yang menyentuh
database SETELAH deploy — bukan cuma buildnya.

**Prisma dibuat per request.** Workers melarang socket dipakai lintas request;
satu client di module scope akan melempar *"Cannot perform I/O on behalf of a
different request"* pada request kedua. `lib/prisma.ts` membuat client per
`ExecutionContext` dan mengekspor Proxy supaya seluruh call site `prisma.*`
tidak perlu berubah. Jangan dikembalikan jadi singleton.

**Kerja setelah response harus lewat `runAfterResponse()`.** Promise yang tidak
didaftarkan ke `ctx.waitUntil()` DIBATALKAN begitu response dikirim. Ini yang
diam-diam menghapus email konfirmasi pembayaran. Kalau menambah kerja latar
baru, pakai `lib/after-response.ts` — jangan `.catch(() => {})` menggantung.

**Jangan baca secret di module scope.** Module scope dievaluasi saat isolate
start, sebelum ada request; `process.env.X` untuk secret runtime masih kosong di
titik itu. Sudah pernah menggigit di `lib/supabase.ts` dan `lib/mayar.ts` —
keduanya kini lazy.

**`next/image` disetel `unoptimized`.** Optimizer bawaan butuh `sharp`. Gambar
disajikan apa adanya dari Supabase Storage, dan sudah dikecilkan di browser saat
upload. Kalau nanti berlangganan Cloudflare Images, ganti dengan loader kustom
dan hapus `unoptimized` di `next.config.mjs`.

**Batas paket Free:** CPU 10 ms per request. `bcrypt` saat login memakan lebih
dari itu, jadi **Workers Paid ($5/bulan) praktis wajib** untuk login yang
konsisten. Ukuran Worker saat ini 2,17 MB gzip (batas Free 3 MB, Paid 10 MB).

**Jangan impor `@/lib/db` sebagai nilai dari komponen client.** Itu menyeret
Prisma dan `pg` ke bundle browser dan build langsung gagal dengan
`Can't resolve 'net'`. Konstanta yang aman untuk client ada di
`lib/built-in-data.ts`. Untuk tipe, pakai `import type`.

**Jangan hapus `custom-worker.ts`.** Di situlah handler `scheduled()` berada;
`.open-next/worker.js` hasil generate hanya punya `fetch`.
