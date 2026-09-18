import { settings } from '@/lib/db'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Syarat dan Ketentuan | iaundang',
  description: 'Syarat dan ketentuan penggunaan layanan undangan digital iaundang, termasuk pembayaran, masa aktif, dan kebijakan refund.',
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="font-display text-h2 text-forest-deep mt-10 mb-3 scroll-mt-24">{children}</h2>
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="text-body-lg text-concrete leading-[1.75] mb-3">{children}</p>
}
function UL({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc pl-5 space-y-1.5 text-body-lg text-concrete leading-[1.7] mb-3">{children}</ul>
}

export default async function TermsPage() {
  const appSettings = await settings.get()
  // Tanpa nilai cadangan. Nomor contoh yang dulu dipakai di sini menuju ruang
  // kosong, dan kontak palsu lebih merusak kepercayaan daripada kontak yang
  // tidak ditampilkan (D-9).
  const wa = appSettings.confirmationWhatsapp || ''

  return (
    <div className="min-h-screen bg-ivory pt-28 pb-24">
      <div className="max-w-3xl mx-auto px-5 sm:px-8">

        {/* Header */}
        <p className="text-eyebrow text-concrete mb-3">Syarat dan Ketentuan</p>
        <h1 className="font-display text-display-md text-forest-deep text-balance">Ketentuan penggunaan layanan</h1>
        <p className="text-body-xs text-concrete mt-4">Terakhir diperbarui: 30 Juni 2026</p>

        <div className="mt-8 border-t border-hairline pt-8">

          <P>
            Dengan membuat akun atau menggunakan layanan iaundang, Anda menyetujui syarat dan
            ketentuan berikut. Mohon dibaca dengan saksama. Jika Anda tidak setuju dengan salah satu
            ketentuan ini, sebaiknya hentikan penggunaan layanan kami.
          </P>

          <H2>Tentang Layanan</H2>
          <P>
            iaundang adalah platform undangan pernikahan digital. Kami menyediakan template undangan,
            alamat undangan pribadi (subdomain), serta fitur seperti konfirmasi kehadiran (RSVP),
            buku ucapan, galeri foto, musik latar, dan personalisasi nama tamu. Cakupan fitur
            mengikuti paket yang Anda pilih.
          </P>

          <H2>Akun Pengguna</H2>
          <UL>
            <li>Anda harus berusia minimal 17 tahun atau memiliki izin wali untuk membuat akun.</li>
            <li>Anda wajib memberikan data yang benar dan menjaganya tetap mutakhir.</li>
            <li>Anda bertanggung jawab menjaga kerahasiaan password dan seluruh aktivitas pada akun Anda.</li>
          </UL>

          <H2>Pemesanan dan Pembayaran</H2>
          <UL>
            <li>Harga yang tercantum sudah final dan jelas. Tidak ada biaya tersembunyi.</li>
            <li>Pembayaran dapat dilakukan melalui Mayar (otomatis, seperti QRIS dan e-wallet) atau transfer bank manual.</li>
            <li>Layanan bersifat sekali bayar untuk satu masa aktif, bukan langganan yang menagih berulang.</li>
            <li>Undangan aktif secara otomatis setelah pembayaran terverifikasi.</li>
          </UL>

          <H2>Pembatalan dan Pengembalian Dana</H2>
          <P>
            Jika Anda membatalkan sebelum undangan dipublikasikan dan dibagikan ke tamu, Anda berhak
            atas pengembalian dana penuh. Setelah undangan dipublikasikan dan dibagikan, pengembalian
            dana tidak berlaku, kecuali terjadi kesalahan teknis dari pihak kami yang membuat layanan
            tidak dapat digunakan. Untuk mengajukan pembatalan, hubungi tim support kami.
          </P>

          <H2>Masa Aktif dan Perpanjangan</H2>
          <P>
            Masa aktif undangan mengikuti paket yang dipilih dan tertera di halaman harga. Setelah
            masa aktif berakhir, undangan tidak lagi dapat diakses oleh tamu sampai Anda
            memperpanjangnya kembali.
          </P>

          <H2>Konten Pengguna</H2>
          <UL>
            <li>Anda bertanggung jawab penuh atas kebenaran dan legalitas konten yang Anda unggah, termasuk foto, nama, dan informasi acara.</li>
            <li>Kami berhak menghapus konten yang melanggar hukum atau norma kesopanan tanpa pemberitahuan terlebih dahulu.</li>
          </UL>

          <H2>Hak Kekayaan Intelektual</H2>
          <P>
            Seluruh template dan desain merupakan milik iaundang dan dilisensikan untuk Anda gunakan
            selama masa aktif paket. Konten yang Anda unggah, seperti foto dan teks, tetap menjadi
            milik Anda. Anda memberi kami izin terbatas untuk menyimpan dan menampilkannya hanya
            untuk menjalankan layanan undangan Anda.
          </P>

          <H2>Batasan Tanggung Jawab</H2>
          <P>
            Kami berupaya menjaga layanan tetap dapat diakses, namun kami tidak dapat menjamin
            layanan berjalan 100 persen tanpa gangguan setiap saat. Kami juga tidak bertanggung jawab
            atas kerugian yang timbul akibat penyalahgunaan akun oleh pihak lain, misalnya karena
            password bocor akibat kelalaian Anda dalam menjaganya.
          </P>

          <H2>Penghentian Layanan</H2>
          <P>
            Kami berhak menonaktifkan atau menutup akun yang terbukti melanggar syarat dan ketentuan
            ini. Bila memungkinkan, kami akan memberi tahu Anda terlebih dahulu beserta alasannya.
          </P>

          <H2>Perubahan Ketentuan</H2>
          <P>
            Syarat dan ketentuan ini dapat kami perbarui sewaktu-waktu. Untuk perubahan yang
            signifikan, kami akan memberi tahu Anda melalui email atau pemberitahuan di dalam
            aplikasi.
          </P>

          <H2>Hukum yang Berlaku</H2>
          <P>
            Syarat dan ketentuan ini tunduk pada hukum yang berlaku di Republik Indonesia.
          </P>

          <H2>Hubungi Kami</H2>
          <P>Untuk pertanyaan seputar ketentuan ini, hubungi kami:</P>
          <UL>
            <li>Email: <a href="mailto:halo@iaundang.online" className="text-graphite font-medium underline underline-offset-2">halo@iaundang.online</a></li>
            {wa && <li>WhatsApp: <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" className="text-graphite font-medium underline underline-offset-2">+{wa}</a></li>}
          </UL>

        </div>
      </div>
    </div>
  )
}
