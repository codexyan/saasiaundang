# IAUndang — Architecture & Technical Reference

**Last updated:** 29 Juni 2026
**Stack:** Next.js 14.2 (App Router) · Prisma · PostgreSQL (Supabase) · Resend · TypeScript

> **Catatan 11 Sep 2026:** bagian tentang trial, pendaftaran mandiri, pembuatan
> undangan gratis, paket, dan referral pengguna sudah disesuaikan dengan branch
> `tier-unification`. Bagian lain belum diaudit ulang sejak Juni 2026 dan
> sebagian sudah usang, misalnya versi stack, `lib/db.ts` yang kini dipecah ke
> `lib/db/*.ts`, hosting yang kini Cloudflare Workers, dan `/api/payment/*` yang
> kini hanya berisi webhook Mayar.

---

## Daftar Isi

1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [Database Schema](#database-schema)
4. [Domain Services](#domain-services)
5. [API Routes](#api-routes)
6. [Dashboard Modules](#dashboard-modules)
7. [Admin Panel](#admin-panel)
8. [Template Engine](#template-engine)
9. [Authentication & Authorization](#authentication--authorization)
10. [Subscription Lifecycle](#subscription-lifecycle)
11. [Notification System](#notification-system)
12. [Analytics System](#analytics-system)
14. [Referral Program](#referral-program)
15. [SEO Infrastructure](#seo-infrastructure)
16. [Environment Variables](#environment-variables)
17. [Deployment](#deployment)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14.2, App Router, React 18 |
| Language | TypeScript (strict) |
| Database | PostgreSQL via Supabase |
| ORM | Prisma 5.22 |
| Auth | JWT via `jose`, cookie-based sessions |
| Storage | Supabase Storage (images, music) |
| Email | Resend (fallback: console) |
| Styling | Tailwind CSS + custom design tokens |
| Animation | Framer Motion |
| Font | Geist Sans + Geist Mono |
| Icons | Lucide React |

---

## Project Structure

```
app/
├── (main)/           # Public pages (landing, blog, templates, order)
│   ├── page.tsx      # Landing page (JSON-LD WebApplication)
│   ├── blog/         # Blog listing + [slug] detail
│   ├── templates/    # Template gallery + [slug] detail (JSON-LD Product)
│   └── layout.tsx    # Public layout (Navbar + Footer)
├── (app)/            # Authenticated pages
│   ├── dashboard/    # User dashboard
│   └── admin/        # Admin panel
├── (auth)/           # Login, forgot-password, reset-password (register dialihkan ke /templates)
├── invitation/[slug]/ # Public invitation view (JSON-LD Event)
├── api/              # All API routes (see API Routes section)
├── robots.ts         # Dynamic robots.txt
├── sitemap.ts        # Dynamic XML sitemap
└── layout.tsx        # Root layout (Geist font, Toaster)

components/
├── admin/            # Admin panel components
│   ├── AdminPanel.tsx # Main admin shell (sidebar + content)
│   └── tabs/         # 15 admin tabs
├── dashboard/        # User dashboard modules (10 components)
├── landing/          # Landing page sections (9 sections)
├── templates/        # Legacy hardcoded templates (3)
├── renderer/         # JSON-driven template renderer (v2)
├── analytics/        # ViewTracker component
├── blog/             # Blog components
└── ui/               # Shared UI (Button, Logo, Navbar, Footer)

lib/
├── db.ts             # Database service layer (all Prisma queries)
├── prisma.ts         # Prisma client singleton
├── types.ts          # TypeScript interfaces
├── auth.ts           # Auth helpers (isAdmin, isAffiliate, etc.)
├── session.ts        # JWT session encode/decode/verify
├── session-server.ts # Server-side getSession()
├── subscription.ts   # Subscription domain service
├── notifications.ts  # Notification service (9 types, Resend transport)
├── packages.ts       # Package/tier definitions (starter, popular, eksklusif)
├── utils.ts          # Shared utilities
├── demo-data.ts      # Demo/preview data
└── template-configs/ # JSON template definitions (3 templates)
    ├── javanese-gold.ts
    ├── rose-garden.ts
    └── midnight-luxe.ts

docs/
├── COMPANY_BLUEPRINT.md  # 15-section company & product masterplan
├── ARCHITECTURE.md       # This file
└── CHANGELOG.md          # Sprint-by-sprint technical changelog
```

---

## Database Schema

### 22 Models (Prisma)

#### Core Product
| Model | Purpose | Key Fields |
|-------|---------|------------|
| `User` | User accounts | email, passwordHash, role, sessionEpoch |
| `Invitation` | Wedding invitations | slug, templateId, data (JSON), packageTier, isPublished, isPaid, expiresAt |
| `Gallery` | Invitation photos | invitationId, url, order |
| `Guest` | Unified contacts + RSVP | invitationId, name, phone, group, note, source, attending, blastSentAt |
| `Wish` | Guest messages | invitationId, name, message |
| `GiftProof` | Digital envelope proofs | invitationId, name, proofUrl |

#### Commerce
| Model | Purpose | Key Fields |
|-------|---------|------------|
| `Order` | Purchase orders | orderNumber, email, subdomain, templateId, packageTier, amount, status, invitationId |
| `PaymentProof` | Payment verification | invitationId, userId, orderId, amount, proofUrl, status |
| `Subscription` | Access lifecycle | invitationId, userId, tier, status, startsAt, expiresAt |

#### Content & Template
| Model | Purpose | Key Fields |
|-------|---------|------------|
| `TemplateRecord` | Template definitions | name, slug, config (JSON), status, requiredPackage, price |
| `MusicTrack` | Background music library | title, artist, category, url |
| `MusicCategory` | Music categorization | name, sortOrder |
| `Article` | Blog posts | title, slug, content, isPublished, viewsCount |

#### Ecosystem
| Model | Purpose | Key Fields |
|-------|---------|------------|
| `Affiliate` | Partner affiliates | userId, referralCode, commissionRate, totalEarnings |
| `Referral` | Affiliate referral tracking | affiliateId, buyerEmail, saleAmount, commission, status |

#### Intelligence
| Model | Purpose | Key Fields |
|-------|---------|------------|
| `InvitationView` | Page view tracking | invitationId, viewedAt, referrer, userAgent |

#### System
| Model | Purpose | Key Fields |
|-------|---------|------------|
| `SupportTicket` | User support | userId, subject, message, status, priority |
| `TicketReply` | Support replies | ticketId, userId, message, isAdmin |
| `PasswordResetToken` | Password reset | userId, token, expiresAt |
| `AppSetting` | App configuration | key, value (JSON) |
| `AffiliateWithdrawal` | Affiliate payouts | affiliateId, amount, status |

---

## Domain Services

### `lib/db.ts` — Database Layer
Central data access layer. All Prisma queries wrapped in typed functions.

**Service objects:**
- `users` — findByEmail, findById, create, findAll, delete, updatePassword, revokeSessions, sessionEpoch, updateRole
- `invitations` — findBySlug, findManyByUserId, findById, findAll, create, update, delete, slugExists
- `galleries` — findByInvitationId, findById, create, update, delete, reorder
- `guests` — findByInvitationId, create, update, delete, markBlastSent, countByInvitation
- `wishes` — findByInvitationId, create, delete
- `giftProofs` — create, findByInvitationId
- `templateRecords` — findAll, findById, findBySlug, findActive, create, update, delete
- `orders` — findAll, findById, findByOrderNumber, create, update, subdomainExists
- `paymentProofs` — findAll, findById, findByInvitationId, create, update
- `settings` — get, save
- `articles` — findAll, findPublished, findById, findBySlug, create, update, delete
- `affiliates` — findByUserId, findByCode, create, updateBank, incrementClicks
- `referrals` — findByAffiliateId, create
- `invitationViews` — record, countByInvitation, countByDateRange, dailyCounts, topReferrers
- `landingSections` — get, save

### `lib/subscription.ts` — Subscription Domain
Lifecycle: `active` → `expiring_soon` → `expired` → `cancelled`

- `subscriptions.create()`: langganan baru, dibuat `provisionPaidOrder()` saat pesanan dibayar (webhook Mayar atau persetujuan admin)
- `subscriptions.findByInvitation()` / `findByUser()`
- `subscriptions.renew()` / `cancel()` / `markExpired()` / `syncExpiredStatuses()`
- Helpers: `resolveStatus()`, `daysRemaining()`, `isActive()`
- Tidak ada lagi trial maupun masa tenggang (dibuang 11 Sep 2026)

### `lib/notifications.ts` — Notification Service
9 notification types with Indonesian templates.

Transport: Resend (with `RESEND_API_KEY`) or console fallback.

Types: `welcome`, `order_created`, `order_approved`, `order_rejected`, `payment_received`, `subscription_active`, `subscription_expiring`, `subscription_expired`, `password_reset`

### `lib/packages.ts` — Tier Definitions

Sumber kebenaran paket adalah `settings.priceTiers` yang diatur admin, termasuk
paket kustom di luar tiga paket bawaan. Server membacanya lewat `lib/tiers.ts`
(`resolveTier`, `resolveTierFeatures`, `resolveExpiry`), dan harga dihitung
`computePrice()` di `lib/pricing.ts` untuk memajang maupun menagih. `PACKAGES` di
`lib/packages.ts` hanya nilai cadangan tiga paket bawaan:

| Tier | Price | Duration | Max Guests | Max Photos |
|------|-------|----------|------------|------------|
| Starter | Rp 79.000 | 1 bulan | 200 | 10 |
| Popular | Rp 149.000 | 3 bulan | 500 | 20 |
| Eksklusif | Rp 249.000 | 6 bulan | Unlimited | Unlimited |

Masa aktif yang dipakai saat penyediaan adalah `validity_days` paket di pengaturan
admin (`resolveExpiry()` di `provisionPaidOrder()`), bukan kolom Duration di atas.
Tidak ada paket trial maupun gratis.

---

## API Routes

### Public (No Auth)
| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| POST | `/api/auth/forgot-password` | Request reset |
| POST | `/api/auth/reset-password` | Execute reset |
| GET | `/api/auth/me` | Current session |
| POST | `/api/orders` | Create order |
| GET | `/api/orders?order_number=X` | Check order |
| POST | `/api/rsvp` | Submit RSVP |
| GET | `/api/rsvp?invitationId=X` | Get RSVPs |
| POST | `/api/wishes` | Submit wish |
| GET | `/api/wishes?invitationId=X` | Get wishes |
| GET | `/api/music` | Music library |
| POST | `/api/views` | Record invitation view |
| POST | `/api/referral` | Affiliate click tracking |
| GET | `/api/articles` | Published articles |
| GET | `/api/payment/config` | Payment config |

### User Auth Required
| Method | Route | Purpose |
|--------|-------|---------|
| GET/POST/PATCH/DELETE | `/api/guests` | Guest CRUD |
| POST | `/api/guests/blast-sent` | Mark guests as blast-sent |
| GET | `/api/analytics?invitation_id=X` | Invitation analytics |
| GET | `/api/user/subscription` | Subscription status |
| PATCH/DELETE | `/api/invitations/[id]` | Simpan isi undangan dari Studio, hapus undangan |
| POST | `/api/payment/proof` | Upload payment proof |
| POST | `/api/galleries/upload` | Upload gallery image |
| POST/GET | `/api/tickets` | Support tickets |

### Admin Only
| Method | Route | Purpose |
|--------|-------|---------|
| GET/POST | `/api/admin/orders` | Order management |
| PATCH | `/api/admin/orders/[id]` | Approve/reject order |
| GET/PATCH | `/api/admin/proofs/[id]` | Payment verification |
| GET/POST/DELETE | `/api/admin/users` | User management |
| GET/POST/PATCH | `/api/admin/template-records` | Template CRUD |
| GET/PUT | `/api/admin/settings` | App settings |
| GET/PATCH/DELETE 
### Cron
| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/cron/sync-subscriptions` | Batch expire + notify (CRON_SECRET, Vercel Cron) |

---

## Dashboard Modules

User dashboard (`/dashboard`) — 8 tabs:

| Tab | Component | Purpose |
|-----|-----------|---------|
| Beranda | `DashboardOverview` | Stats, checklist, quick actions |
| Undangan | `TemplateModule` + `InvitationEditor` | Edit invitation content |
| Tamu | `GuestManager` | Contact management, WA blast (database-backed) |
| RSVP | `RSVPList` | View RSVP responses |
| Analitik | `AnalyticsPanel` | Views chart, RSVP breakdown, referrers |
| Langganan | `SubscriptionInfo` | Subscription status + upgrade |
| Bantuan | `SupportTickets` | Support ticket system |
| Pengaturan | `SettingsPanel` | Account settings, delete invitation |

---

## Admin Panel

Admin panel (`/admin`) — 11 tabs in 6 groups:

**Utama:** Dashboard (stats, revenue, recent activity), Pengguna
**Konten:** Artikel, Writer
**Template:** Template, Musik
**Transaksi:** Pembayaran, Pesanan, Paket & Promo
**Marketing:** Afiliasi
**Sistem:** Pengaturan (branding, payment, domain)

### Modul Template (`components/admin/tabs/template/`)

Satu modul untuk satu objek. Sebelumnya dipecah dua — "Studio Desain" (editor)
dan "Manajemen" (harga/publikasi) — padahal keduanya mengelola baris
`template_records` yang sama; pemisahan itu melahirkan daftar template ganda,
dua jalur simpan kategori yang saling menimpa, dan satu pekerjaan yang memaksa
admin pindah modul di tengah jalan.

| Berkas | Peran |
|--------|-------|
| `TemplateModule.tsx` | Shell: koleksi ⇄ editor, seluruh mutasi |
| `TemplateCollection.tsx` | Grid + filter + ringkasan |
| `TemplateCard.tsx` / `TemplateThumb.tsx` | Kartu & miniatur (satu-satunya) |
| `TemplateSettingsDrawer.tsx` | Nama, slug, deskripsi, kategori, paket, harga, status |
| `CategoryManager.tsx` | Kategori — hanya lewat REST `/api/admin/categories` |
| `editor/TemplateEditor.tsx` | Kerangka editor: state, autosave, bingkai UI |
| `editor/EditorContext.tsx` | Satu context berisi state + updater untuk semua panel |
| `editor/panels/*` | Isi tiap tab + kolom pratinjau, satu berkas masing-masing |
| `editor/parts/*` | Konstanta & subkomponen stateless editor |

Editor dipecah per tab. `TemplateEditor.tsx` memegang state, persistensi, dan
bingkai (header, tab bar, footer, modal); isi tiap tab ada di
`panels/{Appearance,Opening,Decor,Content,Music}Panel.tsx`, dan kolom pratinjau
di `panels/EditorPreview.tsx`. Semuanya membaca dari `useEditor()`.

Aman terhadap render: hanya satu panel ter-mount pada satu waktu (dipilih tab),
jadi nilai context yang dibuat ulang tiap render tidak menyebarkan render.
**Kalau panel butuh binding baru dari kerangka, tambahkan ke `EditorContextValue`**
— jangan mengembalikan logikanya ke `TemplateEditor.tsx`.

**Draft vs terbit.** `TemplateRecord.config` adalah versi yang dirender untuk
pengunjung; `draft_config` adalah salinan kerja editor. Autosave (1,2 detik)
menulis ke `draft_config` lewat `PUT /api/admin/template-records/[id]/draft`;
`POST .../publish` menaikkannya jadi `config`. Karena itu mengedit template
yang sudah terbit tidak lagi langsung mengubah undangan pelanggan, dan draft
tidak lagi hilang saat ganti browser (dulu disimpan di `localStorage`).

**Angka pemakaian.** `usage_count` dihitung dari tabel undangan
(`templateRecords.usageCounts()`), bukan dari counter — counter lamanya tidak
pernah dinaikkan siapa pun sehingga selalu 0.

---

## Template Engine

### v1: Legacy Hardcoded (3 templates)
- `modern-white`, `floral-garden`, `dark-elegant`
- React components in `components/templates/`
- Props: invitation, galleries, wishes, guests

### v2: JSON-driven Renderer (current)
- Template = JSON config (`TemplateRecord.config`)
- 16 section types: opening, couple, event, gallery, rsvp, wishes, gift, countdown, story, video, streaming, closing, loading, payment, navigation, music
- Renderer: `components/renderer/InvitationRenderer.tsx`
- 3 active templates: Javanese Gold, Rose Garden, Midnight Luxe
- Section-level tier gating (sections locked by package tier)

---

## Authentication & Authorization

- **JWT sessions** via `jose` library
- Cookie: `iaundang_session` (httpOnly, secure, sameSite: lax)
- `SessionPayload`: `{ userId, email, role }`
- Roles: `admin` | `content_writer` | `affiliate` | `user`
- Server: `getSession()` from `lib/session-server.ts`
- API: `getSessionFromRequest(req)` from `lib/session.ts`
- Guards: `isAdmin(session)`, `isAffiliate(session)` from `lib/auth.ts`
- Middleware: `middleware.ts` protects `/dashboard`, `/admin`, `/writer`

---

## Subscription Lifecycle

```
User orders package di /order → Payment
    ↓
Webhook Mayar atau persetujuan admin → provisionPaidOrder()
    ↓
Akun (kalau email belum terdaftar) + Invitation + Subscription dibuat sekaligus
    ↓
Subscription Active (masa aktif = validity_days paket)
    ↓
Expiring Soon (7 days before, notification)
    ↓
Expired → Invitation hidden from public
```

Order → Invitation → Subscription traceability chain fully linked. Tidak ada trial
maupun masa tenggang: calon pembeli mencoba lewat pratinjau `/demo/renderer` tanpa
akun.

---

## Notification System

9 notification types, all with Indonesian templates.

**Transport priority:**
1. Resend email (if `RESEND_API_KEY` configured)
2. Console log (development fallback)

**HTML template:** Responsive, branded email with iaundang footer.

**Integration points:**
- Order creation → `order_created`
- Admin order review → `order_approved` / `order_rejected`
- Cron sync → `subscription_expiring` / `subscription_expired`

---

## Analytics System

- `InvitationView` records every public page visit
- `ViewTracker` client component fires POST on mount
- Dashboard `AnalyticsPanel`: daily views chart, RSVP breakdown, top referrers
- Date range selector: 7/14/30 days
- Stats: totalViews, viewsThisWeek, attending rate

---

## Referral Program

Program referral pengguna (kode per akun dengan janji diskon Rp 15.000) dihapus
11 Sep 2026 karena tidak pernah mencatat satu referral pun. Tabel
`user_referrals` dan kolom `users.referral_code` dijatuhkan lewat migrasi
`20260911000000_drop_user_referral_program`, yang diterapkan sesudah kode tanpa
kolom itu ter-deploy. Yang tersisa hanya program afiliasi.

### Affiliate Program (partners only)
- Role-based: requires `affiliate` role
- Commission-based: configurable rate per affiliate
- Click tracking, conversion tracking, withdrawal system
- Admin management in Affiliates tab
- Atribusi: tautan `?ref=KODE` ditangkap `ReferralCapture`, `POST /api/referral`
  memvalidasi kode afiliasi lalu memasang cookie `ref` (httpOnly, 30 hari),
  `/api/orders` mengisi `referred_by` dari cookie itu, dan komisi dicatat
  `provisionPaidOrder()` saat pesanan dibayar.

---

## SEO Infrastructure

| Feature | Implementation |
|---------|---------------|
| robots.txt | `app/robots.ts` — block /api, /dashboard, /admin, /auth |
| sitemap.xml | `app/sitemap.ts` — static pages + blog articles + published invitations |
| Landing page | JSON-LD `WebApplication` with `AggregateOffer` |
| Invitation pages | JSON-LD `Event` with startDate, location, organizer |
| Template detail | JSON-LD `Product` with price, brand, availability |
| Blog articles | Dynamic `generateMetadata()` with OG tags |
| Template gallery | Dynamic `generateMetadata()` per template slug |

---

## Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection (Supabase pooler) |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key |
| `JWT_SECRET` | Yes | JWT signing secret |
| `ADMIN_EMAIL` | Yes | Admin email address |
| `NEXT_PUBLIC_APP_URL` | Yes | App base URL |
| `NEXT_PUBLIC_APP_DOMAIN` | Yes | App domain for cookies |
| `RESEND_API_KEY` | No | Resend email API key (falls back to console) |
| `EMAIL_FROM` | No | Email sender address |
| `CRON_SECRET` | No | Bearer token for cron endpoints |

---

## Deployment

- **Database:** Supabase PostgreSQL (ap-south-1)
- **Hosting:** Vercel (recommended) or any Node.js host
- **Storage:** Supabase Storage for images, music files
- **Email:** Resend (configure `RESEND_API_KEY`)
- **Cron:** Vercel Cron or external scheduler for `/api/cron/sync-subscriptions`
- **Domain:** iaundang.online

### Build & Deploy
```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
npm start
```

### Development
```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```
