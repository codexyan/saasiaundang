import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { orders, invitations, settings, templateRecords } from '@/lib/db'
import { notifyUser } from '@/lib/notifications'
import { runAfterResponse } from '@/lib/after-response'
import { randomString } from '@/lib/random'
import { createMayarPayment } from '@/lib/mayar'
import { PACKAGES, type PackageTier } from '@/lib/packages'
import { computePrice, checkCoupon } from '@/lib/tiers'
import { readJsonBody } from '@/lib/request-body'

export const dynamic = 'force-dynamic'

// 4 karakter dari Math.random() terhadap kolom @unique: tabrakan muncul sebagai
// error 500 ke pembeli, dan ruang tebakannya kecil (lihat GET di bawah).
// Sekarang 8 karakter dari CSPRNG.
const ORDER_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function generateOrderNumber(): string {
  const now = new Date()
  const y = String(now.getFullYear()).slice(-2)
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `ORD-${y}${m}${d}-${randomString(8, ORDER_ALPHABET)}`
}

/** Kode unik pembeda nominal transfer (1-999). */
function generateUniqueCode(): number {
  return (crypto.getRandomValues(new Uint32Array(1))[0] % 999) + 1
}

/**
 * Dulu hanya ada pengecekan "terisi atau tidak" (`!email || !groom_name || ...`).
 * Dua lubang yang ditutup skema ini:
 *
 * 1. Format email TIDAK pernah divalidasi. Padahal email inilah yang dipakai
 *    mengirim konfirmasi pesanan DAN menjadi akun login yang dibuatkan saat
 *    pesanan disetujui — email salah ketik berarti pembeli membayar lalu tidak
 *    pernah menerima apa pun, dan akunnya tidak bisa diakses.
 * 2. Tipe tidak pernah diperiksa. `{ "email": 123 }` lolos pengecekan presence,
 *    lalu `email.toLowerCase()` melempar TypeError -> dibalas 500, seolah
 *    server yang rusak, padahal permintaannya yang salah (harusnya 400).
 *
 * Batas panjang mengikuti pemakaian nyatanya: subdomain 63 = batas satu label
 * DNS, karena nilai ini menjadi <slug>.iaundang.online.
 *
 * Field opsional sengaja `.optional()` dan BUKAN `.default('')` — fallback
 * `|| ''` di bawah dibiarkan apa adanya supaya perilaku untuk body yang tidak
 * lengkap persis sama seperti sebelumnya.
 */
const orderSchema = z.object({
  email: z.string().email().max(200),
  phone: z.string().max(30).optional(),
  groom_name: z.string().min(1).max(100),
  bride_name: z.string().min(1).max(100),
  groom_nickname: z.string().max(100).optional(),
  bride_nickname: z.string().max(100).optional(),
  groom_father: z.string().max(100).optional(),
  groom_mother: z.string().max(100).optional(),
  bride_father: z.string().max(100).optional(),
  bride_mother: z.string().max(100).optional(),
  groom_profession: z.string().max(100).optional(),
  bride_profession: z.string().max(100).optional(),
  subdomain: z.string().min(1).max(63),
  template_id: z.string().min(1).max(100),
  package_tier: z.string().min(1).max(50),
  referred_by: z.string().max(50).nullish(),
  /** Kode kupon opsional. Divalidasi ULANG di server — nilai diskon TIDAK
   *  pernah diterima dari client. */
  coupon_code: z.string().max(40).nullish(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await readJsonBody(req)
    const parsed = orderSchema.safeParse(body)
    if (!parsed.success) {
      // Email dibedakan: itu kesalahan yang paling mungkin dilakukan pembeli
      // sungguhan (salah ketik), dan pesan umum tidak menolongnya memperbaiki.
      if (parsed.error.flatten().fieldErrors.email) {
        return NextResponse.json({ error: 'Alamat emailnya sepertinya belum benar. Coba periksa lagi ya.' }, { status: 400 })
      }
      return NextResponse.json({ error: 'Masih ada data yang belum terisi. Coba periksa lagi ya.' }, { status: 400 })
    }

    const {
      email, phone, groom_name, bride_name,
      groom_nickname, bride_nickname,
      groom_father, groom_mother, bride_father, bride_mother,
      groom_profession, bride_profession,
      subdomain, template_id, package_tier,
      referred_by, coupon_code,
    } = parsed.data

    const slug = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '')
    if (slug.length < 3) {
      return NextResponse.json({ error: 'Alamat undangan minimal 3 huruf ya.' }, { status: 400 })
    }

    const slugTaken = await invitations.slugExists(slug)
    const orderTaken = await orders.subdomainExists(slug)
    if (slugTaken || orderTaken) {
      return NextResponse.json({ error: 'Alamat undangan ini sudah dipakai pasangan lain. Coba nama lain ya.' }, { status: 409 })
    }

    // Harga DITENTUKAN SERVER, bukan dikirim client.
    //
    // Dulu `amount` diambil langsung dari body request dan tidak pernah
    // dicocokkan dengan paket mana pun — PACKAGES[package_tier] memang dimuat
    // di bawah, tapi hanya `pkg.name` yang dipakai. Kirim
    // `{ package_tier: "eksklusif", amount: 1000 }` dan pesanan Eksklusif
    // terbentuk seharga Rp 1.000; link pembayaran Mayar ikut nominal itu, dan
    // webhook mencocokkan lewat totalAmount sehingga paket penuh tetap diberikan.
    //
    // Sumber kebenaran harga adalah settings.priceTiers (bisa diubah admin),
    // BUKAN konstanta PACKAGES — kalau admin mengubah harga, keduanya berbeda.
    // Harus salah satu paket yang benar-benar bisa disediakan. settings.priceTiers
    // bisa memuat tier kustom buatan admin yang tidak ada di PACKAGES; pesanan
    // dengan tier seperti itu akan gagal saat penyediaan — setelah pelanggan
    // terlanjur membayar. Halaman /order sendiri hanya menawarkan ketiga ini.
    if (!(package_tier in PACKAGES)) {
      return NextResponse.json({ error: 'Paket yang dipilih belum kami kenali. Silakan pilih ulang paketnya.' }, { status: 400 })
    }

    const appSettings = await settings.get()
    const tier = appSettings.priceTiers.find(t => t.id === package_tier)
    if (!tier) {
      return NextResponse.json({ error: 'Paket yang dipilih belum kami kenali. Silakan pilih ulang paketnya.' }, { status: 400 })
    }
    // Template harus ada, aktif, dan boleh diakses paket yang dipilih.
    //
    // `required_package` selama ini bisa diatur admin tapi TIDAK PERNAH dicek
    // di mana pun: pembeli paket Starter bisa memesan tema yang ditandai
    // Eksklusif, dan template berstatus draft/arsip pun bisa dipesan lewat
    // tautan lama karena hanya galeri yang menyaringnya.
    const template = await templateRecords.findById(template_id)
    if (!template || template.status !== 'active') {
      return NextResponse.json(
        { error: 'Template yang dipilih sudah tidak tersedia. Silakan pilih tema lain ya.' },
        { status: 400 },
      )
    }

    const TIER_RANK: Record<string, number> = { starter: 1, popular: 2, eksklusif: 3 }
    if (template.required_package !== 'all') {
      const needed = TIER_RANK[template.required_package] ?? 0
      const chosen = TIER_RANK[package_tier] ?? 0
      if (chosen < needed) {
        const label = appSettings.priceTiers.find(t => t.id === template.required_package)?.label
          ?? template.required_package
        return NextResponse.json(
          { error: `Tema "${template.name}" tersedia mulai paket ${label}. Pilih paket itu atau tema lain ya.` },
          { status: 400 },
        )
      }
    }

    // Harga khusus per template (kalau diisi admin) menang atas harga paket.
    const basePrice = template.price > 0 ? template.price : tier.price

    /**
     * Promo DITERAPKAN DI SINI, bukan cuma ditampilkan.
     *
     * Sebelumnya flash sale hanya dihitung di halaman landing dan galeri
     * template untuk dipajang, sementara endpoint ini tidak menyebut promo
     * sama sekali: pembeli melihat "Rp 104.300 (diskon 30%)" lalu ditagih
     * Rp 149.000 penuh. Kupon bahkan tidak punya jalur sama sekali — tidak
     * ada input kodenya di mana pun dan `used_count` tidak akan pernah naik.
     *
     * computePrice() adalah fungsi YANG SAMA yang dipakai halaman publik dan
     * endpoint pengecekan kupon, jadi angka yang dilihat dan angka yang
     * ditagih tidak bisa lagi berbeda.
     */
    // Kupon yang dikirim tapi ditolak harus MENGGAGALKAN pesanan, bukan
    // diam-diam diabaikan — pembeli sudah melihat harga berdiskon di layar.
    if (coupon_code) {
      const check = checkCoupon(
        appSettings.coupons,
        coupon_code,
        { tierId: package_tier, category: template.category },
      )
      if (!check.ok) {
        return NextResponse.json({ error: check.message }, { status: 400 })
      }
    }

    const price = computePrice({
      basePrice,
      tierId: package_tier,
      category: template.category,
      flashSales: appSettings.flashSales,
      coupons: appSettings.coupons,
      couponCode: coupon_code,
    })

    const amount = price.final

    const uniqueCode = generateUniqueCode()
    const totalAmount = amount + uniqueCode

    const order = await orders.create({
      order_number: generateOrderNumber(),
      invitation_id: null,
      email: email.toLowerCase(),
      phone: phone || '',
      groom_name, bride_name,
      groom_nickname: groom_nickname || '',
      bride_nickname: bride_nickname || '',
      groom_father: groom_father || '',
      groom_mother: groom_mother || '',
      bride_father: bride_father || '',
      bride_mother: bride_mother || '',
      groom_profession: groom_profession || '',
      bride_profession: bride_profession || '',
      subdomain: slug,
      template_id,
      package_tier,
      amount,
      unique_code: uniqueCode,
      total_amount: totalAmount,
      proof_url: '',
      notes: '',
      status: 'pending',
      admin_notes: '',
      referred_by: referred_by || null,
      mayar_transaction_id: null,
      mayar_payment_link: null,
      payment_method: null,
    })

    /**
     * Kuota kupon dipakai SETELAH pesanan benar-benar terbentuk.
     *
     * Dinaikkan lebih awal berarti kuota terbakar walau pembuatan pesanannya
     * gagal. Dinaikkan lewat settings.save() penuh memang bukan operasi atomik
     * — dua pesanan yang tepat bersamaan bisa saling menimpa dan menghitung
     * satu kali saja. Itu diterima: konsekuensi terburuknya satu kupon terpakai
     * melebihi kuota, jauh lebih ringan daripada pembeli membayar lalu kuponnya
     * hangus karena pesanannya gagal dibuat.
     */
    if (price.coupon) {
      try {
        const fresh = await settings.get()
        const idx = fresh.coupons.findIndex(c => c.code === price.coupon!.code)
        if (idx >= 0) {
          fresh.coupons[idx] = { ...fresh.coupons[idx], used_count: fresh.coupons[idx].used_count + 1 }
          await settings.save(fresh)
        }
      } catch (err) {
        // Jangan menggagalkan pesanan yang sudah jadi hanya karena penghitung
        // kupon gagal naik.
        console.error('Gagal menaikkan used_count kupon:', err)
      }
    }

    runAfterResponse(
      notifyUser('order_created', order.email, {
        orderNumber: order.order_number,
        amount: order.total_amount.toLocaleString('id-ID'),
      }),
      `notifyUser(order_created) order=${order.order_number}`
    )

    // Call Mayar payment gateway
    let paymentUrl: string | null = null
    try {
      const pkg = PACKAGES[package_tier as PackageTier]
      if (pkg) {
        const expiredAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

        const mayarPayment = await createMayarPayment({
          name: `${groom_name} & ${bride_name}`,
          email: email.toLowerCase(),
          amount: totalAmount,
          mobile: phone || '08000000000',
          redirectUrl: `${appUrl}/dashboard?payment=success&order=${order.id}`,
          description: `Paket ${pkg.name} - iaundang - ${order.order_number}`,
          expiredAt,
        })

        await orders.update(order.id, {
          mayar_transaction_id: mayarPayment.transactionId,
          mayar_payment_link: mayarPayment.link,
          payment_method: 'mayar',
        })

        paymentUrl = mayarPayment.link
      }
    } catch (err) {
      console.error('Mayar payment creation failed, falling back to manual:', err)
    }

    return NextResponse.json({ order, paymentUrl }, { status: 201 })
  } catch (error) {
    console.error('Order POST error:', error)
    return NextResponse.json({ error: 'Pesanannya gagal dibuat. Coba lagi sebentar lagi ya.' }, { status: 500 })
  }
}

/**
 * Lacak pesanan. Sengaja tanpa login (pembeli belum punya akun sampai
 * pesanannya disetujui), tapi sekarang WAJIB menyertakan email juga.
 *
 * Dulu order_number saja sudah cukup. Nomornya berbentuk
 * ORD-YYMMDD-XXXX dengan 4 karakter base36 dari Math.random() — sekitar 1,7 juta
 * kemungkinan per tanggal yang sudah diketahui, gampang di-brute force. Setiap
 * tebakan yang tepat mengembalikan email, telepon, serta nama dan pekerjaan
 * orang tua kedua mempelai.
 *
 * Email berfungsi sebagai faktor kedua: pembeli tahu keduanya, penebak tidak.
 */
export async function GET(req: NextRequest) {
  const orderNumber = req.nextUrl.searchParams.get('order_number')
  const email = req.nextUrl.searchParams.get('email')

  if (!orderNumber || !email) {
    return NextResponse.json({ error: 'Nomor pesanan dan email keduanya wajib diisi.' }, { status: 400 })
  }

  const order = await orders.findByOrderNumber(orderNumber)

  // Pesan dan status yang sama untuk "tidak ada" maupun "email tidak cocok",
  // supaya tidak bisa dipakai memastikan sebuah nomor pesanan itu ada.
  if (!order || order.email.toLowerCase() !== email.trim().toLowerCase()) {
    return NextResponse.json({ error: 'Pesanannya tidak ditemukan. Coba periksa lagi nomor pesanan dan emailnya.' }, { status: 404 })
  }

  return NextResponse.json({ order })
}
