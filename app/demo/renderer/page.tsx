import { notFound } from 'next/navigation'
import { templateRecords } from '@/lib/db'
import JAVANESE_GOLD from '@/lib/template-configs/javanese-gold'
import DemoShell from './DemoShell'
import DemoEditorClient from './DemoEditorClient'
import type { NewInvitationData, Wish } from '@/lib/types'

interface Props {
  searchParams: Promise<{ id?: string }>
}

export const dynamic = 'force-dynamic'

export async function generateMetadata(props: Props) {
  const searchParams = await props.searchParams;
  if (!searchParams.id) return { title: 'Demo Tema - iaundang' }
  const rec = await templateRecords.findById(searchParams.id)
  return { title: `Preview: ${rec?.name ?? 'Tema'} - iaundang` }
}

const DEMO_DATA: NewInvitationData = {
  groom_name: 'Ikhwal',
  bride_name: 'Fani',
  bride_parents: 'Bapak & Ibu Santoso',
  groom_parents: 'Bapak & Ibu Wijaya',
  groom_photo_url: 'https://images.unsplash.com/photo-1526922782478-4946233fabf5?w=400&h=500&fit=crop&crop=face',
  bride_photo_url: 'https://images.unsplash.com/photo-1492175742197-ed20dc5a6bed?w=400&h=500&fit=crop&crop=face',
  couple_photo_url: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=600&h=800&fit=crop',
  groom_bio: 'Seorang arsitek yang percaya bahwa keindahan sejati terletak pada kesederhanaan.',
  bride_bio: 'Dokter muda yang menemukan kebahagiaan dalam merawat dan menyayangi sesama.',
  tagline: 'Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu pasangan-pasangan dari jenismu sendiri.',
  story_title: 'Kisah Kami',
  story_text: 'Pertemuan sederhana yang ternyata menjadi awal dari perjalanan yang penuh makna. Dengan izin Allah SWT, kami memutuskan untuk melanjutkan ke jenjang pernikahan.',
  akad: {
    date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: '08:00',
    venue_name: 'Masjid Al-Ikhlas',
    venue_address: 'Jl. Mawar No. 12, Jakarta Selatan',
    maps_url: 'https://maps.google.com',
    venue_photo_url: 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?w=600&h=400&fit=crop',
  },
  resepsi: {
    date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: '11:00',
    venue_name: 'Ballroom Grand Hotel',
    venue_address: 'Jl. Sudirman No. 86, Jakarta Pusat',
    maps_url: 'https://maps.google.com',
    venue_photo_url: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600&h=400&fit=crop',
  },
  gift_accounts: [
    { type: 'bank', bank: 'BCA', number: '1234567890', name: 'Ikhwal' },
  ],
  closing_text: 'Merupakan suatu kehormatan apabila Bapak/Ibu berkenan hadir.',
  thank_you_message: 'Terima kasih atas doa dan kehadiran Anda.',
  quote_arabic: 'وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُمْ مِنْ أَنْفُسِكُمْ أَزْوَاجًا لِتَسْكُنُوا إِلَيْهَا',
  quote_translation: 'Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu pasangan-pasangan dari jenismu sendiri, supaya kamu cenderung dan merasa tenteram kepadanya.',
  quote_source: 'QS. Ar-Rum: 21',
  video_embed_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  video_caption: 'Highlight perjalanan kami bersama',
  story_chapters: [
    { date: 'Maret 2021', title: 'Pertama Bertemu', text: 'Sebuah pertemuan yang tidak direncanakan di ruang meeting kantor. Senyumnya yang hangat membuat hari-hari di kantor terasa berbeda.', photo_url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=600&h=900&fit=crop' },
    { date: 'Desember 2022', title: 'Jatuh Cinta', text: 'Dari rekan kerja menjadi sahabat, dari sahabat menjadi cinta. Perasaan yang tumbuh perlahan namun pasti, bagai bunga yang mekar di musim semi.', photo_url: 'https://images.unsplash.com/photo-1606216794079-73f85bbd57d5?w=600&h=900&fit=crop' },
    { date: 'Juni 2023', title: 'Melamar', text: 'Dengan restu kedua keluarga dan keyakinan di hati, kami memutuskan untuk melangkah bersama menuju jenjang yang lebih serius.', photo_url: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=600&h=900&fit=crop' },
  ],
  story_timeline: [
    { date: 'Maret 2021', title: 'Pertama Bertemu', description: 'Sebuah pertemuan yang tidak direncanakan di ruang meeting kantor. Senyumnya yang hangat membuat hari-hari terasa berbeda.', photo_url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=400&h=400&fit=crop' },
    { date: 'Desember 2022', title: 'Jatuh Cinta',  description: 'Dari rekan kerja menjadi sahabat, dari sahabat menjadi cinta yang tumbuh perlahan namun pasti.', photo_url: 'https://images.unsplash.com/photo-1606216794079-73f85bbd57d5?w=400&h=400&fit=crop' },
    { date: 'Juni 2023',  title: 'Melamar',        description: 'Dengan restu kedua keluarga, kami memutuskan untuk melangkah bersama menuju jenjang pernikahan.', photo_url: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=400&h=400&fit=crop' },
    { date: 'April 2026', title: 'Hari Bahagia',   description: 'Mempersatukan dua hati menjadi satu keluarga, insya Allah.', photo_url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400&h=400&fit=crop' },
  ],
  gallery_photos: [
    'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&h=800&fit=crop',
    'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1606216794079-73f85bbd57d5?w=600&h=800&fit=crop',
    'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=600&h=800&fit=crop',
    'https://images.unsplash.com/photo-1529636798458-92182e662485?w=600&h=600&fit=crop',
  ],
  gift_registry: [
    { label: 'Perlengkapan dapur',   url: 'https://tokopedia.com/wishlist/1', marketplace: 'tokopedia', image_url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300&h=300&fit=crop' },
    { label: 'Furnitur rumah tangga', url: 'https://shopee.co.id/wishlist/2', marketplace: 'shopee', image_url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=300&h=300&fit=crop' },
  ],
  ig_story_image_url: 'https://images.unsplash.com/photo-1604017011826-d3b4c23f8914?w=400&h=710&fit=crop',
  qr_target_url: 'https://iaundang.online/ikhwal-fani',
  qr_label: 'Pindai untuk membagikan undangan ini',
}

const DEMO_WISHES: Wish[] = [
  { id: '1', invitation_id: 'demo', name: 'Reza Firmansyah', message: 'Selamat menempuh hidup baru! Semoga menjadi keluarga yang sakinah, mawaddah, warahmah. Barakallah!', created_at: new Date(Date.now() - 2 * 3600000).toISOString() },
  { id: '2', invitation_id: 'demo', name: 'Sari & Keluarga', message: 'Turut berbahagia atas pernikahan kalian. Semoga dipenuhi kebahagiaan dan keberkahan!', created_at: new Date(Date.now() - 5 * 3600000).toISOString() },
  { id: '3', invitation_id: 'demo', name: 'Hendra Wijaya', message: 'Semoga menjadi keluarga yang bahagia dunia akhirat. Aamiin!', created_at: new Date(Date.now() - 8 * 3600000).toISOString() },
]

export default async function DemoRendererPage(props: Props) {
  const searchParams = await props.searchParams;
  let template = JAVANESE_GOLD

  if (searchParams.id) {
    const rec = await templateRecords.findById(searchParams.id)
    if (!rec) notFound()
    template = rec
  }

  const demoTemplate = {
    ...template,
    config: {
      ...template.config,
      opening: { ...template.config.opening, show_opening: true },
    },
  }

  return (
    <DemoShell templateName={template.name}>
      <DemoEditorClient
        template={demoTemplate}
        demoData={DEMO_DATA}
        demoWishes={DEMO_WISHES}
      />
    </DemoShell>
  )
}
