import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session-server'
import { uploadToStorage } from '@/lib/supabase'
import { fileExtension, matchesMagic, numberField, type MagicSignature } from '@/lib/upload-utils'

export const dynamic = 'force-dynamic'

const MAX_IMAGE = 8 * 1024 * 1024   // 8 MB
const MAX_VIDEO = 80 * 1024 * 1024  // 80 MB
const MAX_AUDIO = 15 * 1024 * 1024  // 15 MB
const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
const VIDEO_EXTS = ['.mp4', '.webm', '.mov']
const AUDIO_EXTS = ['.mp3', '.m4a', '.wav', '.ogg', '.aac']
const ALLOWED_FOLDERS = ['user', 'music', 'photos', 'videos']

const MAGIC_SIGS: MagicSignature[] = [
  { kind: 'image', bytes: [0xFF, 0xD8, 0xFF] },
  { kind: 'image', bytes: [0x89, 0x50, 0x4E, 0x47] },
  { kind: 'image', bytes: [0x52, 0x49, 0x46, 0x46] },
  { kind: 'image', bytes: [0x47, 0x49, 0x46, 0x38] },
  { kind: 'video', bytes: [0x66, 0x74, 0x79, 0x70], offset: 4 },
  { kind: 'video', bytes: [0x1A, 0x45, 0xDF, 0xA3] },
  { kind: 'audio', bytes: [0xFF, 0xFB] },
  { kind: 'audio', bytes: [0x49, 0x44, 0x33] },
  { kind: 'audio', bytes: [0x4F, 0x67, 0x67, 0x53] },
  { kind: 'audio', bytes: [0x52, 0x49, 0x46, 0x46] },
]

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Sesi kamu sudah berakhir. Silakan masuk lagi ya.' }, { status: 401 })

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const folderParam = (formData.get('folder') as string | null) ?? 'user'
    const folder = ALLOWED_FOLDERS.includes(folderParam) ? folderParam : 'user'

    if (!file) return NextResponse.json({ error: 'Belum ada berkas yang dipilih.' }, { status: 400 })

    const ext = fileExtension(file.name)
    const isVideo = VIDEO_EXTS.includes(ext) || file.type.startsWith('video/')
    const isAudio = AUDIO_EXTS.includes(ext) || file.type.startsWith('audio/')
    const isImage = IMAGE_EXTS.includes(ext) || file.type.startsWith('image/')

    if (!isVideo && !isAudio && !isImage) {
      return NextResponse.json({ error: 'Jenis berkasnya belum didukung. Pakai foto (JPG, PNG, WebP), video (MP4, WebM, MOV), atau musik (MP3, M4A, WAV) ya.' }, { status: 400 })
    }

    const maxSize = isVideo ? MAX_VIDEO : isAudio ? MAX_AUDIO : MAX_IMAGE
    if (file.size > maxSize) {
      const label = isVideo ? '80MB untuk video' : isAudio ? '15MB untuk audio' : '8MB untuk foto'
      return NextResponse.json({ error: `Berkasnya terlalu besar. Maksimal ${label}.` }, { status: 400 })
    }

    const kind = isVideo ? 'video' : isAudio ? 'audio' : 'image'
    const bytes = await file.arrayBuffer()
    const buffer = new Uint8Array(bytes)

    if (!matchesMagic(buffer, MAGIC_SIGS, kind)) {
      return NextResponse.json({ error: 'Isi berkasnya tidak cocok dengan jenisnya. Coba pilih berkas lain ya.' }, { status: 400 })
    }

    // Gambar artikel sudah di-resize di browser (lib/image-resize.ts); server
    // hanya menerima dimensi hasilnya untuk ditampilkan kembali ke editor.
    const outBuffer: Uint8Array = buffer
    const outExt = ext || (isVideo ? '.mp4' : isAudio ? '.mp3' : '.jpg')
    const outType = file.type || 'application/octet-stream'
    const width = numberField(formData.get('width'))
    const height = numberField(formData.get('height'))
    const lowRes = formData.get('lowRes') === 'true'

    const safeName = `${session.userId.slice(0, 8)}-${Date.now()}${outExt}`
    const storagePath = `${folder}/${safeName}`

    const publicUrl = await uploadToStorage(outBuffer, storagePath, outType)

    return NextResponse.json({ url: publicUrl, type: kind, width, height, bytes: outBuffer.length, lowRes }, { status: 201 })
  } catch (error) {
    console.error('User upload error:', error)
    return NextResponse.json({ error: 'Berkasnya gagal dikirim. Coba lagi sebentar lagi ya.' }, { status: 500 })
  }
}
