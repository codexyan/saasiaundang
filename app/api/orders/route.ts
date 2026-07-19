import { NextRequest, NextResponse } from 'next/server'
import { orders, invitations, settings } from '@/lib/db'
import { notifyUser } from '@/lib/notifications'
import { runAfterResponse } from '@/lib/after-response'
import { randomString } from '@/lib/random'
import { createMayarPayment } from '@/lib/mayar'
import { PACKAGES, type PackageTier } from '@/lib/packages'
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

export async function POST(req: NextRequest) {
  try {
    const body = await readJsonBody(req)
    const {
      email, phone, groom_name, bride_name,
      groom_nickname, bride_nickname,
      groom_father, groom_mother, bride_father, bride_mother,
      groom_profession, bride_profession,
      subdomain, template_id, package_tier,
      referred_by,
    } = body

    if (!email || !groom_name || !bride_name || !subdomain || !template_id || !package_tier) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 })
    }

    const slug = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '')
    if (slug.length < 3) {
      return NextResponse.json({ error: 'Subdomain minimal 3 karakter' }, { status: 400 })
    }

    const slugTaken = await invitations.slugExists(slug)
    const orderTaken = await orders.subdomainExists(slug)
    if (slugTaken || orderTaken) {
      return NextResponse.json({ error: 'Subdomain sudah digunakan' }, { status: 409 })
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
    const appSettings = await settings.get()
    const tier = appSettings.priceTiers.find(t => t.id === package_tier)
    if (!tier) {
      return NextResponse.json({ error: 'Paket tidak valid' }, { status: 400 })
    }
    const amount = tier.price

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
    return NextResponse.json({ error: 'Gagal membuat pesanan' }, { status: 500 })
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
    return NextResponse.json({ error: 'order_number dan email wajib diisi' }, { status: 400 })
  }

  const order = await orders.findByOrderNumber(orderNumber)

  // Pesan dan status yang sama untuk "tidak ada" maupun "email tidak cocok",
  // supaya tidak bisa dipakai memastikan sebuah nomor pesanan itu ada.
  if (!order || order.email.toLowerCase() !== email.trim().toLowerCase()) {
    return NextResponse.json({ error: 'Pesanan tidak ditemukan' }, { status: 404 })
  }

  return NextResponse.json({ order })
}
