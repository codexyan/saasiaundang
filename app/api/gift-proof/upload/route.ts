import { NextRequest, NextResponse } from 'next/server'
import { uploadToStorage } from '@/lib/supabase'
import { invitations } from '@/lib/db'
import { fileExtension } from '@/lib/upload-utils'

export const dynamic = 'force-dynamic'

const MAX_SIZE  = 10 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
const ALLOWED_EXTS  = ['.jpg', '.jpeg', '.png', '.webp', '.heic']

const IMAGE_MAGIC: { type: string; bytes: number[] }[] = [
  { type: 'image/jpeg', bytes: [0xFF, 0xD8, 0xFF] },
  { type: 'image/png',  bytes: [0x89, 0x50, 0x4E, 0x47] },
  { type: 'image/webp', bytes: [0x52, 0x49, 0x46, 0x46] },
]

function validateMagicBytes(buffer: Uint8Array, declaredType: string): boolean {
  if (declaredType === 'image/heic') return true
  const sig = IMAGE_MAGIC.find(m => m.type === declaredType)
  if (!sig) return false
  return sig.bytes.every((b, i) => buffer[i] === b)
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const invitationId = formData.get('invitationId') as string | null

    if (!invitationId) {
      return NextResponse.json({ error: 'invitationId wajib diisi' }, { status: 400 })
    }

    if (invitationId !== 'preview') {
      const inv = await invitations.findById(invitationId)
      if (!inv || !inv.is_published) {
        return NextResponse.json({ error: 'Undangan tidak ditemukan' }, { status: 404 })
      }
    }

    if (!file) {
      return NextResponse.json({ error: 'File wajib diisi' }, { status: 400 })
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File terlalu besar (maks 10MB)' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Format tidak didukung. Gunakan JPG, PNG, atau WebP' }, { status: 400 })
    }

    const ext = fileExtension(file.name)
    if (!ALLOWED_EXTS.includes(ext)) {
      return NextResponse.json({ error: 'Ekstensi file tidak valid' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = new Uint8Array(bytes)

    if (!validateMagicBytes(buffer, file.type)) {
      return NextResponse.json({ error: 'Konten file tidak sesuai dengan format yang dideklarasikan' }, { status: 400 })
    }

    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 9)
    const safeFilename = `proof-${timestamp}-${random}${ext}`
    const storagePath = `gift-proofs/${safeFilename}`

    const publicUrl = await uploadToStorage(buffer, storagePath, file.type)

    return NextResponse.json({ url: publicUrl }, { status: 201 })
  } catch (error) {
    console.error('Gift proof upload error:', error)
    return NextResponse.json(
      { error: 'Gagal mengupload file. Silakan coba lagi.' },
      { status: 500 }
    )
  }
}
