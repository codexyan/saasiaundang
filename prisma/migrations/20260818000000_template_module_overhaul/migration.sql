-- Rombak modul Template: kolom pendukung koleksi + editor jadi satu alur.
--
-- description  : dulu diminta di Studio ("deskripsi untuk ditampilkan ke user")
--                tapi tidak punya kolom sama sekali — nyangkut di localStorage
--                browser admin dan tidak pernah sampai ke user.
-- draft_config : salinan kerja editor. `config` tetap versi yang dilihat
--                pengunjung; admin mengedit draft_config dan baru menimpa
--                `config` saat menekan Terbitkan. Ini yang membuat autosave
--                aman dilakukan pada template yang sudah aktif.
-- updated_at   : koleksi perlu mengurutkan "terakhir diubah"; sebelumnya hanya
--                ada created_at sehingga template lama selalu tenggelam.
--
-- Semuanya aditif dan punya default, jadi kode versi lama tetap jalan.
ALTER TABLE "template_records" ADD COLUMN IF NOT EXISTS "description" TEXT NOT NULL DEFAULT '';
ALTER TABLE "template_records" ADD COLUMN IF NOT EXISTS "draft_config" JSONB;
ALTER TABLE "template_records" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Koleksi selalu memfilter per status; tabelnya kecil sekarang tapi indeks ini
-- gratis dan mencegah seq-scan saat jumlah template bertambah.
CREATE INDEX IF NOT EXISTS "template_records_status_idx" ON "template_records" ("status");
