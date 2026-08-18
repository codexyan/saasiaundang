# Rombak modul Studio Desain, Manajemen & Musik

Tanggal: 18 Agustus 2026
Cakupan: modul admin `lab` (Studio Desain), `template` (Manajemen), `music` (Musik),
beserta lapisan API dan database yang menopangnya.

---

## Keputusan arsitektur

**Tiga modul menjadi dua, plus pemindahan urusan komersial.**

"Studio Desain" dan "Manajemen" mengelola OBJEK YANG SAMA — baris di tabel
`template_records`. Pemisahannya artifisial, dan justru pemisahan itulah sumber
sebagian besar cacat di bawah: daftar template digambar dua kali dengan kartu
berbeda, kategori punya dua jalur simpan yang saling menimpa, dan satu pekerjaan
("bikin tema lalu beri harga") memaksa admin berpindah modul di tengah jalan —
kehilangan seluruh state editor.

| Sebelum | Sesudah |
|---------|---------|
| Template › Studio Desain | **Template › Template** (koleksi + editor + kategori) |
| Template › Manajemen (Tema, Kategori, Paket Harga, Promosi) | ↑ digabung; Paket Harga + Promosi pindah |
| Template › Musik | **Template › Musik** (satu layar, dulu 3 sub-tab) |
| — | **Transaksi › Paket & Promo** |

Musik tetap berdiri sendiri: ia pustaka aset terpisah yang dipakai template
*dan* pengguna akhir. Paket Harga & Promosi pindah ke grup Transaksi karena
keduanya menggerakkan pesanan, bukan desain — menaruhnya di grup Template
membuat admin mengira harga tema diatur di sana, padahal tidak berpengaruh
(lihat cacat #8).

Tautan lama `?tab=lab` dipetakan otomatis ke `?tab=template`.

---

## Cacat yang diperbaiki

### Kehilangan data

**1. "Simpan Draf & Pergi" tidak menyimpan apa pun saat mode edit.**
`TemplateLab.tsx:163` — `onSaveDraftRef` memuat `if (isEditMode) return`. Saat
admin mengedit template yang sudah terbit lalu menekan tombol itu, fungsinya
langsung keluar, `labDirty` di-reset, lalu muncul toast **"Draf tersimpan"**.
Seluruh hasil edit hilang dengan pesan sukses palsu.
→ Seluruh mekanismenya dibuang. Editor kini autosave ke database.

**2. Draf hidup di `localStorage`, bukan database.**
Kunci `iaundang-labs`. Hilang saat ganti perangkat/browser/incognito, tidak
terlihat admin lain, dan `setItem` tanpa penanganan `QuotaExceededError`.
→ Setiap template punya baris DB sejak dibuat; draf disimpan di kolom
`draft_config`.

**3. State editor hilang tiap pindah tab admin.**
`AdminPanel` me-*unmount* editor lewat render bersyarat.
→ Autosave (1,2 detik) membuatnya tidak lagi merugikan.

### Dua sumber kebenaran

**4. Kategori dikelola lewat dua jalur yang saling menimpa.**
Studio memakai REST `/api/admin/categories`; Manajemen menimpa **seluruh blob
settings** lewat `PATCH /api/admin/settings` (`AdminPanel.tsx:422`). Tambah
kategori di Studio lalu simpan apa pun di Manajemen → kategori baru terhapus.
Konvensi slug-nya pun beda (`-` vs `_`), jadi kategori sama bisa lahir dua kali.
→ Satu jalur (REST), satu konvensi slug. `PATCH /api/admin/settings` kini
**merge**, bukan menimpa satu baris utuh, dan seluruh pemanggil hanya mengirim
kunci yang benar-benar berubah.

**5. Guard hapus kategori tidak konsisten.**
Manajemen menolak menghapus kategori yang masih dipakai; Studio membolehkan.
→ Aturannya satu, ditegakkan di server.

**6. Dua sistem template hidup berdampingan.**
`settings.templates` (legacy) + `template_records` (aktif), lengkap dengan CRUD
`/api/admin/templates` yang tak terpakai.
→ Yang legacy dihapus.

### Fitur yang tampil tapi tidak berfungsi

**7. `required_package` tidak pernah dicek di mana pun.**
Pembeli paket Starter bisa memesan tema bertanda Eksklusif. Template berstatus
draft/arsip pun bisa dipesan lewat tautan lama.
→ Ditegakkan di `POST /api/orders`: template harus ada, `status === 'active'`,
dan peringkat paket pembeli ≥ peringkat yang disyaratkan tema.

**8. Harga template hanya hiasan.**
`app/api/orders/route.ts` menagih `tier.price`, bukan harga template.
→ `price > 0` kini berarti harga khusus template dan benar-benar ditagih;
`price === 0` berarti ikut harga paket.

**9. Tier dijoin ke template lewat NILAI HARGA.**
`findTier(price)` — dua paket bertarif sama saling mengklaim template yang sama,
dan mengubah harga sebuah paket melepaskan seluruh template "miliknya".
→ Relasinya lewat `required_package` (id paket).

**10. `TemplateRecord.usage_count` selalu 0.**
Tidak pernah dinaikkan siapa pun, dan tidak pernah ditampilkan.
→ Dihitung dari tabel undangan (`templateRecords.usageCounts()`) dan
ditampilkan di kartu koleksi, panel pengaturan, serta dipakai sebagai
pengurutan "paling banyak dipakai".

**11. Deskripsi template tidak punya kolom.**
Diminta di Studio dengan keterangan "untuk ditampilkan ke user", lalu hanya
menumpang di localStorage.
→ Kolom `description`; tampil di galeri publik.

**12. `meta.name` / `meta.slug` / `meta.thumbnail` / `meta.preview_images`.**
Ditulis saat rilis, tidak pernah dibaca siapa pun, dan basi begitu template
diganti nama.
→ Dihapus dari tipe dan dari tiga template bawaan. Identitas hanya ada di
`TemplateRecord`.

**13. "Preview Masuk" dan "Full Flow" melakukan hal yang persis sama.**
Keduanya memanggil `setCoverPreviewMode` dengan nilai berbeda lalu menjalankan
kode identik — nilainya tidak pernah dibaca. Begitu pula tombol preview animasi
keluar.
→ "Ulangi Animasi" memutar ulang animasi masuk; "Alur Lengkap" menjalankan
opening → loading → isi undangan; preview keluar menyalakan alur interaktif
(satu-satunya tempat animasi keluar benar-benar berjalan).

### Modul Musik

**14. `usage_count` musik permanen 0 — seluruh tab Statistik kosong.**
Ada dua jalur penghitung dan keduanya mati: `POST /api/music/[id]/usage` hanya
dipanggil `MusicManager.tsx` yang tidak diimpor di mana pun, sementara
`PATCH /api/invitations/[id]` membaca `body.data.music.url` — bentuk bersarang
yang tidak pernah dikirim siapa pun (studio menulis `music_url` datar).
→ Dihitung dari tabel undangan lewat agregasi `data->>'music_url'`.

**15. Durasi lagu selalu "0:00".** Tidak pernah diambil saat unggah.
→ Dibaca di browser dari metadata berkas sebelum diunggah.

**16. Hapus kategori meninggalkan trek yatim** — memegang nama kategori yang
sudah tidak ada, hilang dari semua chip filter.
→ Trek dipindahkan ke "Lainnya" dalam satu transaksi; jumlahnya diberitahukan.
Ganti nama kategori juga ikut memindahkan trek.

**17. `sort_order` ada di DB tanpa cara mengisinya.**
→ Susun ulang lewat seret (`PATCH /api/admin/music`).

**18. `confirm()` bawaan browser** untuk hapus lagu/kategori/paket.
→ `ConfirmDialog` bersama, yang bisa menjelaskan konsekuensinya.

**19. Tambah-via-URL menerima string apa pun** — termasuk `javascript:`, yang
dipakai langsung sebagai `src` pemutar audio di halaman publik.
→ Protokol dibatasi http/https atau path absolut domain sendiri.

### Navigasi

**20. Studio Desain membuka template terakhir, bukan halaman koleksi.**
`labEditRecord` tidak pernah dibersihkan saat pindah tab.
→ Alur koleksi ⇄ editor dikelola satu shell; tidak ada state gantung.

**21. Daftar template digambar dua kali** dengan kode kartu hampir identik.
→ Satu `TemplateCard` + `TemplateThumb`.

**22. Template baru selalu terbit dengan harga 0 / paket `all`**, dan admin
wajib pindah modul untuk menetapkannya.
→ Panel Pengaturan ada di dalam modul yang sama, bisa dibuka dari editor.

---

## Draft vs versi terbit

Konsep baru, dan alasan terbesar rombakan ini aman:

- `template_records.config` — yang dirender untuk pengunjung undangan.
- `template_records.draft_config` — salinan kerja editor. `null` bila tidak ada
  perubahan tertunda.

| Aksi | Endpoint | Efek |
|------|----------|------|
| Autosave (1,2 dtk) | `PUT /api/admin/template-records/[id]/draft` | tulis `draft_config` |
| Terbitkan | `POST .../publish` | `draft_config` → `config`, draf dikosongkan |
| Buang draf | `DELETE .../draft` | kembali ke versi terbit |
| Duplikat | `POST .../duplicate` | salinan dari versi terbit, lahir sebagai draft |

Sebelum ini, setiap simpan dari editor langsung mengubah tampilan undangan
pelanggan yang **sudah terbit**, di tengah admin masih bereksperimen.

---

## Peta berkas

```
components/admin/
  ui/                          Drawer, ConfirmDialog, StatusBadge (dipakai lintas tab)
  tabs/template/
    TemplateModule.tsx         shell: koleksi ⇄ editor + seluruh mutasi
    TemplateCollection.tsx     grid, filter, pencarian, ringkasan
    TemplateCard.tsx           kartu + menu aksi
    TemplateThumb.tsx          miniatur sampul (satu-satunya)
    TemplateSettingsDrawer.tsx nama/slug/deskripsi/kategori/paket/harga/status
    CategoryManager.tsx        kategori (REST)
    NewTemplateDialog.tsx      buat baru + pilih desain awal
    editor/TemplateEditor.tsx  kerangka: state, autosave, bingkai UI
    editor/EditorContext.tsx   state + updater bersama untuk semua panel
    editor/panels/*            isi tiap tab + kolom pratinjau
    editor/parts/*             konstanta & subkomponen stateless
  tabs/music/
    MusicModule.tsx            satu layar kerja
    TrackRow.tsx               baris lagu (inline edit, seret, toggle aktif)
    MusicCategoryDrawer.tsx    kategori musik
    audio-meta.ts              baca durasi di browser + format
  tabs/pricing/PricingTab.tsx  paket harga & promosi

lib/schemas/template-record.ts validasi metadata/config/publikasi
lib/schemas/music.ts           validasi trek & kategori (termasuk protokol URL)
```

Dihapus: `tabs/TemplateLab.tsx`, `tabs/TemplatesTab.tsx`, `tabs/MusicLibraryTab.tsx`,
`dashboard/MusicManager.tsx`, `api/admin/templates/**`, `api/galleries/music`,
`api/music/[id]/usage`, `AdminTemplateConfig` + `settings.templates`.

---

## Pemecahan editor per tab

Dikerjakan setelah rombakan modul, sebagai lanjutan langsung.

`TemplateLab.tsx` yang 4.448 baris kini terpecah jadi kerangka + panel:

| Berkas | Baris | Isi |
|--------|-------|-----|
| `TemplateEditor.tsx` | 811 | State, autosave/terbit, header, tab bar, footer, modal |
| `EditorContext.tsx` | 150 | Kontrak state + updater yang dipakai panel |
| `panels/AppearancePanel.tsx` | 876 | Warna, palet, tipografi, gaya komponen, cek kontras |
| `panels/OpeningPanel.tsx` | 870 | Halaman sampul + layar loading |
| `panels/ContentPanel.tsx` | 734 | Daftar seksi: urutan, varian, latar, transisi, field |
| `panels/MusicPanel.tsx` | 343 | Pilih lagu + tampilan pemutar |
| `panels/EditorPreview.tsx` | 331 | Mockup ponsel, undo/redo, layar penuh |
| `panels/DecorPanel.tsx` | 215 | Aset dekorasi, lapisan, animasi |

**Kenapa context, bukan props.** Tiap panel menyentuh 10–25 binding dari
lingkup induk. Lima daftar prop panjang yang harus diperbarui serempak setiap
kali satu panel butuh satu binding baru adalah persis gesekan yang dulu membuat
orang memilih menambah kode ke dalam berkas raksasa itu. Hanya satu panel
ter-mount pada satu waktu, jadi context yang dibuat ulang tiap render tidak
menyebarkan render ke mana pun.

**Bukti tidak ada perubahan perilaku.** Isi keenam berkas dibandingkan token
per token dengan blok aslinya setelah normalisasi whitespace — seluruhnya
identik (122 KB), kecuali tiga suntingan yang memang disengaja:

| Perubahan | Alasan |
|-----------|--------|
| `alert()` → `toast.error()` di unggah dekorasi | memblokir seluruh tab dan tidak sewarna notifikasi lain |
| `tabContentRef` → helper `withPreservedScroll()` | ref kontainer scroll milik kerangka; panel tidak perlu memegangnya |
| variabel mati `showCustom` dihapus | dihitung tapi tidak pernah dibaca |

---

## Migrasi database

`prisma/migrations/20260818000000_template_module_overhaul/` — aditif seluruhnya
(`ADD COLUMN IF NOT EXISTS`), jadi kode versi lama tetap jalan setelah migrasi
diterapkan:

```sql
ALTER TABLE template_records ADD COLUMN IF NOT EXISTS description  TEXT NOT NULL DEFAULT '';
ALTER TABLE template_records ADD COLUMN IF NOT EXISTS draft_config JSONB;
ALTER TABLE template_records ADD COLUMN IF NOT EXISTS updated_at   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
CREATE INDEX IF NOT EXISTS template_records_status_idx ON template_records (status);
```

Urutan penerapan: **migrasi dulu, deploy kode sesudahnya.**
Kolom `usage_count` sengaja ditinggalkan apa adanya — tidak lagi dibaca, tapi
menghapusnya tidak perlu dan hanya menambah risiko.

## Verifikasi

Statis:

- `tsc --noEmit` bersih
- `next lint` bersih
- `next build` sukses

Migrasi diterapkan ke Supabase produksi 18 Agu 2026 (`prisma migrate deploy`),
lalu seluruh alur diuji langsung terhadap database sungguhan lewat sesi admin.
Data uji dibuat dan **dihapus kembali** setelah verifikasi; isi database sama
seperti sebelum pengujian (3 template bawaan, 0 trek, 6 kategori musik).

| # | Yang diuji | Hasil |
|---|------------|-------|
| 1 | `GET /template-records` membawa `usage_count` nyata | Javanese Gold = 1 (dihitung dari tabel undangan) |
| 2 | Buat template | lahir `status=draft`, `sort_order` di akhir, slug otomatis |
| 3 | Autosave draf | `draft_config.accent = #123456`, `config.accent` tetap `#ffd700` — pengunjung tidak terpengaruh |
| 4 | Terbitkan | draf naik jadi `config`, `draft_config` dikosongkan |
| 5 | PATCH metadata sah | harga/paket/kategori/urutan tersimpan |
| 6 | Slug tidak sah | ditolak 400 |
| 7 | Field liar (`usage_count`, `created_at`) | diabaikan, tidak tertulis |
| 8 | Slug bentrok | ditolak 409 |
| 9 | Duplikat | salinan lahir sebagai draft dari versi terbit |
| 10 | Terbit tanpa seksi aktif | ditolak 400 |
| 11 | Buang draf | kembali ke versi terbit (16 seksi aktif) |
| 12 | Hapus template bawaan | ditolak 403 |
| 13 | Hapus kategori terpakai | ditolak 409, menyebut nama templatenya |
| 14 | Pesan tema Popular dengan paket Starter | **ditolak** — sebelumnya lolos |
| 15 | Pesan template berstatus draft | **ditolak** — sebelumnya lolos |
| 16 | URL lagu `javascript:` | ditolak 400 |
| 17 | Durasi di luar akal (999999) | ditolak 400 |
| 18 | Tambah lagu dengan durasi | durasi tersimpan (222 dtk), `sort_order` berurutan |
| 19 | URL lagu duplikat | ditolak 409 |
| 20 | Susun ulang lagu | urutan tersimpan dan terbaca kembali |
| 21 | Ganti nama kategori musik | trek ikut berpindah ke nama baru |
| 22 | Hapus kategori musik | trek pindah ke "Lainnya", jumlahnya dilaporkan |
| 23 | Hapus kategori "Lainnya" | ditolak 403 |
| 24 | Sidebar admin | Template · Musik / Pembayaran · Pesanan · Paket & Promo; label lama hilang |
| 25 | Galeri publik `/templates` | 200, deskripsi template tampil |

Belum diuji lewat klik langsung di browser (butuh sesi manual): seret-susun
dekorasi, unggah berkas audio nyata (jalur `readAudioDuration`), dan pratinjau
alur lengkap di editor.
