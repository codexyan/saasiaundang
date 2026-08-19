/**
 * Bentuk data admin yang dipakai lintas tab.
 *
 * Dipisah dari AdminPanel.tsx supaya tab yang berdiri sendiri tidak perlu
 * mengimpor kerangka panelnya hanya untuk mendapatkan satu tipe.
 */

export interface AdminOrder {
  id: string
  order_number: string
  email: string
  phone: string
  groom_name: string
  bride_name: string
  groom_nickname: string
  bride_nickname: string
  subdomain: string
  template_id: string
  package_tier: string
  amount: number
  unique_code: number
  total_amount: number
  proof_url: string
  notes: string
  status: string
  admin_notes: string
  payment_method: string | null
  created_at: string
  reviewed_at: string | null
}
