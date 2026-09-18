'use client'

import { MotionConfig } from 'framer-motion'

/**
 * Satu tempat yang mengatur bagaimana seluruh animasi menghormati setelan
 * "kurangi gerak" milik pengunjung.
 *
 * `reducedMotion="user"` membuat framer-motion mematikan animasi transform dan
 * layout kalau setelan itu aktif, sementara opacity tetap dianimasikan. Jadi
 * yang hilang geraknya, bukan elemennya.
 *
 * Kenapa lewat provider dan bukan percabangan di tiap komponen: percabangan
 * `useReducedMotion()` menghasilkan markup yang berbeda antara server dan
 * klien. Server tidak bisa membaca media query, jadi ia selalu merender
 * keadaan awal `opacity:0`, sedangkan klien yang mengaktifkan kurangi gerak
 * merender `opacity:1`. React melaporkannya sebagai hydration mismatch dan
 * menolak menambal selisihnya. Provider ini menjaga markupnya tetap sama di
 * kedua sisi.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>
}
