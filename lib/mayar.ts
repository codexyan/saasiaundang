import { secureEquals } from './secure-compare'

const MAYAR_API_URL = 'https://api.mayar.id/hl/v1'

// Dibaca LAZY, bukan di module scope: di Cloudflare Workers module scope
// dievaluasi saat isolate start — sebelum ada request — dan secret runtime
// belum tersedia di titik itu, sehingga `process.env.X!` akan undefined selamanya.
function mayarApiKey(): string {
  const key = process.env.MAYAR_API_KEY
  if (!key) throw new Error('MAYAR_API_KEY belum diset.')
  return key
}

export interface MayarPaymentRequest {
  name: string
  email: string
  amount: number
  mobile: string
  redirectUrl: string
  description: string
  expiredAt: string
}

export interface MayarPaymentResponse {
  id: string
  transactionId: string
  link: string
}

export async function createMayarPayment(
  req: MayarPaymentRequest
): Promise<MayarPaymentResponse> {
  const res = await fetch(`${MAYAR_API_URL}/payment/create`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${mayarApiKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(req),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Mayar API error: ${res.status} ${err}`)
  }

  const json = await res.json()
  return json.data as MayarPaymentResponse
}

/**
 * Dulu: `token === MAYAR_WEBHOOK_TOKEN`.
 * .env.example mengirim MAYAR_WEBHOOK_TOKEN="" dan route webhook mengubah
 * header yang hilang jadi ''. Hasilnya `'' === ''` -> true: siapa pun bisa
 * mengirim event `payment.received` palsu dan mendapat langganan berbayar
 * gratis. secureEquals menolak nilai kosong dan waktunya konstan.
 */
export async function verifyMayarWebhook(token: string | null | undefined): Promise<boolean> {
  return secureEquals(token, process.env.MAYAR_WEBHOOK_TOKEN)
}
