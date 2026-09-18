---
version: alpha
name: iaundang
description: Bahasa desain produk iaundang untuk halaman pemasaran, checkout, auth, dashboard, dan Studio.
colors:
  primary: "{colors.forest}"
  forest: "#1a3320"
  forest-deep: "#0f1a12"
  forest-light: "#2d5a3d"
  forest-50: "#f0f5f1"
  forest-100: "#dce8de"
  forest-200: "#bcd4c1"
  forest-400: "#5e8a6c"
  forest-500: "#3f6b4e"
  forest-600: "#2d5a3d"
  forest-700: "#234731"
  gold: "#d4af37"
  gold-dark: "#b8973a"
  gold-light: "#e8d48b"
  gold-50: "#faf6e8"
  gold-200: "#ecd9a0"
  gold-400: "#dabb55"
  gold-500: "#d4af37"
  gold-600: "#b8973a"
  gold-700: "#997d30"
  ivory: "#faf9f6"
  chalk: "#ffffff"
  mist: "#f2f2f2"
  hairline: "#e5e5e5"
  graphite: "#0a0a0a"
  carbon: "#171717"
  concrete: "#737373"
  ash: "#a1a1a1"
  smoke: "#b9b9b9"
  sukses: "#16a34a"
  peringatan: "#d97706"
  error: "#dc2626"
  info: "#1d4ed8"
typography:
  display:
    fontFamily: Fraunces
    fontWeight: 500
    letterSpacing: -0.015em
  sans:
    fontFamily: Plus Jakarta Sans
  mono:
    fontFamily: Geist Mono
  body-base:
    fontSize: 14px
    lineHeight: 1.43
    fontWeight: 400
  body-sm:
    fontSize: 13px
    lineHeight: 1.43
    fontWeight: 400
  body-xs:
    fontSize: 12px
    lineHeight: 1.5
    fontWeight: 400
  label-lg:
    fontSize: 14px
    lineHeight: 1.43
    fontWeight: 500
  label-base:
    fontSize: 12px
    lineHeight: 1.5
    fontWeight: 500
  label-sm:
    fontSize: 12px
    lineHeight: 1.5
    fontWeight: 500
  eyebrow:
    fontSize: 12px
    lineHeight: 1.5
    fontWeight: 500
    letterSpacing: 0.05em
  button-lg:
    fontSize: 14px
    lineHeight: 1.5
    fontWeight: 500
  button-base:
    fontSize: 14px
    lineHeight: 1.5
    fontWeight: 500
  button-sm:
    fontSize: 12px
    lineHeight: 1.5
    fontWeight: 500
  ui-base:
    fontSize: 13px
    lineHeight: 1.45
  ui-sm:
    fontSize: 12px
    lineHeight: 1.4
  ui-xs:
    fontSize: 11px
    lineHeight: 1.35
  ui-2xs:
    fontSize: 10px
    lineHeight: 1.3
  ui-eyebrow:
    fontSize: 10px
    lineHeight: 1.3
    fontWeight: 700
    letterSpacing: 0.12em
rounded:
  button: 10px
  input: 10px
  card: 16px
  pill: 9999px
components:
  button-primary:
    backgroundColor: "{colors.forest}"
    textColor: "{colors.chalk}"
    rounded: "{rounded.button}"
    typography: "{typography.button-base}"
  button-primary-hover:
    backgroundColor: "{colors.forest-deep}"
  button-secondary:
    backgroundColor: "{colors.chalk}"
    textColor: "{colors.carbon}"
    rounded: "{rounded.button}"
    typography: "{typography.button-base}"
  button-secondary-hover:
    textColor: "{colors.graphite}"
  button-ghost:
    textColor: "{colors.concrete}"
    rounded: "{rounded.button}"
    typography: "{typography.button-base}"
  button-ghost-hover:
    textColor: "{colors.forest-deep}"
  button-gold:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.forest-deep}"
    rounded: "{rounded.button}"
    typography: "{typography.button-base}"
  button-gold-hover:
    backgroundColor: "{colors.gold-light}"
  button-inverse:
    backgroundColor: "{colors.chalk}"
    textColor: "{colors.forest-deep}"
    rounded: "{rounded.button}"
    typography: "{typography.button-base}"
  button-inverse-hover:
    backgroundColor: "{colors.forest-50}"
  button-sm:
    typography: "{typography.button-sm}"
  button-lg:
    typography: "{typography.button-lg}"
  input-field:
    backgroundColor: "{colors.chalk}"
    textColor: "{colors.graphite}"
    rounded: "{rounded.input}"
    typography: "{typography.body-base}"
  input-field-label:
    textColor: "{colors.carbon}"
    typography: "{typography.label-base}"
  input-field-hint:
    textColor: "{colors.concrete}"
    typography: "{typography.body-xs}"
  input-field-error:
    textColor: "{colors.error}"
    typography: "{typography.body-xs}"
---

## Overview

iaundang adalah platform undangan digital pernikahan. Pasangan memilih template, membayar, mengisi undangan di Studio, lalu membagikan tautan personal ke setiap tamu.

Arah desainnya elegan dan personal. Nama pasangan dan nama tamu adalah elemen yang paling menonjol di setiap layar yang memuatnya. Akar visualnya majalah pernikahan: judul serif di atas kanvas ivory yang hangat, dengan foto dan pratinjau template sebagai pusat perhatian.

Dial: ENERGY 3 / RHYTHM 3 / MOTION 2.

Halaman pemasaran, checkout, dan auth dibaca, jadi lapang. Dashboard dan Studio dioperasikan, jadi rapat dan cepat.

## Colors

Forest adalah warna brand untuk aksi utama, tautan, dan permukaan gelap. Forest-deep dipakai untuk section gelap dan untuk judul di latar terang.

Gold adalah satu-satunya aksen. Di halaman pemasaran gold hadir tipis sebagai garis pemisah, ikon kecil, atau satu kata beraksen di judul. Di editor gold menandai hal fungsional seperti item aktif dan penanda wajib, bukan dekorasi.

Kanvas halaman memakai ivory, sedangkan kartu dan field memakai chalk supaya permukaan terangkat tanpa bayangan berat.

Graphite dipakai untuk teks utama. Concrete dipakai untuk teks sekunder dan menjadi warna paling terang yang boleh dipakai teks informatif berukuran kecil. Ash dan smoke hanya untuk teks besar, elemen dekoratif, atau keadaan nonaktif.

Teks informatif di atas forest-deep memakai chalk.

Sukses, peringatan, error, dan info hanya dipakai untuk keadaan dan umpan balik.

## Typography

Fraunces membawa suara editorial untuk judul display, harga, dan nama pasangan. Di editor, Fraunces hanya muncul untuk nama pasangan di sekitar pratinjau dan judul keadaan kosong.

Teks isi dan antarmuka memakai Plus Jakarta Sans, rancangan Gumpita Rahayu (Tokotype) untuk identitas +Jakarta City of Collaboration, sehingga undangan untuk pasangan Indonesia memakai huruf yang lahir dari identitas kota Indonesia. X-height yang sedikit lebih tinggi dan counter yang terbuka menjaga keterbacaannya di ukuran antarmuka yang kecil.

Setiap teks memakai salah satu level skala. Judul dan display berukuran fluid dan mengecil di layar ponsel, jadi heading tidak diberi ukuran tetap.

Label section memakai eyebrow dalam huruf kapital, diikuti judul serif, lalu paragraf pembuka.

Level ui hanya untuk chrome editor dan dashboard, seperti navigasi, badge paket, dan petunjuk padat. Teks konten di editor yang seukuran body-xs atau lebih besar tetap memakai level body dan label.

## Layout

Komposisi berubah dari satu section ke section berikutnya. Section yang berurutan tidak memakai pola yang sama berupa judul di tengah, subjudul, lalu grid kartu.

Konten halaman publik dibatasi satu lebar kontainer yang sama.

Di layar tablet ke atas, Studio menampilkan panel dan pratinjau berdampingan. Di ponsel, Studio memakai navigasi bawah dan pratinjau sebagai overlay.

Tombol ukuran standar adalah target sentuh minimum untuk aksi utama. Kontrol utama di editor paling tidak setinggi tombol ukuran kecil.

## Elevation & Depth

Kedalaman datang dari lapisan permukaan: kartu chalk di atas kanvas ivory, dibatasi garis hairline, dengan bayangan kartu yang tipis.

Bayangan kartu naik ke bayangan hover hanya pada kartu yang bisa diklik.

## Shapes

Tombol dan field berbagi satu radius, kartu memakai radius yang lebih besar, dan bentuk pil hanya untuk badge dan chip.

## Components

Tombol gold dan inverse hanya dipakai di section berlatar forest-deep.

Setiap elemen interaktif menampilkan cincin fokus forest saat dicapai dengan keyboard.

Field di checkout dan auth menaruh label di atas input. Pesan error menggantikan hint di bawah input, dan field yang error memakai border merah.

Field di editor memakai keluarga field editor, bukan field halaman publik.

Pratinjau undangan di dashboard dan Studio menjadikan isi tema sebagai pusat. Bingkai di sekelilingnya memakai token produk, sedangkan bezel ponsel tetap gelap netral.

Item aktif di navigasi editor punya penanda selain warna.

## Motion

Di halaman pemasaran, elemen muncul sekali saat masuk viewport dengan geser pendek, memakai easing dan durasi dari token motion bersama.

Setiap animasi menghormati preferensi kurangi gerak dan tidak menggeser tata letak.

Di editor, gerak hanya mikro dan instan untuk status simpan dan pergantian panel, tanpa animasi masuk yang menunda pekerjaan.

## Do's and Don'ts

- Jangan pakai gold sebagai warna teks di atas latar putih.
- Jangan pakai ash untuk teks informatif berukuran kecil.
- Jangan pakai ukuran font di luar skala, kecuali teks ilustrasi mini-mockup.
- Jangan tambahkan animasi baru yang berjalan tanpa akhir.
- Jangan pakai Fraunces untuk label form dan navigasi editor.
- Jangan pakai warna sukses, peringatan, error, atau info sebagai dekorasi.
- Jangan ubah tampilan isi tema undangan di pratinjau.
