# Spesifikasi: Dua Kanvas, Satu Mesin

| | |
|---|---|
| Disusun | 19 September 2026 |
| Cakupan | Editor template admin (kanvas kami) dan studio pelanggan (kanvas mereka): tab Dekorasi, tab Konten, gaya Opening, transisi dan animasi |
| Status | Draf 1, menunggu keputusan pemilik produk |
| Bahan | Pembacaan kode, pengukuran browser lewat Chrome DevTools Protocol, dan kueri baca saja ke database produksi 19 Sep 2026 |

**Design Read.** Membaca ini sebagai: alat kerja internal (editor admin) plus alat pakai sekali seumur hidup (studio pelanggan), untuk dua pemakai yang sangat berbeda, dengan bahasa visual yang sudah ada di `DESIGN.md`. Dial untuk permukaan admin: ENERGY 1 / RHYTHM 1 / MOTION 1, karena panel kerja yang bergerak sendiri mengganggu pekerjaan. Dial untuk studio pelanggan dan undangan: ENERGY 2 / RHYTHM 2 / MOTION 2, karena di sana suasana adalah produknya. Dial ini dipegang dari bagian pertama sampai terakhir.

---

## 1. Bukti, bukan dugaan

Kueri baca saja ke database produksi, 19 September 2026:

```
pengguna              1        (akun admin sendiri)
undangan              0
undangan terbit       0
undangan dibayar      0
pesanan               2        (0 lunas)
tema                  3        (semuanya aktif)
tamu, ucapan, view    0, 0, 0
foto galeri, lagu     0, 0
```

Isi tema:

```
Javanese Gold   gaya opening gate-open      16 seksi, 16 aktif   dekorasi: 1 di opening, 0 di seksi
Midnight Luxe   gaya opening curtain        16 seksi, 16 aktif   dekorasi: 0
Rose Garden     gaya opening flower-bloom   16 seksi, 16 aktif   dekorasi: 0
```

Pemakaian fitur oleh pelanggan: nol di semua kolom, karena belum ada satu pun undangan.

**Konsekuensi untuk spesifikasi ini.** Tidak ada satu pun angka pemakaian yang bisa dipakai untuk memutuskan apa pun. Setiap kalimat "pengguna sering mengeluh X" di dokumen ini akan menjadi karangan. Jadi dokumen ini tidak memakainya. Yang dipakai sebagai dasar hanya tiga hal: cacat yang bisa diukur di kode dan browser, perbandingan dengan pesaing yang sudah ditulis di `BRIEF_KOMPETITIF_2026-09-18.md`, dan keputusan pemilik produk.

Artinya sasaran produk bukan "menaikkan metrik yang ada", melainkan **membuat dua puluh pelanggan pertama berhasil sampai undangannya terbit tanpa dibantu manusia**.

---

## 2. Konsep yang sedang dibangun

Kalimat pemilik produk: editor template ini kanvas dari kami, dan pelanggan nanti masih bisa mengeditnya juga di kanvas mereka.

Itu berarti dua permukaan di atas satu mesin render:

| | Kanvas kami (admin) | Kanvas mereka (pelanggan) |
|---|---|---|
| Objek yang diedit | `template_records.config` | `invitations.data` |
| Sifat | Cetakan, dipakai berkali kali | Satu undangan, sekali pakai |
| Kebebasan | Penuh: seksi, urutan, warna, dekorasi, animasi | Terbatas, dan batasnya dijual sebagai paket |
| Hasil | Tema di galeri | Undangan yang dibagikan ke tamu |
| Mesin render | `components/renderer/*` | `components/renderer/*` yang sama |

Yang sudah ada dan sering tidak disadari: **pipa untuk kanvas pelanggan sudah terpasang di lapisan data.** `invitations.data` sudah menerima `section_decoration_overrides`, `section_background_overrides`, `section_transition_overrides`, dan `opening_decoration_overrides`. `lib/decoration-utils.ts` sudah menggabungkan aset template dengan aset pelanggan dan menaikkan z-layer milik pelanggan di atas milik template. `app/api/invitations/[id]/route.ts` sudah menegakkan batas paket: `decoration_editing`, `max_decoration_assets` (Popular 3, Eksklusif tanpa batas), dan `custom_animations`.

Yang belum ada: **UI-nya.** Tidak ada satu layar pun di studio pelanggan yang menulis keempat kolom itu. Jadi tiga fitur berbayar sudah tertulis di skema paket, sudah dijaga API, dan belum bisa dipakai siapa pun.

---

## 3. Masalah

**M-1. Kanvas admin tidak bisa dipercaya sebagai kanvas.** Sampai hari ini, tab Dekorasi punya dua cacat yang membuatnya tidak berfungsi: kanvasnya tertutup lapisan opening sehingga setiap klik mendarat di tempat lain (`elementFromPoint` mengembalikan `z=40` milik opening, bukan `z=30` milik kanvas), dan dekorasi yang berhasil dipasang kembali ke opacity 0 begitu animasi masuknya selesai. Keduanya sudah diperbaiki 19 Sep (commit `874ccfc` dan `dd195f0`), tapi cacatnya menunjukkan bahwa permukaan ini belum pernah benar benar dipakai sampai selesai.

**M-2. Pratinjau tidak mengikuti apa yang sedang dikerjakan.** Memilih "Detail Acara" di tab Dekorasi atau membuka seksi di tab Konten tidak menggeser pratinjau ke seksi itu. Admin harus menggulir sendiri mencari bagian yang baru saja diubahnya. Ironisnya studio pelanggan sudah melakukan ini dengan benar: `InvitationStudio` mengirim `scrollToSection` ke `InvitationRenderer`, yang mencari `[data-section-id]` lalu menggulir ke sana. Editor admin memakai `InvitationPreview`, komponen berbeda yang tidak menandai seksinya sama sekali.

**M-3. Kanvas pelanggan belum ada, padahal sudah dijual.** Lihat bagian 2. Pelanggan Popular membayar untuk "3 aset dekorasi" yang tidak ada layarnya.

**M-4. Tab Konten mencampur dua pekerjaan.** Satu baris seksi memegang: urutan, aktif atau tidak, warna latar, varian gaya, dan seluruh isi teks. Untuk tema dengan 16 seksi, panel kirinya jadi daftar 16 baris yang semuanya terlihat sama pentingnya, sementara yang benar benar sering diubah cuma empat atau lima.

**M-5. Gaya opening banyak tapi buta.** Ada 17 gaya opening (`gate-open`, `curtain`, `flower-bloom`, `petal-fall`, `ring-zoom`, `lantern-rise`, dan seterusnya). Memilihnya lewat grid ikon emoji yang tidak memperlihatkan gerakannya. Untuk memutuskan, admin harus memilih, menekan Play, menunggu, lalu mengulang untuk gaya berikutnya. Enam belas kali.

**M-6. Transisi antar seksi tidak terasa disengaja.** `transition_in` dan `transition_out` ada per seksi, tapi tidak ada pratinjau berdampingan dan tidak ada aturan yang menjaga supaya 16 seksi tidak memakai 16 gerakan berbeda.

---

## 4. Sasaran

1. **Dua puluh pelanggan pertama bisa menerbitkan undangan tanpa dibantu.** Ukur dengan: jumlah undangan yang sampai status terbit dibagi jumlah pesanan lunas, dalam 30 hari pertama setelah rilis.
2. **Admin bisa membuat satu tema baru dari nol sampai terbit dalam satu duduk.** Ukur dengan: catat waktu nyata sekali, bandingkan dengan pengukuran ulang sesudah perubahan.
3. **Fitur berbayar yang tertulis di paket benar benar bisa dipakai.** Tidak ada lagi baris fitur tanpa layar.
4. **Undangan tetap ringan di HP kelas menengah.** Anggaran: Worker gzip di bawah 3.072 KiB (tercatat 2.916 KiB pada 16 Agu 2026), dan tidak ada paket JavaScript baru di atas 60 KiB gzip untuk jalur tamu tanpa persetujuan eksplisit.
5. **Gerakan terasa disengaja, bukan ramai.** Setiap animasi punya alasan tertulis satu baris (R-19, R-31).

## 5. Bukan sasaran

1. **Bukan membangun Canva.** Tidak ada teks bebas, tidak ada layer teks, tidak ada bentuk vektor yang digambar sendiri. Kanvas di sini hanya menempatkan dan mengatur aset di atas seksi yang strukturnya sudah ditentukan tema. Alasan: kebebasan penuh menghasilkan undangan jelek dan biaya dukungan.
2. **Bukan editor animasi keyframe untuk pelanggan.** Keyframe kustom tetap milik admin. Pelanggan memilih dari daftar. Alasan: keyframe sudah ada di kode dan sudah terbukti terlalu berat untuk tab Dekorasi admin sendiri.
3. **Bukan kolaborasi banyak orang.** Satu undangan satu pemilik. Alasan: belum ada satu pelanggan pun.
4. **Bukan mengubah `components/renderer/*` secara besar.** PRD sebelumnya membekukannya. Perubahan di sana hanya untuk cacat yang membuat fitur tidak berfungsi, dengan catatan tertulis.
5. **Bukan WebGL di jalur tamu untuk v1.** Lihat bagian 8.

---

## 6. Kebutuhan

### P0, tidak bisa rilis tanpa ini

**P0-1. Pratinjau mengikuti yang sedang diedit.**
Memilih seksi di tab Dekorasi atau membuka seksi di tab Konten menggeser pratinjau ke seksi itu.

- [ ] Diberikan editor terbuka di tab Konten, ketika admin membuka baris "Detail Acara", maka pratinjau bergulir ke seksi Detail Acara dalam 600 ms dan seksi itu terlihat penuh.
- [ ] Diberikan tab Dekorasi, ketika admin memilih chip seksi mana pun, maka panggung dekorasi menampilkan seksi itu tanpa perlu memindahkan mode pratinjau secara manual.
- [ ] Diberikan seksi yang dipilih sedang nonaktif, maka pratinjau tetap menampilkannya dengan penanda "seksi ini tidak tampil di undangan", bukan halaman kosong.
- [ ] Gulir memakai `behavior: 'smooth'` dan dibatalkan kalau admin menggulir sendiri sebelum selesai.

Catatan teknis: `InvitationRenderer` sudah punya `scrollToSection` dan menandai seksi dengan `data-section-id`. `InvitationPreview` yang dipakai editor admin tidak. Dua jalan: tambahkan penanda dan gulir di `InvitationPreview`, atau pindahkan pratinjau editor ke `InvitationRenderer` seperti studio pelanggan. Jalan kedua menyatukan dua jalur render jadi satu, dan itu sejalan dengan konsep satu mesin.

**P0-2. Kanvas pelanggan untuk dekorasi, sesuai batas paket.**
Layar di studio pelanggan untuk menempatkan dekorasi di seksi mereka.

- [ ] Pelanggan paket Popular bisa memasang sampai 3 aset per undangan; aset keempat ditolak dengan pesan yang menyebut angka batasnya dan paket yang membukanya.
- [ ] Pelanggan paket Starter melihat layar ini terkunci dengan penjelasan satu kalimat, bukan disembunyikan diam diam.
- [ ] Aset yang dipasang pelanggan selalu tampil di atas aset bawaan tema (sudah ditangani `mergeDecorationAssets`).
- [ ] Pelanggan tidak bisa menghapus atau menggeser aset bawaan tema. Yang bisa dilakukan hanya menambah miliknya sendiri.
- [ ] Sumber aset: pustaka ornamen bawaan yang sama dengan admin, ditambah unggahan sendiri kalau paketnya mengizinkan.
- [ ] Keadaan kosong, memuat, dan gagal ditulis apa adanya (R-27): kosong menyebutkan langkah pertama, gagal menyebutkan penyebab dan langkah berikutnya.

**P0-3. Memilih gaya opening dengan melihat gerakannya.**
- [ ] Setiap kartu gaya opening memutar pratinjau gerakan saat disentuh atau diarahkan pointer, tanpa memindahkan pilihan yang sedang aktif.
- [ ] Pratinjau berhenti ketika pointer pergi, dan tidak pernah berputar sendiri tanpa henti (R-19, dial MOTION 1 untuk permukaan admin).
- [ ] Di perangkat yang mengaktifkan kurangi gerak, kartu menampilkan bingkai diam dan keterangan satu baris tentang gerakannya.
- [ ] Memilih gaya langsung memutar pratinjau penuh sekali, tanpa perlu menekan Play.

**P0-4. Anggaran gerak yang mengikat.**
- [ ] Setiap animasi di permukaan admin punya alasan tertulis satu baris di kode.
- [ ] Undangan tamu: paling banyak dua gerakan berjalan bersamaan di satu layar.
- [ ] Seluruh gerakan mematuhi `prefers-reduced-motion` lewat `MotionConfig` yang sudah dipasang di root.
- [ ] Tidak ada animasi berulang tanpa henti di permukaan admin.

### P1, segera menyusul

**P1-1. Dekorasi bisa dipakai ulang.** Pustaka media per tema, salin dekorasi antar seksi, dan terapkan ke semua seksi sekaligus. Alasan: memasang ornamen yang sama di 16 seksi sekarang berarti 16 kali kerja.

**P1-2. Tab Konten dipecah menurut yang sering diubah.** Seksi yang paling sering disentuh naik ke atas, sisanya masuk ke "seksi lain". Urutannya ditentukan admin, bukan ditebak.

**P1-3. Pratinjau berdampingan untuk transisi.** Dua seksi bersebelahan diputar berurutan supaya transisi keluar dan masuk dinilai sebagai pasangan, bukan satu satu.

**P1-4. Kartu berbagi otomatis.** Satu gambar 1080x1920 berisi nama mempelai, tanggal, dan tautan, dibuat dari data undangan untuk dibagikan ke status WhatsApp atau Instagram. Alasan: undangan digital disebarkan lewat status, dan sekarang pelanggan membuat kartunya sendiri di aplikasi lain. Seksi "Template IG Story" sudah ada di renderer, jadi bahannya sebagian sudah tersedia.

### P2, dirancang sekarang dibangun nanti

**P2-1. Riwayat versi tema.** Menyimpan versi terbit sebelumnya supaya perubahan besar bisa dikembalikan.
**P2-2. Menyalin gaya antar tema.** Ambil tipografi dan warna dari tema lain tanpa menyalin isinya.
**P2-3. Kanvas pelanggan untuk tata letak.** Menggeser urutan seksi, bukan cuma dekorasi.

---

## 7. Cerita pengguna

**Admin tema (kami)**
1. Sebagai perancang tema, saya ingin pratinjau ikut pindah ke bagian yang sedang saya ubah, supaya saya tidak menggulir mencari hasil kerja saya sendiri.
2. Sebagai perancang tema, saya ingin melihat gerakan tiap gaya opening sebelum memilih, supaya saya tidak perlu mencoba tujuh belas kali.
3. Sebagai perancang tema, saya ingin memasang satu ornamen ke banyak seksi sekaligus, supaya menyiapkan satu tema tidak memakan satu hari.
4. Sebagai perancang tema, saya ingin tahu persis mana yang akan dilihat pelanggan Starter dan mana yang hanya untuk Eksklusif, supaya saya tidak merancang sesuatu yang tidak pernah tampil.

**Pelanggan (mereka)**
5. Sebagai pasangan yang baru membayar, saya ingin undangan saya sudah terlihat jadi sejak menit pertama, supaya saya yakin uang saya tidak sia sia.
6. Sebagai pasangan, saya ingin menambahkan satu ornamen bunga favorit kami di halaman sampul, supaya undangannya terasa milik kami, bukan cetakan.
7. Sebagai pasangan yang tidak mengerti desain, saya ingin pilihan yang sudah pasti bagus, bukan kanvas kosong.
8. Sebagai pasangan, saya ingin melihat perubahan saya langsung di layar sebelah, supaya saya tidak takut merusak.
9. Sebagai pasangan, saya ingin satu gambar siap bagi untuk status WhatsApp, supaya menyebarkan undangan tidak perlu aplikasi lain.

**Tamu**
10. Sebagai tamu yang membuka tautan di HP dengan kuota terbatas, saya ingin undangannya terbuka cepat, supaya saya tidak menutupnya sebelum melihat namanya sendiri.

---

## 8. Tren dan Three.js

Pertanyaannya bukan "apa yang sedang tren", tapi "apa yang bertahan di HP Android kelas menengah dengan kuota terbatas, yang memang audiens kita".

**Diambil**

| Yang diambil | Alasan satu baris | Biaya |
|---|---|---|
| Gerak terikat gulir (scroll-driven) | Tamu mengendalikan temponya sendiri, dan ini satu satunya gerak yang tidak pernah terasa memaksa | 0 kB, CSS scroll-timeline dengan fallback framer-motion yang sudah ada |
| Format ketuk seperti Story | Pola yang sudah dikuasai semua orang di bawah 30 tahun, dan pas untuk undangan yang dibaca sambil berdiri | Kecil, sudah ada seksi IG Story |
| Kartu berbagi otomatis | Penyebaran nyata terjadi di status WhatsApp, bukan di halaman web | Sedang, render kanvas 2D di peramban |
| Getar halus saat membuka sampul | Satu isyarat fisik di momen paling penting, bukan hiasan | 0 kB, Vibration API dengan pemeriksaan dukungan |
| Papan ucapan yang hidup | Tamu melihat ucapannya muncul, dan itu alasan untuk kembali | Sudah ada tabel `wishes` |

**Ditolak**

| Yang ditolak | Alasan |
|---|---|
| Three.js di undangan tamu | 150 sampai 250 kB gzip untuk halaman yang dibuka sekali lewat WhatsApp, di perangkat yang panas setelah dua puluh detik WebGL. Anggaran Worker juga tinggal sekitar 156 KiB |
| Kursor kustom, efek magnet | Undangan dibuka dengan jempol, bukan tetikus |
| Mode gelap otomatis di undangan | Warna undangan adalah keputusan desain tema, bukan preferensi sistem tamu |
| Suara latar otomatis menyala | Sudah ada pemutar musik dengan kontrol. Menyalakan sendiri membuat tautan ditutup |
| Teks berjalan tanpa henti, glow di mana mana | Persis daftar slop di `antislop.md` (R-13, R-19) |

**Keputusan Three.js.** Tidak untuk v1 di jalur tamu. Kalau tetap diinginkan, bentuk yang bisa dipertahankan hanya satu: **satu gaya opening eksklusif berbasis WebGL**, dimuat malas hanya ketika gaya itu dipilih, dengan tiga syarat mengikat:

1. Ukuran paketnya diukur dan tercatat sebelum digabungkan, dan tidak boleh melewati 120 kB gzip.
2. Ada fallback non-WebGL yang otomatis dipakai ketika konteks WebGL gagal dibuat atau `prefers-reduced-motion` aktif.
3. Berhenti total setelah sampul dibuka. Tidak ada render loop yang hidup selama tamu membaca.

Alternatif yang lebih murah dan sering terlihat lebih mahal: transform 3D CSS untuk parallax berlapis, dan partikel kanvas 2D untuk kelopak bunga. Keduanya sudah dipakai di beberapa gaya opening yang ada sekarang.

---

## 9. Metrik

Karena belum ada lalu lintas, semua angka di bawah adalah **hipotesis yang harus diuji**, bukan target yang diturunkan dari data lama. Ditandai jelas supaya tidak berubah jadi klaim.

**Indikator cepat (minggu pertama sesudah rilis)**
- Berapa persen pesanan lunas yang berlanjut sampai undangan terbit. Hipotesis awal: 70 persen. Diukur dari `orders.status = 'paid'` dibandingkan `invitations.is_published`.
- Berapa banyak pelanggan yang menyentuh kanvas dekorasi sama sekali. Hipotesis: 30 persen dari paket Popular ke atas.
- Berapa lama dari bayar sampai terbit. Hipotesis: di bawah 45 menit median.
- Jumlah galat konsol di studio pelanggan. Target: nol.

**Indikator lambat (kuartal pertama)**
- Berapa banyak pelanggan naik paket karena batas dekorasi. Ini yang membuktikan fitur berbayarnya nyata.
- Berapa banyak undangan yang dibuka lebih dari 50 tamu.
- Berapa banyak tiket dukungan per undangan terbit.

**Cara mengukur.** Kueri baca saja seperti yang dipakai menyusun bagian 1, dijalankan mingguan. Tidak ada alat analitik pihak ketiga yang ditambahkan untuk ini.

---

## 10. Pertanyaan terbuka

| # | Pertanyaan | Yang menjawab | Memblokir? |
|---|---|---|---|
| Q-1 | Pratinjau editor admin dipindahkan ke `InvitationRenderer` (menyatukan dua jalur render) atau `InvitationPreview` ditambahi penanda seksi saja? | Rekayasa | Ya, menentukan bentuk P0-1 |
| Q-2 | Kanvas pelanggan: seret bebas seperti admin, atau hanya memilih dari titik tempel yang sudah ditentukan tema? | Pemilik produk | Ya, menentukan bentuk P0-2 |
| Q-3 | Apakah paket Starter melihat kanvas terkunci, atau tidak melihatnya sama sekali? | Pemilik produk | Tidak |
| Q-4 | Batas ukuran unggahan dekorasi pelanggan, dan siapa yang membayar penyimpanannya | Pemilik produk | Tidak |
| Q-5 | Gaya opening berbasis WebGL: dikerjakan sekarang, nanti, atau tidak sama sekali | Pemilik produk | Tidak |

---

## 11. Urutan kerja

Dipecah supaya tiap tahap bisa dinilai sendiri, dan tiap tahap punya potret sebelum dan sesudah.

**Tahap A. Pratinjau mengikuti pekerjaan (P0-1).** Paling kecil, paling terasa, dan menyelesaikan keluhan yang sudah ada di tangan.

**Tahap B. Memilih opening dengan melihat gerakannya (P0-3).** Berdiri sendiri, tidak menyentuh data.

**Tahap C. Kanvas pelanggan (P0-2).** Paling besar. Menyentuh studio, API, dan batas paket. Perlu jawaban Q-2 dulu.

**Tahap D. Pakai ulang dekorasi dan rapikan tab Konten (P1-1, P1-2).**

**Tahap E. Kartu berbagi (P1-4).**

Ketergantungan yang mengikat: Tahap C tidak boleh naik ke produksi sebelum migrasi `20260911000000_drop_user_referral_program` selesai dijalankan sesuai `RUNBOOK_DEPLOY_2026-09.md`, karena keduanya menyentuh jalur deploy yang sama.

---

## 12. Bukti pasar

**Cara mengambilnya.** Halaman pencarian publik Threads dibuka dengan peramban sungguhan (Chrome DevTools Protocol), digulir sampai dinding login muncul. Hanya kueri persis `undangan digital` yang mengembalikan isi; `undangan digital murah`, `undangan digital estetik`, `web undangan pernikahan`, dan `undangan digital gratis` semuanya membalas "No results" lalu meminta login. Yang terbaca: 10 postingan sebelum dipotong "Log in for more threads about this topic". Sampel sekecil ini adalah **sinyal, bukan statistik**, dan dipakai begitu di dokumen ini.

Kutipan apa adanya, beserta angka interaksi yang tertera:

```
pinkythefleur  01/06/26   304 suka, 125 balasan, 41, 90
  "Dear Bride To Be 2026 atau kakak kakak yang sudah menikah, boleh saranin
   vendor digital invitation yang kalian pakai?"

saladmuii      08/28/26   332 suka, 84 balasan, 59, 114
  "Spill dong undangan digital yang murce tapi tetep cakep. Lagi hunting nih"

kaartikarahma  3 hari      43 suka, 87 balasan
  "rekomen undangan digital dan undangan cetak yang beneran bagus estetik"

mhidayats      4 hari      18 suka, 54 balasan
  "adakah yang punya rekomendasi undangan digital untuk acara pernikahan?"

terlalulugu    1 hari      14 suka, 43 balasan
  "aku lagi cari-cari vendor undangan digital, mungkin ada portfolio dan PL
   yang bisa aku lihat"

auliafwln      1 hari       8 suka, 33 balasan
  "Rekomendasi invitation web dong, pusing banget nyari nyari blm dpt yg cocok"

ien__jei       1 hari      19 suka, 31 balasan
  "Info undangan digital yang estetik tanpa foto"

sheeeeily      38 menit     1 suka, 6 balasan
  "lagi nanya2 sm admin undangan digital tp dia bls gini. zuzurr jadi agak malesst"

belune.digital 1 hari      (vendor berjualan di kolom yang sama)
```

**Yang terbaca dari sinyal ini**

| # | Bacaan | Bukti |
|---|---|---|
| B-1 | Pembelian dimulai dari **bertanya ke orang lain**, bukan dari mesin pencari. Balasan jauh lebih banyak daripada suka di hampir semua postingan | 125, 84, 87, 54, 43, 33 balasan |
| B-2 | Kata sifat yang paling sering dipakai adalah **estetik**, bukan murah, bukan lengkap | 4 dari 10 postingan menyebutnya |
| B-3 | Harga tetap jadi syarat, tapi selalu berpasangan dengan rupa: "murce tapi tetep cakep" | saladmuii, 332 suka |
| B-4 | Yang diminta calon pembeli pertama kali adalah **portofolio dan daftar harga**, bukan penjelasan fitur | terlalulugu |
| B-5 | Ada ceruk yang tidak terlayani: **tanpa foto** (sering karena alasan agama) dan **syar'i** | ien__jei, dan vendor belune.digital yang menjual persis itu |
| B-6 | Layanan lewat admin chat adalah titik gagal. Satu balasan yang salah membuat calon pembeli mundur | sheeeeily |
| B-7 | Digital dan cetak sering dicari **sekaligus**, bukan saling menggantikan | kaartikarahma |

**Harga pasar.** Rentangnya Rp0 sampai Rp500.000 lebih. Beberapa pemain yang muncul di pencarian: Sitemu.id gratis sampai Rp150.000 dengan 120+ tema, Satumomen Rp99.000 sampai Rp399.000 dengan 50+ tema, Wevitation Rp50.000 sampai Rp350.000 dengan 80+ tema, Undangandigital.id gratis sampai Rp275.000 dengan 60+ tema, Undweb mulai Rp49.000. Sumber ada di akhir bagian ini.

**Jurang yang harus diterima.** iaundang punya **3 tema** (terukur, bukan perkiraan). Pesaing memasang 50 sampai 120 tema sebagai angka utama di halaman depannya. Perang jumlah tema sudah kalah sebelum dimulai, dan menambah tema asal banyak akan menghabiskan waktu yang sama yang dibutuhkan untuk membuat tiga tema ini benar benar bagus.

Kesimpulan yang mengikat bagian 16: **satu satunya sumbu yang bisa dimenangkan adalah rupa dan seberapa jauh pembeli bisa menjadikannya miliknya sendiri.** Itu persis cerita dua kanvas.

Sumber: [Sitemu.id](https://sitemu.id/blog/berapa-harga-undangan-digital-2026), [Sannubari](https://sannubari.com/harga-undangan-digital-online/), [Undweb.id](https://undweb.id/blog/harga-undangan-digital-pernikahan/), [Menica](https://menica.pro/harga-paket).

---

## 13. Tab Tampilan

**Apa yang ada sekarang.** Sembilan blok dalam satu gulungan, semuanya setara: Penerapan Warna, Palet Tema Siap Pakai, Custom Warna, pratinjau mini, Pasangan Font (16 kombinasi, disembunyikan di dalam `<details>` yang tertutup), Pilih & Atur Font (termasuk unggah font dan tambah Google Font), Gaya Tombol, Gaya Sudut, Gaya Ornamen.

**Masalah**

**M-7. Semua sama pentingnya, jadi tidak ada yang penting.** Warna dan font adalah dua keputusan yang mengubah wajah tema. Gaya sudut dan gaya ornamen adalah penyetelan halus. Sekarang keempatnya ditumpuk dengan judul berukuran sama.

**M-8. Pasangan font yang paling berguna justru disembunyikan.** Enam belas kombinasi terkurasi ada di balik `<details>` tertutup dengan judul 10 piksel. Admin yang tidak membukanya akan mengatur font satu satu dan hasilnya hampir pasti lebih buruk.

**M-9. Skala font memakai persen tanpa contoh.** Slider 60 sampai 200 persen dengan angka, tanpa contoh teks yang ikut berubah di tempat. Efeknya baru terlihat di pratinjau seksi yang mungkin sedang tidak tampak.

**M-10. Unggah font adalah pintu ke masalah hukum dan ukuran.** Tidak ada batas ukuran yang terlihat, tidak ada catatan lisensi, dan font yang diunggah ikut ke setiap undangan yang memakai tema itu.

**Kebutuhan**

- [ ] **P1-5.** Tab Tampilan dipecah dua tingkat: keputusan besar (warna, pasangan font) terbuka apa adanya, penyetelan halus (sudut, ornamen, skala) masuk ke kelompok yang bisa dibuka. Alasan ditulis di kode.
- [ ] **P1-6.** Pasangan font keluar dari `<details>`, ditampilkan sebagai baris contoh yang benar benar memakai fontnya.
- [ ] **P1-7.** Setiap slider skala punya contoh teks di sebelahnya yang ikut berubah seketika.
- [ ] **P2-4.** Unggah font diberi batas ukuran yang terlihat dan satu kalimat tentang lisensi.

---

## 14. Tab Musik

**Fakta yang menentukan.** Tabel `music_tracks` berisi **0 baris** di produksi. Perpustakaan musik yang dijanjikan panel ini kosong.

Sekarang lihat paket:

```
Starter    music: true,  custom_music: false
Popular    music: true,  custom_music: true
Eksklusif  music: true,  custom_music: true
```

**M-11. Pelanggan Starter membayar untuk musik yang tidak bisa mereka dapatkan.** `music: true` berarti undangannya boleh berbunyi. `custom_music: false` berarti mereka hanya boleh memilih dari perpustakaan. Perpustakaannya kosong. Jadi untuk pelanggan Starter, fitur musik hari ini bernilai nol. Ini bukan bug di kode, ini janji yang belum diisi.

**M-12. Lisensi musik belum diputuskan.** Memutar lagu komersial di undangan yang dibagikan ke ratusan orang adalah penyiaran. Tidak ada satu pun catatan lisensi di repo. Selama perpustakaan diisi lagu yang tidak jelas haknya, risikonya menumpuk seiring jumlah undangan.

**M-13. Autoplay tidak bisa diandalkan.** Peramban modern memblokir suara otomatis sebelum ada sentuhan. Panel menawarkan sakelar Autoplay tanpa menjelaskan bahwa di sebagian besar HP musik baru berbunyi setelah tamu menekan "Buka Undangan". Admin akan menyalakannya dan mengira rusak.

**M-14. Empat kenop pemutar tanpa pratinjau gerakan.** Gaya, posisi, ukuran, dan animasi masuk dipilih dari grid teks. Sama seperti gaya opening, tidak terlihat sampai dicoba satu satu.

**Kebutuhan**

- [ ] **P0-5.** Isi perpustakaan musik dengan lagu yang jelas haknya, atau ubah paket Starter supaya tidak menjanjikan musik. Salah satu, tidak boleh keduanya dibiarkan.
  - Diberikan pelanggan Starter membuka tab Musik, ketika perpustakaan kosong, maka layarnya menjelaskan apa yang tersedia untuk paketnya, bukan daftar kosong.
- [ ] **P0-6.** Sakelar Autoplay menampilkan satu kalimat apa adanya: musik berbunyi setelah tamu menekan tombol buka, karena peramban memblokir suara otomatis.
- [ ] **P1-8.** Setiap gaya pemutar bisa dicoba bunyinya dan gerakannya langsung dari panel.
- [ ] **P1-9.** Batas ukuran berkas musik yang terlihat, dengan angka, dan penjelasan pengaruhnya ke kecepatan buka di HP tamu.

---

## 15. Routing

**Peta yang ada sekarang** (dihitung dari berkas, bukan dari ingatan):

```
Publik         /  /templates  /templates/[slug]  /blog  /blog/[slug]
               /order  /order/status/[token]  /terms  /privacy
               /demo/renderer            pratinjau tema tanpa akun
               /invitation/[slug]        undangan tamu, juga lewat subdomain
Auth           /login  /register  /forgot-password  /reset-password
Masuk akun     /dashboard  /admin  /writer  /affiliate
Sementara      /dev-preview/template     hanya hidup di NODE_ENV bukan production
API            78 rute
```

Penjagaan di `middleware.ts`: jalur terlindung dialihkan ke `/login?redirect=...`, `/admin` menolak non admin, `/writer` menolak non writer, `/affiliate` menolak non affiliate, semuanya jatuh ke `/dashboard`. Subdomain ditangani lewat `lib/subdomain.ts`.

**Masalah**

**M-15. Layar yang paling lama dipakai tidak punya alamat.** Studio pelanggan hidup di dalam `/dashboard` sebagai state React (`tab`, `activeId`). Editor tema admin hidup di dalam `/admin?tab=template` sebagai state (`editingId`). Akibatnya, untuk keduanya:

- Tombol kembali peramban keluar dari editor, bukan mundur satu langkah.
- Menyegarkan halaman membuang posisi kerja.
- Tidak ada tautan yang bisa dikirim ke orang lain, termasuk ke diri sendiri di perangkat lain.
- Tidak ada cara membuka undangan tertentu langsung dari email.

Ini paling terasa di studio pelanggan, karena satu satunya tautan yang bisa kita kirim lewat email setelah pembayaran adalah `/dashboard`, dan dari sana pelanggan harus mencari undangannya sendiri.

**M-16. `/dev-preview/template` harus dihapus sebelum deploy.** Rute ini sengaja dibuat untuk memeriksa modul template tanpa login. Sudah dijaga `notFound()` di produksi, tapi meninggalkannya berarti menyimpan pintu yang tidak perlu.

**M-17. `/demo/renderer` adalah satu satunya pintu publik ke pratinjau tema, dan ia menerima `?id=`.** Kalau id tema tidak sah atau temanya dinonaktifkan, perilakunya perlu dipastikan mengarah ke galeri, bukan halaman kosong.

**Kebutuhan**

- [ ] **P0-7.** Studio pelanggan punya alamat sendiri: `/dashboard/undangan/[id]` dan bagian yang aktif ikut di URL (`?bagian=galeri`).
  - Diberikan pelanggan membuka tautan dari email, ketika tautannya menunjuk undangan tertentu, maka studio terbuka langsung di undangan itu.
  - Tombol kembali peramban memindahkan satu bagian, bukan keluar dari studio.
  - Menyegarkan halaman mempertahankan bagian yang sedang dibuka.
- [ ] **P1-10.** Editor tema admin mengikuti pola yang sama: `/admin/template/[id]` dengan tab di URL.
- [ ] **P0-8.** `/dev-preview/template` dihapus begitu pekerjaan modul template selesai.
- [ ] **P1-11.** `/demo/renderer` tanpa `id` atau dengan id yang tidak aktif mengarah ke `/templates` dengan pesan satu kalimat, bukan layar kosong.

---

## 16. Paket dan model bisnis

**Keadaan sekarang**

```
Starter    Rp  79.000   6 foto,   100 tamu,  opening dasar, tanpa cerita/video/hadiah
Popular    Rp 149.000  20 foto,   500 tamu,  opening semua, dekorasi 3 aset
Eksklusif  Rp 249.000  50 foto,  tanpa batas, dekorasi tanpa batas, animasi kustom
semua      masa aktif 365 hari, watermark tetap ada sampai 200 undangan terbit
```

**Prinsip yang dipakai untuk menyusun ulang**

1. **Yang memakan biaya kami, naik bersama paket.** Penyimpanan foto, jumlah tamu, domain, masa aktif. Ini jujur dan mudah dijelaskan.
2. **Yang menjadi pembeda kami, jangan dikunci terlalu rapat.** Rupa adalah satu satunya sumbu yang bisa dimenangkan (bagian 12). Mengunci rupa di paket termahal berarti membuang keunggulan sendiri di depan pembeli yang membandingkan tiga tab di HP-nya.
3. **Yang menimbulkan tiket dukungan, kunci atau sederhanakan.** Kebebasan penuh untuk orang yang tidak terbiasa mendesain menghasilkan undangan jelek, lalu keluhan.
4. **Paket termurah harus tetap terasa utuh.** Pembeli yang kecewa di Rp79.000 tidak akan naik ke Rp149.000, dia akan pergi dan bercerita di Threads.

**Usulan susunan**

| Kemampuan | Starter | Popular | Eksklusif | Alasan satu baris |
|---|---|---|---|---|
| Semua tema boleh dipakai | ya | ya | ya | Rupa adalah pembeda kami, bukan barang yang ditahan |
| Ganti warna dan font dari daftar terkurasi | ya | ya | ya | Membuat undangan terasa milik sendiri dengan risiko jelek yang kecil |
| Kanvas dekorasi | tidak | 3 aset | tanpa batas | Memakan penyimpanan dan berisiko merusak tata letak |
| Unggah dekorasi sendiri | tidak | tidak | ya | Biaya penyimpanan dan risiko lisensi gambar |
| Animasi kustom per aset | tidak | tidak | ya | Kenop lanjutan yang butuh mata desainer |
| Foto galeri | 6 | 20 | 50 | Biaya penyimpanan nyata |
| Tamu terdaftar | 100 | 500 | tanpa batas | Biaya kirim dan penyimpanan |
| Musik dari perpustakaan | ya | ya | ya | Kalau perpustakaannya diisi, lihat P0-5 |
| Unggah musik sendiri | tidak | ya | ya | Biaya penyimpanan dan risiko lisensi |
| Cerita, video, hadiah, livestream | tidak | ya | ya | Fitur acara besar |
| Subdomain sendiri | ya | ya | ya | Tidak ada biaya tambahan |
| Domain sendiri | tidak | tidak | ya | Biaya tahunan nyata |
| Tanpa watermark | tidak | tidak | ya | Satu satunya pembeda yang murni status |
| Masa aktif | 365 hari | 365 hari | 365 hari | Menyamakannya menghapus satu sumber keluhan |

Perbedaan utama dari susunan sekarang: **kanvas dekorasi tetap berbayar, tetapi warna dan font dibuka untuk semua paket**, karena itulah yang membuat pembeli merasa undangannya miliknya sendiri, dan itu yang mereka tanyakan di Threads.

**Model bisnis**

Tetap sekali bayar. Alasannya: pernikahan adalah peristiwa sekali, langganan tidak masuk akal, dan pasar sudah terbiasa dengan sekali bayar. Yang perlu ditambah bukan langganan, tapi **barang jual tambahan yang cocok dengan sinyal pasar**:

| Tambahan | Dasar dari bukti | Catatan |
|---|---|---|
| Varian tanpa foto | B-5, permintaan nyata yang sekarang dilayani vendor lain | Butuh varian tema, bukan fitur baru |
| Varian syar'i | B-5, vendor menjualnya di kolom yang sama | Sama, varian tema |
| Kartu berbagi siap status | B-1, penyebaran terjadi lewat rekomendasi orang | Sudah masuk P1-4 |
| Paket cetak plus digital | B-7 | Butuh mitra cetak, bukan pekerjaan kode |
| Perpanjangan masa aktif | Sesudah 365 hari lewat | Kecil, tapi murni untung |

**Yang tidak boleh dilakukan**

- Menambah tema asal banyak supaya angkanya menyaingi 120. Tiga tema yang bagus lebih bisa dipertahankan daripada tiga puluh tema medioker, dan waktunya sama.
- Menulis angka jumlah pengguna atau undangan di halaman harga. Angkanya nol, dan mengarangnya melanggar R-17 dan R-36.
- Menjual fitur yang belum ada layarnya. Ini yang sedang terjadi pada dekorasi dan musik Starter.

---

## 17. Catatan kepatuhan dokumen

Dokumen ini adalah spesifikasi, bukan antarmuka, jadi Delivery Gate antislop dijalankan saat implementasi, bukan di sini. Yang sudah ditegakkan di dokumen ini: tanpa em dash (R-02), tanpa angka karangan (R-17, R-36, R-38), setiap angka disertai cara mengukurnya, dan setiap keputusan besar punya alasan satu baris (R-31). Sampel Threads dinyatakan ukurannya dan keterbatasannya, bukan disajikan sebagai riset pasar.

---

## Lampiran A. Cacat yang sudah diperbaiki 19 Sep 2026

Dicatat supaya tidak dikerjakan dua kali, dan supaya jelas apa yang sudah berubah sejak keluhan pertama.

| Kode | Cacat | Bukti | Commit |
|---|---|---|---|
| A-1 | Kanvas dekorasi tertutup lapisan opening, setiap klik mendarat di sampul | `elementFromPoint` di tengah layar simulasi mengembalikan `div.absolute z=40` milik opening, bukan `z=30` milik kanvas | `874ccfc` |
| A-2 | Chip seksi tidak memindahkan mode pratinjau, sementara chip Opening memindahkannya | Baca kode `DecorPanel` | `874ccfc` |
| A-3 | Dekorasi kembali tidak terlihat sesudah animasi masuk selesai | Opacity pembungkus motion 0 pada keempat aset, gambar opacity 1, posisi benar | `dd195f0` |
| A-4 | Tidak ada satu pun ornamen bawaan yang bisa dipasang tanpa mengunggah berkas | Pustaka `BUILT_IN:` ada di kode, `DECORATION_BUNDLES` yang disebut komentarnya tidak pernah ada | `dd195f0` |

## Lampiran B. Berkas yang terlibat

```
components/admin/tabs/template/editor/
  TemplateEditor.tsx            kerangka, tab, lembar kontrol, terbitkan
  panels/EditorPreview.tsx      layar simulasi, panggung dekorasi, mode pratinjau
  panels/ContentPanel.tsx       daftar seksi, varian gaya, isi teks
  panels/DecorPanel.tsx         tujuan dekorasi, pustaka ornamen, daftar lapisan
  panels/OpeningPanel.tsx       gaya opening, teks sampul, tipografi
  DecorationCanvas.tsx          seret, ubah ukuran, putar, magnet, papan tik
components/studio/
  InvitationStudio.tsx          studio pelanggan, navigasi kelompok, pratinjau
  SectionAppearanceControls.tsx latar dan transisi per seksi milik pelanggan
components/renderer/            mesin render bersama, dibekukan kecuali cacat
lib/built-in-assets.ts          18 ornamen SVG, 6 paket, resolveAssetUrl
lib/decoration-utils.ts         penggabungan aset tema dan aset pelanggan
app/api/invitations/[id]/route.ts  penegakan batas paket untuk dekorasi
```
