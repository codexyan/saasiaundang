//  LEGACY TEMPLATE TYPES (hardcoded templates) 

export type LegacyTemplateId = 'modern-white' | 'floral-garden' | 'dark-elegant'
// Backward-compat alias   old code uses `Template`
export type Template = LegacyTemplateId

export interface InvitationData {
  groomName: string
  groomFather: string
  groomMother: string
  brideName: string
  brideFather: string
  brideMother: string
  akadDate: string
  akadTime: string
  akadVenue: string
  akadAddress: string
  akadMapsUrl: string
  resepsiDate: string
  resepsiTime: string
  resepsiVenue: string
  resepsiAddress: string
  resepsiMapsUrl: string
  heroPhotoUrl?: string
  musicUrl?: string
  musicTitle?: string
  giftAddress?: string
  giftRecipient?: string
  giftContact?: string
  paymentBankName?: string
  paymentAccountNumber?: string
  paymentAccountName?: string
  paymentQris?: string
  paymentNote?: string
  openingText?: string
  closingText?: string
}

export interface Invitation {
  id: string
  user_id: string
  slug: string
  template_id: string
  data: InvitationData
  /** Id paket. Dulu diketat ke union PackageTier (starter|popular|eksklusif),
   *  tapi admin sekarang bisa membuat tier sendiri lewat panel Paket & Promo,
   *  jadi id-nya tidak lagi terbatas tiga itu. Resolusi label dan fiturnya
   *  lewat lib/tiers.ts (server) atau resolveTierDisplay (client). */
  package_tier?: string
  is_published: boolean
  is_paid: boolean
  expires_at: string | null
  referred_by: string | null
  created_at: string
}

export interface Gallery {
  id: string
  invitation_id: string
  url: string
  order: number
}

export interface Guest {
  id: string
  invitation_id: string
  name: string
  phone: string
  group: string
  note: string
  source: 'manual' | 'rsvp'
  attending: boolean | null
  total_guests: number
  blast_sent_at: string | null
  created_at: string
}

export interface Wish {
  id: string
  invitation_id: string
  name: string
  message: string
  created_at: string
}

export interface TemplateConfig {
  id: LegacyTemplateId
  name: string
  description: string
  thumbnailUrl: string
  demoSlug: string
  tags: string[]
}

export const LEGACY_TEMPLATE_IDS: LegacyTemplateId[] = ['modern-white', 'floral-garden', 'dark-elegant']

export const TEMPLATES: TemplateConfig[] = [
  {
    id: 'modern-white',
    name: 'Modern White',
    description: 'Bersih, minimalis, elegan. Cocok untuk pasangan modern.',
    thumbnailUrl: '/templates/modern-white/thumbnail.jpg',
    demoSlug: 'demo-modern',
    tags: ['minimalis', 'modern', 'putih'],
  },
  {
    id: 'floral-garden',
    name: 'Floral Garden',
    description: 'Penuh bunga dan warna hangat. Romantis dan feminin.',
    thumbnailUrl: '/templates/floral-garden/thumbnail.jpg',
    demoSlug: 'demo-floral',
    tags: ['bunga', 'romantis', 'feminin'],
  },
  {
    id: 'dark-elegant',
    name: 'Dark Elegant',
    description: 'Gelap, mewah, dan berkesan. Untuk kesan yang kuat.',
    thumbnailUrl: '/templates/dark-elegant/thumbnail.jpg',
    demoSlug: 'demo-dark',
    tags: ['gelap', 'mewah', 'elegan'],
  },
]

export const PRICE = 129000
export const PRICE_FORMATTED = 'Rp 129.000'

//  JSON-DRIVEN TEMPLATE SYSTEM (v2) 

export type SectionType =
  | 'hero'
  | 'profiles'
  | 'countdown'
  | 'story'
  | 'events'
  | 'gallery'
  | 'gift'
  | 'rsvp'
  | 'wishes'
  | 'livestream'
  | 'closing'
  | 'quote'
  | 'video'
  | 'gift-registry'
  | 'ig-story'
  | 'qrcode'

export type TransitionType =
  | 'fade'
  | 'slide-up'
  | 'slide-down'
  | 'slide-left'
  | 'slide-right'
  | 'zoom-in'
  | 'zoom-out'
  | 'none'

export type OpeningType =
  | 'envelope'
  | 'curtain'
  | 'flower-bloom'
  | 'fade-reveal'
  | 'gate-open'
  | 'scroll-reveal'
  | 'diamond-split'
  | 'book-open'
  | 'lantern-rise'
  | 'veil-lift'
  | 'mosaic-reveal'
  | 'ring-zoom'
  | 'petal-fall'
  | 'typewriter'
  | 'gold-shimmer'
  | 'frosted-blur'
  | 'parallax-split'

/**
 * Konteks render undangan.
 *
 * 'live'    = halaman undangan sungguhan. Aksi tamu (RSVP, ucapan) dikirim ke API.
 * 'preview' = editor, demo, atau Template Lab. Aksi tamu HANYA disimulasikan.
 *
 * Sengaja prop WAJIB di InvitationRenderer/SectionRenderer, bukan ditebak dari
 * bentuk invitationId: penebakan lewat regex UUID-lah yang dulu membuat seluruh
 * undangan produksi diperlakukan sebagai preview sehingga RSVP dan ucapan tamu
 * tidak pernah dikirim ke server sama sekali.
 */
export type RenderMode = 'live' | 'preview'

export interface BackgroundConfig {
  type: 'image' | 'video' | 'color' | 'gradient'
  url?: string              // untuk image dan video
  value?: string            // untuk color dan gradient
  overlay_opacity?: number  // 0 1, gelap overlay di atas foto/video
}

export type SectionTextAlign = 'center' | 'left' | 'right'
export type SectionLayout    = 'default' | 'split-left' | 'split-right' | 'full-bleed'

export interface SectionConfig {
  id: string
  type: SectionType
  order: number
  enabled: boolean
  background: BackgroundConfig
  decoration_assets?: DecorationAsset[]
  transition_in: TransitionType
  transition_out: TransitionType
  user_fields: string[]
  // Advanced layout controls
  text_align?: SectionTextAlign     // Alignment teks
  content_layout?: SectionLayout    // Layout konten
  style_variant?: string            // Variant tampilan section
  font_heading?: string             // Override font judul untuk section ini
  font_body?: string                // Override font teks untuk section ini
  heading_weight?: number           // Ketebalan judul: 300 | 400 | 500 | 600 | 700 | 800 | 900
  body_weight?: number              // Ketebalan teks: 300 | 400 | 500 | 600 | 700
  heading_scale?: number            // Ukuran judul/heading: 0.7   1.8 (default 1.0)
  body_scale?: number               // Ukuran teks isi/body: 0.7   1.5 (default 1.0)

  //  Gift section controls 
  gift_show_logo?: boolean              // Tampilkan logo brand pada kartu (default true)
  gift_proof_enabled?: boolean          // Tampilkan tombol & form upload bukti transfer (default true)
  gift_thankyou_text?: string           // Pesan terima kasih kustom setelah kirim bukti

  //  Hero section controls 
  hero_bismillah?: 'none' | 'text' | 'arabic'
  hero_bismillah_custom?: string    // Teks kustom (override 'text')
  hero_title_size?: number          // px ukuran nama (default 36)
  hero_and_size?: number            // px ukuran simbol "&" (default 22)
  hero_tagline_size?: number        // px ukuran tagline/ayat (default 11)
  hero_label_size?: number          // px ukuran bismillah/label kecil (default 9)
  hero_overlay?: number             // 0 1 kegelapan foto/video background
  hero_padding_top?: number         // px padding atas konten
  hero_padding_bottom?: number      // px padding bawah konten
  hero_show_scroll?: boolean        // tampilkan indikator scroll (default true)
  hero_anim_duration?: number       // durasi animasi masuk (detik, default 0.8)
  hero_anim_stagger?: number        // jeda antar elemen (detik, default 0.15)
  hero_text_shadow?: boolean        // bayangan teks untuk keterbacaan
  hero_icon_size?: number           // px ukuran brand mark iaundang di atas hero (default 40)
}

export type AssetAnimation =
  | 'none' | 'fade-in' | 'slide-left' | 'slide-right'
  | 'slide-up' | 'slide-down' | 'zoom-in' | 'rotate-in'
  | 'custom'

export type AssetExitAnimation =
  | 'none' | 'fade-out' | 'slide-out-left' | 'slide-out-right'
  | 'slide-out-up' | 'slide-out-down' | 'zoom-out' | 'rotate-out'
  | 'shrink' | 'blur-out'
  | 'custom'

export type AssetIdleAnimation =
  | 'none' | 'float' | 'pulse' | 'shimmer' | 'sway' | 'spin-slow' | 'heartbeat' | 'drift-right'

export type AssetKeyframeEasing = 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'spring' | 'linear'

export interface AssetKeyframeState {
  opacity?: number    // 0 1
  x?: number          // px offset
  y?: number          // px offset
  scale?: number      // multiplier
  rotate?: number     // degrees
  blur?: number       // px
}

export interface AssetKeyframeConfig {
  from: AssetKeyframeState
  to: AssetKeyframeState
  duration?: number              // ms, default 900
  easing?: AssetKeyframeEasing   // default 'ease'
}

/**
 * Aset dekorasi yang ditempel di atas opening atau sebuah seksi.
 *
 * KOORDINAT PERSEN, bukan anchor + offset piksel.
 *
 * Model lama memakai `position` (17 anchor preset seperti 'edge-left',
 * 'bottom-quarter-right') DITAMBAH `offset_x`/`offset_y` dalam piksel absolut.
 * Dua sistem koordinat untuk satu pertanyaan yang sama, dan keduanya saling
 * meniadakan: menyeret aset di kanvas selalu menulis ulang
 * `position: 'top-left'`, jadi pilihan anchor admin terhapus diam-diam begitu
 * ia menggeser satu piksel. Piksel absolut juga berarti dekorasi TIDAK ikut
 * menyesuaikan lebar layar tamu — dirancang di 390px, melenceng di 430px.
 *
 * Sekarang: satu sistem, semua relatif ukuran kanvas.
 *   x, y = titik PUSAT aset, dalam persen lebar/tinggi kanvas
 *   w    = lebar aset, dalam persen lebar kanvas
 *   h    = tinggi opsional; kosong berarti ikut rasio asli gambar
 *
 * Nilai di luar 0–100 SENGAJA diizinkan supaya aset bisa menggantung keluar
 * bingkai (ornamen sudut, sulur yang terpotong tepi) — itu justru kebutuhan
 * desain yang paling sering dipakai.
 */
export interface DecorationAsset {
  id: string
  url: string
  label?: string
  /** Pusat horizontal, % lebar kanvas. Boleh < 0 atau > 100. */
  x: number
  /** Pusat vertikal, % tinggi kanvas. Boleh < 0 atau > 100. */
  y: number
  /** Lebar, % lebar kanvas. */
  w: number
  /** Tinggi, % tinggi kanvas. Kosong = ikut rasio asli gambar. */
  h?: number
  rotation?: number        // derajat
  flip_h?: boolean
  flip_v?: boolean
  opacity?: number         // 0-100
  animation?: AssetAnimation     // animasi masuk
  animation_delay?: number       // ms, delay animasi masuk
  entry_keyframes?: AssetKeyframeConfig  // keyframe custom untuk animasi masuk (saat animation = 'custom')
  exit_animation?: AssetExitAnimation  // animasi keluar saat transisi ke loading
  exit_delay?: number            // ms, delay animasi keluar
  exit_keyframes?: AssetKeyframeConfig   // keyframe custom untuk animasi keluar (saat exit_animation = 'custom')
  idle_animation?: AssetIdleAnimation  // animasi on-the-spot setelah masuk
  idle_speed?: 'slow' | 'normal' | 'fast'  // kecepatan idle, default 'normal'
  z_layer?: number         // z-order/layer, default 0
}

export interface OpeningConfig {
  type: OpeningType
  duration_ms: number
  background_image?: string
  // Cover page (onboarding) settings
  subtitle?: string
  button_text?: string
  invitation_text?: string
  show_guest_name?: boolean
  cover_photo_url?: string
  cover_photo_display?: 'background' | 'portrait' | 'banner'
  cover_photo_opacity?: number
  cover_photo_position?: 'top' | 'center' | 'bottom'
  cover_gradient_height?: number
  cover_gradient_color?: string   // Warna gradasi bawah, default: primary template
  // Typography & layout
  greeting_font_size?: number      // px, default 11
  couple_name_font_size?: number   // px, default 32
  couple_name_letter_spacing?: number // em, default 0.08
  couple_name_uppercase?: boolean  // DEPRECATED: use couple_name_text_transform
  couple_name_text_transform?: 'uppercase' | 'capitalize' | 'lowercase' | 'none'  // default 'uppercase'
  guest_label?: string             // default "KEPADA YTH."
  guest_label_font_size?: number   // px, default 8.5
  show_top_separator?: boolean     // separator setelah greeting, default true
  show_bottom_separator?: boolean  // separator sebelum nama, default true
  separator_style?: 'diamond' | 'dot' | 'line' | 'floral' | 'star' | 'wave'  // default 'diamond'
  button_size?: 'sm' | 'md' | 'lg' // default 'lg'
  couple_name_connector?: 'ampersand' | 'heart' | 'dot' | 'dash' | 'ring' | 'flower' // default 'ampersand'
  couple_name_connector_size?: number // px, default 26
  /** TIDAK DIPAKAI: tidak ada komponen pembuka yang membacanya. Kontrolnya
   *  sudah dicabut dari panel admin. Lihat catatan di NewInvitationData. */
  couple_name_gap?: number
  content_padding_x?: number       // px, default 28
  content_padding_bottom?: number  // px, default 48
  // Aset dekorasi custom (upload-based)
  decoration_assets?: DecorationAsset[]
  // Aktifkan/nonaktifkan halaman cover sebelum undangan
  show_opening?: boolean           // default: true
  //  Petal Fall specific 
  petal_count?: number             // jumlah kelopak, default 22
  petal_speed?: 'slow' | 'normal' | 'fast'  // kecepatan jatuh, default 'normal'
  petal_size?: 'sm' | 'md' | 'lg' // ukuran kelopak, default 'md'
  petal_opacity?: number           // 0 100, opacity puncak kelopak, default 30
  petal_sway?: number              // 0 100, intensitas ayunan horizontal, default 50
  petal_color?: string             // warna kelopak, default: accent color template
  petal_shape?: 'petal' | 'sakura' | 'leaf' | 'snowflake'  // bentuk partikel, default 'petal'
  show_button_glow?: boolean       // pulse glow pada tombol, default true
  show_scroll_hint?: boolean       // chevron bouncing di bawah tombol, default true
  ken_burns_enabled?: boolean      // animasi Ken Burns pada background, default true
  ken_burns_speed?: number         // detik durasi siklus, default 20
  exit_blur?: number               // px blur saat exit, default 12
  scrim_opacity?: number           // 0 100, opacity overlay gelap, default 33
}

export type LoadingVariant =
  | 'dual-ring'
  | 'heartbeat'
  | 'elegant-spinner'
  | 'petal-cascade'
  | 'wave-dots'
  | 'letter-reveal'
  | 'arch-gate'
  | 'candle-glow'
  | 'infinity-ribbon'
  | 'shimmer-bar'
  | 'orbit-rings'
  | 'ripple-pulse'
  | 'diamond-spin'
  | 'hourglass'
  | 'crescent-moon'
  | 'spiral-gold'

export type LoadingBgType = 'solid' | 'gradient' | 'radial' | 'image' | 'pattern'

export interface LoadingConfig {
  background_color: string
  logo_image?: string
  text: string
  show_text?: boolean
  animation?: string
  variant?: LoadingVariant
  duration_ms?: number
  accent_color?: string
  text_color?: string
  show_progress?: boolean
  blur_background?: boolean
  particle_count?: number
  font_family?: string
  text_size?: 'sm' | 'base' | 'lg'
  animation_speed?: 'slow' | 'normal' | 'fast'
  overlay_opacity?: number
  bg_type?: LoadingBgType
  bg_gradient_from?: string
  bg_gradient_to?: string
  bg_gradient_angle?: number
  bg_image_url?: string
  bg_pattern?: 'none' | 'dots' | 'lines' | 'cross' | 'moroccan'
}

export interface ColorScheme {
  primary: string
  accent: string
  text: string
  background?: string
}

export interface CustomFont {
  name: string
  url: string            // URL ke file font (.woff2/.ttf/.otf) di Supabase Storage
  weight?: string        // e.g. '400', '400;700', default '400'
  style?: 'normal' | 'italic'
}

export interface FontConfig {
  heading: string
  body: string
  heading_scale?: number  // 0.6   2.0, default 1.0   ukuran default semua judul
  body_scale?: number     // 0.6   1.6, default 1.0   ukuran default semua teks
  heading_line_height?: number   // default 1.15
  body_line_height?: number      // default 1.65
  heading_letter_spacing?: number // em, default 0
  body_letter_spacing?: number    // em, default 0
  heading_word_spacing?: number   // em, default 0
  body_word_spacing?: number      // em, default 0
  custom_fonts?: CustomFont[]     // font custom yang diupload/ditambahkan admin
}

export type ButtonVariant = 'outlined' | 'filled' | 'pill' | 'ghost' | 'underline'
export type BorderVariant = 'sharp' | 'rounded' | 'pill'
export type OrnamentVariant = 'classic' | 'minimal' | 'floral' | 'geometric' | 'none'

export interface ComponentStyle {
  button: ButtonVariant
  border: BorderVariant
  ornament: OrnamentVariant
}

/** Identitas template (nama, slug, kategori, thumbnail) TIDAK ada di sini —
 *  tempatnya di TemplateRecord. Dulu digandakan di dua tempat dan yang di
 *  dalam config tidak pernah dibaca satu pun renderer, jadi begitu admin
 *  mengganti nama template, salinan di config diam-diam basi. */
export interface TemplateMeta {
  color_scheme: ColorScheme
  font: FontConfig
  component_style?: ComponentStyle
}

export type MusicPlayerStyle = 'pill' | 'circle' | 'vinyl' | 'minimal'
export type MusicPlayerPosition = 'bottom-right' | 'bottom-left' | 'bottom-center' | 'top-right'
export type MusicPlayerAnimation = 'fade-slide' | 'scale-bounce' | 'slide-up' | 'none'

export interface MusicConfig {
  enabled: boolean
  url?: string
  title?: string
  autoplay: boolean
  volume: number
  loop: boolean
  player_style: MusicPlayerStyle
  player_position: MusicPlayerPosition
  player_animation: MusicPlayerAnimation
  show_title: boolean
  player_size: 'sm' | 'md' | 'lg'
}

export interface JsonTemplateConfig {
  meta: TemplateMeta
  opening: OpeningConfig
  loading: LoadingConfig
  music?: MusicConfig
  sections: SectionConfig[]
}

/** Tier minimum yang dibutuhkan user untuk akses template.
 *  'all' = semua user (termasuk free). Selain itu = tier minimum (lihat lib/packages.ts). */
export type TemplatePackageRequirement = 'all' | 'starter' | 'popular' | 'eksklusif'

/** Kategori template   admin bisa CRUD dari Manajemen tab. */
export interface TemplateCategory {
  slug: string
  label: string
  is_built_in: boolean
}

/** Fitur yang bisa di-toggle per tier. */
export interface TierFeatures {
  max_photos: number
  max_guests: number
  music: boolean
  custom_music: boolean
  opening_animation: boolean
  opening_styles: 'basic' | 'all'
  hero: boolean
  profiles: boolean
  events: boolean
  quote: boolean
  countdown: boolean
  gallery: boolean
  rsvp: boolean
  wishes: boolean
  story: boolean
  video: boolean
  gift: boolean
  gift_registry: boolean
  livestream: boolean
  ig_story: boolean
  qrcode: boolean
  closing: boolean
  custom_domain: boolean
  subdomain: boolean
  remove_watermark: boolean
  analytics: boolean
  priority_support: boolean
  validity_days: number
  decoration_editing: boolean
  max_decoration_assets: number
  custom_animations: boolean
}

/** Tier harga yang bisa dipilih per-template. Admin CRUD dari Manajemen. */
export interface PriceTier {
  id: string
  label: string
  price: number
  is_built_in: boolean
  description?: string
  features?: TierFeatures
  color?: string
  icon?: string
  highlight?: boolean
}

/** Scope target untuk promo   berlaku ke semua, per tier, atau per kategori. */
export type PromoScope = 'all' | 'tier' | 'category'

/** Flash sale   diskon sementara, bisa target per tier atau per kategori. */
export interface FlashSale {
  id: string
  label: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  start_date: string
  end_date: string
  scope: PromoScope
  scope_ids: string[]
  is_active: boolean
}

/** Kupon diskon   user memasukkan kode saat checkout, bisa target per tier atau per kategori. */
export interface Coupon {
  id: string
  code: string
  label: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  max_uses: number
  used_count: number
  valid_from: string
  valid_until: string
  scope: PromoScope
  scope_ids: string[]
  is_active: boolean
}

export interface MusicTrack {
  id: string
  title: string
  artist: string
  category: string
  url: string
  duration: number
  file_size: number
  is_active: boolean
  sort_order: number
  usage_count: number
  created_at: string
}

export interface MusicCategory {
  id: string
  name: string
  sort_order: number
  created_at: string
}

export interface Order {
  id: string
  order_number: string
  invitation_id: string | null
  email: string
  phone: string
  groom_name: string
  bride_name: string
  groom_nickname: string
  bride_nickname: string
  groom_father: string
  groom_mother: string
  bride_father: string
  bride_mother: string
  groom_profession: string
  bride_profession: string
  subdomain: string
  template_id: string
  package_tier: string
  amount: number
  unique_code: number
  total_amount: number
  proof_url: string
  notes: string
  status: 'pending' | 'paid' | 'approved' | 'rejected'
  admin_notes: string
  referred_by: string | null
  mayar_transaction_id: string | null
  mayar_payment_link: string | null
  payment_method: string | null
  created_at: string
  reviewed_at: string | null
}

/** Color palette preset untuk Studio Desain. */
export interface ColorPalette {
  id: string
  name: string
  /** Grouping di Studio Desain UI: 'Nusantara' | 'Modern' | 'Floral' | 'Minimalis' | 'Rustic' | custom. */
  group: string
  primary: string
  accent: string
  text: string
  background: string
  is_built_in: boolean
}

export interface TemplateRecord {
  id: string
  name: string
  slug: string
  category: string
  /** Ditampilkan ke user di galeri template. */
  description: string
  /** Versi terbit — inilah yang dirender untuk pengunjung undangan. */
  config: JsonTemplateConfig
  /** Salinan kerja editor (autosave). null/undefined = tidak ada perubahan tertunda. */
  draft_config?: JsonTemplateConfig | null
  thumbnail_url: string
  status: 'draft' | 'active' | 'archived'
  sort_order: number
  /** Jumlah undangan yang memakai template ini. */
  usage_count: number
  /** Harga dalam Rupiah utuh (Int). 0 = gratis / ikuti harga global. */
  price: number
  /** Single source of truth untuk access control (gantikan isPremium boolean). */
  required_package: TemplatePackageRequirement
  created_at: string
  updated_at: string
}

// Invitation data format for JSON-driven templates (snake_case)
export interface EventDetail {
  date: string
  time: string
  venue_name: string
  venue_address: string
  maps_url?: string
  venue_photo_url?: string
}

export interface GiftAccount {
  type: 'bank' | 'ewallet'
  bank?: string
  platform?: string
  number: string
  name: string
}

export interface TimelineItem {
  date: string
  title: string
  description?: string
  photo_url?: string
}

export interface GiftRegistryLink {
  label: string
  url: string
  image_url?: string
  description?: string
  price?: string
  marketplace?: 'tokopedia' | 'shopee' | 'bukalapak' | 'lazada' | 'other'
}

/** Satu bab dalam section Kisah Cinta   foto atau video background */
export interface StoryChapter {
  title?: string
  text?: string
  date?: string
  photo_url?: string
  video_url?: string         // video background cinematic (mp4/webm)
  overlay_opacity?: number   // 0 1, default 0.45
}

export interface NewInvitationData {
  bride_name: string
  groom_name: string
  groom_nickname?: string
  bride_nickname?: string
  bride_parents?: string
  groom_parents?: string
  groom_father?: string
  groom_mother?: string
  bride_father?: string
  bride_mother?: string
  tagline?: string
  groom_photo_url?: string
  bride_photo_url?: string
  groom_bio?: string
  bride_bio?: string
  couple_photo_url?: string
  // Colors
  primary_color?: string
  accent_color?: string
  text_color?: string
  background_color?: string
  /** Pilihan font pembeli. Kosong berarti ikut font tema. */
  font_heading?: string
  font_body?: string
  // Opening
  opening_type?: OpeningType
  opening_greeting?: string
  opening_subtitle?: string
  /**
   * TIDAK DIPAKAI. Tidak ada komponen pembuka yang membacanya: ketujuh belas
   * memakai groom_name dan bride_name apa adanya. Kontrolnya sudah dicabut
   * dari studio pembeli. Bidangnya dibiarkan di sini supaya payload lama
   * yang masih membawanya tidak ditolak, bukan supaya dipakai lagi.
   */
  opening_groom_name?: string
  opening_bride_name?: string
  opening_name_gap?: number
  // Story
  story_title?: string
  story_text?: string
  story_timeline?: TimelineItem[]
  story_chapters?: StoryChapter[]
  // Hero
  hero_video_url?: string
  akad?: EventDetail
  resepsi?: EventDetail
  gallery_photos?: string[]
  // Music
  music_url?: string
  music_title?: string
  gift_accounts?: GiftAccount[]
  livestream_url?: string
  closing_text?: string
  thank_you_message?: string
  // Quote/Doa
  quote_arabic?: string
  quote_translation?: string
  quote_source?: string
  // Video Embed
  video_embed_url?: string
  video_caption?: string
  // Gift Registry
  gift_registry?: GiftRegistryLink[]
  // IG Story Download
  ig_story_image_url?: string
  // QR Code Generator
  qr_target_url?: string
  qr_label?: string
  // Loading screen overrides
  loading_config?: Partial<LoadingConfig>
  // User decoration overrides
  opening_decoration_overrides?: DecorationAsset[]
  section_decoration_overrides?: Record<string, DecorationAsset[]>
  // User section-level overrides (background & transisi), keyed by section.id.
  // Kosong = pakai default dari template. Tidak menimpa template global.
  section_background_overrides?: Record<string, BackgroundConfig>
  section_transition_overrides?: Record<string, { in?: TransitionType; out?: TransitionType }>
}

export interface NewInvitation {
  id: string
  user_id: string
  slug: string
  template_id: string
  data: NewInvitationData
  is_published: boolean
  is_paid: boolean
  expires_at: string | null
  created_at: string
}
