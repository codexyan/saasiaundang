import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session-server'
import { isAdmin } from '@/lib/auth'
import { uploadToStorage } from '@/lib/supabase'
import { fileExtension, matchesMagic, numberField, type MagicSignature } from '@/lib/upload-utils'

export const dynamic = 'force-dynamic'

const MAX_IMAGE_SIZE = 5  * 1024 * 1024  // 5 MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024  // 50 MB
const MAX_AUDIO_SIZE = 15 * 1024 * 1024  // 15 MB

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/ogg']
const AUDIO_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/m4a', 'audio/x-m4a', 'audio/wav', 'audio/wave', 'audio/x-wav', 'audio/ogg', 'audio/aac']
const FONT_TYPES  = ['font/woff2', 'font/woff', 'font/ttf', 'font/otf', 'application/x-font-woff2', 'application/x-font-woff', 'application/x-font-ttf', 'application/x-font-otf', 'application/font-woff2', 'application/font-woff']
const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp']
const VIDEO_EXTS = ['.mp4', '.webm', '.mov', '.ogg']
const AUDIO_EXTS = ['.mp3', '.m4a', '.wav', '.ogg', '.aac']
const FONT_EXTS  = ['.woff2', '.woff', '.ttf', '.otf']

const MAX_FONT_SIZE = 5 * 1024 * 1024  // 5 MB

const ALLOWED_FOLDERS = ['covers', 'thumbnails', 'assets', 'templates', 'decorations', 'music', 'fonts']

const MAGIC_SIGS: MagicSignature[] = [
  { kind: 'image', bytes: [0xFF, 0xD8, 0xFF] },              // jpeg
  { kind: 'image', bytes: [0x89, 0x50, 0x4E, 0x47] },        // png
  { kind: 'image', bytes: [0x52, 0x49, 0x46, 0x46] },        // webp (RIFF)
  { kind: 'video', bytes: [0x66, 0x74, 0x79, 0x70], offset: 4 }, // mp4 (ftyp)
  { kind: 'video', bytes: [0x1A, 0x45, 0xDF, 0xA3] },        // webm
  { kind: 'audio', bytes: [0xFF, 0xFB] },                    // mp3
  { kind: 'audio', bytes: [0x49, 0x44, 0x33] },              // mp3 (ID3)
  { kind: 'audio', bytes: [0x4F, 0x67, 0x67, 0x53] },        // ogg
  { kind: 'audio', bytes: [0x52, 0x49, 0x46, 0x46] },        // wav (RIFF)
  // Font dulu dilewati begitu saja (selalu lolos). Sekarang diperiksa juga —
  // folder "fonts" ikut disajikan publik dari bucket Supabase.
  { kind: 'font',  bytes: [0x77, 0x4F, 0x46, 0x32] },        // woff2 (wOF2)
  { kind: 'font',  bytes: [0x77, 0x4F, 0x46, 0x46] },        // woff  (wOFF)
  { kind: 'font',  bytes: [0x00, 0x01, 0x00, 0x00] },        // ttf
  { kind: 'font',  bytes: [0x74, 0x72, 0x75, 0x65] },        // ttf   (true)
  { kind: 'font',  bytes: [0x4F, 0x54, 0x54, 0x4F] },        // otf   (OTTO)
]

function fileKind(file: File): 'image' | 'video' | 'audio' | 'font' | null {
  if (IMAGE_TYPES.includes(file.type)) return 'image'
  if (VIDEO_TYPES.includes(file.type)) return 'video'
  if (AUDIO_TYPES.includes(file.type)) return 'audio'
  if (FONT_TYPES.includes(file.type))  return 'font'
  const ext = fileExtension(file.name)
  if (IMAGE_EXTS.includes(ext)) return 'image'
  if (VIDEO_EXTS.includes(ext)) return 'video'
  if (AUDIO_EXTS.includes(ext)) return 'audio'
  if (FONT_EXTS.includes(ext))  return 'font'
  return null
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const folderParam = (formData.get('folder') as string | null) ?? 'covers'
    const folder = ALLOWED_FOLDERS.includes(folderParam) ? folderParam : 'covers'

    if (!file) {
      return NextResponse.json({ error: 'File wajib diisi' }, { status: 400 })
    }

    const kind = fileKind(file)
    if (!kind) {
      return NextResponse.json({ error: 'Format tidak didukung. Gunakan JPG, PNG, WebP, MP4, WebM, MP3, M4A, WAV, WOFF2, TTF, atau OTF' }, { status: 400 })
    }

    const maxSize = kind === 'video' ? MAX_VIDEO_SIZE : kind === 'audio' ? MAX_AUDIO_SIZE : kind === 'font' ? MAX_FONT_SIZE : MAX_IMAGE_SIZE
    if (file.size > maxSize) {
      const label = kind === 'video' ? '50MB untuk video' : kind === 'audio' ? '15MB untuk audio' : kind === 'font' ? '5MB untuk font' : '5MB untuk foto'
      return NextResponse.json({ error: `File terlalu besar (maks ${label})` }, { status: 400 })
    }

    const ext = fileExtension(file.name)
    const allowedExts = kind === 'video' ? VIDEO_EXTS : kind === 'audio' ? AUDIO_EXTS : kind === 'font' ? FONT_EXTS : IMAGE_EXTS
    if (!allowedExts.includes(ext)) {
      return NextResponse.json({ error: 'Ekstensi file tidak valid' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = new Uint8Array(bytes)

    if (!matchesMagic(buffer, MAGIC_SIGS, kind)) {
      return NextResponse.json({ error: 'Konten file tidak sesuai dengan format yang dideklarasikan' }, { status: 400 })
    }

    // Gambar artikel sudah di-resize di browser (lib/image-resize.ts); server
    // hanya menerima dimensi hasilnya untuk ditampilkan kembali ke editor.
    const outBuffer: Uint8Array = buffer
    const outExt = ext
    const outType = file.type || 'application/octet-stream'
    const width = numberField(formData.get('width'))
    const height = numberField(formData.get('height'))
    const lowRes = formData.get('lowRes') === 'true'

    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 9)
    const filename = `${kind}-${timestamp}-${random}${outExt}`
    const storagePath = `${folder}/${filename}`

    const publicUrl = await uploadToStorage(outBuffer, storagePath, outType)

    return NextResponse.json({ url: publicUrl, width, height, bytes: outBuffer.length, lowRes }, { status: 201 })
  } catch (error) {
    console.error('Admin upload error:', error)
    return NextResponse.json(
      { error: 'Gagal mengupload file. Silakan coba lagi.' },
      { status: 500 }
    )
  }
}
