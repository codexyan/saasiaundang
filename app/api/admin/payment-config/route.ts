import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session-server'
import { isAdmin } from '@/lib/auth'
import { settings } from '@/lib/db'
import { readJsonBody } from '@/lib/request-body'

export const dynamic = 'force-dynamic'


export async function GET() {
  const session = await getSession()
  if (!isAdmin(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const s = await settings.get()
  return NextResponse.json({
    bankAccounts: s.bankAccounts,
    qrisImageUrl: s.qrisImageUrl,
    paymentInstructions: s.paymentInstructions,
    confirmationWhatsapp: s.confirmationWhatsapp,
  })
}

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!isAdmin(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await readJsonBody(req)
  const s = await settings.get()

  if (body.bankAccounts !== undefined) s.bankAccounts = body.bankAccounts
  if (body.qrisImageUrl !== undefined) s.qrisImageUrl = body.qrisImageUrl
  if (body.paymentInstructions !== undefined) s.paymentInstructions = body.paymentInstructions
  if (body.confirmationWhatsapp !== undefined) s.confirmationWhatsapp = body.confirmationWhatsapp

  await settings.save(s)
  return NextResponse.json({ success: true })
}
