import { NextRequest, NextResponse } from 'next/server'
import { orders, invitations } from '@/lib/db'
import { notifyUser } from '@/lib/notifications'
import { runAfterResponse } from '@/lib/after-response'
import { createMayarPayment } from '@/lib/mayar'
import { PACKAGES, type PackageTier } from '@/lib/packages'

export const dynamic = 'force-dynamic'

function generateOrderNumber(): string {
  const now = new Date()
  const y = String(now.getFullYear()).slice(-2)
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `ORD-${y}${m}${d}-${rand}`
}

function generateUniqueCode(): number {
  return Math.floor(Math.random() * 999) + 1
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      email, phone, groom_name, bride_name,
      groom_nickname, bride_nickname,
      groom_father, groom_mother, bride_father, bride_mother,
      groom_profession, bride_profession,
      subdomain, template_id, package_tier, amount,
      referred_by,
    } = body

    if (!email || !groom_name || !bride_name || !subdomain || !template_id || !package_tier || !amount) {
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

    const uniqueCode = generateUniqueCode()
    const totalAmount = Number(amount) + uniqueCode

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
      amount: Number(amount),
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

export async function GET(req: NextRequest) {
  const orderNumber = req.nextUrl.searchParams.get('order_number')
  if (!orderNumber) return NextResponse.json({ error: 'order_number required' }, { status: 400 })

  const order = await orders.findByOrderNumber(orderNumber)
  if (!order) return NextResponse.json({ error: 'Pesanan tidak ditemukan' }, { status: 404 })

  return NextResponse.json({ order })
}
