# PRD: Rombak UI dan Jalur Sesudah Bayar

| | |
|---|---|
| Status | Draf 2, direvisi sesudah audit kode |
| Tanggal | 15 September 2026, revisi 18 September 2026 |
| Pemilik | Fakhrian |
| Tenggat | 30 September 2026 |
| Branch acuan | `tier-unification` (commit `49c8e4b`, ditambah perubahan yang belum di-commit, lihat Lampiran D) |
| Sumber | Wawancara 15 Sep 2026, kode di branch acuan, catatan proyek yang bertanggal |
| Audit | `docs/AUDIT_PRD_ROMBAK_UI_2026-09-18.md`, 18 Sep 2026 |
| Brief kompetitif | `docs/BRIEF_KOMPETITIF_2026-09-18.md`, 18 Sep 2026 |

Label yang dipakai di dokumen ini:
- **TBD**: belum diputuskan atau belum ada datanya. Tidak boleh diisi dengan tebakan.
- **Usulan**: angka atau pilihan dari penyusun, berlaku hanya sesudah disetujui pemilik.
- **Perlu diukur ulang**: angka dari catatan lama. Query baseline ke database produksi pada 15 Sep 2026 belum bisa dijalankan dari sesi penyusun.
- **Ditetapkan 18 Sep**: keputusan yang sudah diambil Fakhrian, atau jawaban yang sudah dibuktikan di kode, pada audit 18 Sep 2026.

---

## 1. Executive Summary (Ringkasan Eksekutif)

### Problem Statement

iaundang sekarang meminta pembeli membayar sebelum mengisi undangan, tetapi halaman publiknya masih memakai pola template AI dan menjanjikan "coba dulu, bayar kalau suka", dan pembeli baru yang kembali dari halaman bayar Mayar mendarat di halaman login tanpa password. Belum ada pembeli nyata (catatan 11 Sep 2026: satu akun di database, tanpa pengguna aktif), jadi konversi belum terbukti dan produk belum siap diserahkan ke orang lain.

### Proposed Solution

Rombak empat permukaan (pemasaran, `/order` dan auth, dashboard dan Studio, email transaksi) di atas design system baru yang lolos Delivery Gate antislop, dengan copy yang hanya memuat hal yang benar di kode. Jalur sesudah bayar diganti menjadi halaman status pesanan publik ditambah tautan untuk membuat password sendiri, tanpa password tertulis di email dan tanpa masuk otomatis.

### Success Criteria

| # | KPI | Cara ukur | Baseline | Target |
|---|---|---|---|---|
| K-1 | Konversi pengunjung ke lunas | Pesanan `approved` dibagi pengunjung unik `/templates` dan `/demo/*` per 30 hari | Tidak terukur: tidak ada analitik pengunjung di kode | TBD, ditetapkan sesudah 30 hari data pertama |
| K-2 | Aktivasi sesudah lunas | Persentase pesanan `approved` yang undangannya `is_published` dan punya minimal satu baris `invitation_views` dalam 7 hari sesudah `reviewed_at` | TBD, perlu diukur ulang | TBD |
| K-3 | Pembeli tidak buntu sesudah bayar | Uji skenario di 4.1: pembeli baru yang kembali dari Mayar melihat status pesanan, dan email lunas memuat tautan buat password | 0 dari 2 syarat terpenuhi | 2 dari 2, terverifikasi di sandbox Mayar |
| K-4 | Beban admin | Jumlah tindakan manual admin per pesanan Mayar yang webhook-nya berhasil | 0 tindakan (jalur webhook), 2 tindakan per pesanan jalur approve admin (approve, teruskan password lewat WhatsApp) | 0 tindakan untuk kedua jalur (admin tidak lagi meneruskan password) |
| K-5 | Kualitas teknis | Laporan Delivery Gate antislop per permukaan, skor Lighthouse Accessibility, ukuran bundle | Gate belum pernah dijalankan; bundle lihat Lampiran B | Gate PASS di keempat blok; Lighthouse Accessibility usulan 95 atau lebih; First Load JS tiap halaman tidak naik dari baseline 18 Sep 2026 di Lampiran B; Worker gzip tetap di bawah 3.072 KiB |
| K-6 | Webhook Mayar terbukti terpicu | Satu uji kirim dari dashboard Mayar: log menunjukkan event dikenali dan pesanan berpindah ke `approved` | Belum pernah diuji. Pemeriksaan event sekarang hanya cocok untuk satu bentuk payload (audit T-1) | 1 dari 1 uji berhasil sebelum rilis MVP |

---

## 2. User Experience & Functionality (Pengalaman dan Fungsi)

### User Personas

- **Pasangan calon pengantin, pembeli baru.** Datang dari landing, galeri, atau link afiliasi. Ingin yakin undangannya bagus dengan nama mereka sendiri sebelum membayar, lalu mengisi dan menyebarkannya sebelum hari H. Perangkat yang dominan: TBD, belum ada data kunjungan.
- **Pembeli dengan akun lama.** Membeli undangan kedua memakai email akun yang sama. Ingin tetap memakai password lamanya.
- **Tamu undangan.** Membuka link dari WhatsApp, konfirmasi hadir, kirim ucapan. Tampilan mereka (renderer tema) tidak dirombak, tetapi kunjungan mereka menjadi ukuran K-2.
- **Admin (Fakhrian).** Menangani pesanan yang gagal diproses otomatis. Panel admin tidak dirombak, tetapi jumlah tindakan manualnya menjadi K-4.

### User Stories dan Acceptance Criteria

#### A. Jalur sesudah bayar

**US-1.** Sebagai pembeli baru yang baru membayar di Mayar, saya ingin langsung melihat status pesanan saya supaya tahu pembayaran diterima dan apa langkah berikutnya.

- `redirectUrl` Mayar menunjuk halaman status pesanan publik, bukan `/dashboard`. Rutenya `/order/status/[token]`. **Ditetapkan 18 Sep**: sebahasa dengan rute yang sudah ada (semuanya Inggris), duduk satu keluarga dengan `/order`, dan tidak bentrok dengan `app/(main)/order/page.tsx`.
- Halaman status dibuka lewat token yang ditandatangani server, terikat ke satu pesanan, dan punya masa berlaku (usulan 7 hari). URL tidak memuat email, nama, atau nomor pesanan yang bisa ditebak.
- Ada tiga keadaan dengan copy yang berbeda:
  - **Menunggu konfirmasi:** halaman memeriksa ulang status sendiri (usulan tiap 5 detik, paling lama 2 menit), lalu menampilkan tombol cek ulang.
  - **Lunas:** berisi instruksi membuka email untuk membuat password. Alamat email disamarkan.
  - **Token kedaluwarsa atau pesanan tidak ditemukan:** berisi langkah berikutnya dan kontak WhatsApp dari pengaturan admin.
- Halaman status tidak pernah membuat sesi login.

**US-2.** Sebagai pembeli baru, saya ingin membuat password sendiri lewat email supaya bisa masuk tanpa menunggu admin.

- Untuk akun yang BARU dibuat oleh pesanan, sistem membuat `PasswordResetToken` dengan `purpose` bernilai `purchase` dan masa berlaku 72 jam. Reset biasa tetap 1 jam dengan `purpose` `reset`. **Ditetapkan 18 Sep** (D-6, D-10).
- Kolom `purpose` ditambahkan ke `password_reset_tokens` lewat migrasi tersendiri. Urutan rilisnya mengikat: deploy `tier-unification`, cek login produksi, migrasi drop program referral, baru migrasi `purpose`.
- Email lunas memuat tombol ke `/reset-password?token=...` dan tidak memuat password tertulis.
- Halaman `/reset-password` memakai copy "Buat password" saat `purpose` token bernilai `purchase`.
- Masa berlaku yang disebut di badan email dibaca dari token, tidak ditulis mati. Hari ini `lib/notifications.ts` menulis "Tautannya berlaku 1 jam" sebagai teks tetap.
- `POST /api/auth/forgot-password` hanya menghapus token ber-`purpose` `reset` milik pengguna itu, supaya permintaan lupa password tidak membatalkan tautan pembelian yang belum sempat dibuka (audit T-4).
- Tautan yang kedaluwarsa menampilkan jalan meminta tautan baru lewat Lupa password.
- Jalur approve admin memakai mekanisme yang sama. Admin tidak lagi melihat maupun meneruskan password.
- Sesudah password dibuat, pembeli masuk dan undangan yang dibeli terlihat di dashboard.
- Kalau webhook sempat gagal sesudah akun dibuat, percobaan ulang tetap mengirim tautan buat password. Hari ini percobaan ulang menganggap akunnya lama, sehingga password tidak pernah terkirim.

**US-3.** Sebagai pemilik akun lama yang membeli undangan kedua, saya ingin tetap memakai akun dan password saya.

- Tidak ada token maupun password yang dibuat untuk akun lama. Email lunas berisi tombol masuk.
- Undangan baru muncul di dashboard tanpa reload manual. Dashboard mengambil datanya di server tiap kunjungan, jadi cukup satu muat ulang saat pembeli kembali dari halaman status, tanpa polling. **Ditetapkan 18 Sep**.

**US-4.** Sebagai pembeli, saya ingin email tentang pesanan saya menyatakan keadaan yang sebenarnya.

- Email lunas tidak memuat "undangan sudah aktif" atau "siap dibagikan" sebelum undangan dipublikasi. Tombolnya tidak menuju alamat undangan yang belum dipublikasi.
- Email pesanan dibuat memuat jalan untuk melanjutkan pembayaran (tautan ke halaman status). Hari ini isinya hanya nomor pesanan dan nominal.

**US-5.** Sebagai admin, saya ingin pesanan yang gagal diproses dikirim ulang otomatis supaya saya tidak perlu mengecek satu per satu.

- Webhook membalas status non-2xx saat provisioning melempar error.
- Pemeriksaan tipe event menerima dua bentuk payload sekaligus: `event` berupa string, maupun objek `{ received }`. Bentuk yang tidak dikenal dicatat ke log lengkap dengan daftar kunci payload, bukan dilewati diam-diam. **Ditetapkan 18 Sep** (audit T-1). Hari ini `app/api/payment/mayar/webhook/route.ts:27` hanya mengenal bentuk objek, dan bentuk lain dibalas 200 tanpa jejak apa pun.
- Pemulihan TIDAK bergantung pada pengiriman ulang dari Mayar, karena dokumentasi Mayar tidak menyebut retry sama sekali (audit T-2). Gantinya dua lapis: cron `*/15` yang sudah ada mengecek ulang pesanan `pending` yang punya `mayarTransactionId`, dan pesanan yang tetap gagal muncul di daftar khusus di panel admin. **Ditetapkan 18 Sep**.
- Uji sandbox menjadi syarat rilis MVP: satu pembayaran uji harus terbukti berpindah ke `approved` (K-6).

**US-6.** Sebagai pengguna, saya ingin tautan masuk tidak bisa dipakai melempar saya ke situs lain sesudah memasukkan password.

- `?redirect=` di halaman login hanya menerima path di situs sendiri. `https://situs-lain`, `//situs-lain`, dan `/\situs-lain` jatuh ke `/dashboard`.

#### B. Pemasaran (landing, galeri, detail template, blog, kerangka demo)

**US-7.** Sebagai calon pembeli, saya ingin melihat undangan dengan nama kami sendiri lalu memesan template yang sama tanpa memilih ulang.

- Setiap template aktif di galeri dan halaman detail punya jalan ke pratinjau demo dan ke `/order?template=<id>`.
- Setiap CTA di kerangka demo menuju `/order` dengan template yang sedang dilihat. Audit 18 Sep: ini SUDAH benar di `app/demo/[template]/DemoPreviewClient.tsx:74`, `:145`, dan `app/demo/renderer/DemoEditorClient.tsx:285`. Sisanya hanya tautan navigasi ke `/templates` di `DemoShell.tsx`, dan itu memang bukan CTA pesan.
- Paket yang dipilih di bagian harga ikut terbawa ke `/order?paket=<id>`. Nilainya divalidasi ke `priceTiers`, dan nilai asing jatuh diam ke pilihan bawaan. **Ditetapkan 18 Sep**. Hari ini `/order` hanya membaca `template` (`app/(main)/order/page.tsx:12`).

**US-8.** Sebagai calon pembeli, saya ingin harga, cara bayar, dan janji layanan yang sesuai kenyataan.

- Pencarian frasa di Lampiran A.1 terhadap `components/`, `app/`, dan `lib/` kembali kosong, kecuali komentar kode.
- Semua harga yang tampil berasal dari `startingPrice()` atau `computePrice()`. Tidak ada angka rupiah atau masa aktif yang ditulis mati. Audit 18 Sep: harga di landing SUDAH dibaca dari database (`components/landing/Pricing.tsx:167-168`); yang tersisa adalah jalur cadangan hardcoded `PRICING_CONFIG` (`Pricing.tsx:233-248`) dan daftar template cadangan (`TemplatePreview.tsx:77-92`).
- Semua jalur cadangan hardcoded dihapus: harga, daftar template, dan nomor WhatsApp. Kalau data dari database kosong, halaman menampilkan keadaan kosong yang jujur, bukan angka lama. **Ditetapkan 18 Sep** (D-9).
- Nomor WhatsApp dibaca dari pengaturan admin. `628123456789` hilang dari kode, termasuk dari rantai cadangan dan nilai bawaan pengaturan yang didaftar di Lampiran A.2.
- Tidak ada testimoni, statistik, atau klaim tanpa sumber (R-17, R-18, R-36). Klaim "dirancang oleh desainer profesional" dan "balas di hari kerja" hanya dipertahankan kalau Fakhrian mengonfirmasi benar.
- FAQ hanya berisi pertanyaan yang benar-benar ditanyakan calon pembeli (R-28). Sumbernya pertanyaan yang masuk ke WhatsApp Fakhrian. Selama belum ada pembeli, FAQ dipangkas ke pertanyaan yang jawabannya bisa dibuktikan di kode, dan tidak ditambah pertanyaan karangan. **Ditetapkan 18 Sep**.
- Janji masa tenggang dan janji penghapusan data 12 bulan DIHAPUS dari syarat dan kebijakan privasi, bukan diimplementasikan. **Ditetapkan 18 Sep** (D-8). Teksnya disamakan dengan kode: masa aktif berakhir berarti undangan tidak lagi bisa dibuka tamu.

**US-9.** Sebagai calon pembeli, saya ingin halaman yang bercerita tentang produk ini, bukan urutan halaman template.

- Urutan section diturunkan dari Design Read di `DESIGN.md`, bukan dari urutan bawaan sekarang (Lampiran A.4).
- Tidak ada pola yang dilarang R-05: "cara kerja" tiga langkah sebagai bawaan, harga tiga kolom dengan badge populer sebagai bawaan, kartu fitur identik, dan footer empat kolom tanpa variasi.
- Setiap keputusan visual besar punya alasan satu baris yang tertulis (R-31).

#### C. `/order` dan auth

**US-10.** Sebagai pembeli di `/order`, saya ingin tahu kenapa alamat undangan saya ditolak dan alamat apa yang akan saya dapat.

- Form menampilkan `reason` dari `/api/orders/check-subdomain`, tidak lagi satu pesan "sudah digunakan" untuk semua penolakan.
- Form menampilkan alamat hasil normalisasi (misalnya `raka-sinta-` menjadi `raka-sinta`) sebelum pesanan dibuat.

**US-11.** Sebagai pembeli, saya ingin tahu paket mana yang bisa dipakai template pilihan saya sebelum menekan Buat Pesanan.

- Paket yang tidak memenuhi `required_package` ditandai di langkah Paket dengan alasannya. Aturan kelayakan memakai fungsi yang sama dengan `/api/orders`.

**US-12.** Sebagai pengguna, saya ingin halaman masuk, lupa password, dan buat password yang jelas di setiap keadaan.

- Setiap halaman punya keadaan memuat, gagal, dan berhasil yang menyebut sebab dan langkah berikutnya (R-27).
- Bisa dipakai penuh dengan keyboard dan fokusnya terlihat (R-32).

**Batas area beku untuk C.** Logika harga, kupon, validasi pesanan, dan pembentukan pesanan tidak berubah. Setiap perubahan di `OrderForm.tsx` dan `/api/orders` disertai diff yang membuktikan logikanya sama, kecuali butir yang disetujui eksplisit (US-10, US-11).

#### D. Dashboard dan Studio

**US-13.** Sebagai pembeli yang baru masuk, saya ingin satu langkah jelas berikutnya: lengkapi isi, publikasikan, bagikan.

- Tata letak dashboard dibangun dari keputusan yang diambil pembeli di layar itu, bukan dari kerangka sidebar, kartu statistik, dan tabel (antislop "Default Dashboard Shell", C-3).
- Keadaan kosong, memuat, dan gagal menyebut sebab dan satu aksi.
- Tidak ada angka atau statistik yang tidak berasal dari data nyata (R-17).

**US-14.** Sebagai pembeli template apa pun, saya ingin bisa mengedit undangan saya di Studio.

- Studio memuat konfigurasi template dari database untuk setiap template aktif. Hari ini Studio hanya mengenal tiga konfigurasi lokal (Lampiran A.3).
- Masuk MVP. **Ditetapkan 18 Sep** (D-4). Tanpa ini, pembeli template selain tiga yang dikenal Studio tidak bisa mengisi undangannya sama sekali.

**US-15.** Sebagai pembeli, saya ingin foto yang saya unggah di galeri tampil di undangan.

- Studio dan renderer memakai sumber data galeri yang sama. Satu foto yang diunggah dari Studio tampil di halaman undangan publik.

**Batas area beku untuk D.** Semua yang berasal dari `components/renderer/*` tidak diubah. Pratinjau tema di dashboard dan Studio identik piksel sebelum dan sesudah rombak.

#### E. Email transaksi

**US-16.** Sebagai pembeli, saya ingin email dari iaundang terlihat berasal dari produk yang sama dan isinya bisa saya tindak lanjuti.

- Email yang benar-benar terkirim hari ini memakai identitas visual baru. Daftarnya:
  - pesanan dibuat
  - lunas (jalur webhook dan jalur admin)
  - ditolak
  - pengingat masa aktif
  - reset password
- Email yang tidak punya pemanggil ditangani satu per satu. **Ditetapkan 18 Sep** (D-7), usulan penyusun yang tinggal dikoreksi kalau Fakhrian tidak setuju:
  - `welcome`: dibuang. Akun hanya lahir dari pembelian, dan email lunas sudah menyambut.
  - `payment_received`: dibuang. Sisa alur bukti transfer manual yang tidak ada lagi sesudah checkout murni.
  - `subscription_active`: dibuang. Isinya mengulang email lunas.
  - `subscription_expired`: diberi pemanggil di cron `sync-subscriptions`, yang memang sudah menandai langganan kedaluwarsa.
- Klien email untuk uji tampilan: Gmail web dan Gmail Android. **Ditetapkan 18 Sep**.
- Copy lolos antislop copywriting: tanpa em dash, tanpa buzzword, tanpa klaim tanpa sumber.

### Non-Goals

- Renderer tema undangan dan tampilan halaman undangan tamu.
- Panel admin, kecuali satu daftar pesanan yang gagal provisioning (US-5).
- Logika harga, kupon, dan validasi pesanan di luar US-10 dan US-11.
- Masuk otomatis sesudah bayar. Ditolak karena pesanan dengan email akun lama bisa dipakai membajak akun itu.
- Jalur perpanjangan, upgrade paket, dan masa aktif yang dihitung dari tanggal acara.
- Pindah stack atau menambah dependency sisi server.
- Mode gelap. Produk memakai satu tema terang saja. **Ditetapkan 18 Sep** (D-3), dengan alasan ditulis di `DESIGN.md` sesuai R-21: tenggat 30 September, dan tiap permukaan cukup diuji kontrasnya sekali.

---

## 3. AI System Requirements (Persyaratan Sistem AI)

Produk tidak menambah fitur AI untuk pengguna. Bagian ini mengatur AI sebagai alat pembuat UI, sesuai permintaan "rombak UI dengan AI anti slop".

### Tool Requirements

- **Claude Code dengan plugin antislop:**
  - core `antislop` dan `antislop-ui`, untuk tampilan
  - `antislop-copywriting`, untuk copy halaman dan email
  - `antislop-human`, untuk kontras, keyboard, dan fokus
  - `antislop-layoutmobile`, untuk breakpoint dan target sentuh
- **`DESIGN.md` di root repo** sebagai satu-satunya sumber arah desain, ditulis atau disetujui Fakhrian (R-37). Sudah ada di repo sejak 15 Sep 2026, memuat token warna dan tipografi serta Design Read ENERGY 3 / RHYTHM 3 / MOTION 2, jadi D-1 selesai. Tanpa file ini, hasilnya berlabel "draft without direction" dengan dial ENERGY 1, RHYTHM 1, MOTION 1, dan tidak boleh dirilis. `docs/DESIGN_SYSTEM.md` (Arah A, 5 Jul 2026) menjadi bahan pembanding, bukan acuan, karena design system boleh diganti.
- **Mode antislop:** Mode 1, aturan diterapkan selama pengerjaan. **Ditetapkan** (D-2).
- **Design Read satu baris per permukaan**, dengan dial ENERGY, RHYTHM, MOTION, sebelum kode UI ditulis.
- **Verifikasi:** browser pratinjau untuk klik per elemen, `npx tsc --noEmit` (baseline 0 error), dan build OpenNext untuk mengukur bundle dan ukuran Worker.

### Evaluation Strategy

- Setiap permukaan dikirim dengan laporan Delivery Gate PASS atau FAIL per butir untuk Blok 1 sampai 4, masing-masing dengan bukti. Satu FAIL berarti permukaan itu tidak dirilis.
- Laporan klik per elemen (R-35) di lebar 375, 390, 768, 1024, dan 1440 piksel.
- Kontras diukur dengan alat, bukan ditaksir: 4,5:1 untuk teks normal dan 3:1 untuk teks besar (R-25).
- Pencarian frasa Lampiran A.1 dan karakter em dash di permukaan yang dirombak kembali kosong.
- Uji tukar nama produk (R-20) dan alasan tertulis per keputusan besar (R-31) dicatat di laporan tiap permukaan.

---

## 4. Technical Specifications (Spesifikasi Teknis)

### Architecture Overview

Alur sesudah bayar yang dituju:

1. `POST /api/orders` membuat pesanan `pending` dan link Mayar dengan `redirectUrl` ke halaman status berisi token pesanan bertanda tangan.
2. Webhook Mayar `payment.received` memanggil `provisionPaidOrder`:
   - akun, baru atau lama
   - undangan dengan `is_published` false
   - langganan
   - komisi afiliasi
   - status pesanan `approved` di langkah terakhir
3. Untuk akun baru, sistem membuat `PasswordResetToken` ber-`purpose` `purchase` dengan masa berlaku 72 jam, lalu mengirim email lunas yang berisi tombol buat password.
4. Halaman status memeriksa status lewat endpoint publik yang memverifikasi token. Endpoint itu tidak menerima email di query string.
5. `/reset-password` dalam mode buat password menyimpan password, menaikkan `sessionEpoch`, menghapus token, lalu pembeli masuk ke `/dashboard`.
6. Jalur approve admin (`PATCH /api/admin/orders/[id]`) memakai langkah 3 yang sama.
7. Cron `*/15` mengecek ulang pesanan `pending` yang punya `mayarTransactionId`. Pesanan yang tetap gagal muncul di daftar khusus di panel admin.

Alur design system:

- Token warna, tipografi, radius, dan jarak baru didefinisikan di `tailwind.config.ts` dan `globals.css` berdasarkan `DESIGN.md`.
- Primitive komponen dipakai bersama oleh pemasaran, `/order`, auth, dashboard, dan Studio, dan tinggal di `components/ui/*`. `components/marketing/*` hanya menyimpan komponen tata letak khusus halaman publik seperti `SectionContainer`. **Ditetapkan 18 Sep**.
- Email memakai nilai token yang sama dalam bentuk inline style.
- Perubahan token global tidak boleh mengubah renderer. Ini dicek dengan perbandingan pratinjau sebelum dan sesudah.

### Integration Points

- **Mayar:**
  - `payment/create` untuk `redirectUrl`
  - webhook `payment.received` dengan token `MAYAR_WEBHOOK_TOKEN`
  - pengiriman ulang pada non-2xx tidak terdokumentasi dan tidak diandalkan (audit T-2, US-5)
- **Database** (Prisma lewat Hyperdrive ke Supabase):
  - tabel `orders`, `users`, `invitations`, `subscriptions`, `invitation_views`, `guests`
  - `password_reset_tokens` sudah punya `expires_at` per token, jadi masa berlaku yang lebih panjang tidak butuh migrasi
- **Email:** Resend. Kalau `RESEND_API_KEY` kosong, email dilewati tanpa error.
- **Auth:**
  - JWT (`jose`) dengan `sessionEpoch`
  - middleware membawa query saat melempar ke login
  - login hanya menerima redirect ke path lokal
- **Analitik pengunjung:** Cloudflare Web Analytics, dipasang di MVP. **Ditetapkan 18 Sep** (D-5). Satu platform dengan hosting, tanpa cookie, tanpa dependency server baru. Kebijakan privasi ditambah satu paragraf tentang pengukuran kunjungan.

### Security & Privacy

- Tidak ada password tertulis di email mana pun.
- **Token halaman status:**
  - ditandatangani server
  - memuat id pesanan dan waktu kedaluwarsa, tanpa data pribadi
  - halamannya menyamarkan email
  - ditandatangani dengan `SESSION_SECRET` (cadangan `JWT_SECRET`) lewat `jose` yang sudah dipakai sesi, dengan klaim pembeda supaya token status tidak bisa dipakai sebagai sesi. **Ditetapkan 18 Sep**, tanpa env baru dan tanpa dependency baru
- Halaman status tidak pernah membuat sesi.
- **Token buat password:** sekali pakai, dihapus sesudah dipakai, dan pemakaiannya menaikkan `sessionEpoch`. Perilaku ini sudah ada di reset password.
- Redirect sesudah login dibatasi ke path lokal (US-6).
- Prefill dari demo ke `/order` tetap lewat `sessionStorage`, bukan query string.
- Janji masa tenggang di syarat dan kebijakan privasi diselaraskan dengan kode (US-8).

---

## 5. Risks & Roadmap (Risiko dan Peta Jalan)

### Phased Rollout

**MVP, 16 sampai 30 September 2026**

1. `DESIGN.md` disetujui dan Design Read tiap permukaan dideklarasikan. Semua langkah UI bergantung pada ini.
2. Jalur sesudah bayar: US-1 sampai US-6.
3. Email lunas dan email pesanan dibuat dengan identitas baru: sebagian dari US-4 dan US-16.
4. `/order` dan auth dengan design system baru: US-10 sampai US-12.
5. Landing, galeri, dan detail template: copy jujur (US-8) dan struktur baru (US-7, US-9).
6. Galeri tampil di undangan: US-15.
7. Studio memuat konfigurasi semua template aktif: US-14 (D-4).
8. Cloudflare Web Analytics terpasang dan kebijakan privasi diperbarui (D-5).
9. Uji sandbox Mayar: satu pembayaran uji terbukti berpindah ke `approved` (K-6).

**v1.1, Oktober 2026 (tanggal TBD)**

- Dashboard dan Studio dirombak: US-13.
- Email transaksi lainnya: sisa US-16.
- Target angka K-1 dan K-2 ditetapkan dari 30 hari data pertama Cloudflare Web Analytics.

**v2.0 (TBD)**

- Perpanjangan dan masa aktif berbasis tanggal acara.
- Panel admin.

### Technical Risks

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Tenggat 15 hari untuk design system baru dan empat permukaan, dikerjakan bertahap dengan persetujuan per fase | MVP molor atau kualitas turun | Urutan MVP di atas; dashboard dan Studio di v1.1; satu fase satu persetujuan |
| Mayar tidak mengirim ulang webhook pada non-2xx, karena dokumentasinya memang tidak menyebut retry | Pesanan lunas tetap tertahan pending | Cron rekonsiliasi `*/15` dan daftar gagal di panel admin; halaman status menampilkan kontak; admin tetap bisa approve |
| Bentuk payload `payment.received` berbeda dari yang dikenali kode | Setiap pembayaran dilewati diam-diam dengan balasan 200 | Pemeriksaan menerima dua bentuk, bentuk asing masuk log, dan uji sandbox jadi syarat rilis (K-6) |
| Migrasi kolom `purpose` bertabrakan dengan migrasi drop referral | Login produksi rusak atau migrasi gagal separuh | Urutan tetap: deploy `tier-unification`, cek login, migrasi drop referral, baru migrasi `purpose` |
| Worker gzip menembus 3.072 KiB karena font atau pustaka UI baru (terakhir 2.916 KiB, 16 Agu 2026) | Deploy gagal | Ukur dengan `wrangler deploy --dry-run` sebelum setiap rilis; tidak menambah dependency server |
| `RESEND_API_KEY` kosong di lingkungan rilis | Pembeli baru tidak menerima tautan buat password | Halaman status menampilkan jalan Lupa password; cek variabel sebelum rilis |
| Token global baru bocor ke renderer tema | Undangan tamu berubah tampilan | Perbandingan pratinjau sebelum dan sesudah pada tiga template |
| Tanpa analitik, K-1 tidak terukur | Keputusan desain tidak punya data | D-5 diputuskan di minggu pertama |
| Studio hanya memuat tiga konfigurasi | Pembeli template lain tidak bisa aktivasi, K-2 tertahan | D-4 |
| Migrasi destruktif program referral menunggu deploy `tier-unification` | Urutan deploy salah merusak login produksi | Rilis rombak UI mengikuti urutan: deploy kode, cek login, baru migrasi |

---

## Lampiran A. Temuan di kode yang menjadi dasar PRD

Semua butir di bawah sudah dicek langsung di branch acuan pada 15 Sep 2026, kecuali yang diberi label lain.

### A.1 Copy yang bertentangan dengan checkout bayar-dulu atau tidak didukung kode

| Lokasi | Isi |
|---|---|
| `components/landing/Testimonials.tsx:20-21` | "Coba Dulu, Bayar Kalau Suka", "Bayar hanya saat sudah puas" |
| `components/landing/Pricing.tsx:269` | "Lihat hasilnya dulu, bayar kalau suka" |
| `components/landing/ClosingCTA.tsx:54`, `:89` | "Bayar hanya saat sudah cocok", "Coba gratis", "Bayar saat siap" |
| `components/landing/FAQ.tsx:11` | "Bayar hanya saat kalian sudah cocok dan siap publish" |
| `components/landing/HeroSection.tsx:31` | Teks cadangan "Mulai Gratis" |
| `components/landing/HowItWorks.tsx:20` | "mulai Rp 79.000", "aktif dalam 1x24 jam" ditulis mati |
| `components/landing/FeatureShowcase.tsx:425`, `:453` | "Aktif hingga 6 bulan", "Konfirmasi bukti transfer" |
| `lib/db/landing.ts:96`, `:98`, `:107` | FAQ dan nilai bawaan "bayar hanya kalau sudah cocok", "6 bulan penuh", "Rp 149.000" |
| `lib/pricing-config.ts:44`, `:55` | "6 bulan" |
| `app/(main)/terms/page.tsx:75`, `app/(main)/privacy/page.tsx:99` | Janji masa tenggang yang tidak ada di kode |
| `app/(main)/order/OrderForm.tsx:815`, `:836`, `:838` | Instruksi kirim bukti transfer, "maks 1x24 jam kerja" |
| `components/dashboard/SubscriptionInfo.tsx:135` | "Tim kami akan mengecek bukti transfer Anda. Biasanya 1x24 jam" |
| `lib/email-templates.ts` (email lunas), `lib/notifications.ts:73-74` | "Undangan Kalian Aktif", "siap dibagikan", tombol ke undangan yang belum dipublikasi |
| `app/(main)/privacy/page.tsx:99-102` | "data undangan disimpan hingga 12 bulan setelah masa aktif berakhir, lalu dihapus secara permanen", padahal tidak ada pekerjaan penghapusan terjadwal (ditambahkan 18 Sep) |
| `components/landing/FAQ.tsx:11` | "membalas dalam 1 hari kerja" (ditambahkan 18 Sep) |
| `lib/email-templates.ts:122-129`, `lib/notifications.ts` (`payment_received`) | "Bukti transfer kalian sudah kami terima", sisa alur transfer manual (ditambahkan 18 Sep) |
| `components/landing/FeatureShowcase.tsx` | "Upload hingga 20 foto", padahal batas nyata dibaca per paket dari pengaturan (ditambahkan 18 Sep) |

### A.2 Kontak mati

Dilengkapi 18 Sep 2026: nomornya muncul di 14 tempat, bukan 4.

- Ditulis mati: `components/ui/Footer.tsx:24`, `:129`, `app/not-found.tsx:84`, `app/error.tsx:87`.
- Nilai cadangan saat pengaturan kosong: `app/(main)/page.tsx:48`, `app/(main)/privacy/page.tsx:22`, `app/(main)/terms/page.tsx:22`, `components/landing/ClosingCTA.tsx:9`, `components/landing/FAQ.tsx:22`.
- Nilai bawaan pengaturan: `lib/db/settings.ts:62`, `:64`.
- Placeholder panel admin: `components/admin/AdminPanel.tsx:412`, `components/admin/tabs/SettingsTab.tsx:539`.

Semuanya dihapus sesuai D-9, kecuali placeholder panel admin yang memang contoh format.

### A.3 Titik buntu dan kerusakan fungsi

- **Kembali dari Mayar:** `redirectUrl` Mayar menuju `/dashboard?payment=success` (`app/api/orders/route.ts`). Pembeli baru belum punya sesi, jadi dilempar ke `/login`.
- **Email lunas:** undangan dibuat dengan `is_published` false (`lib/provision-order.ts`), sementara email lunas menautkan alamat undangan itu.
- **Webhook Mayar:** membalas 200 untuk semua error. Ditambah 18 Sep: pemeriksaan tipe event di `app/api/payment/mayar/webhook/route.ts:27` (`body?.event?.received`) hanya cocok untuk payload berbentuk objek. Kalau Mayar mengirim `"event": "payment.received"` sebagai string, setiap pembayaran dilewati dengan balasan 200 tanpa jejak.
- **Halaman login:** memakai `?redirect=` tanpa validasi (open redirect).
- **Studio:** hanya memuat konfigurasi `javanese-gold`, `rose-garden`, `midnight-luxe` (`components/dashboard/TemplateModule.tsx:35-41`). Template lain menampilkan "Template config tidak ditemukan".
- **Galeri:** Studio mengunggah ke tabel `galleries` lewat `GalleryManager`, sedangkan halaman undangan untuk template baru hanya mengirim `invitation.data` ke renderer (`app/invitation/[slug]/page.tsx:109-119`). Renderer tidak membaca tabel `galleries`.
- **Pesan subdomain:** `OrderForm.tsx:659` menampilkan satu pesan "Subdomain sudah digunakan" untuk setiap penolakan, tanpa membaca `reason`.
- **Email pesanan dibuat:** hanya memuat nomor pesanan dan nominal, tanpa jalan melanjutkan pembayaran.
- **Lacak pesanan:** `GET /api/orders` mensyaratkan nomor pesanan dan email, jadi tidak cocok untuk dipanggil dari `redirectUrl`.
- **Analitik:** tidak ada analitik pengunjung di kode (dicari: gtag, Plausible, Umami, PostHog, Cloudflare Insights, Vercel Analytics, Mixpanel, Amplitude, Clarity, Meta Pixel).

Tiga butir yang semula belum dicek, sudah ditutup pada audit 18 Sep 2026:

- **CTA kerangka demo: klaimnya SALAH.** CTA pesan sudah membawa template (`app/demo/[template]/DemoPreviewClient.tsx:74`, `:145`, `app/demo/renderer/DemoEditorClient.tsx:285`). Yang menuju `/templates` hanya tautan navigasi di `DemoShell.tsx:32`, `:52`, `:55`.
- **Tombol paket membuang pilihan: BENAR.** `components/landing/Pricing.tsx:102` menuju `/templates` tanpa membawa paket, dan `/order` memang belum punya parameter paket.
- **Pesanan pending mengunci subdomain: BENAR.** `lib/db/orders.ts:91` menghitung status `pending`, `paid`, dan `approved`, dan tidak ada pekerjaan yang mengedaluwarsakan pesanan. Cron yang terdaftar hanya `sync-subscriptions` dan `publish-scheduled`.

### A.4 Struktur landing sekarang

- **Urutan section bawaan** (`lib/db/landing.ts:149-160`): hero, trust bar, template preview, fitur unggulan, cara kerja, testimoni, harga, blog, FAQ, CTA penutup. Urutan yang tersimpan di database belum dicek.
- **Section "Testimoni"** (`components/landing/Testimonials.tsx`): isinya enam kartu nilai jual berbentuk seragam dengan ikon Lucide, termasuk `Sparkles`. Data testimoni dari props diabaikan.

## Lampiran B. Baseline yang tersedia

| Metrik | Nilai | Tanggal dan sumber | Status |
|---|---|---|---|
| First Load JS `/` | 177 kB | 18 Sep 2026, `npx next build` | Terukur |
| First Load JS auth (`/login`, `/forgot-password`, `/reset-password`) | 152 kB | 18 Sep 2026, `npx next build` | Terukur |
| First Load JS `/order` | 127 kB | 18 Sep 2026, `npx next build` | Terukur |
| First Load JS `/dashboard` | 264 kB | 18 Sep 2026, `npx next build` | Terukur |
| First Load JS `/invitation/[slug]` | 264 kB | 18 Sep 2026, `npx next build` | Terukur |
| First Load JS `/demo/renderer` | 225 kB | 18 Sep 2026, `npx next build` | Terukur |
| Shared semua halaman | 103 kB | 18 Sep 2026, `npx next build` | Terukur |
| Middleware | 40,1 kB | 18 Sep 2026, `npx next build` | Terukur |
| Typecheck | 0 error | 18 Sep 2026, `npx tsc --noEmit` | Terukur |
| Worker gzip | 2.916 KiB dari batas 3.072 KiB | 16 Agu 2026 | Perlu diukur ulang, butuh `npm run cf:build` |
| Akun di database | 1 | 11 Sep 2026 | Perlu diukur ulang, butuh akses produksi |
| Pesanan yang lewat Mayar | 0 | 19 Jul 2026, `BUGS.md` | Perlu diukur ulang, butuh akses produksi |
| Template aktif | 3 | 19 Jul 2026 | Perlu diukur ulang, butuh akses produksi |

## Lampiran C. Keputusan

Semua keputusan di bawah sudah tertutup pada 18 September 2026.

| ID | Keputusan | Hasil |
|---|---|---|
| D-1 | Siapa yang menulis arah desain di `DESIGN.md` | Selesai. Fakhrian menjawab pertanyaan arah, penyusun memformat. `DESIGN.md` ada di root sejak 15 Sep 2026 |
| D-2 | Mode antislop | Mode 1, aturan diterapkan selama pengerjaan |
| D-3 | Tema | Terang saja, alasannya ditulis di `DESIGN.md` sesuai R-21 |
| D-4 | US-14 (Studio memuat semua template) | MVP |
| D-5 | Analitik pengunjung | Cloudflare Web Analytics, dipasang di MVP |
| D-6 | Masa berlaku token status dan token buat password | 7 hari dan 72 jam, sesuai usulan |
| D-7 | Email tanpa pemanggil | `welcome`, `payment_received`, dan `subscription_active` dibuang; `subscription_expired` diberi pemanggil di cron `sync-subscriptions` |
| D-8 | Janji masa tenggang di syarat dan privasi | Dihapus dari teks, termasuk janji penghapusan data 12 bulan |
| D-9 | Jalur cadangan hardcoded (harga, daftar template, nomor WhatsApp) | Dihapus semua. Data kosong ditampilkan sebagai keadaan kosong yang jujur |
| D-10 | Cara membedakan token pembelian dari token reset | Kolom `purpose` di `password_reset_tokens`, lewat migrasi yang mengantre sesudah migrasi drop referral |
| D-11 | Masa aktif undangan terhadap norma pasar "selamanya" | Semua paket dinaikkan menjadi 1 tahun lewat `validity_days` di pengaturan paket, bukan mesin baru. Dasar: `docs/BRIEF_KOMPETITIF_2026-09-18.md` |
| D-12 | Watermark undangan | Permanen di semua paket sampai 200 undangan terbit. Penghapusannya dibuka lagi sebagai fitur berbayar sesudah itu. Alasan: watermark adalah satu-satunya saluran distribusi berbiaya nol, dan sekarang justru dijual ke pelanggan yang undangannya paling banyak dibagikan |
| D-13 | Menguji asumsi bayar-dulu | Diuji ke 10 pasangan nyata, paralel dengan rombak halaman. Rombak tetap jalan karena copy bohong dan testimoni karangan harus mati apa pun hasil ujinya |
| D-14 | Titik mulai rombak UI | Token design system lebih dulu, baru halaman. Audit 18 Sep: warna dan radius di `tailwind.config.ts` SUDAH sama persis dengan `DESIGN.md`, jadi sisa pekerjaan tokennya hanya tipografi |

## Lampiran D. Perubahan yang sudah dikerjakan tapi belum di-commit

Dikerjakan 15 Sep 2026, sebelum PRD ini ditulis. Fase ini terhenti di tengah. Audit 18 Sep: `npx tsc --noEmit` di working tree lengkap selesai tanpa error, jadi catatan "belum lolos `tsc`" dicabut.

- `middleware.ts`: query ikut dibawa saat melempar ke `/login` (bagian dari US-1).
- `app/api/payment/mayar/webhook/route.ts`: error provisioning dibalas 500, bukan 200 (US-5).
- `app/(auth)/login/page.tsx`: `safeRedirect()` membatasi redirect ke path lokal (US-6). Variabel `fromPayment` sudah ditambahkan tapi belum dipakai di tampilan.

Keputusan US-2 (tautan buat password, bukan password tertulis) menggantikan rencana awal fase itu, yang masih mengirim password lewat email.
