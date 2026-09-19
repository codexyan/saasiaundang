# Rencana Kerja: dari sekarang sampai rilis

| | |
|---|---|
| Disusun | 19 September 2026 |
| Cabang | `tier-unification`, belum ada yang dideploy |
| Dasar | `SPEC_KANVAS_2026-09.md` (apa dan kenapa), dokumen ini (urutan dan status) |

Dokumen ini menjawab satu pertanyaan saja: **sesudah ini, kerjakan apa.**

---

## 1. Posisi sekarang

Sepuluh commit berdiri di `tier-unification`, semuanya sudah di-push, tidak ada yang dideploy.

| Commit | Isi | Terbukti lewat |
|---|---|---|
| `23b7555` | Area sentuh 44px dan nama untuk pembaca layar di modul template | 0 kontrol di bawah 44px, 0 tanpa nama, di 5 tab |
| `4616b18` | Pratinjau editor muat di layar HP, bingkai ponsel jadi khusus desktop | Potret di 390px, konsol bersih |
| `874ccfc` | Kanvas dekorasi tidak lagi tertutup lapisan opening | `elementFromPoint` mengembalikan kanvas, bukan sampul |
| `dd195f0` | 18 ornamen bawaan, 6 paket siap pakai, plus perbaikan dekorasi yang lenyap | 5 ornamen dirender mesin render sungguhan |
| `1cc84c3` | Pratinjau mengikuti seksi yang dibuka di tab Konten | Posisi gulir 0, 2947, 5265, 10776 |
| `f976c72` | Studio dan editor punya alamat di URL | Tombol kembali dan tautan langsung terukur |
| `0e5ac5c` | Musik dicabut dari Starter, warna dan huruf dibuka untuk semua, halaman harga jadi selisih | Daftar fitur terbaca ulang di halaman |
| `f41d310` | Gaya opening dipilih sambil melihat gerakannya | 17 kartu, panggung 168x292 berisi opening sungguhan |
| `89262fb` | Kanvas pelanggan lewat titik tempel, batas dekorasi jadi per undangan | Ornamen mendarat di 15%,12% dan 85%,12% |
| `4258e99` | Simpan yang gagal tidak lagi dilaporkan berhasil | PATCH gagal jadi 500, bukan 200 dengan isi kosong |

Diuji sebagai pembeli sungguhan pada baris uji `uji_inv_kanvas`:

```
Huruf     Cinzel + Cormorant  ->  Sacramento + Work Sans, tersimpan di database
Warna     rgb(122,31,61)      ->  rgb(18,63,140), bertahan sesudah muat ulang
Hiasan    2 ornamen di titik 15%,12% dan 85%,12%, batas berhenti di 3
Tamu      undangan terbit, 2 ornamen ikut dirender mesin render
Konsol    bersih di seluruh layar studio
```

---

## 2. Tiga keputusan yang menunggu, dan apa yang tergantung padanya

| # | Keputusan | Kalau belum diputuskan | Menghambat |
|---|---|---|---|
| K-1 | Warna pembeli untuk latar seksi: tambah tombol "terapkan ke semua bagian", atau jujur di UI bahwa yang berubah hanya sampul dan aksen | Pembeli mengganti warna, sampulnya biru, badan undangannya tetap hijau | Fase 1 |
| K-2 | Musik: isi perpustakaan dengan lagu berlisensi jelas, atau biarkan kosong dan jelaskan di UI | Tab Musik menawarkan perpustakaan kosong tanpa penjelasan | Fase 3 |
| K-3 | Kapan deploy | Sepuluh commit menumpuk tanpa pernah diuji di produksi | Fase 5 |

Alasan K-1 ada: tema Javanese Gold menyimpan `meta.color_scheme` merah tua sementara latar seksinya hijau, dua nilai yang tidak berhubungan sama sekali. Pemetaan warna yang sudah dipasang hanya bekerja untuk tema yang konsisten dengan dirinya sendiri.

---

## 3. Urutan kerja

Tiap fase berdiri sendiri, bisa dihentikan di ujungnya tanpa meninggalkan pekerjaan setengah jadi.

### Fase 0. Bereskan sisa hari ini

Kecil, dan harus habis sebelum apa pun naik ke produksi.

- [ ] Hapus baris uji: `node scripts/uji-studio.mjs hapus`
- [ ] Hapus rute `/dev-preview/template` beserta komponen kliennya
- [ ] Telusuri satu peringatan hidrasi di halaman tamu yang tidak muncul di `/demo/renderer`
- [ ] Jalankan `node scripts/ui-check/audit.mjs` untuk halaman publik

**Selesai kalau:** tidak ada rute sementara, tidak ada baris uji, konsol halaman tamu bersih.

### Fase 1. Tutup lubang di janji "warna dan huruf untuk semua" (butuh K-1)

- [ ] Sesuai K-1: tombol terapkan ke semua bagian, atau perbaiki teks di layar Tema Warna
- [ ] Contoh warna di layar itu memakai warna yang benar benar dipakai seksi, bukan hanya warna meta

**Selesai kalau:** pembeli mengganti satu warna dan yang mereka lihat berubah sesuai yang dijanjikan layar itu.

### Fase 2. Pakai ulang dekorasi dan rapikan tab Konten

Ini yang paling menghemat waktumu sendiri sebagai perancang tema.

- [ ] Salin dekorasi antar seksi, dan terapkan ke semua seksi sekaligus
- [ ] Pustaka media per tema, supaya satu berkas tidak diunggah berulang
- [ ] Tab Konten: seksi yang sering disentuh naik ke atas, sisanya dikelompokkan

**Selesai kalau:** memasang satu ornamen ke enam belas seksi cukup sekali kerja.

### Fase 3. Musik (butuh K-2)

- [ ] Isi perpustakaan, atau ubah layar Musik supaya jujur tentang apa yang tersedia
- [ ] Catat lisensi tiap lagu di repo, satu baris per lagu
- [ ] Pratinjau gaya pemutar bisa dicoba bunyinya

**Selesai kalau:** tidak ada paket yang menjanjikan sesuatu yang tidak bisa dipakai.

### Fase 4. Kartu berbagi

Dasarnya dari bukti pasar: penyebaran terjadi lewat status WhatsApp dan rekomendasi orang, bukan lewat pencarian.

- [ ] Satu gambar 1080x1920 dibuat dari data undangan, siap dibagikan
- [ ] Tombolnya ada di studio dan di dashboard

**Selesai kalau:** pembeli bisa menyebarkan undangannya tanpa membuka aplikasi lain.

### Fase 5. Rilis (butuh K-3)

Urutannya mengikat, lihat `RUNBOOK_DEPLOY_2026-09.md`.

```
1. Cek ukuran Worker gzip, batas 3.072 KiB, terakhir tercatat 2.916 KiB
2. Deploy kode
3. Cek login produksi, buat satu undangan, terbitkan, buka sebagai tamu
4. Baru jalankan migrasi drop referral
5. Cek ulang pesanan dan dashboard
```

**Selesai kalau:** satu undangan bisa dibuat, dibayar, disunting, dan dibuka tamu di `iaundang.online`.

### Fase 6. Uji webhook Mayar

Syarat rilis MVP yang belum pernah lolos sekali pun. Ditunda atas permintaanmu, dan masih menunggu.

- [ ] Arahkan webhook ke penangkap permintaan, lakukan satu pembayaran uji
- [ ] Cocokkan bentuk `event` dengan yang dibaca kode
- [ ] Pastikan pesanan lunas benar benar melahirkan akun dan undangan

**Selesai kalau:** satu pembayaran sungguhan melahirkan undangan tanpa tangan manusia.

### Fase 7. Isi, bukan lagi mesin

Sesudah mesinnya berdiri, yang menentukan penjualan adalah jumlah dan rupa tema.

- [ ] Tema keempat dan seterusnya
- [ ] Varian tanpa foto, dan varian syar'i, keduanya permintaan nyata yang terbaca di Threads
- [ ] Isi panel admin yang masih bawaan: nomor WhatsApp `628123456789`, em dash di deskripsi tema

**Selesai kalau:** galeri punya cukup pilihan untuk tidak kalah di pandangan pertama.

---

## 4. Yang sengaja TIDAK dikerjakan

Dicatat supaya tidak diam diam masuk lagi.

| Tidak dikerjakan | Alasan |
|---|---|
| Three.js di jalur tamu | 150 sampai 250 kB gzip untuk halaman yang dibuka sekali lewat WhatsApp, sementara anggaran Worker tinggal sekitar 156 KiB |
| Kanvas seret bebas untuk pembeli | Keputusanmu 19 Sep: titik tempel. Kebebasan penuh menghasilkan undangan jelek lalu tiket dukungan |
| Editor keyframe untuk pembeli | Sudah terlalu berat untuk tab Dekorasi admin sendiri |
| Mengejar jumlah tema pesaing | 120 tema medioker menghabiskan waktu yang sama dengan 3 tema bagus, dan bukan itu yang dicari pembeli |
| Langganan | Pernikahan peristiwa sekali. Pasar sudah terbiasa sekali bayar |

---

## 5. Urutan yang disarankan, sekali baca

```
sekarang    Fase 0   bereskan sisa                      setengah hari
lalu        K-1      putuskan warna latar seksi         lima menit
            Fase 1   tutup lubang janji warna            setengah hari
lalu        Fase 2   pakai ulang dekorasi                satu hari
lalu        K-2      putuskan musik                      butuh riset lisensi
            Fase 3   musik                               tergantung K-2
lalu        K-3      putuskan kapan deploy
            Fase 5   rilis                               setengah hari
            Fase 6   webhook Mayar                       setengah hari
sesudah     Fase 4   kartu berbagi
            Fase 7   tema baru dan varian
```

Fase 5 boleh dimajukan kapan saja sesudah Fase 0 selesai. Semakin lama sepuluh commit menumpuk tanpa menyentuh produksi, semakin besar kemungkinan yang patah tidak ketahuan sampai ada pembeli sungguhan.
