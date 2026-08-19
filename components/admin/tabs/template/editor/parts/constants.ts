/**
 * Konstanta & helper murni untuk TemplateLab.
 *
 * Dipindah verbatim dari TemplateLab.tsx (dulu 5914 baris) — tidak ada satu
 * pun yang menyentuh state komponen, jadi memisahkannya murni pemindahan
 * tanpa perubahan perilaku.
 */
import type {
  NewInvitationData, Wish, GiftAccount, MusicConfig,
} from '@/lib/types'

//  Sample data default untuk preview 
export const PREVIEW_DATA_DEFAULT: NewInvitationData = {
  groom_name: 'Ikhwal Ramadhan',
  bride_name: 'Fani Aulia',
  groom_nickname: 'Ikhwal',
  bride_nickname: 'Fani',
  groom_father: 'H. Ahmad Wijaya',
  groom_mother: 'Hj. Siti Rahayu',
  bride_father: 'H. Santoso',
  bride_mother: 'Hj. Kartini',
  bride_parents: 'Bpk. H. Santoso & Ibu Hj. Kartini',
  groom_parents: 'Bpk. H. Ahmad Wijaya & Ibu Hj. Siti Rahayu',
  tagline: 'Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu pasangan-pasangan dari jenismu sendiri.',
  groom_photo_url: 'https://images.unsplash.com/photo-1526922782478-4946233fabf5?w=400&h=500&fit=crop&crop=face',
  bride_photo_url: 'https://images.unsplash.com/photo-1492175742197-ed20dc5a6bed?w=400&h=500&fit=crop&crop=face',
  couple_photo_url: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=600&h=800&fit=crop',
  groom_bio: 'Seorang arsitek yang percaya bahwa keindahan sejati terletak pada kesederhanaan.',
  bride_bio: 'Dokter muda yang menemukan kebahagiaan dalam merawat dan menyayangi sesama.',
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

// Semua referensi PREVIEW_DATA sekarang ke state previewData di komponen

export const PREVIEW_WISHES: Wish[] = [
  { id: '1', invitation_id: 'lab', name: 'Reza', message: 'Selamat menempuh hidup baru! 💕', created_at: new Date().toISOString() },
  { id: '2', invitation_id: 'lab', name: 'Sari', message: 'Semoga menjadi keluarga sakinah mawaddah warahmah!', created_at: new Date().toISOString() },
]

//  Gift section lab data 
export interface GiftLabBrand { g: [string, string]; type: 'bank' | 'ewallet'; num: string; name: string; logo: string }
export const GIFT_LAB_BRANDS: Record<string, GiftLabBrand> = {
  'BRI':       { g: ['#003B8E', '#00529B'], type: 'bank',    num: '123456789012',  name: 'BUDI SANTOSO',  logo: '/logos/bri.svg' },
  'BCA':       { g: ['#003087', '#00509E'], type: 'bank',    num: '1234567890',    name: 'BUDI SANTOSO',  logo: '/logos/bca.svg' },
  'BNI':       { g: ['#003087', '#0050A0'], type: 'bank',    num: '9876543210',    name: 'BUDI SANTOSO',  logo: '/logos/bni.svg' },
  'Mandiri':   { g: ['#003368', '#005099'], type: 'bank',    num: '1400123456789', name: 'BUDI SANTOSO',  logo: '/logos/mandiri.svg' },
  'BSI':       { g: ['#006633', '#00884A'], type: 'bank',    num: '7123456789',    name: 'BUDI SANTOSO',  logo: '/logos/bsi.svg' },
  'Blu':       { g: ['#0077CC', '#00AAFF'], type: 'bank',    num: '8881234567',    name: 'BUDI SANTOSO',  logo: '/logos/blu.svg' },
  'GoPay':     { g: ['#00880F', '#00AA15'], type: 'ewallet', num: '08123456789',   name: 'Budi Santoso',  logo: '/logos/gopay.svg' },
  'DANA':      { g: ['#118EEA', '#1565C0'], type: 'ewallet', num: '08234567890',   name: 'Budi Santoso',  logo: '/logos/dana.svg' },
  'ShopeePay': { g: ['#D73211', '#EE4D2D'], type: 'ewallet', num: '08345678901',   name: 'Budi Santoso',  logo: '/logos/shopee.svg' },
  'OVO':       { g: ['#4B0080', '#6A1B9A'], type: 'ewallet', num: '08456789012',   name: 'Budi Santoso',  logo: '/logos/ovo.svg' },
}
export function makeGiftAccount(name: string, b: GiftLabBrand): GiftAccount {
  return b.type === 'bank'
    ? { type: 'bank',    bank: name,     number: b.num, name: b.name }
    : { type: 'ewallet', platform: name, number: b.num, name: b.name }
}

//  Constants 
export const SECTION_TYPES = ['hero', 'profiles', 'countdown', 'events', 'story', 'gallery', 'rsvp', 'wishes', 'closing', 'gift', 'livestream', 'quote', 'video', 'gift-registry', 'ig-story', 'qrcode'] as const
/**
 * Gaya halaman sampul yang bisa dipilih admin.
 *
 * HARUS sama persis dengan `OpeningType` di lib/types.ts dan dengan cabang
 * switch di components/renderer/OpeningScene.tsx. Sebelumnya daftar ini hanya
 * memuat 3 dari 17 gaya yang benar-benar terimplementasi — akibatnya Rose
 * Garden ('flower-bloom') dan Midnight Luxe ('curtain') tidak punya opsi yang
 * tersorot saat dibuka di editor, dan sekali admin menekan salah satu dari 3
 * pilihan yang ada, gaya aslinya hilang tanpa cara untuk mengembalikannya.
 */
export const OPENING_TYPES = [
  'fade-reveal', 'envelope', 'curtain', 'gate-open', 'veil-lift',
  'flower-bloom', 'petal-fall', 'ring-zoom', 'diamond-split', 'gold-shimmer',
  'book-open', 'scroll-reveal', 'typewriter', 'lantern-rise',
  'mosaic-reveal', 'frosted-blur', 'parallax-split',
] as const

export const OPENING_META: Record<string, { icon: string; label: string; desc: string }> = {
  'fade-reveal':    { icon: '✨', label: 'Fade Reveal',   desc: 'Muncul lembut, paling netral' },
  'envelope':       { icon: '✉️', label: 'Amplop',        desc: 'Amplop terbuka, surat naik' },
  'curtain':        { icon: '🎭', label: 'Tirai',         desc: 'Tirai terbuka ke samping' },
  'gate-open':      { icon: '🚪', label: 'Gerbang',       desc: 'Dua daun gerbang membuka' },
  'veil-lift':      { icon: '👰', label: 'Kerudung',      desc: 'Kain tipis terangkat' },
  'flower-bloom':   { icon: '🌸', label: 'Bunga Mekar',   desc: 'Kelopak mekar dari tengah' },
  'petal-fall':     { icon: '🌺', label: 'Petal Jatuh',   desc: 'Kelopak berguguran' },
  'ring-zoom':      { icon: '💍', label: 'Cincin',        desc: 'Cincin membesar lalu larut' },
  'diamond-split':  { icon: '💎', label: 'Berlian',       desc: 'Belah diagonal berkilau' },
  'gold-shimmer':   { icon: '🥇', label: 'Kilau Emas',    desc: 'Sapuan cahaya keemasan' },
  'book-open':      { icon: '📖', label: 'Buku',          desc: 'Halaman buku terbuka' },
  'scroll-reveal':  { icon: '📜', label: 'Gulungan',      desc: 'Gulungan kertas terbuka' },
  'typewriter':     { icon: '⌨️', label: 'Mesin Tik',     desc: 'Nama diketik huruf demi huruf' },
  'lantern-rise':   { icon: '🏮', label: 'Lampion',       desc: 'Lampion naik perlahan' },
  'mosaic-reveal':  { icon: '🔲', label: 'Mozaik',        desc: 'Kotak-kotak tersingkap' },
  'frosted-blur':   { icon: '🌫️', label: 'Kabut',         desc: 'Buram menjernih' },
  'parallax-split': { icon: '⬍', label: 'Parallax',      desc: 'Belah atas-bawah bergeser' },
}

//  Color Palettes 
export const COLOR_PALETTES = [
  // Nusantara
  { name: 'Jawa Emas',       cat: 'Nusantara', p: '#1a4a1a', a: '#d4af37', t: '#ffffff', bg: '#0f2d0f' },
  { name: 'Jawa Kerajaan',   cat: 'Nusantara', p: '#2d1b4e', a: '#c5a028', t: '#f5e6c8', bg: '#1a0d30' },
  { name: 'Sumatera Tanah',  cat: 'Nusantara', p: '#4a2c17', a: '#e8a830', t: '#f5ebe0', bg: '#2c1a0e' },
  { name: 'Bali Sakral',     cat: 'Nusantara', p: '#3d0000', a: '#ffd700', t: '#fff8e7', bg: '#1a0000' },
  { name: 'Sunda Hijau',     cat: 'Nusantara', p: '#1b3a1b', a: '#8fbe6f', t: '#f0faf0', bg: '#0d1f0d' },
  { name: 'Betawi Merah',    cat: 'Nusantara', p: '#2c1810', a: '#e07b30', t: '#fff5ed', bg: '#1a0e08' },
  { name: 'Bugis Biru',      cat: 'Nusantara', p: '#0a1f3d', a: '#d4aa70', t: '#f0eee8', bg: '#050f20' },
  // Modern
  { name: 'Modern Putih',    cat: 'Modern',    p: '#f9f9f9', a: '#1a1a1a', t: '#1a1a1a', bg: '#ffffff' },
  { name: 'Modern Hitam',    cat: 'Modern',    p: '#0f0f0f', a: '#e8e0d0', t: '#f5f5f5', bg: '#1a1a1a' },
  { name: 'Navy Elegan',     cat: 'Modern',    p: '#0a192f', a: '#64ffda', t: '#ccd6f6', bg: '#020c1b' },
  { name: 'Sage Tenang',     cat: 'Modern',    p: '#2c3e2d', a: '#8fba8f', t: '#f0f4f0', bg: '#1a2b1c' },
  { name: 'Charcoal Gold',   cat: 'Modern',    p: '#1c1c1c', a: '#c8a84b', t: '#f0ead8', bg: '#111111' },
  // Floral
  { name: 'Rose Garden',     cat: 'Floral',    p: '#3d1020', a: '#f5a0b5', t: '#fff0f5', bg: '#2a0815' },
  { name: 'Lavender Dream',  cat: 'Floral',    p: '#1a0d33', a: '#b088f9', t: '#f5f0ff', bg: '#100820' },
  { name: 'Peony Soft',      cat: 'Floral',    p: '#fdf0f3', a: '#c45876', t: '#2d1018', bg: '#fff5f7' },
  { name: 'Dusty Mauve',     cat: 'Floral',    p: '#2e1a28', a: '#e0a8c8', t: '#f8eef5', bg: '#1c0f1a' },
  // Minimalis
  { name: 'Cream Lembut',    cat: 'Minimalis', p: '#faf8f5', a: '#8b7355', t: '#1a1510', bg: '#f5f2ed' },
  { name: 'Abu Elegan',      cat: 'Minimalis', p: '#2a2a2a', a: '#b8b8b8', t: '#f0f0f0', bg: '#1a1a1a' },
  { name: 'Off White',       cat: 'Minimalis', p: '#fcfaf7', a: '#6b6b6b', t: '#2a2a2a', bg: '#f7f5f2' },
  // Rustic
  { name: 'Kayu Tua',        cat: 'Rustic',    p: '#3d2b1f', a: '#d4956a', t: '#f5e6d3', bg: '#2a1a10' },
  { name: 'Hijau Hutan',     cat: 'Rustic',    p: '#1e3a2f', a: '#8fb870', t: '#e8f4e8', bg: '#122518' },
  { name: 'Terracotta',      cat: 'Rustic',    p: '#2c1a15', a: '#c87941', t: '#f5e5d8', bg: '#1a0e0a' },
]

// Variant yang tersedia per tipe section
export const SECTION_VARIANTS: Record<string, { value: string; label: string; desc: string }[]> = {
  hero: [
    { value: 'default',      label: 'Centered',     desc: 'Nama di tengah layar' },
    { value: 'bottom',       label: 'Bottom',        desc: 'Nama di bawah, foto penuh' },
    { value: 'minimal',      label: 'Minimal',       desc: 'Tipografi, tanpa foto bg' },
    { value: 'split',        label: 'Split',          desc: 'Foto kiri, nama kanan' },
    { value: 'overlay-card', label: 'Glass Card',     desc: 'Nama di dalam card transparan' },
    { value: 'editorial',    label: 'Editorial',      desc: 'Teks besar dramatis' },
    { value: 'arch',         label: 'Arch',           desc: 'Frame lengkung ornamental' },
    { value: 'magazine',     label: 'Magazine',       desc: 'Foto circle + layout majalah' },
  ],
  profiles: [
    { value: 'default',  label: 'Portrait',  desc: 'Foto 3:4 berdampingan, badge & tengah' },
    { value: 'card',     label: 'Cinematic', desc: 'Panel full-width, teks overlay bawah' },
    { value: 'vertical', label: 'Vertical',  desc: 'Foto bulat, susun atas-bawah' },
    { value: 'magazine', label: 'Magazine',  desc: 'Foto kiri-kanan bergantian, editorial' },
    { value: 'overlap',  label: 'Overlap',   desc: 'Foto tumpang tindih, nama di bawah' },
  ],
  events: [
    { value: 'default',   label: 'Editorial',  desc: 'Kartu editorial bersih + foto venue' },
    { value: 'cinematic', label: 'Sinematik',  desc: 'Full-bleed foto venue + overlay gelap' },
    { value: 'timeline',  label: 'Timeline',   desc: 'Garis vertikal + titik + foto' },
    { value: 'magazine',  label: 'Majalah',    desc: 'Foto lebar + accent bar kiri' },
    { value: 'elegant',   label: 'Elegan',     desc: 'Centered dengan ornamen pemisah' },
  ],
  countdown: [
    { value: 'default',   label: 'Editorial',   desc: 'Kotak editorial minimalis' },
    { value: 'cinematic', label: 'Sinematik',   desc: 'Full-bleed foto background + overlay' },
    { value: 'elegant',   label: 'Elegan',      desc: 'Angka hari besar fokus + H:M:S' },
    { value: 'minimal',   label: 'Minimal',     desc: 'Tipografi besar bersih' },
    { value: 'rings',     label: 'Lingkaran',   desc: 'Progress ring SVG animasi' },
    { value: 'magazine',  label: 'Majalah',     desc: 'Foto strip atas + countdown bawah' },
  ],
  gift: [
    { value: 'default', label: 'Stack',  desc: 'Kartu vertikal, maks 3' },
    { value: 'swipe',   label: 'Swipe',  desc: 'Kartu tumpuk, geser horizontal' },
  ],
  closing: [
    { value: 'default',   label: 'Simple',    desc: 'Editorial bersih, centered' },
    { value: 'elegant',   label: 'Elegant',   desc: 'Double border frame + corner dots' },
    { value: 'cinematic', label: 'Cinematic', desc: 'Full-screen gelap, foto background' },
    { value: 'magazine',  label: 'Magazine',  desc: 'Left-aligned editorial, tipografi besar' },
    { value: 'card',      label: 'Card',      desc: 'Kartu aksen border atas-bawah' },
    { value: 'poetic',    label: 'Poetic',    desc: 'Kutipan besar dengan tanda petik' },
  ],
  story: [
    { value: 'default',  label: 'Default',  desc: 'IG Stories navigasi per-bab' },
    { value: 'timeline', label: 'Timeline', desc: 'Garis waktu perjalanan (butuh story_timeline)' },
  ],
  gallery: [
    { value: 'default',   label: 'Masonry',   desc: 'Hero foto + 2 kolom staggered' },
    { value: 'dramatic',  label: 'Dramatic',  desc: 'Full-screen, auto-slide, cinematic' },
    { value: 'mosaic',    label: 'Mosaic',    desc: 'Grid asimetris pola majalah' },
    { value: 'filmstrip', label: 'Filmstrip', desc: 'Scroll horizontal strip sinematik' },
    { value: 'collage',   label: 'Collage',   desc: 'Foto tumpuk scattered editorial' },
  ],
  'ig-story': [
    { value: 'default',  label: 'Centered', desc: 'Preview tengah dengan tombol unduh' },
    { value: 'phone',    label: 'Phone',    desc: 'Mockup di dalam frame ponsel' },
    { value: 'minimal',  label: 'Minimal',  desc: 'Foto besar, tombol overlay bawah' },
  ],
  quote: [
    { value: 'default',   label: 'Editorial',  desc: 'Centered dengan ornamen atas-bawah' },
    { value: 'cinematic', label: 'Sinematik',  desc: 'Full-height gelap + teks putih besar' },
    { value: 'elegant',   label: 'Elegan',     desc: 'Tanda kutip besar dekoratif' },
    { value: 'magazine',  label: 'Majalah',    desc: 'Rata kiri + accent bar' },
    { value: 'minimal',   label: 'Minimal',    desc: 'Ultra bersih tanpa heading' },
  ],
  video: [
    { value: 'default',   label: 'Editorial',  desc: 'Frame editorial + caption italic' },
    { value: 'cinematic', label: 'Sinematik',  desc: 'Full-width + caption overlay gradient' },
    { value: 'magazine',  label: 'Majalah',    desc: 'Rata kiri + accent bar atas' },
    { value: 'minimal',   label: 'Minimal',    desc: 'Bersih, border tipis, tanpa header' },
  ],
  'gift-registry': [
    { value: 'default',  label: 'Carousel',  desc: 'Geser horizontal kartu produk' },
    { value: 'grid',     label: 'Grid',       desc: 'Grid 2 kolom kartu kompak' },
    { value: 'list',     label: 'List',       desc: 'Daftar vertikal foto kiri teks kanan' },
    { value: 'minimal',  label: 'Minimal',    desc: 'Teks saja tanpa gambar' },
  ],
}

export const HEADING_FONTS = [
  'Geist', 'Cinzel', 'Cormorant Garamond', 'Great Vibes', 'Dancing Script',
  'Libre Baskerville', 'EB Garamond', 'Cinzel Decorative', 'Bodoni Moda', 'Italiana',
  'Tenor Sans', 'Marcellus', 'Yeseva One', 'Poiret One', 'Antic Didone',
  'Gilda Display', 'Cormorant SC', 'Spectral', 'Lora', 'Merriweather',
  'Josefin Sans', 'Montserrat', 'Prata', 'Forum', 'Philosopher',
  'Alex Brush', 'Allura', 'Sacramento', 'Parisienne', 'Tangerine',
]
export const BODY_FONTS = [
  'Lato', 'Raleway', 'Nunito', 'Cormorant Garamond', 'Roboto', 'Inter', 'Jost',
  'Spectral', 'Source Serif 4', 'Crimson Text', 'Lora', 'Merriweather',
  'Josefin Sans', 'Montserrat', 'Poppins', 'DM Sans', 'Work Sans',
  'Libre Caslon Text', 'Gentium Book Plus', 'EB Garamond',
]

export type ConfigTab = 'tampilan' | 'opening' | 'decor' | 'konten' | 'music'

export const SECTION_LABELS: Record<string, string> = {
  hero: 'Hero (Cover)', profiles: 'Profil Pasangan', countdown: 'Hitung Mundur',
  events: 'Detail Acara', story: 'Kisah Cinta', gallery: 'Galeri Foto',
  rsvp: 'RSVP', wishes: 'Buku Ucapan', closing: 'Penutup',
  gift: 'Amplop Digital', livestream: 'Livestream',
  quote: 'Quote / Doa', video: 'Video Sinematik', 'gift-registry': 'Daftar Hadiah',
  'ig-story': 'Template IG Story', qrcode: 'QR Code',
}

//  Helpers 
export function makeId() {
  return 'lab-' + Date.now().toString(36)
}

export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

export const DEFAULT_MUSIC_CFG: MusicConfig = {
  enabled: true, autoplay: true, volume: 0.3, loop: true,
  player_style: 'pill', player_position: 'bottom-right',
  player_animation: 'fade-slide', show_title: true, player_size: 'md',
}
