# Brief Kompetitif: Pasar Undangan Digital Indonesia

| | |
|---|---|
| Tanggal | 18 September 2026 |
| Tujuan | Menentukan posisi halaman publik iaundang sebelum dirombak |
| Metode | Halaman harga pesaing dibaca langsung, ditambah artikel perbandingan pihak ketiga yang ditandai keandalannya |
| Keputusan yang dipicu | D-11 (masa aktif 1 tahun), D-12 (watermark permanen sampai 200 undangan), D-13 (uji model ke 10 pasangan) |

---

## 1. Peta harga dan model

| Pesaing | Harga masuk | Puncak | Masa aktif | Tema | Model coba | Keandalan data |
|---|---|---|---|---|---|---|
| Wedew | Gratis | Rp 1.000.000 | "Aktif Selamanya" di paket Starter | "ratusan tema premium" di paket Lite | Paket gratis permanen: RSVP, buku tamu digital, galeri, countdown, love story, maps, musik | Tinggi, dibaca dari `wedew.id/harga` |
| Sangmempelai | Rp 49.000 (dicoret dari Rp 350.000) | Rp 309.000 (domain .ID) | "Selamanya (selama website kami aktif)" | tidak disebut | tidak disebut | Tinggi, dibaca dari `sangmempelai.id/pricelist` |
| Satumomen | Rp 99.000 | Rp 399.000+ | Paket Prioritas 1 tahun | 50+ (sumber lain menyebut jauh lebih banyak) | Uji coba gratis 12 jam | Sedang, halaman menolak dibaca (HTTP 402), angka dari hasil pencarian |
| Sitemu | Gratis | Rp 150.000 | tidak disebut | 120+ | ada tier gratis | Rendah, dari artikel perbandingan |
| Wevitation | Rp 50.000 | Rp 350.000+ | tidak disebut | 80+ | tidak disebut | Rendah, dari artikel perbandingan |
| **iaundang** | Rp 79.000 | Rp 249.000 | 30 / 90 / 180 hari | 3 | tidak ada, bayar dulu | Dari kode dan pengaturan sendiri |

Artikel perbandingan yang dipakai untuk baris berkeandalan rendah adalah materi pemasaran milik pesaing, bukan data terverifikasi. Jangan dipakai sebagai patokan keras.

## 2. Empat norma pasar

1. **Gratis adalah pintu masuk standar.** Wedew memberi paket gratis permanen yang sudah berisi RSVP, buku tamu, galeri, dan musik. Satumomen memberi 12 jam. Tier gratis di pasar ini bukan promosi, melainkan mesin akuisisi.
2. **"Selamanya" adalah janji masa aktif standar.** Dua dari dua halaman harga yang bisa dibaca langsung menjanjikannya. Satumomen menjual 1 tahun sebagai paket tertingginya.
3. **Katalog besar dipakai sebagai bukti kredibilitas.** Angka tema dipajang di judul: 50, 80, 120, ratusan.
4. **Teater diskon adalah bahasa normal.** Harga coret 85 persen dipajang tanpa canggung.

## 3. Posisi iaundang terhadap norma itu

Di keempat sumbu itu iaundang kalah, dan bukan kalah tipis:

| Sumbu | Norma pasar | iaundang | Selisih |
|---|---|---|---|
| Pintu masuk | Gratis | Rp 79.000 | Kalah telak |
| Masa aktif | Selamanya | 30 sampai 180 hari | Kalah telak |
| Katalog | 50 sampai ratusan | 3 | Kalah telak |
| Harga masuk berbayar | Rp 49.000 | Rp 79.000 | Kalah |

Konsekuensinya lugas: **halaman publik yang berargumen di sumbu yang sama dengan pesaing akan kalah, sebagus apa pun desainnya.** Tabel perbandingan fitur adalah medan yang sudah kalah sebelum bertanding.

Catatan yang tidak menyenangkan tapi perlu tertulis: keputusan checkout murni 12 September menutup jalur gratis. Dari dalam, itu penyederhanaan produk yang masuk akal. Dari peta ini, itu mematikan mesin akuisisi standar pasar tepat ketika merek belum dikenal siapa pun. Halaman publik tidak bisa menutup lubang itu sendirian.

## 4. Sumbu yang masih bisa dimenangi

Yang tersisa satu: **rasa, dibuktikan bukan diklaim.** Tiga template yang dikerjakan sungguh-sungguh melawan ratusan template comotan adalah argumen sah, tetapi hanya kalau pengunjung melihatnya. Kalimat "desain premium" adalah klaim kosong dan melanggar R-36 kalau tanpa bukti. Undangan yang terbuka di HP dengan nama pengunjung sendiri adalah bukti.

Karena itu demo bukan salah satu section. Demo adalah argumennya.

## 5. Saluran yang sudah dimiliki tapi sedang dijual murah

Setiap undangan yang terbit dibungkus `WatermarkShell` (`app/invitation/[slug]/page.tsx`) yang menautkan balik ke iaundang, dan setiap undangan dibuka 100 sampai 500 tamu yang semuanya berada di lingkaran sosial pernikahan. Itu saluran distribusi berbiaya nol dengan penargetan yang tidak bisa ditandingi iklan mana pun.

Sampai 18 Sep 2026, `hasWatermarkFree` bernilai false hanya di Starter, jadi Popular dan Eksklusif menghapus watermark. Artinya pelanggan yang paling banyak membayar, yang undangannya paling bagus dan paling banyak dibagikan, adalah yang paling tidak menyebut nama iaundang. Ini yang dibalik oleh D-12.

## 6. Keputusan yang diambil dari brief ini

| ID | Keputusan | Alasan dari brief |
|---|---|---|
| D-11 | Masa aktif semua paket dinaikkan menjadi 1 tahun | Menutup kolom paling telanjang di tabel perbandingan tanpa menjanjikan "selamanya" yang belum tentu bisa ditepati. Perubahannya di `validity_days` pengaturan paket, bukan mesin baru |
| D-12 | Watermark permanen di semua paket sampai 200 undangan terbit | Distribusi didahulukan daripada pendapatan selama merek belum dikenal. Sesudah 200 undangan, penghapusan watermark dibuka lagi sebagai fitur berbayar |
| D-13 | Model bayar-dulu diuji ke 10 pasangan nyata, paralel dengan rombak halaman | Asumsi paling berisiko dari seluruh rencana adalah bahwa orang mau bayar di muka padahal ada yang gratis selamanya. Rombak halaman tetap jalan karena copy bohong dan testimoni karangan harus mati apa pun hasil ujinya |

## 7. Asumsi paling berisiko

**Pasangan Indonesia mau membayar di muka untuk undangan yang lebih bagus, padahal ada yang gratis selamanya.** Belum pernah diuji, dan nol pembeli berarti belum ada satu pun data yang mendukung maupun membantahnya.

Cara termurah mengujinya bukan merombak halaman. Tunjukkan tiga template iaundang dan paket gratis Wedew ke sepuluh pasangan yang benar-benar sedang menyiapkan pernikahan, lalu tanya mereka memilih yang mana dan kenapa. Sepuluh jawaban itu lebih berharga daripada tiga minggu kerja desain.

## Sumber

- https://wedew.id/harga
- https://sangmempelai.id/pricelist
- https://satumomen.com/harga (tidak bisa dibaca langsung, HTTP 402)
- https://sitemu.id/blog/berapa-harga-undangan-digital-2026
- https://sannubari.com/harga-undangan-digital-online/
