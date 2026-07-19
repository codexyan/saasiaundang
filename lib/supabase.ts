import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Client dibuat LAZY, bukan di module scope.
 *
 * Di Cloudflare Workers module scope dievaluasi sekali saat isolate start —
 * sebelum ada request — dan `process.env` untuk secret runtime belum terisi di
 * titik itu. `createClient(undefined, undefined)` akan menghasilkan client rusak
 * yang baru gagal jauh di kemudian hari dengan pesan yang menyesatkan.
 *
 * Client Supabase berbasis fetch (bukan socket), jadi aman di-cache per isolate.
 */
let cached: SupabaseClient | undefined

function supabaseAdmin(): SupabaseClient {
  if (cached) return cached

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error(
      'Supabase Storage tidak terkonfigurasi: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY kosong.'
    )
  }

  cached = createClient(url, serviceKey)
  return cached
}

const BUCKET = 'uploads'

export async function uploadToStorage(
  file: Buffer | Uint8Array,
  filePath: string,
  contentType: string
): Promise<string> {
  const client = supabaseAdmin()

  const { error } = await client.storage
    .from(BUCKET)
    .upload(filePath, file, { contentType, upsert: true })

  if (error) throw new Error(`Upload failed: ${error.message}`)

  const { data } = client.storage.from(BUCKET).getPublicUrl(filePath)
  return data.publicUrl
}

export async function deleteFromStorage(filePath: string): Promise<void> {
  await supabaseAdmin().storage.from(BUCKET).remove([filePath])
}
