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

export const PATCH = withAdminAuth(async (req) => {
  try {
    // settings.save() adalah upsert SATU RECORD UTUH — tidak ada merge dengan
    // baris yang tersimpan. Jadi body yang tidak terbaca TIDAK BOLEH diperlakukan
    // sebagai "{}", karena artinya menimpa seluruh pengaturan dengan objek kosong:
    // semua template, kategori, palet warna, tier harga, kupon, flash sale, dan
    // rekening bank buatan admin hilang permanen, dan route tetap membalas 200.
    //
    // Dulu `req.json()` melempar pada body rusak dan tertangkap catch di bawah
    // (500, baris database utuh) — lemparan itulah validasinya. Pemakaian
    // readJsonBody() di sini sempat mengubahnya jadi gagal-terbuka.
    const body = await readNonEmptyJsonBody(req)
    if (!body) {
      return NextResponse.json(
        { error: 'Body pengaturan tidak valid atau kosong' },
        { status: 400 }
      )
    }

    // Penjaga tambahan: pengaturan yang sah selalu membawa kunci-kunci ini.
    // Menangkap body JSON yang valid tapi jelas bukan AppSettings.
    const requiredKeys: (keyof AppSettings)[] = ['priceTiers', 'categories', 'templates']
    const missing = requiredKeys.filter(k => !(k in body))
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Body pengaturan tidak lengkap (hilang: ${missing.join(', ')})` },
        { status: 400 }
      )
    }

    await settings.save(body as unknown as AppSettings)
    return NextResponse.json({ settings: body })
  } catch (error) {
    console.error('Settings PATCH error:', error)
    return NextResponse.json({ error: 'Pengaturannya gagal disimpan. Coba lagi sebentar lagi ya.' }, { status: 500 })
  }
})
