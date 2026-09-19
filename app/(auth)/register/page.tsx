import { permanentRedirect } from 'next/navigation'

/**
 * Pendaftaran mandiri ditutup.
 *
 * Dulu halaman ini ("Daftar Gratis") membuat akun lewat POST
 * /api/auth/register lalu langsung membuka dashboard tanpa pembelian apa pun,
 * lengkap dengan janji "Coba dulu sepuasnya, bayar saat siap publish". Itu
 * bertentangan dengan keputusan produk: akun hanya lahir dari pembelian lewat
 * provision-order.ts, dan pratinjau gratis ada di /demo/renderer tanpa akun.
 * Endpoint API-nya ikut dihapus, karena menutup halamannya saja masih
 * membiarkan siapa pun membuat akun lewat panggilan langsung.
 *
 * Halaman ini tidak ditautkan dari mana pun, tapi masih bisa dibuka lewat URL
 * langsung atau hasil indeks lama, jadi diarahkan permanen ke galeri template.
 */
export default function RegisterPage() {
  permanentRedirect('/templates')
}
