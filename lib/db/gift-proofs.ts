import { prisma } from '../prisma'

//  GIFT PROOFS

export interface GiftProofRecord {
  id: string
  invitation_id: string
  name: string
  proof_url: string
  created_at: string
}

export const giftProofs = {
  async create(data: { invitation_id: string; name: string; proof_url: string }): Promise<GiftProofRecord> {
    const r = await prisma.giftProof.create({
      data: { invitationId: data.invitation_id, name: data.name, proofUrl: data.proof_url },
    })
    return { id: r.id, invitation_id: r.invitationId, name: r.name, proof_url: r.proofUrl, created_at: r.createdAt.toISOString() }
  },
  async findByInvitationId(invitationId: string): Promise<GiftProofRecord[]> {
    const all = await prisma.giftProof.findMany({ where: { invitationId }, orderBy: { createdAt: 'desc' } })
    return all.map((r) => ({
      id: r.id, invitation_id: r.invitationId, name: r.name, proof_url: r.proofUrl, created_at: r.createdAt.toISOString(),
    }))
  },
}
