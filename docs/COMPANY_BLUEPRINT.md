# IAUndang — Company Blueprint & Product Masterplan

**Version:** 1.0
**Date:** 29 Juni 2026
**Status:** Approved for internal distribution
**Next review:** Desember 2026

---

## Daftar Isi

1. [Company Identity](#bagian-1--company-identity)
2. [Product Philosophy](#bagian-2--product-philosophy)
3. [Company Philosophy](#bagian-3--company-philosophy)
4. [Product Positioning](#bagian-4--product-positioning)
5. [Product Architecture](#bagian-5--product-architecture)
6. [Feature Philosophy](#bagian-6--feature-philosophy)
7. [Dashboard Architecture](#bagian-7--dashboard-architecture)
8. [Business Model](#bagian-8--business-model)
9. [Marketplace Strategy](#bagian-9--marketplace-strategy)
10. [Multi-Event Strategy](#bagian-10--multi-event-strategy)
11. [Growth Strategy](#bagian-11--growth-strategy)
12. [Organization](#bagian-12--organization)
13. [Decision Framework](#bagian-13--decision-framework)
14. [North Star & Metrics](#bagian-14--north-star--metrics)
15. [What We Build / What We Don't Build](#bagian-15--what-we-build--what-we-dont-build)

---

# BAGIAN 1 — COMPANY IDENTITY

## 1.1 — Apa Itu IAUndang?

IAUndang adalah **platform undangan digital self-service** untuk pasangan Indonesia yang ingin membuat, mengelola, dan mendistribusikan undangan acara personal secara mandiri.

IAUndang duduk di persimpangan tiga industri:

1. **Wedding Industry** — pasar Rp 80+ triliun/tahun di Indonesia
2. **Creative Tools** — seperti Canva untuk undangan
3. **Content Delivery** — micro-website yang di-distribute via WhatsApp

**Pernyataan kunci:** IAUndang adalah *"the operating system for personal event communication"*.

## 1.2 — Masalah yang Diselesaikan

### Primary Job (JTBD)

> *"Saat saya dan pasangan akan menikah, saya ingin memberi tahu semua tamu tentang detail acara saya dengan cara yang elegan, personal, dan mudah, sehingga mereka tahu kapan-di mana harus hadir dan saya tahu siapa yang akan datang."*

### Masalah Konkret

1. **Friction antara keinginan dan kemampuan** — ingin undangan indah, tidak punya skill desain
2. **Distribusi yang fragmentasi** — kirim satu-satu via WA, catat manual
3. **Tidak ada feedback loop** — tidak tahu apakah tamu sudah buka/akan hadir
4. **Koordinasi yang melelahkan** — update info = cetak ulang (fisik) vs edit sekali (digital)

## 1.3 — Target Pengguna

### Primary: Pasangan Muda Indonesia (Usia 22-35)

| Persona | Deskripsi | Tier Target |
|---------|-----------|-------------|
| **Persona 1: Practical Bride** | Usia 25, budget ketat, mau cepat jadi | Starter-Popular |
| **Persona 2: Aesthetic Couple** | Usia 28-30, dual income, mau beda dari yang lain | Popular-Eksklusif |
| **Persona 3: Family Representative** | Usia 45+, mengurus undangan untuk keluarga | Starter |

### Secondary: WO, Vendor Pernikahan, Event Organizer (future)

## 1.4 — Unique Value Proposition

> **"Undangan yang benar-benar milik kamu — bukan template yang sama dengan 1.000 pasangan lain."**

## 1.5 — Competitive Differentiation

3 pilar diferensiasi:
1. **Customization Depth** — section-based composition, bukan just pick-and-fill
2. **Smart Defaults, Easy Override** — cantik out-of-box, customizable bagi yang mau
3. **Distribution Intelligence** — bukan hanya "kirim link" tapi track, remind, analyze

---

# BAGIAN 2 — PRODUCT PHILOSOPHY

## 7 Product Principles

### Principle 1: "Beautiful by Default, Unique by Choice"
Setiap undangan harus terlihat profesional tanpa user mengubah apapun. Tapi setiap elemen harus bisa diubah.

### Principle 2: "Selesai dalam Satu Sesi"
User harus bisa membuat undangan lengkap dan siap kirim dalam <30 menit, target <15 menit.

### Principle 3: "Setiap Fitur Harus Menjawab Pertanyaan Tamu"
Restraint principle — fitur yang tidak menjawab pertanyaan fungsional tamu seharusnya tidak ada.

### Principle 4: "Data Milik Pasangan, Bukan Milik Platform"
Semua data user adalah milik mereka. Export available. Tidak ada lock-in. Data tidak dijual.

### Principle 5: "Complexity is Our Problem, Not the User's"
Arsitektur boleh kompleks. Interface harus selalu sederhana.

### Principle 6: "Bangun untuk 10.000 User Berikutnya, Bukan 10 User Pertama"
Pattern-driven, bukan anecdote-driven.

### Principle 7: "Revenue is a Feature"
Monetisasi = product design, bukan afterthought.

## Product Compass (Prioritas)

```
1. Apakah ini membuat undangan lebih cepat jadi?          -> Tertinggi
2. Apakah ini membuat undangan lebih cantik by default?    -> Tinggi
3. Apakah ini membuat distribusi/tracking lebih mudah?     -> Tinggi
4. Apakah ini membuat user lebih willing to pay?           -> Medium
5. Apakah ini membuat undangan lebih unik/personal?        -> Medium
6. Apakah ini membuat admin/operasional lebih efisien?     -> Rendah
7. Apakah ini membuat platform lebih scalable?             -> Rendah
```

---

# BAGIAN 3 — COMPANY PHILOSOPHY

## Vision

> **"Setiap momen penting dalam hidup seseorang layak disampaikan dengan indah — tanpa bergantung pada privilege, skill, atau budget."**

## Mission

> **"Membangun platform self-service yang memungkinkan siapapun membuat, mengelola, dan mengirimkan undangan acara berkualitas profesional — dalam hitungan menit, bukan hari."**

## Core Values

1. **Craft Over Speed — Tapi Jangan Lambat** — kualitas tinggi, bukan perfectionism
2. **User First, Ego Last** — keputusan berdasarkan user need, bukan internal preference
3. **Own the Outcome** — bertanggung jawab atas hasil, bukan hanya tugas
4. **Transparansi Radikal** — informasi mengalir bebas, bad news travels fast
5. **Small Team, Big Standards** — ukuran kecil bukan alasan untuk standar rendah

## Operating Principles

- **Ship Weekly, Learn Daily**
- **Measure Before You Build, Measure After You Ship**
- **One Owner, Many Contributors**
- **Default to Action, Easy to Reverse**
- **Write It Down**

## Decision Hierarchy

1. User Impact (tertinggi)
2. Revenue Impact
3. Simplicity
4. Reversibility

## Always Do

1. Selalu minta izin sebelum menggunakan data user
2. Selalu berikan cara untuk menghapus akun dan semua data
3. Selalu tampilkan harga final yang jelas
4. Selalu respon support ticket dalam <24 jam
5. Selalu berikan grace period setelah subscription expire
6. Selalu test di mobile-first

## Never Do

1. Tidak akan pernah menjual data personal tamu
2. Tidak akan pernah menampilkan iklan pihak ketiga di undangan
3. Tidak akan pernah membuat harga berbeda untuk user yang sama (dynamic pricing)
4. Tidak akan pernah menggunakan countdown/scarcity palsu
5. Tidak akan pernah menyulitkan user untuk berhenti
6. Tidak akan pernah memblokir akses user ke data mereka sebagai leverage

---

# BAGIAN 4 — PRODUCT POSITIONING

## Positioning Level

**Saat ini:** Level 3 — Self-Service Invitation Platform
**Target Year 2-3:** Level 4 — Platform + Designer Marketplace

## Positioning Statement

> **IAUndang adalah platform undangan digital self-service yang memberikan pasangan Indonesia kendali penuh untuk membuat undangan berkualitas profesional — dengan deep customization yang tidak tersedia di template builder biasa.**

## Positioning Evolution

```
Month 0-6:   "Invitation Builder Premium"
Month 7-18:  "Self-Service Invitation Platform"
Month 19-36: "Event Invitation Platform + Designer Marketplace"
Month 37+:   "The Invitation Platform for Every Important Moment"
```

## Benchmark Pelajaran

| Company | Yang Dipelajari | Yang Tidak Ditiru |
|---------|----------------|-------------------|
| Canva | Template as starting point, freemium acquisition | Feature sprawl |
| Shopify | Merchant success = platform success, theme ecosystem | Complexity for power users |
| Notion | Block-based composition, template gallery | Learning curve |
| Webflow | Output quality sebagai moat | Pricing yang mengasingkan |
| ThemeForest | (Cautionary tale) | Race to bottom, no curation, designer as commodity |

## Competitive Position

Kuadran target: **Affordable AND High Customization** — posisi yang saat ini kosong di pasar Indonesia.

---

# BAGIAN 5 — PRODUCT ARCHITECTURE

## Domain Map: 14 Domains, 4 Clusters

### Cluster 1: CORE PRODUCT
1. **Invitation** — lifecycle undangan dari creation hingga expiry
2. **Template** — blueprint visual dan struktural
3. **Guest** — lifecycle hubungan host-tamu
4. **Media** — file digital (foto, video, musik, aset)

### Cluster 2: COMMERCE
5. **Order** — proses pemesanan hingga fulfillment
6. **Payment** — verifikasi dan rekonsiliasi pembayaran
7. **Promotion** — pricing, diskon, coupon, flash sale
8. **Subscription** — lifecycle hak akses fitur berbayar

### Cluster 3: DISTRIBUTION & INTELLIGENCE
9. **Broadcast** — distribusi undangan ke tamu via WA/email
10. **Notification** — komunikasi platform ke user dan admin
11. **Analytics** — data engagement undangan dan bisnis

### Cluster 4: ECOSYSTEM
12. **Marketplace** — designer template ecosystem (Year 2-3)
13. **Affiliate** — program referral dan komisi
14. **Identity & Access** — authentication, authorization, roles

## Domain Investment Priority

| Priority | Domain | Action |
|----------|--------|--------|
| #1 | Subscription | Build from scratch |
| #2 | Notification | Build from scratch |
| #3 | Guest | Unify (Guest + RSVP + Contacts) |
| #4 | Order | Restructure (consolidate dual flow) |
| #5 | Payment | Gateway integration |

---

# BAGIAN 6 — FEATURE PHILOSOPHY

## Feature Categories

### Core Features (100% users, semua tier, non-negotiable)
Template Selection, Invitation Editor, Section Management, Live Preview, Publish & Share, RSVP, Wishes, Photo Upload, Auth, Mobile Responsive

### Growth Features (50-80% users, free tier OK)
Guest List Management, WhatsApp Blast, Invitation Analytics, Template Gallery, Social Proof, Referral Program, Blog/Content, Onboarding Excellence

### Premium Features (30-60% users, paid tier)
Watermark removal, Extended gallery, Premium sections, Opening animations, Decoration sets, Guest blast quota, Custom domain, Duration, Hide wishes, Priority support

### Enterprise Features (Year 2+)
Multi-invitation workspace, White-label, Client handoff, Bulk template customization, API access, Corporate event invitations

### Experimental (validate first)
AI Text Generator, Smart Photo Enhancement, Personalized OG Preview, Template Remix, Digital RSVP Card

## 5 Signature Differentiators

1. **Section Composer** — compose from sections, not just fill template
2. **Cinematic Opening** — 13 opening animation variants
3. **Smart Guest Distribution** — personalized links + blast + tracking + reminder
4. **Tier-Aware Customization** — progressive depth per tier
5. **Invitation Intelligence** — analytics dashboard for invitation performance

---

# BAGIAN 7 — DASHBOARD ARCHITECTURE

## 4 Interfaces (Bukan 10)

| Interface | Untuk | Feel | URL |
|-----------|-------|------|-----|
| **Studio** | Customer | Notion workspace | /studio |
| **Admin Console** | Admin, Support, Finance | Shopify Admin | /admin |
| **Partner Portal** | Affiliate, Writer | Minimal dashboard | /partner |
| **Designer Studio** | Designer (Year 2-3) | Figma + Analytics | /designer |

## Implementation: 1 Next.js App, 4 Route Groups

```
app/
  (main)/      <- Landing page, public
  (auth)/      <- Login, register
  (studio)/    <- Customer workspace
  (admin)/     <- Admin console
  (partner)/   <- Partner portal
  (designer)/  <- Designer studio (future)
  invitation/  <- Public renderer
```

## Migration Phases

1. Month 1-2: Foundation (route groups, per-page data loading)
2. Month 3-4: Studio MVP (customer workspace)
3. Month 5-7: Admin Console upgrade
4. Month 8-10: Partner Portal
5. Month 18-24: Designer Studio

---

# BAGIAN 8 — BUSINESS MODEL

## Revenue Architecture

```
PRIMARY (70% Year 1): One-Time Tier Payment
  Starter Rp 79k -> 99k | Popular Rp 149k -> 179k | Eksklusif Rp 249k -> 299k

SECONDARY (20% Year 1-2): Add-On Services
  Custom Domain Rp 75k | WA Blast Pack Rp 50k | Premium Template Rp 50k

TERTIARY (10% Year 1 -> 30% Year 3): B2B Subscription
  WO Starter Rp 299k/bln | Pro Rp 599k | Ent Rp 1.499k

EMERGING (Year 2-3): Marketplace Commission (30% of template sales)
```

## Key Decisions

| Model | Decision | Reason |
|-------|----------|--------|
| One-Time Payment | PRIMARY | Sesuai one-time use case |
| Subscription B2C | REJECT | Fundamental mismatch |
| Subscription B2B | BUILD Year 2 | WO punya recurring need, LTV:CAC 27x |
| Marketplace Fee | BUILD Year 2-3 | Supplementary + ecosystem value |
| AI Features | INCLUDE, don't charge | Reduces friction, negligible cost |

## Free Tier: 7-Day Trial

> **Tidak berlaku lagi sejak 11 Sep 2026.** Trial berbasis akun sudah dihapus
> dari produk (branch `tier-unification`). Calon pembeli mencoba editor lewat
> pratinjau `/demo/renderer` tanpa akun, lalu membeli di `/order`. Rencana di
> bawah dibiarkan sebagai catatan keputusan awal.

- 7 hari dari saat invitation dibuat
- 3 basic templates, watermark, limited sections
- 50 tamu max, 5 foto max
- After expiry: read-only 14 hari, lalu redirect

## Revenue Projection

| Year | Annual Revenue | Team |
|------|---------------|------|
| 1 | Rp 300-400jt | 1-2 |
| 2 | Rp 1-1.3M | 5-6 |
| 3 | Rp 2.5-3M | 7-10 |
| 5 | Rp 6-8M | 15-20 |

---

# BAGIAN 9 — MARKETPLACE STRATEGY

## Preconditions (Sebelum Launch)

1. Template Engine stable 6+ bulan tanpa breaking changes
2. 5.000+ paid customers kumulatif
3. 20+ in-house templates sebagai quality benchmark

## Designer Tiers

| Tier | Commission (Designer/IAUndang) | Requirements |
|------|-------------------------------|-------------|
| Emerging | 70/30 | Portfolio 3+, quiz lulus |
| Verified | 75/25 | 5+ approved, rating >=4.2, 50+ sales |
| Expert | 80/20 | 15+ approved, rating >=4.5, 200+ sales |

Exclusivity bonus: +5%

## Review Pipeline

1. Automated Check (instant): format, assets, mobile, fonts, accessibility
2. Manual Review (48-120h): visual quality, originality, UX, mobile, cultural sensitivity
3. Staging QA (24h): render test, performance, cross-browser
4. Published

## Pricing Guardrails

- Floor: Rp 25k
- Ceiling: Rp 200k

## Launch Phases

1. Month 12-15: Foundation (SDK documentation, recruit beta designers)
2. Month 15-18: Closed Beta (invited designers, test pipeline)
3. Month 18-21: Open Beta (application-based)
4. Month 21-24: General Availability

---

# BAGIAN 10 — MULTI-EVENT STRATEGY

## Architectural Readiness: 60%

- Ready: Engine core, Guest, RSVP, Wishes, Gallery, Opening, Loading, Payment
- Not Ready: Invitation data model, Onboarding wizard, Section labels, Template library, Decoration assets

## Expansion Sequence

```
Year 1:  Wedding only (excellence first)
Year 2a: Aqiqah (85% similarity, natural upsell to existing customers)
Year 2b: Khitanan (80% similarity, reuse aqiqah templates)
Year 3:  Birthday (conditional, based on data)
NEVER:   Corporate events, Funeral
```

## Prepare TODAY (4 Decisions)

1. Generic field naming (event_date bukan wedding_date)
2. Section labels dari config, bukan hardcoded
3. Template tagging system (compatible_events)
4. Dynamic form fields di wizard

## Cross-Event Flywheel

Wedding customer -> Aqiqah (1-2 tahun) -> Khitanan (3-5 tahun) + Referrals
LTV naik 3.2x tanpa re-acquisition cost.

## Branding: Keep "IAUndang", Evolve Tagline

- Now: "Undangan Digital Premium"
- Year 2: "Undangan Digital untuk Momen Istimewa"
- Year 3: "Undangan Digital untuk Setiap Momen"

---

# BAGIAN 11 — GROWTH STRATEGY

## Growth Engine: Product-Led Growth (PLG)

## The Growth Loop

```
Pasangan register -> Buat undangan -> Blast ke 200-500 tamu
  -> Tamu lihat (+ brand IAUndang) -> 5-10 tamu akan menikah
  -> Mereka ingat IAUndang -> Register -> Cycle repeats
```

## Year-by-Year Roadmap

### Year 1: "Foundation & Product Excellence"

| Quarter | Focus | Key Actions |
|---------|-------|-------------|
| Q1 | FIX | Fix critical bugs, upgrade flow, guest unification, free trial expiry |
| Q2 | BUILD | Subscription domain, Notification system, Basic analytics, WA blast improvement |
| Q3 | GROW | SEO/content, Instagram, Template library 20-30, Referral program, WO partnerships |
| Q4 | SCALE | A/B testing, Template velocity 30+, Customer feedback loop, Prepare first hire |

**Revenue target:** Rp 300-400jt/tahun

### Year 2: "Growth & Diversification"

- Price increase (Rp 99k/179k/299k)
- Add-on launch (custom domain, WA blast pack)
- B2B pilot (5-10 WOs)
- Aqiqah expansion
- First hires: Designer, Developer, Marketing
- Marketplace beta

**Revenue target:** Rp 1-1.3M/tahun

### Year 3: "Platform & Maturity"

- Marketplace GA
- AI-assisted creation
- Multi-event maturity
- Team 7-10 people
- Profitability achieved

**Revenue target:** Rp 2.5-3M/tahun

### Year 5: "Market Leadership"

- 50.000+ paid customers
- 500+ templates, 100+ designers
- 4-5 event types
- SEA expansion consideration
- Team 15-20

**Revenue target:** Rp 6-8M/tahun

---

# BAGIAN 12 — ORGANIZATION

## Team Evolution

| Stage | Timeline | Size | Key Hires |
|-------|----------|------|-----------|
| Solo | Month 0-6 | 1 | - |
| +Support | Month 6-12 | 1.5-2 | PT VA/CS |
| Core Team | Month 12-18 | 3-4 | FT Designer, FT Developer |
| Growth Team | Month 18-24 | 5-6 | Marketing/Growth, CS FT |
| Functional Leads | Month 24-36 | 7-10 | Dev #2, Designer #2, Content, PM |
| Scaled | Month 36-60 | 15-20 | Heads, specialists |

## Hiring Order

1. Part-time VA/CS (Month 6) — Rp 2-4jt/bln
2. Full-time Designer (Month 12-13) — Rp 6-10jt/bln
3. Full-time Developer (Month 15-18) — Rp 10-18jt/bln
4. Marketing/Growth (Month 18-20) — Rp 7-12jt/bln

## Key Rules

- Payroll never exceeds 50% of revenue
- No VP/C-level titles before 15 people
- Internal promotion preferred over external hire
- Culture rituals from Day 1 of team

---

# BAGIAN 13 — DECISION FRAMEWORK

## 7 Frameworks

### Framework 1: Build/Don't Build
4 gates: Problem Validation -> Alignment Check -> Feasibility & ROI -> Reversibility Check

### Framework 2: Prioritization (Modified ICE)
Score = (Impact x 0.35) + (Confidence x 0.25) + (Ease x 0.20) + (Strategic Alignment x 0.20)

### Framework 3: Pricing Decisions
5 tests: Value Test, Competitive Test, Segment Test, Grandfathering Test, Communication Test

### Framework 4: Kill/Keep
4 steps: Measure usage -> Understand why -> Assess cost -> Communicate

### Framework 5: Partnership & Integration
Matrix: Strategic Value (high/low) x Effort/Cost (high/low)

### Framework 6: Hiring Decision
Tree: Automate? -> Outsource? -> Revenue supports? -> Internal promotion? -> Hire external

### Framework 7: Sunday Night Test
Gut check: "Am I still confident about this decision when all noise is removed?"

## Decision Anti-Patterns to Avoid

- HiPPO (Highest Paid Person's Opinion)
- Analysis Paralysis
- Design by Committee
- Sunk Cost Continuation
- Loud Minority Bias
- Perfectionism Disguised as Quality

---

# BAGIAN 14 — NORTH STAR & METRICS

## North Star Metric

> **Monthly Active Engaged Invitations** — jumlah undangan yang mendapat >=1 RSVP per bulan

## Input Metrics (Leading)

| Metric | Target M12 |
|--------|-----------|
| Unique visitors/month | 30k |
| Register-to-First-Invitation Rate | 70% |
| Invitations with >=50 guests sent | 65% of paid |
| Free-to-Paid conversion rate | 15-20% |
| Time-to-first-preview | <10 menit |

## Output Metrics (Lagging)

| Metric | Target Y1 | Target Y3 |
|--------|----------|----------|
| Monthly Revenue | Rp 35-45jt | Rp 230-280jt |
| Paid Customers (monthly) | 200-300 | 1.000-1.500 |
| AOV | Rp 155k | Rp 195k |
| NPS | >30 | >50 |

## Unit Economics Targets

| Metric | Y1 | Y3 |
|--------|----|----|
| CAC | Rp 35k | Rp 25k |
| LTV:CAC (B2C) | 3.3x | 6.2x |
| LTV:CAC (B2B) | - | 26x |
| Gross Margin | 75% | 80% |

---

# BAGIAN 15 — WHAT WE BUILD / WHAT WE DON'T BUILD

## We Build

1. **Invitation Platform** — Core
2. **Section-Based Template Engine** — Differentiator
3. **Guest Management System** — Value chain
4. **Distribution & Broadcast Tools** — Growth engine
5. **Invitation Analytics** — Blue ocean
6. **Designer Marketplace** — Scalability (Year 2-3)
7. **Multi-Event Support** — LTV extension (Year 2)
8. **B2B / WO Dashboard** — Profit center (Year 2)
9. **AI-Assisted Creation** — Enhancement (Year 2)
10. **Payment Gateway Integration** — Operational (Year 1-2)

## We Don't Build

1. **Chat Application** — WhatsApp sudah menang
2. **Social Media Platform** — Instagram sudah menang
3. **ERP / Wedding Planning** — Different product
4. **Generic CRM** — Different business
5. **Vendor Marketplace** — Different business, strong incumbents
6. **Video Editing Tool** — Different expertise
7. **Physical Products** — Different supply chain
8. **Event Ticketing** — Different industry
9. **Generic Website Builder** — Lose vertical advantage
10. **Photo/Video Hosting** — Google Photos sudah free

## Filters

1. Apakah memperkuat core loop? (Create -> Customize -> Distribute -> Track -> RSVP)
2. Apakah IAUndang punya unfair advantage?
3. Apakah bisa dilakukan lebih baik oleh pihak lain?

---

# 5 KEPUTUSAN TERPENTING

| # | Keputusan | Bagian |
|---|-----------|--------|
| 1 | Positioning: Self-Service Platform, bukan Template Builder | 4 |
| 2 | Revenue: One-time B2C + Subscription B2B | 8 |
| 3 | NSM: Monthly Active Engaged Invitations | 14 |
| 4 | Expansion: Multi-event via customer lifecycle | 10 |
| 5 | Architecture: 14 domains, build Subscription & Notification first | 5 |

---

*"Jangan jatuh cinta pada solusi. Jatuh cintalah pada masalah."*

Yang customer pedulikan: "Apakah undangan saya jadi cantik? Apakah cepat? Apakah tamu saya bisa buka dan RSVP tanpa bingung?" Jika jawabannya ya — IAUndang berhasil.
