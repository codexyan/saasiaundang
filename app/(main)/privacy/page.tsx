import { settings } from '@/lib/db'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Kebijakan Privasi | iaundang',
  description: 'Bagaimana iaundang mengumpulkan, menggunakan, dan melindungi data Anda. Kami tidak pernah menjual data tamu dan selalu memberi cara menghapus akun.',
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

export default async function PrivacyPage() {
  const appSettings = await settings.get()
  const wa = appSettings.confirmationWhatsapp || '628123456789'

  return (
    <div className="min-h-screen bg-ivory pt-28 pb-24">
      <div className="max-w-3xl mx-auto px-5 sm:px-8">

        {/* Header */}
        <p className="text-eyebrow text-concrete mb-3">Kebijakan Privasi</p>
        <h1 className="font-display text-display-md text-forest-deep text-balance">Privasi Anda, prioritas kami</h1>
        <p className="text-body-xs text-concrete mt-4">Terakhir diperbarui: 30 Juni 2026</p>

        <div className="mt-8 border-t border-hairline pt-8">

          <P>
            iaundang adalah platform undangan pernikahan digital asal Indonesia. Kebijakan ini
            menjelaskan data apa yang kami kumpulkan saat Anda menggunakan layanan kami, bagaimana
            kami memakainya, dan hak yang Anda miliki atas data tersebut. Kebijakan ini berlaku sejak
            Anda mulai menggunakan situs, dashboard, maupun undangan yang dibuat melalui iaundang.
          </P>

          <H2>Data yang Kami Kumpulkan</H2>
          <P>Kami hanya mengumpulkan data yang benar-benar diperlukan untuk menjalankan layanan:</P>
          <UL>
            <li><strong>Data akun</strong>: alamat email dan nomor WhatsApp yang Anda daftarkan untuk login dan menerima notifikasi.</li>
            <li><strong>Data undangan</strong>: nama mempelai, tanggal dan lokasi acara, serta foto yang Anda unggah ke undangan.</li>
            <li><strong>Data tamu</strong>: nama tamu yang Anda masukkan untuk personalisasi, konfirmasi kehadiran (RSVP), dan ucapan yang ditulis tamu di undangan.</li>
            <li><strong>Data teknis</strong>: statistik kunjungan undangan, alamat IP, dan jenis perangkat. Ini kami gunakan untuk statistik dasar dan menjaga keamanan, bukan untuk melacak individu.</li>
          </UL>

          <H2>Bagaimana Kami Menggunakan Data</H2>
          <UL>
            <li>Mengoperasikan dan menampilkan undangan Anda kepada tamu.</li>
            <li>Mengirim notifikasi terkait pesanan, pembayaran, dan status undangan melalui email atau WhatsApp.</li>
            <li>Memperbaiki layanan melalui analitik agregat, bukan dengan menelaah data pribadi satu per satu.</li>
          </UL>

          <H2>Yang Tidak Kami Lakukan</H2>
          <P>Ada batas yang tidak akan pernah kami lewati:</P>
          <UL>
            <li>Kami tidak pernah menjual data pribadi Anda maupun data tamu ke pihak mana pun.</li>
            <li>Kami tidak menampilkan iklan pihak ketiga di dalam undangan Anda.</li>
            <li>Kami tidak membagikan data tamu untuk kepentingan pemasaran pihak lain.</li>
          </UL>

          <H2>Penyimpanan dan Keamanan Data</H2>
          <P>
            Data Anda disimpan di pusat data yang terlindungi dan terenkripsi. Password tidak pernah
            kami simpan apa adanya, melainkan diacak lebih dulu sehingga tidak bisa dibaca kembali,
            bahkan oleh tim kami sendiri.
          </P>

          <H2>Pihak Ketiga yang Terlibat</H2>
          <P>Untuk menjalankan layanan, kami bekerja sama dengan beberapa penyedia tepercaya:</P>
          <UL>
            <li><strong>Mayar</strong>, untuk memproses pembayaran.</li>
            <li><strong>Resend</strong>, untuk mengirim email notifikasi.</li>
            <li><strong>Supabase</strong>, untuk penyimpanan data dan file.</li>
          </UL>
          <P>Kami hanya membagikan data seperlunya kepada mereka, sebatas yang dibutuhkan untuk menjalankan fungsinya.</P>

          <H2>Hak Anda</H2>
          <UL>
            <li>Mengakses data pribadi yang kami simpan tentang Anda.</li>
            <li>Meminta penghapusan akun beserta seluruh datanya, baik melalui menu Pengaturan di dashboard maupun dengan menghubungi tim support kami.</li>
            <li>Mengoreksi data yang tidak akurat kapan saja.</li>
          </UL>

          <H2>Data Tamu Undangan</H2>
          <P>
            Data tamu seperti nama, RSVP, dan ucapan dimasukkan oleh pemilik undangan, bukan kami
            kumpulkan langsung dari tamu. Sebagai pemilik undangan, Anda bertanggung jawab atas
            kebenaran data tamu yang Anda masukkan serta memastikan Anda berhak menggunakannya.
          </P>

          <H2>Retensi Data</H2>
          <P>
            Selama undangan Anda aktif, datanya tetap tersimpan. Setelah masa aktif berakhir, kami
            memberi tenggang (grace period) agar Anda sempat memperpanjang atau mengunduh kenangan.
            Jika tidak diperpanjang, data undangan disimpan hingga 12 bulan setelah masa aktif
            berakhir, lalu dihapus secara permanen. Anda juga dapat meminta penghapusan lebih awal
            kapan saja.
          </P>

          <H2>Perubahan Kebijakan</H2>
          <P>
            Kebijakan ini dapat kami perbarui dari waktu ke waktu. Untuk perubahan yang signifikan,
            kami akan memberi tahu Anda melalui email atau pemberitahuan di dalam aplikasi.
          </P>

          <H2>Hubungi Kami</H2>
          <P>Jika ada pertanyaan tentang privasi atau data Anda, hubungi kami:</P>
          <UL>
            <li>Email: <a href="mailto:halo@iaundang.online" className="text-graphite font-medium underline underline-offset-2">halo@iaundang.online</a></li>
            <li>WhatsApp: <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" className="text-graphite font-medium underline underline-offset-2">+{wa}</a></li>
          </UL>

          <H2>Dasar Hukum</H2>
          <P>
            Kebijakan privasi ini disusun dengan mengacu pada Undang-Undang Nomor 27 Tahun 2022
            tentang Pelindungan Data Pribadi (UU PDP) serta Undang-Undang Informasi dan Transaksi
            Elektronik (UU ITE) beserta perubahannya.
          </P>

        </div>
      </div>
    </div>
  )
}
