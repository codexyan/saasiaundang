-- Penanda generasi sesi.
--
-- Dinaikkan setiap kali password pengguna diganti/direset. Token JWT membawa
-- nilai ini dan ditolak kalau tidak cocok lagi. Tanpa kolom ini, JWT stateless
-- 30 hari yang dicuri tetap berlaku SETELAH korban mereset passwordnya.
--
-- Aditif dan punya default, jadi aman terhadap kode versi lama yang belum
-- mengenal kolom ini: baris yang sudah ada otomatis bernilai 0.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "session_epoch" INTEGER NOT NULL DEFAULT 0;
