'use client'

import { useEffect, useState } from 'react'
import { getInvitationUrl } from './utils'

/**
 * Alamat undangan yang aman dirender di server dan di klien.
 *
 * `getInvitationUrl()` sengaja mengembalikan alamat localhost saat dipakai di
 * peramban dengan hostname localhost, supaya tautan di dashboard bisa dibuka
 * selama pengembangan. Di server tidak ada `window`, jadi yang keluar alamat
 * produksi. Dua nilai berbeda untuk elemen yang sama berarti React membuang
 * pohon yang sudah dihidrasi dan mencetak peringatan hidrasi.
 *
 * Peringatan itu sendiri tidak merusak apa pun di produksi, karena di sana
 * hostname-nya bukan localhost dan kedua sisi menghasilkan alamat yang sama.
 * Masalahnya lain: konsol yang selalu berisi satu peringatan palsu membuat
 * peringatan sungguhan ikut terabaikan. Sudah nyaris terjadi.
 *
 * Jadi render pertama SELALU memakai alamat produksi, sama dengan server, dan
 * versi localhost baru dipasang sesudah hydration selesai.
 */
export function useInvitationUrl(slug: string): string {
  const [url, setUrl] = useState(() => `https://${slug}.${process.env.NEXT_PUBLIC_APP_DOMAIN || 'iaundang.online'}`)

  useEffect(() => {
    setUrl(getInvitationUrl(slug))
  }, [slug])

  return url
}
