-- Buang modul Feedback (NPS) dan A/B Testing.
--
-- Keputusan produk: keduanya dinilai belum diperlukan. Sebelum dijalankan,
-- ketiga tabel diperiksa dan SEMUANYA KOSONG (0 baris), jadi tidak ada data
-- pelanggan yang hilang di sini.
--
-- Catatan soal A/B Testing: modulnya tidak pernah benar-benar berfungsi.
-- Endpoint /api/experiments/assign tidak punya satu pun pemanggil dan tidak
-- ada halaman publik yang membaca varian, jadi tidak pernah ada pengunjung
-- yang ditugaskan varian maupun event yang tercatat.
--
-- DESTRUKTIF dan tidak bisa dibalik oleh migrasi berikutnya. Menghidupkan
-- kembali fitur ini berarti membuat ulang tabelnya lewat migrasi baru.

-- experiment_events lebih dulu: punya foreign key ke experiments.
DROP TABLE IF EXISTS "experiment_events";
DROP TABLE IF EXISTS "experiments";
DROP TABLE IF EXISTS "user_feedback";
