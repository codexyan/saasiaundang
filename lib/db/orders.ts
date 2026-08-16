import { prisma } from '../prisma'
import type { Order } from '../types'

// Tipe baris Prisma dirujuk inline (pola yang sama dipakai di seluruh file
// ini untuk Prisma.JsonValue dkk) supaya tidak bentrok nama dengan `Order`
// lokal dari ./types yang sudah diimpor di atas. Ini satu-satunya dari 17
// fungsi mapXxx yang dulu parameternya `any` — kebetulan justru yang
// menangani data uang/pesanan.
function mapOrder(o: import('@prisma/client').Order): Order {
  return {
    id: o.id, order_number: o.orderNumber, invitation_id: o.invitationId ?? null,
    email: o.email, phone: o.phone,
    groom_name: o.groomName, bride_name: o.brideName,
    groom_nickname: o.groomNickname, bride_nickname: o.brideNickname,
    groom_father: o.groomFather, groom_mother: o.groomMother,
    bride_father: o.brideFather, bride_mother: o.brideMother,
    groom_profession: o.groomProfession, bride_profession: o.brideProfession,
    subdomain: o.subdomain, template_id: o.templateId, package_tier: o.packageTier,
    amount: o.amount, unique_code: o.uniqueCode, total_amount: o.totalAmount,
    proof_url: o.proofUrl, notes: o.notes,
    status: o.status as Order['status'], admin_notes: o.adminNotes,
    referred_by: o.referredBy ?? null,
    mayar_transaction_id: o.mayarTransactionId ?? null,
    mayar_payment_link: o.mayarPaymentLink ?? null,
    payment_method: o.paymentMethod ?? null,
    created_at: o.createdAt instanceof Date ? o.createdAt.toISOString() : o.createdAt,
    reviewed_at: o.reviewedAt instanceof Date ? o.reviewedAt.toISOString() : o.reviewedAt ?? null,
  }
}

//  ORDERS

export const orders = {
  // take:200 — lihat catatan di invitations.findAll() di atas.
  async findAll(): Promise<Order[]> {
    const all = await prisma.order.findMany({ orderBy: { createdAt: 'desc' }, take: 200 })
    return all.map(mapOrder)
  },
  async findById(id: string): Promise<Order | null> {
    const o = await prisma.order.findUnique({ where: { id } })
    return o ? mapOrder(o) : null
  },
  async findByEmail(email: string): Promise<Order[]> {
    const all = await prisma.order.findMany({ where: { email: email.toLowerCase() }, orderBy: { createdAt: 'desc' } })
    return all.map(mapOrder)
  },
  async findByOrderNumber(orderNumber: string): Promise<Order | null> {
    const o = await prisma.order.findUnique({ where: { orderNumber } })
    return o ? mapOrder(o) : null
  },
  async create(data: Omit<Order, 'id' | 'created_at' | 'reviewed_at'>): Promise<Order> {
    const o = await prisma.order.create({
      data: {
        orderNumber: data.order_number, email: data.email.toLowerCase(), phone: data.phone,
        groomName: data.groom_name, brideName: data.bride_name,
        groomNickname: data.groom_nickname, brideNickname: data.bride_nickname,
        groomFather: data.groom_father, groomMother: data.groom_mother,
        brideFather: data.bride_father, brideMother: data.bride_mother,
        groomProfession: data.groom_profession, brideProfession: data.bride_profession,
        subdomain: data.subdomain, templateId: data.template_id, packageTier: data.package_tier,
        amount: data.amount, uniqueCode: data.unique_code, totalAmount: data.total_amount,
        proofUrl: data.proof_url, notes: data.notes,
        status: data.status, adminNotes: data.admin_notes,
        referredBy: data.referred_by,
        mayarTransactionId: data.mayar_transaction_id,
        mayarPaymentLink: data.mayar_payment_link,
        paymentMethod: data.payment_method,
      },
    })
    return mapOrder(o)
  },
  async update(id: string, data: Partial<Order>): Promise<Order | null> {
    try {
      const o = await prisma.order.update({
        where: { id },
        data: {
          ...(data.status !== undefined && { status: data.status }),
          ...(data.admin_notes !== undefined && { adminNotes: data.admin_notes }),
          ...(data.proof_url !== undefined && { proofUrl: data.proof_url }),
          ...(data.invitation_id !== undefined && { invitationId: data.invitation_id }),
          ...(data.mayar_transaction_id !== undefined && { mayarTransactionId: data.mayar_transaction_id }),
          ...(data.mayar_payment_link !== undefined && { mayarPaymentLink: data.mayar_payment_link }),
          ...(data.payment_method !== undefined && { paymentMethod: data.payment_method }),
          ...(data.reviewed_at !== undefined && { reviewedAt: data.reviewed_at ? new Date(data.reviewed_at) : null }),
        },
      })
      return mapOrder(o)
    } catch { return null }
  },
  async subdomainExists(subdomain: string): Promise<boolean> {
    const count = await prisma.order.count({ where: { subdomain, status: { in: ['pending', 'paid', 'approved'] } } })
    return count > 0
  },
}
