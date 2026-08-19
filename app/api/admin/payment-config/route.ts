import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withAdminAuth } from '@/lib/route-guards'
import { settings } from '@/lib/db'
import { readJsonBody } from '@/lib/request-body'

export const dynamic = 'force-dynamic'

/**
 * Rekening dan instruksi pembayaran.
 *
 * Divalidasi ketat karena isinya DITAMPILKAN KE PEMBELI sebagai tujuan
 * transfer. Sebelumnya body diteruskan apa adanya: `bankAccounts` bisa berisi
 * bentuk apa pun tanpa batas panjang, dan halaman pembayaran merendernya
 * mentah-mentah.
 */
const bankAccountSchema = z.object({
  id: z.string().min(1).max(64),
  bankName: z.string().trim().min(1).max(60),
  accountNumber: z.string().trim().min(1).max(40),
  accountName: z.string().trim().min(1).max(80),
  logoUrl: z.string().trim().max(2000),
  isActive: z.boolean(),
})

const configSchema = z.object({
  bankAccounts: z.array(bankAccountSchema).max(20),
  qrisImageUrl: z.string().trim().max(2000),
  paymentInstructions: z.string().max(5000),
  confirmationWhatsapp: z.string().trim().max(30),
}).partial()

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
  const parsed = configSchema.safeParse(await readJsonBody(req))
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Data pembayaran tidak valid' },
      { status: 400 },
    )
  }

  // Baca-ubah-simpan dalam satu request: settings.save() menulis satu baris
  // utuh, jadi nilainya harus segar. settings.get() di-cache per request, dan
  // tidak ada pemanggil lain yang menyimpan lebih dulu di request yang sama.
  const s = await settings.get()
  const p = parsed.data

  if (p.bankAccounts !== undefined) s.bankAccounts = p.bankAccounts
  if (p.qrisImageUrl !== undefined) s.qrisImageUrl = p.qrisImageUrl
  if (p.paymentInstructions !== undefined) s.paymentInstructions = p.paymentInstructions
  if (p.confirmationWhatsapp !== undefined) s.confirmationWhatsapp = p.confirmationWhatsapp

  await settings.save(s)
  return NextResponse.json({ success: true })
})
