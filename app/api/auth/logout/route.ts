import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { SESSION_COOKIE_NAME } from '@/lib/session'

export const dynamic = 'force-dynamic'

/** Dipakai tombol Keluar di aplikasi. */
export async function POST() {
  const cookieStore = await cookies()
  // Nama cookienya dari konstanta, bukan diketik ulang. Dua tempat yang
  // harus selalu sama tapi tidak dipaksa sama adalah cara paling pelan
  // untuk membuat logout diam diam berhenti bekerja.
  cookieStore.set(SESSION_COOKIE_NAME, '', { maxAge: 0, path: '/', httpOnly: true, sameSite: 'lax' })
  cookieStore.set('ref', '', { maxAge: 0, path: '/' })
  return NextResponse.json({ ok: true })
}

/**
 * Jalan keluar untuk cookie yang sudah dicabut tapi tanda tangannya masih sah.
 *
 * `session_epoch` naik di empat tempat: reset password lewat email, reset
 * password oleh admin, cabut sesi, dan GANTI ROLE. Sesudah salah satunya,
 * peramban yang bersangkutan masih memegang token lama. Token itu lolos
 * middleware (middleware sengaja tidak menyentuh database, lihat catatan di
 * SessionPayload), lalu ditolak begitu ada halaman yang benar benar membaca
 * sesi. Halaman itu me-redirect, halaman berikutnya menolak lagi, dan
 * cookienya tidak pernah dibersihkan: orangnya terjebak memantul di antara
 * /admin, /dashboard, dan /login tanpa satu pun penjelasan.
 *
 * Halaman terproteksi sekarang mengarah ke sini, bukan langsung ke /login,
 * supaya cookie beracunnya benar benar dibuang sekali jalan.
 *
 * Hanya menerima permintaan dari situs sendiri. Tanpa syarat itu, sebuah
 * `<img src>` di situs mana pun bisa memaksa pengunjung kita keluar.
 *
 * Yang diperiksa HANYA sec-fetch-site, bukan sec-fetch-dest. Versi pertama
 * ikut mensyaratkan dest 'document' dan itu salah: kalau perpindahannya
 * lewat router Next di sisi klien, redirect-nya diikuti sebagai permintaan
 * RSC dengan dest 'empty', dan rute ini menjawab 403. Terbukti di uji lokal
 * sebelum sempat naik. Cross-site tetap tertolak, dan itu yang memang
 * dijaga di sini.
 */
export async function GET(req: NextRequest) {
  const dariSini = req.headers.get('sec-fetch-site')
  const wajar = !dariSini || dariSini === 'same-origin' || dariSini === 'none'
  if (!wajar) return NextResponse.json({ error: 'Permintaan tidak dikenali' }, { status: 403 })

  const tujuan = new URL('/login', req.url)
  const alasan = req.nextUrl.searchParams.get('alasan')
  if (alasan === 'sesi-berakhir') tujuan.searchParams.set('alasan', 'sesi-berakhir')

  const res = NextResponse.redirect(tujuan)
  res.cookies.set(SESSION_COOKIE_NAME, '', { maxAge: 0, path: '/', httpOnly: true, sameSite: 'lax' })
  return res
}
