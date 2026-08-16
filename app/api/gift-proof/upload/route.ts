import { NextRequest, NextResponse } from 'next/server'
import { uploadToStorage } from '@/lib/supabase'
import { invitations } from '@/lib/db'
import { getSession } from '@/lib/session-server'
import { fileExtension } from '@/lib/upload-utils'
import { allowRequest } from '@/lib/rate-limit'

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
      return NextResponse.json({ error: 'Undangannya belum dipilih.' }, { status: 400 })
    }

    // Undangan sungguhan: sengaja terbuka untuk tamu (tamu tidak punya akun),
    // tapi undangannya harus benar-benar ada dan sudah terbit.
    //
    // invitationId 'preview' adalah nilai default milik renderer saat dipakai di
    // studio/demo. Dulu nilai itu MELEWATI seluruh pemeriksaan, sehingga siapa
    // pun bisa mengunggah berkas 10 MB tanpa batas ke Supabase Storage secara
    // anonim hanya dengan mengirim invitationId=preview. Sekarang jalur preview
    // menuntut sesi login — pengguna studio memang selalu login.
    if (invitationId === 'preview') {
      const session = await getSession()
      if (!session) {
        return NextResponse.json({ error: 'Sesi kamu sudah berakhir. Silakan masuk lagi ya.' }, { status: 401 })
      }
    } else {
      const inv = await invitations.findById(invitationId)
      if (!inv || !inv.is_published) {
        return NextResponse.json({ error: 'Undangannya tidak ditemukan. Coba periksa lagi alamatnya.' }, { status: 404 })
      }

      // Tamu memang tidak perlu login untuk mengirim bukti hadiah — itu
      // disengaja. Tapi tanpa batas, siapa pun yang tahu slug undangan publik
      // bisa mengunggah berkas 10 MB berulang-ulang ke Supabase Storage yang
      // berbayar. Dibatasi per undangan, bukan per IP: yang perlu dilindungi
      // adalah kuota penyimpanan undangan itu, dan tamu satu resepsi bisa saja
      // berbagi jaringan yang sama.
      if (!(await allowRequest('UPLOAD_RATE_LIMIT', `gift-proof:${invitationId}`))) {
        return NextResponse.json(
          { error: 'Terlalu banyak unggahan. Coba lagi sebentar lagi.' },
          { status: 429 }
        )
      }
    }

    if (!file) {
      return NextResponse.json({ error: 'Belum ada berkas yang dipilih.' }, { status: 400 })
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Berkasnya terlalu besar. Maksimal 10MB ya.' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Fotonya harus berformat JPG, PNG, atau WebP ya.' }, { status: 400 })
    }

    const ext = fileExtension(file.name)
    if (!ALLOWED_EXTS.includes(ext)) {
      return NextResponse.json({ error: 'Jenis berkasnya belum didukung. Coba pakai berkas lain ya.' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = new Uint8Array(bytes)

    if (!validateMagicBytes(buffer, file.type)) {
      return NextResponse.json({ error: 'Isi berkasnya tidak cocok dengan jenisnya. Coba pilih berkas lain ya.' }, { status: 400 })
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
      { error: 'Berkasnya gagal dikirim. Coba lagi sebentar lagi ya.' },
      { status: 500 }
    )
  }
}
