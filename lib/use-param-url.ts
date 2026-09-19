'use client'

import { useCallback, useEffect, useState } from 'react'

/**
 * Menyimpan satu potong keadaan layar di URL, tanpa memuat ulang halaman.
 *
 * Kenapa ini ada: layar yang paling lama dipakai di aplikasi ini, studio
 * pelanggan dan editor tema, dulu hidup sepenuhnya di dalam `useState`. Tidak
 * ada alamat untuk mereka, jadi tombol kembali peramban mengusir orang keluar
 * dari editor, menyegarkan halaman membuang posisi kerja, dan satu satunya
 * tautan yang bisa dikirim lewat email sesudah pembayaran adalah dashboard
 * kosong yang harus dicari isinya sendiri.
 *
 * Kenapa parameter kueri dan bukan segmen rute: data seluruh undangan sudah
 * dimuat sekali di halaman dashboard, dan rute bersarang akan memaksa pemuatan
 * kedua sekaligus memutus perpindahan antar undangan yang sekarang instan.
 * Panel admin sudah memakai pola yang sama untuk `?tab=`, jadi ini menyatukan
 * keduanya, bukan menambah pola baru.
 *
 * Tiga hal yang dijaga di sini:
 *
 * 1. Nilai awal TIDAK dibaca saat render pertama. Server merender tanpa tahu
 *    isi URL, jadi membacanya langsung akan membuat HTML server dan klien
 *    berbeda, dan React membuang seluruh pohonnya. URL dibaca sesudah
 *    hydration, di dalam efek.
 * 2. `popstate` didengarkan, supaya tombol kembali dan maju memindahkan
 *    keadaan layar alih alih meninggalkan URL dan tampilan tidak sinkron.
 * 3. Penulisan memakai History API langsung, bukan router Next, supaya tidak
 *    ada permintaan ke server untuk perpindahan yang murni di layar.
 */
export function useParamUrl(
  nama: string,
  bawaan: string | null = null,
  sah?: (nilai: string) => boolean,
) {
  const [nilai, setNilai] = useState<string | null>(bawaan)

  useEffect(() => {
    function bacaUrl() {
      const dariUrl = new URLSearchParams(window.location.search).get(nama)
      if (dariUrl && (!sah || sah(dariUrl))) setNilai(dariUrl)
      else setNilai(bawaan)
    }
    bacaUrl()
    window.addEventListener('popstate', bacaUrl)
    return () => window.removeEventListener('popstate', bacaUrl)
    // `sah` sengaja tidak masuk daftar: fungsinya dibuat ulang tiap render di
    // sebagian pemanggil, dan memasukkannya akan memasang ulang pendengar
    // popstate terus menerus.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nama, bawaan])

  /**
   * @param baru  nilai baru, atau null untuk menghapus parameternya
   * @param ganti true = ganti entri riwayat (untuk perpindahan kecil yang
   *              tidak pantas menambah satu langkah tombol kembali)
   */
  const ubah = useCallback((baru: string | null, ganti = false) => {
    setNilai(baru ?? bawaan)
    if (typeof window === 'undefined') return
    const sp = new URLSearchParams(window.location.search)
    if (baru === null) sp.delete(nama)
    else sp.set(nama, baru)
    const kueri = sp.toString()
    const url = window.location.pathname + (kueri ? `?${kueri}` : '')
    if (ganti) window.history.replaceState(null, '', url)
    else window.history.pushState(null, '', url)
  }, [nama, bawaan])

  return [nilai, ubah] as const
}
