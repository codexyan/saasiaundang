# iaundang — Rangkuman Teknis Sistem

> Dokumen audit arsitektur. Disusun langsung dari codebase pada branch
> `feat/cloudflare-migration` (commit `47b58f8`), 17 Agustus 2026.
> Semua angka dan nama file di bawah diverifikasi dari sumbernya, bukan dari ingatan.

**Ringkasan satu kalimat:** platform SaaS undangan pernikahan digital multi-tenant
berbasis subdomain (`nama-pasangan.iaundang.online`), berjalan penuh di Cloudflare
Workers, dengan sistem tema JSON-driven yang bisa diedit pelanggan lewat editor
berbasis form.

---

## 1. Tech Stack & Infrastruktur

### 1.1 Frontend

| Komponen | Teknologi | Versi | Catatan |
|---|---|---|---|
| Framework | Next.js (App Router) | 15.5.20 | Seluruh route API `force-dynamic` |
| UI Runtime | React | 19.2.7 | Server Components + Client Components |
| Bahasa | TypeScript | 5.x | `strict` aktif |
| Styling | Tailwind CSS | 3.4.4 | + design system internal (`docs/DESIGN_SYSTEM.md`) |
| Animasi | Framer Motion | 11.2.10 | Tulang punggung seluruh opening & transisi section |
| Ikon | lucide-react | 0.400.0 | |
| Font | geist | 1.7.2 | Font tema undangan dimuat dinamis dari Google Fonts |
| Form | react-hook-form + @hookform/resolvers | 7.52 / 3.6 | Divalidasi Zod |
| Notifikasi | react-hot-toast | 2.4.1 | |
| Upload | react-dropzone | 14.2.3 | |
| Utility CSS | clsx + tailwind-merge | 2.1 / 2.3 | `cn()` di `lib/utils.ts` — **dikustomisasi**, lihat catatan di bawah |

> **Jebakan `cn()`** — `tailwind-merge` di-`extendTailwindMerge` karena skala
> tipografi kustom (`text-display-lg`, `text-body-sm`, dst.) salah diklasifikasikan
> sebagai *text color* dan saling membuang. Daftar putihnya ada di `lib/utils.ts:9-25`.

### 1.2 Backend

| Komponen | Teknologi | Catatan |
|---|---|---|
| API Layer | Next.js Route Handlers | **88 file** `app/api/**/route.ts` |
| Autentikasi | `jose` 5.9 (JWT HS256) | Implementasi sendiri, bukan NextAuth/Clerk |
| Hashing | bcryptjs 2.4 | cost factor 10 |
| Validasi | Zod 3.23 | Terpasang di 17 route non-admin |
| Email | Resend 6.16 | Transactional (order approved, trial, reset password) |
| Payment | Mayar (`lib/mayar.ts`) | Payment link + webhook; **plus** transfer manual berkode unik |
| Rich text | Tiptap 2.27 | **Hanya untuk blog/artikel**, tidak dipakai builder undangan |

**Model sesi:** JWT stateless disimpan di cookie `__ku_session`
(httpOnly, SameSite=Lax, 30 hari). Payload: `{ userId, email, role, epoch }`.
Field `epoch` dicocokkan dengan kolom `users.session_epoch` di server —
mekanisme pencabutan sesi saat password diganti (JWT stateless yang dicuri
tidak otomatis mati tanpa ini).

### 1.3 Database

| Lapisan | Teknologi |
|---|---|
| Engine | PostgreSQL (Supabase) |
| ORM | Prisma 6.19.3 |
| Driver | `@prisma/adapter-pg` 6.19 + `pg` 8.22 (driver adapter, wajib) |
| Connection pooling | **Cloudflare Hyperdrive** (binding `HYPERDRIVE`, id `ccaa0aea…`) |

Tiga keputusan yang tidak biasa dan penting untuk diketahui auditor:

1. **Prisma memakai build WASM, bukan engine biner.** `lib/prisma.ts` mengimpor
   `.prisma/client/wasm` secara eksplisit, bukan `@prisma/client`. Alasannya:
   peta export bersyarat Prisma menempatkan kondisi `node` di urutan pertama,
   dan esbuild milik OpenNext memakai platform `node`, sehingga yang terpilih
   selalu engine biner Linux — gagal saat runtime dengan
   *"Could not locate the Query Engine for runtime debian-openssl-1.1.x"*
   padahal build dan deploy sukses tanpa keluhan.

2. **Prisma client dibuat per-request, bukan singleton.** Workers melarang objek
   I/O (socket TCP) dipakai lintas request. Client dikunci ke `ExecutionContext`
   lewat `WeakMap`, dan diakses melalui `Proxy` agar seluruh call site
   `prisma.<model>.<op>()` tidak perlu diubah.

3. **Hyperdrive menunjuk koneksi DIRECT Supabase, bukan pooler.** Hyperdrive
   melakukan pooling sendiri; menaruhnya di depan pgbouncer berarti pooling ganda.

### 1.4 Hosting & Deployment

| Komponen | Teknologi |
|---|---|
| Runtime produksi | Cloudflare Workers |
| Adapter | `@opennextjs/cloudflare` 1.20.1 |
| CLI | wrangler 4.112 |
| Domain | `iaundang.online` (LIVE) |
| Object storage | Supabase Storage, bucket `uploads` |

**Routing multi-tenant** (`wrangler.jsonc`):
```
iaundang.online/*        → aplikasi utama
www.iaundang.online/*    → aplikasi utama
*.iaundang.online/*      → undangan pelanggan (WAJIB "routes", bukan Custom Domain)
```
Wildcard juga butuh DNS record `AAAA * 100::` (proxied). Tanpa route wildcard ini
**semua undangan pelanggan mati sementara halaman utama tetap hidup** — mudah terlewat.

**Worker kustom** (`custom-worker.ts`) membungkus handler hasil build OpenNext dan
menambahkan dua hal:
- `scheduled()` untuk Cron Trigger → memanggil route cron yang sudah ada lewat HTTP internal.
- Lapisan cache edge lewat Cache API (`caches.default`). Response yang dihasilkan
  Worker **tidak** otomatis tersimpan di edge hanya karena ada header `Cache-Control` —
  itu instruksi ke browser saja. Daftar halaman cacheable diputuskan tunggal di
  `next.config.mjs` (`headers()`), tidak diduplikasi di worker.

**Cron aktif** (UTC):
| Jadwal | Route |
|---|---|
| `0 1 * * *` | `/api/cron/sync-subscriptions` |
| `*/15 * * * *` | `/api/cron/publish-scheduled` |

**Rate limiting** — binding native Cloudflare (`lib/rate-limit.ts`), bukan library:
| Namespace | Batas | Target |
|---|---|---|
| `LOGIN_RATE_LIMIT` (1001) | 10 / 60s | Percobaan login per email |
| `EMAIL_RATE_LIMIT` (1002) | 3 / 60s | Endpoint yang mengirim email nyata |
| `UPLOAD_RATE_LIMIT` (1003) | 20 / 60s | Upload bukti hadiah dari tamu |
| `COUNTER_RATE_LIMIT` (1004) | 60 / 60s | Counter publik (views, usage musik, A/B assign) |

### 1.5 Library Builder / Canvas — catatan penting untuk evaluasi bisnis

**Tidak ada library canvas di dalam sistem ini.** Tidak ada Fabric.js, Konva,
tldraw, react-dnd, maupun engine drag-and-drop bebas. Ini keputusan arsitektur
yang disengaja dan berdampak besar pada positioning produk:

| Yang orang bayangkan | Yang sebenarnya dibangun |
|---|---|
| Canvas bebas, tarik-taruh elemen di koordinat mana pun | Editor **berbasis form** yang menulis ke objek JSON |
| Layout tersimpan sebagai koordinat absolut | Layout tersimpan sebagai **konfigurasi section berurutan** |
| Rendering ke `<canvas>` / SVG | Rendering **DOM/React biasa** + Framer Motion |

Elemen dekoratif (`DecorationAsset`) memang bisa diposisikan, tapi lewat sistem
**anchor + offset**, bukan koordinat kanvas bebas:
- 17 posisi anchor (`top-left`, `center`, `edge-bottom`, …)
- `offset_x` / `offset_y` dalam px dari anchor
- `scale`, `rotation`, `flip_h/v`, `opacity`, `z_layer`
- Animasi masuk/keluar/idle, termasuk keyframe kustom (`from` → `to` dengan
  opacity/x/y/scale/rotate/blur + easing)

Implikasi bisnis: biaya rendering rendah, output SEO-friendly dan responsif,
tapi keleluasaan desain pelanggan **terbatas pada apa yang admin siapkan di template**.
Diferensiasi produk ada di kualitas template dan Template Lab, bukan di kebebasan kanvas.

**Sistem tema yang tersedia hari ini:**
- 3 template legacy hardcoded (`modern-white`, `floral-garden`, `dark-elegant`)
- Sistem JSON-driven (v2) — template disimpan di database, dikelola admin lewat
  `components/admin/tabs/TemplateLab.tsx` (4.447 baris)
- 16 tipe section · 17 animasi opening · 16 varian loading screen · 8 tipe transisi

---

## 2. Struktur Database (Schema)

Sumber kebenaran: `prisma/schema.prisma` (553 baris, **27 model**).
Konvensi: PK `cuid()` bertipe `text`, kolom `snake_case` via `@map`, semua
timestamp `timestamptz`.

### 2.1 Model inti (Prisma Schema)

```prisma
// ─── USERS ────────────────────────────────────────────────────
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String   @map("password_hash")
  role         String   @default("user")   // user | admin | content_writer | affiliate
  referralCode String?  @unique @map("referral_code")
  createdAt    DateTime @default(now()) @map("created_at")

  /// Penanda generasi sesi. Dinaikkan setiap kali password diganti/direset.
  /// Token JWT membawa nilai ini; kalau tidak cocok lagi, token ditolak.
  sessionEpoch Int      @default(0) @map("session_epoch")

  invitations    Invitation[]
  paymentProofs  PaymentProof[]
  articles       Article[]
  affiliate      Affiliate?
  writerProfile  WriterProfile?
  supportTickets SupportTicket[]
  referralsMade  UserReferral[] @relation("referrer")
  referralsFrom  UserReferral[] @relation("referred")

  @@map("users")
}

// ─── INVITATIONS (tabel inti produk) ──────────────────────────
model Invitation {
  id          String    @id @default(cuid())
  userId      String    @map("user_id")
  slug        String    @unique          // = subdomain: <slug>.iaundang.online
  templateId  String    @map("template_id")
  data        Json                       // ← JSONB: seluruh isi & override desain
  packageTier String?   @map("package_tier")   // starter | popular | eksklusif
  isPublished Boolean   @default(false) @map("is_published")
  isPaid      Boolean   @default(false) @map("is_paid")
  referredBy  String?   @map("referred_by")
  expiresAt   DateTime? @map("expires_at")
  createdAt   DateTime  @default(now()) @map("created_at")

  user          User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  galleries     Gallery[]
  guests        Guest[]
  wishes        Wish[]
  paymentProofs PaymentProof[]
  giftProofs    GiftProof[]
  views         InvitationView[]

  @@index([userId])
  @@map("invitations")
}

// ─── GUESTS (gabungan kontak undangan + RSVP) ────────────────
model Guest {
  id           String    @id @default(cuid())
  invitationId String    @map("invitation_id")
  name         String
  phone        String    @default("")
  group        String    @default("")
  note         String    @default("")
  source       String    @default("manual")   // manual (input pemilik) | rsvp (dari tamu)
  attending    Boolean?                       // null = belum konfirmasi
  totalGuests  Int       @default(1) @map("total_guests")
  blastSentAt  DateTime? @map("blast_sent_at") // penanda WA sudah dibuka untuk tamu ini
  createdAt    DateTime  @default(now()) @map("created_at")

  invitation Invitation @relation(fields: [invitationId], references: [id], onDelete: Cascade)

  @@index([invitationId])
  @@map("guests")
}

// ─── TEMPLATE RECORDS (sistem tema JSON-driven) ──────────────
model TemplateRecord {
  id              String   @id @default(cuid())
  name            String
  slug            String   @unique
  category        String
  config          Json                            // ← JSONB: STRUKTUR & LAYOUT tema
  thumbnailUrl    String   @default("") @map("thumbnail_url")
  status          String   @default("draft")      // draft | active | archived
  sortOrder       Int      @default(0) @map("sort_order")
  usageCount      Int      @default(0) @map("usage_count")
  price           Int      @default(0)
  requiredPackage String   @default("all") @map("required_package")
  createdAt       DateTime @default(now()) @map("created_at")

  @@map("template_records")
}
```

### 2.2 Model transaksi & langganan

```prisma
// ─── ORDERS (form pesanan publik → pembayaran → provisioning) ──
model Order {
  id            String    @id @default(cuid())
  orderNumber   String    @unique @map("order_number")   // ORD-YYMMDD-XXXXXXXX
  invitationId  String?   @map("invitation_id")          // null sampai di-provision
  email         String
  phone         String    @default("")
  groomName     String    @map("groom_name")
  brideName     String    @map("bride_name")
  // … nickname, father, mother, profession untuk kedua mempelai …
  subdomain     String                                   // calon slug undangan
  templateId    String    @map("template_id")
  packageTier   String    @map("package_tier")
  amount        Int                                      // harga paket (ditentukan SERVER)
  uniqueCode    Int       @default(0) @map("unique_code")  // 1–999, pembeda nominal transfer
  totalAmount   Int       @map("total_amount")           // amount + uniqueCode
  proofUrl      String    @default("") @map("proof_url")
  status        String    @default("pending")            // pending | paid | approved | rejected
  adminNotes    String    @default("") @map("admin_notes")
  referredBy    String?   @map("referred_by")
  mayarTransactionId String? @map("mayar_transaction_id")
  mayarPaymentLink   String? @map("mayar_payment_link")
  paymentMethod      String? @map("payment_method")
  createdAt     DateTime  @default(now()) @map("created_at")
  reviewedAt    DateTime? @map("reviewed_at")

  @@index([email])
  @@index([status])
  @@map("orders")
}

// ─── SUBSCRIPTIONS (sumber kebenaran masa aktif) ─────────────
model Subscription {
  id           String    @id @default(cuid())
  invitationId String    @map("invitation_id")
  userId       String    @map("user_id")
  orderId      String?   @map("order_id")
  tier         String
  status       String    @default("active")   // active | expired | cancelled | trial
  startsAt     DateTime  @map("starts_at")
  expiresAt    DateTime  @map("expires_at")
  cancelledAt  DateTime? @map("cancelled_at")
  renewedFrom  String?   @map("renewed_from")
  createdAt    DateTime  @default(now()) @map("created_at")

  @@index([invitationId]) @@index([userId]) @@index([status]) @@index([expiresAt])
  @@map("subscriptions")
}

// ─── PAYMENT PROOFS (bukti transfer manual) ──────────────────
model PaymentProof {
  id           String    @id @default(cuid())
  invitationId String    @map("invitation_id")
  userId       String    @map("user_id")
  orderId      String?   @map("order_id")
  userEmail    String    @map("user_email")
  slug         String
  amount       Int       @default(0)
  bankName     String    @default("") @map("bank_name")
  transferDate String    @default("") @map("transfer_date")
  proofUrl     String    @default("") @map("proof_url")
  notes        String    @default("")
  status       String    @default("pending")    // pending | approved | rejected
  adminNotes   String    @default("") @map("admin_notes")
  createdAt    DateTime  @default(now()) @map("created_at")
  reviewedAt   DateTime? @map("reviewed_at")

  invitation Invitation @relation(fields: [invitationId], references: [id], onDelete: Cascade)
  user       User       @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId]) @@index([orderId]) @@index([invitationId])
  @@map("payment_proofs")
}
```

### 2.3 Daftar lengkap 27 model

| Domain | Model |
|---|---|
| Inti produk | `User`, `Invitation`, `Gallery`, `Guest`, `Wish`, `TemplateRecord` |
| Transaksi | `Order`, `Subscription`, `PaymentProof`, `GiftProof` |
| Konten/Blog | `Article`, `ArticleCategory`, `WriterProfile` |
| Media | `MusicTrack`, `MusicCategory` |
| Growth | `Affiliate`, `Referral`, `AffiliateWithdrawal`, `UserReferral`, `Experiment`, `ExperimentEvent`, `UserFeedback` |
| Operasional | `SupportTicket`, `TicketReply`, `PasswordResetToken`, `InvitationView`, `AppSetting` |

---

### 2.4 ⭐ Cara data desain/layout disimpan — **JSONB dua lapis**

Ini bagian yang diminta paling detail. Sistem **tidak** menyimpan satu blob
"canvas". Ia memakai **dua kolom JSONB yang saling melengkapi**, dengan pemisahan
tanggung jawab yang tegas:

```
┌──────────────────────────────────────────────────────────────────┐
│ template_records.config   (jsonb)   ← dikelola ADMIN              │
│ "STRUKTUR & LAYOUT"                                               │
│   meta      : warna, font, component style                        │
│   opening   : jenis animasi pembuka + seluruh setelan cover        │
│   loading   : varian loading screen                               │
│   music     : setelan player                                       │
│   sections[]: daftar section, urutan, background, transisi,        │
│               dekorasi, tipografi per-section                      │
└──────────────────────────────────────────────────────────────────┘
                              ⬇  di-MERGE saat render
┌──────────────────────────────────────────────────────────────────┐
│ invitations.data          (jsonb)   ← dikelola PELANGGAN           │
│ "ISI + OVERRIDE"                                                  │
│   Isi     : nama mempelai, orang tua, tanggal/venue akad-resepsi,  │
│             foto, kisah cinta, rekening hadiah, quote, dst.        │
│   Override: primary/accent/text color, opening_type,               │
│             loading_config, section_background_overrides,          │
│             section_transition_overrides,                          │
│             section_decoration_overrides, opening_decoration_…     │
└──────────────────────────────────────────────────────────────────┘
```

**Tipe kolom di Postgres: `jsonb`** (bukan `json`), lihat `prisma/create-tables.sql`:
```sql
create table if not exists invitations (
  ...
  data         jsonb not null default '{}',
  ...
);
-- template_records.config  jsonb not null default '{}'
-- app_settings.value       jsonb not null default '{}'
```

Kolom JSONB lain di sistem: `articles.settings`, `writer_profiles.social_links`,
`experiments.variants`, `app_settings.value`.

#### Bentuk `template_records.config` — `JsonTemplateConfig`

```typescript
// lib/types.ts:461
export interface JsonTemplateConfig {
  meta:     TemplateMeta      // color_scheme, font (+ custom_fonts), component_style
  opening:  OpeningConfig     // 17 tipe + ~45 opsi cover (typography, separator, petal, ken burns…)
  loading:  LoadingConfig     // 16 varian + background solid/gradient/radial/image/pattern
  music?:   MusicConfig       // style player, posisi, volume, autoplay, loop
  sections: SectionConfig[]   // ← inti "layout"
}

export interface SectionConfig {
  id: string
  type: SectionType        // 16 tipe: hero | profiles | countdown | story | events |
                           // gallery | gift | rsvp | wishes | livestream | closing |
                           // quote | video | gift-registry | ig-story | qrcode
  order: number            // ← URUTAN VERTIKAL = "layout" undangan
  enabled: boolean
  background: BackgroundConfig      // image | video | color | gradient + overlay_opacity
  decoration_images: string[]
  decoration_assets?: DecorationAsset[]
  transition_in:  TransitionType    // fade | slide-* | zoom-* | none
  transition_out: TransitionType
  user_fields: string[]             // field mana yang boleh diedit pelanggan
  padding_y?: 'compact' | 'normal' | 'spacious'
  text_align?: 'center' | 'left' | 'right'
  content_layout?: 'default' | 'split-left' | 'split-right' | 'full-bleed'
  style_variant?: string
  font_heading?: string; font_body?: string
  heading_weight?: number; body_weight?: number
  heading_scale?: number; body_scale?: number
  // + belasan kontrol khusus per tipe (hero_*, gift_*)
}

export interface DecorationAsset {
  id: string
  url: string                      // aset di Supabase Storage
  position: AssetPosition          // 17 anchor: top-left … edge-bottom
  offset_x?: number; offset_y?: number   // px dari anchor
  width?: number; scale?: number; rotation?: number
  flip_h?: boolean; flip_v?: boolean; opacity?: number
  animation?: AssetAnimation             // masuk
  entry_keyframes?: AssetKeyframeConfig  // { from, to, duration, easing }
  exit_animation?: AssetExitAnimation    // keluar
  exit_keyframes?: AssetKeyframeConfig
  idle_animation?: AssetIdleAnimation    // float | pulse | shimmer | sway | …
  z_layer?: number
}
```

#### Bentuk `invitations.data` — `NewInvitationData`

```typescript
// lib/types.ts:689  (snake_case, sengaja beda dari camelCase legacy)
export interface NewInvitationData {
  // ── Isi ──
  groom_name: string; bride_name: string
  groom_nickname?; bride_nickname?; groom_father?; groom_mother?
  bride_father?; bride_mother?; tagline?
  groom_photo_url?; bride_photo_url?; couple_photo_url?; groom_bio?; bride_bio?
  akad?:    EventDetail       // { date, time, venue_name, venue_address, maps_url, venue_photo_url }
  resepsi?: EventDetail
  gallery_photos?: string[]
  story_chapters?: StoryChapter[]      // foto/video background per bab
  story_timeline?: TimelineItem[]
  gift_accounts?: GiftAccount[]        // bank | ewallet
  gift_registry?: GiftRegistryLink[]
  music_url?; music_title?; livestream_url?; video_embed_url?
  quote_arabic?; quote_translation?; quote_source?
  qr_target_url?; ig_story_image_url?; closing_text?; thank_you_message?

  // ── Override desain (inilah "data desain milik user") ──
  primary_color?; accent_color?; text_color?; background_color?
  opening_type?: OpeningType
  opening_greeting?; opening_subtitle?; opening_groom_name?; opening_bride_name?
  loading_config?: Partial<LoadingConfig>
  opening_decoration_overrides?: DecorationAsset[]
  section_decoration_overrides?: Record<string /* section.id */, DecorationAsset[]>
  section_background_overrides?: Record<string, BackgroundConfig>
  section_transition_overrides?: Record<string, { in?: TransitionType; out?: TransitionType }>
}
```

**Kenapa dipisah dua lapis?** Satu template dipakai banyak pelanggan. Kalau layout
ikut disalin ke tiap undangan, perbaikan template tidak akan pernah sampai ke
pelanggan lama. Dengan pola ini, `invitations.data` hanya menyimpan **delta** —
selebihnya mengikuti template dan otomatis ikut terbarui.

**Konsekuensi yang perlu disadari (risiko teknis):**
- Kolom `data` **tidak divalidasi skema di level database** (`z.record(z.unknown())`
  saat create). Bentuknya hanya dijaga TypeScript pada compile-time.
- Ada **dua format** yang hidup berdampingan: legacy camelCase (`InvitationData`:
  `groomName`, `akadDate`) untuk 3 template hardcoded, dan `NewInvitationData`
  snake_case untuk sistem JSON-driven. Pemilihan jalur ditentukan
  `LEGACY_TEMPLATE_IDS.includes(template_id)`. Ini utang teknis yang perlu
  dijadwalkan penghapusannya.

---

## 3. Daftar API Endpoint

**88 route handler.** Semuanya `export const dynamic = 'force-dynamic'`.
Route admin dibungkus `withAdminAuth()` (`lib/route-guards.ts`) — cek sesi + role
sekali di satu tempat untuk 38 route admin.

### 3.1 Autentikasi
| Method | Endpoint | Akses | Fungsi |
|---|---|---|---|
| POST | `/api/auth/register` | publik | Daftar akun |
| POST | `/api/auth/login` | publik | Login → set cookie `__ku_session` (rate limit 10/mnt per email) |
| POST | `/api/auth/logout` | sesi | Hapus cookie |
| GET | `/api/auth/me` | sesi | Profil user aktif |
| POST | `/api/auth/forgot-password` | publik | Kirim token reset (rate limit 3/mnt) |
| POST | `/api/auth/reset-password` | publik | Reset + naikkan `session_epoch` |

### 3.2 Undangan (Save/Load "Canvas")
| Method | Endpoint | Akses | Fungsi |
|---|---|---|---|
| GET | `/api/invitations` | sesi | Ambil undangan milik user |
| POST | `/api/invitations` | sesi | Buat undangan + trial 7 hari |
| PATCH | `/api/invitations/[id]` | pemilik | **Simpan data desain (autosave)** |
| DELETE | `/api/invitations/[id]` | pemilik | Hapus undangan |
| GET | `/api/invitations/check-slug` | publik | Cek ketersediaan subdomain |

### 3.3 Tamu & RSVP
| Method | Endpoint | Akses | Fungsi |
|---|---|---|---|
| GET | `/api/guests?invitation_id=` | pemilik | Daftar tamu + statistik |
| POST | `/api/guests` | pemilik | Tambah tamu manual |
| PATCH/DELETE | `/api/guests` | pemilik | Ubah / hapus tamu |
| POST | `/api/guests/blast-sent` | pemilik | Tandai WA sudah dikirim |
| POST | `/api/rsvp` | **publik** | Tamu konfirmasi kehadiran |
| GET | `/api/rsvp?invitationId=` | pemilik | Daftar RSVP (dulu tanpa auth — sudah ditutup) |
| GET/POST | `/api/wishes` | publik | Ucapan & doa dari tamu |

### 3.4 Media & Galeri
| Method | Endpoint | Akses | Fungsi |
|---|---|---|---|
| GET/POST/DELETE | `/api/galleries` | pemilik | CRUD galeri |
| POST | `/api/galleries/upload` | pemilik | Upload foto (5MB, JPG/PNG/WebP, cek magic bytes) |
| POST | `/api/galleries/music` | pemilik | Upload musik kustom |
| DELETE | `/api/galleries/[id]` | pemilik | Hapus foto |
| POST | `/api/user/upload` | sesi | Upload aset user |
| GET | `/api/music` | publik | Katalog musik |
| POST | `/api/music/[id]/usage` | publik | Counter pemakaian (rate-limited) |

### 3.5 Pesanan & Pembayaran
| Method | Endpoint | Akses | Fungsi |
|---|---|---|---|
| POST | `/api/orders` | publik | Buat pesanan; **harga ditentukan server** + kode unik |
| GET | `/api/orders/check-subdomain` | publik | Cek subdomain |
| GET | `/api/payment/config` | publik | Rekening & metode pembayaran aktif |
| POST | `/api/payment/proof` | sesi | Kirim bukti transfer manual |
| POST | `/api/payment/mayar/webhook` | **Mayar** | Webhook `payment.received` → provisioning |
| GET | `/api/user/subscription` | sesi | Status langganan |

### 3.6 Growth & Analitik
| Method | Endpoint | Fungsi |
|---|---|---|
| POST | `/api/views` | Catat kunjungan undangan (rate-limited) |
| GET | `/api/analytics` | Statistik untuk pemilik undangan |
| GET/POST | `/api/affiliate` · `/api/affiliate/withdrawals` | Panel afiliasi |
| GET/POST | `/api/referral` | Program referral antar-user |
| GET/POST | `/api/experiments` · `/api/experiments/assign` · `/api/experiments/[id]` | A/B testing |
| POST | `/api/feedback` | NPS / feedback |
| GET/POST | `/api/tickets` · `/api/tickets/[id]/reply` | Support ticket |
| GET | `/api/articles` · `/api/articles/[slug]/views` | Blog publik |

### 3.7 Writer (7 route)
`/api/writer/articles` · `/api/writer/articles/[id]` · `.../submit` · `.../seen` ·
`/api/writer/article-categories` · `/api/writer/notifications` · `/api/writer/profile`

### 3.8 Admin (38 route, semua `withAdminAuth`)
`/api/admin/` → `users` · `invitations` · `orders` · `proofs` · `payment-config` ·
`settings` · `template-records` · `templates` · `categories` · `palettes` ·
`music` (+`categories`) · `articles` (+`review`, `pending-count`) ·
`article-categories` · `blog-typography` · `writers` (+`trust`) ·
`affiliates` (+`withdrawals`) · `tickets` (+`reply`) · `feedback` · `upload`

### 3.9 Cron (bearer `CRON_SECRET`)
| Endpoint | Jadwal | Fungsi |
|---|---|---|
| `/api/cron/sync-subscriptions` | harian 01:00 UTC | Sinkronisasi status langganan & kedaluwarsa |
| `/api/cron/publish-scheduled` | tiap 15 menit | Terbitkan artikel berstatus `scheduled` |

---

## 4. Logika Inti & Potongan Kode

### 4.a Menyimpan data desain → database, lalu merendernya jadi web undangan

#### Langkah 1 — Frontend: autosave berlapis dua (`components/studio/InvitationStudio.tsx`)

Editor memakai **dua debounce terpisah** dengan tujuan berbeda: satu untuk preview
(600 ms, supaya preview tidak berkedip di tiap ketikan), satu untuk simpan
(800 ms, supaya tidak membanjiri database).

```typescript
// components/studio/InvitationStudio.tsx:270-275  — debounce PREVIEW
const [debouncedData, setDebouncedData] = useState(data)
const debounceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
useEffect(() => {
  debounceTimer.current = setTimeout(() => setDebouncedData(data), 600)
  return () => clearTimeout(debounceTimer.current)
}, [data])

// components/studio/InvitationStudio.tsx:321-350  — debounce SIMPAN
const scheduleSave = useCallback(
  (updatedData: NewInvitationData) => {
    clearTimeout(timer.current)
    setSaveStatus('saving')
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/invitations/${invitation.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: updatedData }),   // ← seluruh objek desain
        })
        if (!res.ok) throw new Error('Save failed')
        const { invitation: updated } = await res.json()
        onSaved(updated)
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus('idle'), 2000)
      } catch {
        toast.error('Perubahannya gagal disimpan. Coba lagi ya.')
        setSaveStatus('idle')
      }
    }, 800)
  },
  [invitation.id, onSaved]
)

function updateData(patch: Partial<NewInvitationData>) {
  const updated = { ...data, ...patch }
  setData(updated)          // UI responsif seketika
  scheduleSave(updated)     // simpan menyusul
}
```

> **Catatan arsitektur:** yang dikirim adalah **seluruh objek**, bukan patch parsial —
> jadi `PATCH /api/invitations/[id]` bersifat *last-write-wins*. Aman selama satu
> undangan disunting satu orang di satu tab (asumsi produk saat ini), tapi ini
> titik yang perlu diubah kalau nanti ada kolaborasi multi-user.

#### Langkah 2 — Backend: allowlist + penegakan tier (`app/api/invitations/[id]/route.ts`)

```typescript
export async function PATCH(req: NextRequest, props: Params) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: '…' }, { status: 401 })

  const inv = await invitations.findById(params.id)
  if (!inv || inv.user_id !== session.userId) {          // ← kepemilikan
    return NextResponse.json({ error: 'Datanya tidak ditemukan.' }, { status: 404 })
  }

  const rawBody = await readJsonBody(req)

  // ALLOWLIST — jangan pernah meneruskan body mentah ke invitations.update().
  // update() menerima package_tier, is_paid, dan expires_at. Karena dulu seluruh
  // body diteruskan apa adanya, pemilik undangan gratis cukup mengirim
  // { is_paid: true, expires_at: "2099-01-01" } ke endpoint miliknya sendiri
  // untuk membuka semua fitur berbayar tanpa membayar.
  const body: Record<string, any> = {}
  for (const field of ['slug', 'template_id', 'data', 'is_published'] as const) {
    if (rawBody[field] !== undefined) body[field] = rawBody[field]
  }

  // Penegakan tier di SERVER untuk aset dekorasi — bukan sekadar disembunyikan di UI
  if (body.data?.section_decoration_overrides || body.data?.opening_decoration_overrides) {
    const tier = inv.package_tier as PackageTier | undefined
    const features = getTierFeatures(tier)
    if (!features.decoration_editing) {
      delete body.data.section_decoration_overrides
      delete body.data.opening_decoration_overrides
    } else if (features.max_decoration_assets >= 0) {
      // potong kelebihan aset sesuai batas paket …
    }
  }

  const updated = await invitations.update(params.id, body)
  return NextResponse.json({ invitation: updated })
}
```

#### Langkah 3 — Data layer: menulis JSONB (`lib/db/invitations.ts`)

```typescript
async update(id: string, data: Partial<Omit<Invitation, 'id'|'created_at'|'user_id'>>) {
  const i = await prisma.invitation.update({
    where: { id },
    data: {
      ...(data.slug        !== undefined && { slug: data.slug }),
      ...(data.template_id !== undefined && { templateId: data.template_id }),
      ...(data.data        !== undefined && { data: data.data as object }),  // ← JSONB
      ...(data.package_tier!== undefined && { packageTier: data.package_tier }),
      ...(data.is_published!== undefined && { isPublished: data.is_published }),
      ...(data.is_paid     !== undefined && { isPaid: data.is_paid }),
      ...(data.expires_at  !== undefined && { expiresAt: data.expires_at ? new Date(data.expires_at) : null }),
    },
  })
  return mapInvitation(i)
}
```

#### Langkah 4 — Render: subdomain → slug (`middleware.ts`)

```typescript
export async function middleware(req: NextRequest) {
  const host = (req.headers.get('host') || '').replace(/:\d+$/, '')

  let slug: string | null = null
  if (host === 'localhost') {
    slug = req.nextUrl.searchParams.get('slug')     // dev: ?slug=budi-ani
  } else if (host.endsWith(`.${APP_DOMAIN}`)) {
    slug = host.split('.')[0]                       // prod: budi-ani.iaundang.online
  }

  const isMainDomain = !slug || slug === 'www' || slug === APP_DOMAIN.split('.')[0]

  if (!isMainDomain && slug && !isApiOrInternal) {
    const url = req.nextUrl.clone()
    url.pathname = pathname === '/' ? `/invitation/${slug}` : `/invitation/${slug}${pathname}`
    return NextResponse.rewrite(url)                // ← rewrite, bukan redirect
  }
  // … penjagaan /dashboard /admin /writer /affiliate …
}
```

#### Langkah 5 — Server Component memuat data + template (`app/invitation/[slug]/page.tsx`)

```typescript
export default async function InvitationPage(props0: Props) {
  const params = await props0.params
  const invitation = await invitations.findBySlug(params.slug)
  if (!invitation) notFound()
  if (!invitation.is_published) return <UnpublishedPage />

  // Gerbang komersial: langganan → kedaluwarsa → masa tenggang trial
  const sub = await subscriptions.findByInvitation(invitation.id)
  const expired = sub ? !isSubActive(sub) : invitation.is_paid && isExpired(invitation.expires_at)
  if (expired) {
    if (sub && isTrial(sub) && isInGracePeriod(sub)) return <TrialGracePage slug={invitation.slug} />
    return <ExpiredPage />
  }

  const pkg = getPackage(invitation.package_tier)
  const showWatermark = !invitation.is_paid || !pkg.hasWatermarkFree

  if (!isLegacy) {
    // Dua query independen → paralel, bukan berurutan
    const [template, invWishes] = await Promise.all([
      templateRecords.findById(invitation.template_id),
      wishes.findByInvitationId(invitation.id),
    ])

    const content = (
      <InvitationRenderer
        invitationId={invitation.id}
        invitationData={invitation.data as unknown as NewInvitationData}
        template={template}                          // ← config JSONB
        initialWishes={invWishes}
        musicUrl={invitation.data.music_url}
      />
    )
    return <>{eventJsonLd && <script type="application/ld+json" …/>}
            {showWatermark ? <WatermarkShell>{content}</WatermarkShell> : content}
            <ViewTracker invitationId={invitation.id} /></>
  }
  // … jalur legacy: switch template_id ke 3 komponen hardcoded …
}
```

> `invitations.findBySlug` dibungkus `cache()` dari React karena dipanggil dua kali
> per load (`generateMetadata` + komponen halaman) — tanpa dedup itu dua round-trip
> Hyperdrive untuk data yang sama.

#### Langkah 6 — Merge template + override, lalu render (`components/renderer/InvitationRenderer.tsx`)

Inilah titik pertemuan dua lapis JSONB tadi:

```typescript
const activeSections = [...config.sections]      // dari template_records.config
  .filter((s) => s.enabled)
  .sort((a, b) => a.order - b.order)             // ← "layout" ditentukan di sini

{activeSections.map((section) => {
  // Override milik pelanggan, dari invitations.data
  const userAssets  = invitationData.section_decoration_overrides?.[section.id]
  const bgOverride  = invitationData.section_background_overrides?.[section.id]
  const trOverride  = invitationData.section_transition_overrides?.[section.id]

  const merged: SectionConfig = {
    ...section,
    ...(userAssets?.length ? { decoration_assets: mergeDecorationAssets(section.decoration_assets, userAssets) } : {}),
    ...(bgOverride  ? { background: bgOverride } : {}),
    ...(trOverride?.in  ? { transition_in:  trOverride.in }  : {}),
    ...(trOverride?.out ? { transition_out: trOverride.out } : {}),
  }

  return (
    <div key={section.id} data-section-id={section.id}>
      <SectionRenderer
        sectionConfig={merged}
        invitationData={invitationData}
        templateMeta={meta}
        invitationId={invitationId}
        initialWishes={section.type === 'wishes' ? initialWishes : undefined}
      />
    </div>
  )
})}
```

Undangan berjalan dalam **tiga fase** (`opening` → `loading` → `main`), dan font
tema dimuat runtime dengan menyuntikkan `<link>` Google Fonts / `@font-face`
untuk font kustom yang diunggah admin.

Terakhir, `SectionRenderer` memetakan `type` ke komponen — satu `switch` datar:

```typescript
// components/renderer/SectionRenderer.tsx:40
switch (sectionConfig.type) {
  case 'hero':          return <HeroSection          {...shared} />
  case 'profiles':      return <ProfilesSection      {...shared} />
  case 'countdown':     return <CountdownSection     {...shared} />
  case 'gallery':       return <GallerySection       {...shared} />
  case 'rsvp':          return <RSVPSection          {...shared} invitationId={invitationId} />
  case 'wishes':        return <WishesSection        {...shared} invitationId={invitationId} initialWishes={initialWishes} />
  // … 16 tipe total …
  default:              return null
}
```

**Alur ringkas end-to-end:**
```
Editor (form)
  → updateData()  → debounce 800ms
  → PATCH /api/invitations/:id  { data }
  → allowlist + penegakan tier
  → prisma.invitation.update({ data: <jsonb> })
  ─────────────────────────────────────────────
Tamu buka budi-ani.iaundang.online
  → middleware rewrite → /invitation/budi-ani
  → findBySlug (cached) + gerbang langganan
  → findById(template_id) → config jsonb
  → InvitationRenderer: merge config × data
  → SectionRenderer → 16 komponen React
```

---

### 4.b Logika generate link/URL unik untuk daftar tamu

Sistem ini memakai **dua tingkat identitas URL** yang perlu dibedakan:

#### Tingkat 1 — URL unik per UNDANGAN (subdomain)

Slug adalah kolom `@unique` di tabel `invitations` dan sekaligus label DNS.
Rekomendasi slug dibuat dari nama pasangan:

```typescript
// lib/slug-generator.ts
export function generateSlugSuggestions(groomFull: string, brideFull: string): string[] {
  const clean = (s: string) =>
    s.split(' ')[0].toLowerCase()      // ambil nama depan saja
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '') // hapus aksen
      .replace(/[^a-z]/g, '')          // hanya huruf

  const g = clean(groomFull), b = clean(brideFull)
  if (!g || !b) return []

  const year = new Date().getFullYear()
  const candidates = [
    `${g}-dan-${b}`,           // budi-dan-ani      paling natural
    `${g}${b}`,                // budiani           akronim gabung
    `${b}${g}`,                // anibudi           dibalik
    `${g}-${b}`,               // budi-ani          simpel
    `${g}-${b}-${year}`,       // budi-ani-2026
    `${g[0]}${b[0]}-${year}`,  // ba-2026
    `${g}and${b}`,             // budiandani        gaya internasional
    `${b}and${g}`,
    `${g[0]}n${b[0]}-wedding`, // bnb-wedding
    `pernikahan-${g}-${b}`,
  ]

  const isValid = (s: string) => /^[a-z0-9-]{3,30}$/.test(s)
  return Array.from(new Set(candidates)).filter(isValid).slice(0, 5)
}
```

Slug menjadi URL lewat helper tunggal:

```typescript
// lib/utils.ts:56
export function getInvitationUrl(slug: string): string {
  const domain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'iaundang.online'
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return `${window.location.origin}?slug=${slug}`   // dev: query param
  }
  return `https://${slug}.${domain}`                  // prod: subdomain
}
```

Keunikannya dijaga di tiga lapis:
```typescript
// lib/db/invitations.ts — pengecekan aplikasi
async slugExists(slug: string, excludeId?: string): Promise<boolean> {
  const count = await prisma.invitation.count({
    where: { slug, ...(excludeId && { id: { not: excludeId } }) }
  })
  return count > 0
}
```
1. `GET /api/invitations/check-slug` saat pelanggan mengetik (realtime)
2. `POST /api/orders` — cek `invitations.slugExists()` **dan** `orders.subdomainExists()`
   (agar slug yang sedang dipesan orang lain tapi belum dibayar juga terkunci)
3. Constraint `@unique` di database sebagai jaring pengaman terakhir

#### Tingkat 2 — Personalisasi per TAMU (query param `?to=`)

Sistem **tidak** membuat token/ID unik per tamu. Personalisasi memakai query
param `?to=<nama>` yang dibaca di sisi klien oleh 17 komponen opening dan 3
template legacy:

```typescript
// Pola identik di seluruh components/renderer/openings/*.tsx
function getGuestName(): string | null {
  if (typeof window === 'undefined') return null
  return new URLSearchParams(window.location.search).get('to')
}

export default function EnvelopeOpening({ config, data, meta, onOpen, previewGuestName }: Props) {
  const [guestName] = useState(() => getGuestName() || previewGuestName || null)
  // → dirender sebagai "Kepada Yth. <guestName>" di halaman cover
}
```

Bentuk URL final yang dituju desain ini:
```
https://budi-ani.iaundang.online/?to=Bapak%20Andi%20dan%20Keluarga
```

#### Distribusi ke daftar tamu — WhatsApp blast

```typescript
// components/dashboard/GuestManager.tsx
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  return digits.startsWith('0') ? `62${digits.slice(1)}` : digits   // 08xx → 628xx
}

function generateWaLink(phone: string, message: string): string {
  return `https://wa.me/${normalizePhone(phone)}?text=${encodeURIComponent(message)}`
}

const invUrl = getInvitationUrl(invitation.slug)

const defaultMessage = useCallback((name: string) =>
  `Assalamu'alaikum Yth. ${name},\n\n` +
  `Kami mengundang kehadiran Bapak/Ibu/Saudara/i dalam acara pernikahan kami.\n\n` +
  `🔗 Undangan digital: ${invUrl}\n\n` +
  `Mohon hadir ya, terima kasih 💝`,
  [invUrl])

function blastAll() {
  const targets = contacts.filter(c => c.phone && !c.blast_sent_at)
  const ids: string[] = []
  targets.forEach(c => {
    window.open(generateWaLink(c.phone, defaultMessage(c.name)), '_blank')
    ids.push(c.id)
  })
  markSent(ids)   // POST /api/guests/blast-sent → isi kolom blast_sent_at
}
```

Pengiriman memakai **wa.me deep link yang dibuka di tab browser**, bukan
WhatsApp Business API. Artinya blast tetap butuh klik manual per tamu dan
dibatasi popup blocker — konsekuensi biaya nol, tapi tidak bisa diskalakan
ke ratusan tamu tanpa gesekan. Kolom `guests.blast_sent_at` mencegah pengiriman ganda.

> ⚠️ **Ada celah di rantai ini** — `defaultMessage()` menyisipkan `invUrl` polos
> tanpa `?to=`, sehingga URL yang benar-benar terkirim ke tamu tidak pernah
> membawa nama mereka. Detailnya di temuan #2 di bawah.

---

## 5. Temuan Audit

Karena dokumen ini disusun untuk keperluan audit, tiga hal berikut ditemukan saat
penelusuran dan sebaiknya masuk daftar perbaikan. Semuanya **belum tercatat** di
`BUGS.md`.

### 🔴 Temuan #1 — RSVP dan Ucapan tidak pernah tersimpan ke database (KRITIS)

**Bukti:**
```typescript
// components/renderer/sections/RSVPSection.tsx:35
// components/renderer/sections/WishesSection.tsx:148  (identik)
const isPreview = !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(invitationId)

if (isPreview) {
  await new Promise(r => setTimeout(r, 400))
  setSubmitted(true)     // ← tampil "berhasil" tanpa memanggil API sama sekali
  setLoading(false)
  return
}
```

```typescript
// app/api/rsvp/route.ts:10  dan  app/api/wishes/route.ts:10
const schema = z.object({
  invitationId: z.string().uuid(),   // ← menolak cuid
  …
})
```

**Analisis.** `Invitation.id` memakai `@default(cuid())` — formatnya
`clx7k2m9p0000...`, bukan UUID. Regex UUID di atas berasal dari era sebelum
migrasi `local JSON db → Prisma` (commit `7cdc3b6`), ketika ID dibuat dengan
`crypto.randomUUID()`. Setelah migrasi, regex itu **tidak pernah cocok lagi**
untuk undangan mana pun.

**Dampak berlapis:**
1. Klien: `isPreview` selalu `true` → tamu melihat "Terima kasih, konfirmasi
   terkirim" padahal tidak ada request yang dikirim.
2. Server: seandainya request dikirim pun, Zod `.uuid()` akan menolaknya dengan 400.

Artinya dua fitur yang dijual di ketiga paket — *"RSVP online hingga 200/500/1.000 tamu"*
dan *"Ucapan & doa dari tamu"* — kemungkinan besar **tidak berfungsi di produksi
untuk seluruh undangan berbasis template JSON**. Statistik RSVP di dashboard
pemilik akan selamanya nol dari sisi tamu.

**Perbaikan:** ganti deteksi preview dengan flag eksplisit (mis. prop `isPreview`
dari `InvitationRenderer`, karena editor memang sudah tahu konteksnya), dan ubah
`z.string().uuid()` → `z.string().min(1)` (konsisten dengan `/api/guests` yang
sudah memakai `z.string().min(1)`).

> Perlu diverifikasi langsung ke database produksi: cek apakah ada baris
> `guests` dengan `source = 'rsvp'` atau baris `wishes` yang dibuat setelah
> tanggal migrasi Prisma. Itu konfirmasi definitif.

### 🟠 Temuan #2 — Fitur "undangan personal per tamu" tidak pernah tersambung

Seluruh sisi *pembaca* `?to=` sudah lengkap dan matang (17 opening + 3 template
legacy). Yang tidak ada adalah sisi *penulis*: pencarian menyeluruh di
`app/`, `components/`, `lib/`, `hooks/` tidak menemukan satu pun tempat yang
**membentuk** URL berisi `?to=`.

`GuestManager.defaultMessage()` mengirim `invUrl` polos. Padahal
`lib/pricing-config.ts` mencantumkan **"Undangan personal per tamu"** sebagai
fitur berbayar di paket Starter (dan diwarisi Popular & Eksklusif).

**Perbaikan (kecil, satu baris):**
```typescript
const defaultMessage = useCallback((name: string) => {
  const personalUrl = `${invUrl}${invUrl.includes('?') ? '&' : '?'}to=${encodeURIComponent(name)}`
  return `Assalamu'alaikum Yth. ${name},\n\n…\n🔗 Undangan digital: ${personalUrl}\n\n…`
}, [invUrl])
```
Perlu `invUrl.includes('?')` karena di localhost `getInvitationUrl()` sudah
memakai `?slug=`.

### ✅ Temuan #3 — Batas "satu undangan per akun" tidak konsisten — SUDAH DIPERBAIKI

> **Selesai 17 Agu 2026.** Diputuskan: **B2C, satu akun boleh banyak undangan.**
> `findByUserId` diganti `findManyByUserId` + `countByUserId`, blok 409 diganti
> batas `MAX_INVITATIONS_PER_USER = 10` (pagar anti-penyalahgunaan trial, bukan
> aturan produk), dan Dashboard memakai daftar + pemilih undangan aktif.
> Rinciannya di `docs/REPORT_PERBAIKAN.md` §4.

Kondisi sebelumnya, sebagai catatan sejarah:

```typescript
// app/api/invitations/route.ts:50-52 — jalur self-service
if (await invitations.findByUserId(session.userId)) {
  return NextResponse.json({ error: 'Kalian sudah punya undangan…' }, { status: 409 })
}
```
Sementara `lib/provision-order.ts` memanggil `invitations.create()` langsung tanpa
pemeriksaan itu. Akun yang membeli dua kali akan punya dua undangan, tapi
`invitations.findByUserId()` memakai `findFirst(orderBy: createdAt desc)` — hanya
mengembalikan **satu**. Jadi undangan kedua yang SUDAH DIBAYAR tidak pernah
terlihat di dashboard pelanggan.

---

## 6. Catatan Operasional Penting

Lima aturan yang kegagalannya **tidak kentara** — build tetap lolos, produksi rusak
(dikutip dari `README.md`, alasannya ada di komentar masing-masing file):

1. **Jangan impor `@/lib/db` sebagai nilai dari komponen client.** Prisma dan `pg`
   ikut ke bundle browser → build gagal `Can't resolve 'net'`. Konstanta aman ada
   di `lib/built-in-data.ts`; untuk tipe pakai `import type`.
2. **Jangan baca secret di module scope.** Di Workers module scope dievaluasi
   sebelum ada request — `process.env` untuk secret runtime masih kosong.
3. **Kerja setelah response harus lewat `runAfterResponse()`.** Promise
   menggantung DIBATALKAN saat response dikirim.
4. **Jangan jadikan client Prisma singleton.** Socket tidak boleh dipakai lintas
   request di Workers.
5. **Harga tidak boleh datang dari client.** Sumber kebenarannya
   `settings.priceTiers`, bukan konstanta `PACKAGES`.

**Paket & harga saat ini** (`lib/packages.ts` — catat: harga *runtime* diambil dari
`settings.priceTiers` yang bisa diubah admin, jadi kedua sumber ini bisa berbeda):

| Tier | Harga | Aktif | Foto | Tamu | Watermark-free | Custom domain |
|---|---|---|---|---|---|---|
| Starter | Rp 79.000 | 1 bulan | 10 | 200 | ✗ | ✗ |
| Popular | Rp 149.000 | 3 bulan | 20 | 500 | ✓ | ✗ |
| Eksklusif | Rp 249.000 | 6 bulan | ∞ | ∞ | ✓ | ✓ |

Undangan baru lewat jalur self-service mendapat **trial 7 hari**
(`app/api/invitations/route.ts:61-62` + `subscriptions.createTrial()`).

---

*Dokumen ini dihasilkan dari pembacaan langsung codebase. Angka baris dan nama file
valid per commit `47b58f8`.*
