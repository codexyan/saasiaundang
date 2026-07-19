# iaundang

Platform undangan pernikahan digital. Tiap pelanggan mendapat undangan di
subdomainnya sendiri (`mira-dani.iaundang.online`) yang bisa disunting lewat
editor visual.

## Stack

| | |
|---|---|
| Framework | Next.js 15.5 (App Router) + React 19 |
| Hosting | Cloudflare Workers via `@opennextjs/cloudflare` |
| Database | Supabase Postgres lewat Hyperdrive + Prisma 6 (`@prisma/adapter-pg`) |
| Storage | Supabase Storage (bucket `uploads`) |
| Styling | Tailwind + design system sendiri (`docs/DESIGN_SYSTEM.md`) |
| Email | Resend |
| Pembayaran | Mayar (+ konfirmasi transfer manual) |

## Mulai

```bash
npm install
cp .env.example .env.local     # isi nilainya
npx prisma generate
npm run dev
```

`SESSION_SECRET` **wajib** diisi — tidak ada nilai default, dan aplikasi akan
gagal terang-terangan tanpanya. Itu disengaja: dulu ada nilai default, dan
akibatnya token produksi ditandatangani dengan konstanta yang ada di dalam repo.

Untuk menguji subdomain undangan secara lokal, pakai `?slug=<slug>` — lihat
`middleware.ts`.

## Perintah

```bash
npm run dev            # dev server Next
npm run build          # prisma generate + next build
npm run lint

npx wrangler dev       # jalankan di runtime Worker sungguhan (lebih dekat produksi)
npm run preview        # build + preview lokal via adapter Cloudflare
npm run deploy         # build + deploy ke Cloudflare
npx wrangler tail      # log produksi langsung
npx wrangler rollback  # kembali ke versi sebelumnya

npx tsx scripts/check-markdown-safety.ts   # regresi XSS renderer markdown
```

## Deploy

Lihat **[CLOUDFLARE_SETUP.md](./CLOUDFLARE_SETUP.md)** — langkah lengkap
Hyperdrive, secret, DNS, cron, rollback, dan daftar jebakannya.

## Struktur

```
app/
  (main)/       landing, templates, order, blog, legal
  (auth)/       login, register, forgot/reset password
  (app)/        dashboard, admin, writer, affiliate
  invitation/   halaman undangan publik (per slug)
  api/          88 route handler
components/
  marketing/    primitif design system
  studio/       editor undangan (pelanggan)
  admin/        panel admin (termasuk TemplateLab)
  renderer/     rendering tema undangan  ← jangan diubah tanpa alasan kuat
lib/
  db.ts         seluruh akses database
  prisma.ts     client Prisma (per request di Workers — baca komentarnya)
  built-in-data.ts  konstanta aman-untuk-client (JANGAN taruh di db.ts)
docs/
  ARCHITECTURE.md, DESIGN_SYSTEM.md, CHANGELOG.md
  archive/      laporan audit & catatan perbaikan lama
```

## Aturan yang mudah dilanggar

Melanggar salah satu di bawah ini gagalnya tidak kentara — build tetap lolos,
tapi produksi rusak. Alasannya ada di komentar masing-masing file.

- **Jangan impor `@/lib/db` sebagai nilai dari komponen client.** Prisma dan
  `pg` ikut terseret ke bundle browser dan build gagal `Can't resolve 'net'`.
  Konstanta aman ada di `lib/built-in-data.ts`; untuk tipe pakai `import type`.
- **Jangan baca secret di module scope.** Di Workers, module scope dievaluasi
  sebelum ada request, jadi `process.env` untuk secret runtime masih kosong.
- **Kerja setelah response harus lewat `runAfterResponse()`.** Promise
  menggantung DIBATALKAN saat response dikirim.
- **Jangan jadikan client Prisma singleton.** Socket tidak boleh dipakai lintas
  request di Workers.
- **Harga tidak boleh datang dari client.** Sumber kebenarannya
  `settings.priceTiers`.
