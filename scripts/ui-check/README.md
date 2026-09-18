# Pemeriksa UI lewat Chrome DevTools Protocol

Memeriksa halaman yang sedang berjalan di browser sungguhan, tanpa memasang
paket apa pun. Yang dibutuhkan hanya Chrome yang sudah terpasang dan Node 22,
yang sudah punya `WebSocket` dan `fetch` global.

Dibuat 19 September 2026, setelah dua bug lolos dari `tsc` dan dari pembacaan
kode, dan baru ketahuan saat halamannya benar-benar dibuka:

- Judul setiap section tidak pernah muncul untuk pengunjung yang mengaktifkan
  "kurangi gerak" di sistemnya. Enam elemen berhenti di `opacity: 0`.
- Tombol menu mobile berukuran 36x36 piksel, di bawah batas area sentuh.

Headless Chrome melaporkan `prefers-reduced-motion: reduce` sebagai aktif, jadi
setiap pemeriksaan di sini otomatis menguji jalur kurangi-gerak. Itu kebetulan
yang menguntungkan: jalur itulah yang paling jarang dibuka manusia.

## Menjalankan

Server pengembangan harus sudah hidup lebih dulu (`npm run dev`).

```bash
# Pemeriksaan penuh: gulir horizontal, area sentuh, jalur keyboard, error konsol
node scripts/ui-check/audit.mjs http://localhost:3000/

# Potret per section, di lebar tertentu
node scripts/ui-check/shots.mjs http://localhost:3000/ 375 ui-shots
node scripts/ui-check/shots.mjs http://localhost:3000/ 1440 ui-shots
```

`audit.mjs` keluar dengan kode 1 kalau ada temuan, jadi bisa dipakai sebagai
gerbang sebelum menyatakan sebuah permukaan selesai.

Chrome dinyalakan sendiri kalau belum ada yang mendengarkan di port debug. Kalau
Chrome terpasang di lokasi tidak biasa, set `CHROME_PATH`. Port bisa diubah lewat
`CDP_PORT`.

## Yang diperiksa

| Pemeriksaan | Kenapa |
|---|---|
| `scrollWidth` lawan `clientWidth` di 375, 390, 768, 1024, 1440 | Gulir horizontal di HP adalah kerusakan yang paling sering lolos dari pembacaan kode |
| Tombol di bawah 44 piksel | Batas area sentuh. Tautan teks di dalam paragraf sengaja dikecualikan, sesuai WCAG |
| Elemen tersangkut di `opacity: 0` sesudah digulir | Menangkap animasi masuk yang tidak pernah selesai, seperti bug judul section di atas |
| 14 perhentian Tab dan indikator fokusnya | UI yang hanya bisa dipakai dengan tetikus adalah UI yang belum selesai |
| Pesan konsol, termasuk peringatan hidrasi React | Ketidakcocokan hidrasi tidak pernah muncul di `tsc` maupun di build |

## Jebakan yang sudah dibayar di muka

- **Jangan melompat langsung ke sebuah section lalu memotretnya.** Animasi masuk
  memakai `viewport-once`, jadi bagian yang belum pernah terlihat tetap
  transparan dan hasil potretnya kosong. `gulirSampaiDasar()` menyelesaikan ini.
- **Jangan percaya `Page.captureScreenshot` dengan `captureBeyondViewport`** di
  halaman yang memakai animasi masuk. Hasilnya panjang tapi separuhnya kosong.
- **`Network.responseReceived` bisa meleset** kalau tab baru dibuat bersamaan
  dengan navigasi. Untuk menghitung permintaan, `performance.getEntriesByType('resource')`
  dari dalam halaman lebih dapat diandalkan.
