import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session-server'
import { invitations } from '@/lib/db'
import { uploadToStorage } from '@/lib/supabase'
import { fileExtension, matchesMagic, type MagicSignature } from '@/lib/upload-utils'

export const dynamic = 'force-dynamic'

const MAX_SIZE = 20 * 1024 * 1024 // 20MB

// Route ini dulu menerima ekstensi APA PUN dan meneruskan file.type dari client
// mentah-mentah sebagai Content-Type tersimpan. Karena bucket "uploads" bersifat
// publik, "lagu.html" dengan Content-Type text/html akan disajikan sebagai HTML
// dari origin storage kita — XSS tersimpan sekaligus hosting phishing gratis.
// Sekarang ekstensi, MIME, dan magic byte semuanya dibatasi allowlist.
const ALLOWED_EXTS = ['.mp3', '.m4a', '.wav', '.ogg', '.aac']
const ALLOWED_TYPES = [
  'audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/m4a', 'audio/x-m4a',
  'audio/wav', 'audio/wave', 'audio/x-wav', 'audio/ogg', 'audio/aac',
]
const CONTENT_TYPE_BY_EXT: Record<string, string> = {
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.aac': 'audio/aac',
}
const AUDIO_MAGIC: MagicSignature[] = [
  { kind: 'audio', bytes: [0xFF, 0xFB] },                    // mp3
  { kind: 'audio', bytes: [0xFF, 0xF3] },                    // mp3
  { kind: 'audio', bytes: [0xFF, 0xF2] },                    // mp3
  { kind: 'audio', bytes: [0x49, 0x44, 0x33] },              // mp3 (ID3)
  { kind: 'audio', bytes: [0x4F, 0x67, 0x67, 0x53] },        // ogg
  { kind: 'audio', bytes: [0x52, 0x49, 0x46, 0x46] },        // wav (RIFF)
  { kind: 'audio', bytes: [0x66, 0x74, 0x79, 0x70], offset: 4 }, // m4a/aac (ftyp)
]

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await req.formData()
    const invitationId = formData.get('invitationId') as string
    const file = formData.get('file') as File | null

    if (!file || !invitationId) {
      return NextResponse.json({ error: 'File dan invitationId wajib diisi' }, { status: 400 })
    }

    const inv = await invitations.findById(invitationId)
    if (!inv || inv.user_id !== session.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File terlalu besar (max 20MB)' }, { status: 400 })
    }

    const ext = fileExtension(file.name) || '.mp3'
    if (!ALLOWED_EXTS.includes(ext)) {
      return NextResponse.json({ error: 'Format tidak didukung. Gunakan MP3, M4A, WAV, OGG, atau AAC' }, { status: 400 })
    }
    if (file.type && !ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Tipe file tidak didukung' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = new Uint8Array(bytes)

    if (!matchesMagic(buffer, AUDIO_MAGIC, 'audio')) {
      return NextResponse.json({ error: 'Konten file tidak sesuai dengan format audio' }, { status: 400 })
    }

    const filename = `music-${session.userId}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}${ext}`
    const storagePath = `music/${filename}`

    // Content-Type diturunkan dari ekstensi yang sudah lolos allowlist —
    // BUKAN dari file.type kiriman client.
    const musicUrl = await uploadToStorage(buffer, storagePath, CONTENT_TYPE_BY_EXT[ext] ?? 'audio/mpeg')

    await invitations.update(invitationId, {
      data: { ...inv.data, musicUrl },
    })

    return NextResponse.json({ musicUrl, musicTitle: file.name })
  } catch (error) {
    console.error('Music upload error:', error)
    return NextResponse.json({ error: 'Gagal mengupload musik' }, { status: 500 })
  }
}
