import { NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/route-guards'
import { settings } from '@/lib/db'
import type { AppSettings } from '@/lib/db'
import { readNonEmptyJsonBody } from '@/lib/request-body'

export const dynamic = 'force-dynamic'


export const GET = withAdminAuth(async () => {
  try {
    return NextResponse.json({ settings: await settings.get() })
  } catch (error) {
    console.error('Settings GET error:', error)
    return NextResponse.json({ error: 'Pengaturannya gagal dimuat. Coba muat ulang halaman ya.' }, { status: 500 })
  }
})

/**
 * PATCH bersifat MERGE, bukan ganti-seluruh-baris.
 *
 * Sebelumnya body ditulis apa adanya sebagai satu record utuh. Karena panel
 * admin memegang salinan pengaturan di state React dan selalu mengirim
 * SELURUH objek itu, setiap penyimpanan mengembalikan seluruh pengaturan ke
 * kondisi saat halaman dibuka — termasuk kategori yang baru saja dibuat lewat
 * endpoint /api/admin/categories dan perubahan dari tab admin lain atau dari
 * admin kedua. Bug hilang-diam-diam yang tidak meninggalkan jejak error.
 *
 * Dengan merge, kunci yang TIDAK dikirim tidak tersentuh, jadi client basi
 * hanya bisa menimpa bagian yang memang sedang ia ubah.
 *
 * Body kosong/rusak tetap ditolak: readNonEmptyJsonBody() melaporkan null,
 * dan tanpa penjagaan ini "{}" akan berarti "simpan objek kosong" — bukan
 * "tolak permintaan".
 */
export const PATCH = withAdminAuth(async (req) => {
  try {
    const body = await readNonEmptyJsonBody(req)
    if (!body) {
      return NextResponse.json(
        { error: 'Body pengaturan tidak valid atau kosong' },
        { status: 400 }
      )
    }

    const current = await settings.get()
    const merged = { ...current, ...body } as AppSettings

    await settings.save(merged)
    return NextResponse.json({ settings: merged })
  } catch (error) {
    console.error('Settings PATCH error:', error)
    return NextResponse.json({ error: 'Pengaturannya gagal disimpan. Coba lagi sebentar lagi ya.' }, { status: 500 })
  }
})
