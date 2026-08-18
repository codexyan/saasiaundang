'use client'

import ImageUploadField from '@/components/admin/ImageUploadField'

interface Props {
  value: string | undefined
  onChange: (url: string | undefined) => void
  label?: string
  hint?: string
}

/**
 * Pemilih gambar untuk STUDIO (sisi pelanggan).
 *
 * Alasan komponen tipis ini ada:
 * <ImageUploadField> lahir di panel admin dan endpoint bawaannya
 * `/api/admin/upload` — yang dibungkus withAdminAuth. Lima form studio
 * memakainya tanpa mengoper `uploadUrl`, sehingga upload foto tempat, foto
 * mempelai, foto bab cerita, foto produk, dan gambar IG Story MEMBALAS 403
 * untuk setiap pelanggan non-admin. Kemungkinan besar tidak pernah terdeteksi
 * karena pengujian selalu dilakukan dari akun admin.
 *
 * Membalik nilai bawaannya bukan jalan keluar: panel admin (TemplateLab,
 * SettingsTab, LoadingScreenPanel) juga TIDAK mengoper uploadUrl, jadi
 * membalik default akan memindahkan aset admin ke folder pengguna.
 * Pembungkus ini mengikat endpoint yang benar di satu tempat, sehingga form
 * studio berikutnya tidak bisa lupa.
 *
 * Folder 'photos' dipilih karena ALLOWED_FOLDERS di /api/user/upload adalah
 * ['user', 'music', 'photos', 'videos'] — 'covers' akan diam-diam jatuh ke
 * folder 'user'.
 */
export default function StudioImageField(props: Props) {
  return <ImageUploadField {...props} uploadUrl="/api/user/upload" folder="photos" />
}
