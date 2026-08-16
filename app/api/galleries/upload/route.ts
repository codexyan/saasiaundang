import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session-server'
import { galleries, invitations } from '@/lib/db'
import { uploadToStorage } from '@/lib/supabase'
import { fileExtension } from '@/lib/upload-utils'

export const dynamic = 'force-dynamic'

const MAX_FILES = 10
const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const ALLOWED_EXTS = ['.jpg', '.jpeg', '.png', '.webp']

const IMAGE_MAGIC: { bytes: number[] }[] = [
  { bytes: [0xFF, 0xD8, 0xFF] },
  { bytes: [0x89, 0x50, 0x4E, 0x47] },
  { bytes: [0x52, 0x49, 0x46, 0x46] },
]

function validateImageMagic(buffer: Uint8Array): boolean {
  return IMAGE_MAGIC.some(s => s.bytes.every((b, i) => buffer[i] === b))
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Sesi kamu sudah berakhir. Silakan masuk lagi ya.' }, { status: 401 })

    const formData = await req.formData()
    const invitationId = formData.get('invitationId') as string
    const file = formData.get('file') as File | null

    if (!file || !invitationId) {
      return NextResponse.json({ error: 'Berkasnya belum dipilih.' }, { status: 400 })
    }

    const inv = await invitations.findById(invitationId)
    if (!inv || inv.user_id !== session.userId) {
      return NextResponse.json({ error: 'Datanya tidak ditemukan.' }, { status: 404 })
    }

    const existing = await galleries.findByInvitationId(invitationId)
    if (existing.length >= MAX_FILES) {
      return NextResponse.json({ error: `Maksimal ${MAX_FILES} foto ya.` }, { status: 400 })
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Fotonya terlalu besar. Maksimal 5MB ya.' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Fotonya harus berformat JPG, PNG, atau WebP ya.' }, { status: 400 })
    }

    const ext = fileExtension(file.name) || '.jpg'
    if (!ALLOWED_EXTS.includes(ext)) {
      return NextResponse.json({ error: 'Jenis berkasnya belum didukung. Coba pakai berkas lain ya.' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = new Uint8Array(bytes)

    if (!validateImageMagic(buffer)) {
      return NextResponse.json({ error: 'Berkas ini sepertinya bukan foto. Coba pilih foto lain ya.' }, { status: 400 })
    }
    // Suffix acak: uploadToStorage memakai upsert:true, jadi dua upload dalam
    // milidetik yang sama akan saling menimpa kalau namanya hanya userId+waktu.
    const filename = `${session.userId}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}${ext}`
    const storagePath = `galleries/${filename}`

    const publicUrl = await uploadToStorage(buffer, storagePath, file.type || 'image/jpeg')

    const gallery = await galleries.create({
      invitation_id: invitationId,
      url: publicUrl,
      order: existing.length,
    })

    return NextResponse.json({ gallery }, { status: 201 })
  } catch (error) {
    console.error('Gallery upload error:', error)
    return NextResponse.json({ error: 'Fotonya gagal dikirim. Coba lagi sebentar lagi ya.' }, { status: 500 })
  }
}
