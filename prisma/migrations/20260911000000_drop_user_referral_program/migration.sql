-- Buang sisa program referral PENGGUNA: tabel user_referrals dan kolom
-- users.referral_code.
--
-- Programnya dibuang dari aplikasi pada 11 Sep 2026 (commit f655112) karena
-- tidak pernah bekerja: tautan referral kehilangan ?ref, kode pengguna ditolak
-- /api/referral yang hanya mengenal kode afiliasi, dan tidak ada kode yang
-- mencatat referral atau memberi diskon Rp 15.000 yang dijanjikan panelnya.
-- Sejak itu kolom dan tabel ini tidak punya pembaca maupun penulis.
--
-- Diperiksa read-only sebelum ditulis (11 Sep 2026): user_referrals 0 baris,
-- tidak ada user yang referral_code-nya terisi, dan tidak ada trigger, fungsi,
-- view, atau foreign key lain yang menunjuk keduanya. Tidak ada data yang hilang.
--
-- IF EXISTS wajib: keduanya tidak pernah dibuat lewat migrasi mana pun (drift
-- yang tercatat di BUGS.md), jadi tanpa itu migrasi ini gagal saat diputar ulang
-- di shadow database yang memang tidak pernah memilikinya.
--
-- URUTAN WAJIB: terapkan SESUDAH kode tanpa referralCode ter-deploy. Client
-- Prisma lama memilih kolom referral_code di hampir setiap query ke tabel users,
-- termasuk login dan penyediaan pesanan, jadi menjatuhkan kolomnya lebih dulu
-- membuat semua itu gagal.
--
-- DESTRUKTIF dan tidak bisa dibalik oleh migrasi berikutnya. Menghidupkan lagi
-- program referral pengguna berarti membuat ulang tabel dan kolomnya lewat
-- migrasi baru.

DROP TABLE IF EXISTS "user_referrals";
DROP INDEX IF EXISTS "users_referral_code_key";
ALTER TABLE "users" DROP COLUMN IF EXISTS "referral_code";
