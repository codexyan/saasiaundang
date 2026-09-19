import { z } from 'zod'

/**
 * Skema minimal untuk kolom JSONB `invitations.data`.
 *
 * FILOSOFI — validasi BENTUK, bukan kelengkapan:
 *
 * 1. Semua field opsional. Autosave studio mengirim data apa adanya termasuk
 *    saat undangan baru dibuat dan hampir semuanya masih kosong; mewajibkan
 *    bride_name/groom_name akan mengunci pengguna di luar editornya sendiri.
 *
 * 2. .passthrough() di setiap level. Zod default MEMBUANG key tak dikenal —
 *    dan karena InvitationStudio.scheduleSave() menyimpan SELURUH objek data
 *    pada tiap autosave, "membuang" berarti KEHILANGAN DATA PERMANEN untuk
 *    (a) field baru dari Template Lab yang belum terdaftar di sini, dan
 *    (b) undangan legacy yang datanya masih camelCase (groomName, brideName —
 *    lihat DashboardClient.getDisplayNames).
 *
 * 3. Yang benar-benar dijaga: tipe dan batas ukuran. Renderer runtuh kalau
 *    gallery_photos ternyata string, atau akad ternyata angka. Batas panjang
 *    mencegah satu baris JSONB membengkak sampai memperlambat setiap render.
 *
 * 4. Enum (opening_type, transition, marketplace) sengaja divalidasi sebagai
 *    string berbatas, bukan z.enum(). Nilai-nilainya bertambah dari Template
 *    Lab; z.enum() akan menolak template baru sampai berkas ini ikut diperbarui.
 */

/** Teks pendek: nama, label, judul, tanggal, jam. */
const shortText = z.string().max(200)
/** Teks panjang: bio, cerita, sambutan penutup. */
const longText = z.string().max(5000)
/** URL aset. Sengaja bukan z.string().url() — sebagian nilai adalah path relatif. */
const assetUrl = z.string().max(2000)
/** Nilai warna: hex, rgba, atau gradient CSS pendek. */
const colorValue = z.string().max(500)
/** Rasio 0–1 (opacity). */
const ratio = z.number().min(0).max(1)

const eventDetail = z.object({
  date: shortText.optional(),
  time: shortText.optional(),
  venue_name: shortText.optional(),
  venue_address: longText.optional(),
  maps_url: assetUrl.optional(),
  venue_photo_url: assetUrl.optional(),
}).passthrough()

const giftAccount = z.object({
  type: shortText.optional(),          // 'bank' | 'ewallet'
  bank: shortText.optional(),
  platform: shortText.optional(),
  number: shortText.optional(),
  name: shortText.optional(),
}).passthrough()

const timelineItem = z.object({
  date: shortText.optional(),
  title: shortText.optional(),
  description: longText.optional(),
  photo_url: assetUrl.optional(),
}).passthrough()

const storyChapter = z.object({
  title: shortText.optional(),
  text: longText.optional(),
  date: shortText.optional(),
  photo_url: assetUrl.optional(),
  video_url: assetUrl.optional(),
  overlay_opacity: ratio.optional(),
}).passthrough()

const giftRegistryLink = z.object({
  label: shortText.optional(),
  url: assetUrl.optional(),
  image_url: assetUrl.optional(),
  description: longText.optional(),
  price: shortText.optional(),
  marketplace: shortText.optional(),
}).passthrough()

const backgroundConfig = z.object({
  type: shortText.optional(),          // 'image' | 'video' | 'color' | 'gradient'
  url: assetUrl.optional(),
  value: colorValue.optional(),
  overlay_opacity: ratio.optional(),
}).passthrough()

const transitionOverride = z.object({
  in: shortText.optional(),
  out: shortText.optional(),
}).passthrough()

/**
 * Aset dekorasi punya ~20 field opsional yang masih sering berubah bentuk di
 * Template Lab (keyframe, idle, exit). Divalidasi longgar sebagai objek —
 * yang penting ia OBJEK di dalam ARRAY, karena DecorationAssetLayer
 * melakukan .map() atasnya dan runtuh kalau bentuknya lain.
 */
const decorationAsset = z.record(z.unknown())

export const newInvitationDataSchema = z.object({
  // ── Identitas mempelai ──────────────────────────────────────────────
  bride_name: shortText.optional(),
  groom_name: shortText.optional(),
  groom_nickname: shortText.optional(),
  bride_nickname: shortText.optional(),
  bride_parents: shortText.optional(),
  groom_parents: shortText.optional(),
  groom_father: shortText.optional(),
  groom_mother: shortText.optional(),
  bride_father: shortText.optional(),
  bride_mother: shortText.optional(),
  tagline: longText.optional(),
  groom_photo_url: assetUrl.optional(),
  bride_photo_url: assetUrl.optional(),
  groom_bio: longText.optional(),
  bride_bio: longText.optional(),
  couple_photo_url: assetUrl.optional(),

  // ── Warna ───────────────────────────────────────────────────────────
  primary_color: colorValue.optional(),
  accent_color: colorValue.optional(),
  text_color: colorValue.optional(),
  background_color: colorValue.optional(),

  // ── Tipografi ───────────────────────────────────────────────────────
  // Nama keluarga Google Fonts. Renderer menyusun tautan fonts.googleapis
  // langsung dari nilai ini.
  font_heading: shortText.optional(),
  font_body: shortText.optional(),

  // ── Sampul (opening) ────────────────────────────────────────────────
  opening_type: shortText.optional(),
  opening_greeting: longText.optional(),
  opening_subtitle: longText.optional(),
  opening_groom_name: shortText.optional(),
  opening_bride_name: shortText.optional(),
  opening_name_gap: z.number().optional(),

  // ── Kisah ───────────────────────────────────────────────────────────
  story_title: shortText.optional(),
  story_text: longText.optional(),
  story_timeline: z.array(timelineItem).max(50).optional(),
  story_chapters: z.array(storyChapter).max(50).optional(),

  // ── Hero & acara ────────────────────────────────────────────────────
  hero_video_url: assetUrl.optional(),
  akad: eventDetail.optional(),
  resepsi: eventDetail.optional(),
  gallery_photos: z.array(assetUrl).max(300).optional(),

  // ── Musik ───────────────────────────────────────────────────────────
  music_url: assetUrl.optional(),
  music_title: shortText.optional(),

  // ── Hadiah & penutup ────────────────────────────────────────────────
  gift_accounts: z.array(giftAccount).max(20).optional(),
  livestream_url: assetUrl.optional(),
  closing_text: longText.optional(),
  thank_you_message: longText.optional(),

  // ── Kutipan / doa ───────────────────────────────────────────────────
  quote_arabic: longText.optional(),
  quote_translation: longText.optional(),
  quote_source: shortText.optional(),

  // ── Video embed ─────────────────────────────────────────────────────
  video_embed_url: assetUrl.optional(),
  video_caption: longText.optional(),

  // ── Gift registry, IG story, QR ─────────────────────────────────────
  gift_registry: z.array(giftRegistryLink).max(50).optional(),
  ig_story_image_url: assetUrl.optional(),
  qr_target_url: assetUrl.optional(),
  qr_label: shortText.optional(),

  // ── Override tingkat lanjut ─────────────────────────────────────────
  loading_config: z.record(z.unknown()).optional(),
  opening_decoration_overrides: z.array(decorationAsset).max(100).optional(),
  section_decoration_overrides: z.record(z.array(decorationAsset).max(100)).optional(),
  section_background_overrides: z.record(backgroundConfig).optional(),
  section_transition_overrides: z.record(transitionOverride).optional(),
}).passthrough()

export type ValidatedInvitationData = z.infer<typeof newInvitationDataSchema>
