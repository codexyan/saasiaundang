import { prisma } from '../prisma'

export interface PaymentProof {
  id: string
  invitation_id: string
  user_id: string
  user_email: string
  slug: string
  amount: number
  bank_name: string
  transfer_date: string
  proof_url: string
  notes: string
  status: 'pending' | 'approved' | 'rejected'
  admin_notes: string
  created_at: string
  reviewed_at: string | null
}

function mapPaymentProof(p: {
  id: string; invitationId: string; userId: string; userEmail: string; slug: string;
  amount: number; bankName: string; transferDate: string; proofUrl: string; notes: string;
  status: string; adminNotes: string; createdAt: Date; reviewedAt: Date | null
}): PaymentProof {
  return {
    id: p.id, invitation_id: p.invitationId, user_id: p.userId, user_email: p.userEmail,
    slug: p.slug, amount: p.amount, bank_name: p.bankName, transfer_date: p.transferDate,
    proof_url: p.proofUrl, notes: p.notes, status: p.status as PaymentProof['status'],
    admin_notes: p.adminNotes, created_at: p.createdAt.toISOString(),
    reviewed_at: p.reviewedAt ? p.reviewedAt.toISOString() : null,
  }
}

//  PAYMENT PROOFS

export const paymentProofs = {
  // take:200 — lihat catatan di invitations.findAll() di atas.
  async findAll(): Promise<PaymentProof[]> {
    const all = await prisma.paymentProof.findMany({ orderBy: { createdAt: 'desc' }, take: 200 })
    return all.map(mapPaymentProof)
  },
  async findByUserId(userId: string): Promise<PaymentProof[]> {
    const all = await prisma.paymentProof.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } })
    return all.map(mapPaymentProof)
  },
  async findByInvitationId(invitationId: string): Promise<PaymentProof[]> {
    const all = await prisma.paymentProof.findMany({ where: { invitationId }, orderBy: { createdAt: 'desc' } })
    return all.map(mapPaymentProof)
  },
  async findById(id: string): Promise<PaymentProof | null> {
    const p = await prisma.paymentProof.findUnique({ where: { id } })
    return p ? mapPaymentProof(p) : null
  },
  /**
   * Ubah status HANYA kalau masih 'pending'. Mengembalikan null kalau sudah
   * pernah diproses.
   *
   * Guard-nya ada di dalam `where` supaya atomik: hanya satu pemanggil yang
   * bisa memenangkan transisi. Dulu route menulis status tanpa syarat lalu
   * menjalankan efek sampingnya, jadi menyetujui bukti yang sama dua kali
   * membuat DUA baris langganan dan membayar komisi afiliasi DUA KALI.
   */
  async review(
    id: string,
    status: 'approved' | 'rejected',
    adminNotes: string
  ): Promise<PaymentProof | null> {
    const claimed = await prisma.paymentProof.updateMany({
      where: { id, status: 'pending' },
      data: { status, adminNotes, reviewedAt: new Date() },
    })
    if (claimed.count === 0) return null
    const p = await prisma.paymentProof.findUnique({ where: { id } })
    return p ? mapPaymentProof(p) : null
  },
  async create(data: Omit<PaymentProof, 'id' | 'created_at' | 'reviewed_at'>): Promise<PaymentProof> {
    const p = await prisma.paymentProof.create({
      data: {
        invitationId: data.invitation_id, userId: data.user_id, userEmail: data.user_email,
        slug: data.slug, amount: data.amount, bankName: data.bank_name,
        transferDate: data.transfer_date, proofUrl: data.proof_url, notes: data.notes,
        status: data.status, adminNotes: data.admin_notes,
      },
    })
    return mapPaymentProof(p)
  },
  async update(id: string, data: Partial<PaymentProof>): Promise<PaymentProof | null> {
    try {
      const p = await prisma.paymentProof.update({
        where: { id },
        data: {
          ...(data.status !== undefined && { status: data.status }),
          ...(data.admin_notes !== undefined && { adminNotes: data.admin_notes }),
          ...(data.reviewed_at !== undefined && { reviewedAt: data.reviewed_at ? new Date(data.reviewed_at) : null }),
          ...(data.proof_url !== undefined && { proofUrl: data.proof_url }),
          ...(data.amount !== undefined && { amount: data.amount }),
          ...(data.bank_name !== undefined && { bankName: data.bank_name }),
          ...(data.transfer_date !== undefined && { transferDate: data.transfer_date }),
          ...(data.notes !== undefined && { notes: data.notes }),
        },
      })
      return mapPaymentProof(p)
    } catch {
      return null
    }
  },
}
