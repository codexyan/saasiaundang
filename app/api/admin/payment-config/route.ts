import { NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/route-guards'
import { settings } from '@/lib/db'
import { readJsonBody } from '@/lib/request-body'

export const dynamic = 'force-dynamic'


export const GET = withAdminAuth(async () => {
  const s = await settings.get()
  return NextResponse.json({
    bankAccounts: s.bankAccounts,
    qrisImageUrl: s.qrisImageUrl,
    paymentInstructions: s.paymentInstructions,
    confirmationWhatsapp: s.confirmationWhatsapp,
  })
})

export const PATCH = withAdminAuth(async (req) => {
  const body = await readJsonBody(req)
  const s = await settings.get()

  if (body.bankAccounts !== undefined) s.bankAccounts = body.bankAccounts
  if (body.qrisImageUrl !== undefined) s.qrisImageUrl = body.qrisImageUrl
  if (body.paymentInstructions !== undefined) s.paymentInstructions = body.paymentInstructions
  if (body.confirmationWhatsapp !== undefined) s.confirmationWhatsapp = body.confirmationWhatsapp

  await settings.save(s)
  return NextResponse.json({ success: true })
})
