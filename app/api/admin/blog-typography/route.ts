import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session-server'
import { isAdmin } from '@/lib/auth'
import { blogTypography, DEFAULT_BLOG_TYPOGRAPHY } from '@/lib/db'
import { sanitizeFontFamily } from '@/lib/html-safe'
import { readNonEmptyJsonBody } from '@/lib/request-body'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (!isAdmin(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({ typography: await blogTypography.get() })
}

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!isAdmin(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // Tiap field jatuh ke DEFAULT saat tidak ada, jadi body kosong = SEMUA
  // tipografi direset diam-diam ke bawaan lalu dibalas 200 seolah berhasil.
  // Body yang tidak terbaca harus ditolak, bukan diperlakukan sebagai {}.
  const body = await readNonEmptyJsonBody(req)
  if (!body) {
    return NextResponse.json({ error: 'Body tipografi tidak valid atau kosong' }, { status: 400 })
  }

  const next = {
    // Dulu hanya `typeof === 'string'`. Nilainya ditempel mentah ke dalam
    // <style>, jadi `x</style><script>...` lolos dan jadi XSS tersimpan untuk
    // semua pengunjung blog.
    headingFont: sanitizeFontFamily(body.headingFont, DEFAULT_BLOG_TYPOGRAPHY.headingFont),
    bodyFont: sanitizeFontFamily(body.bodyFont, DEFAULT_BLOG_TYPOGRAPHY.bodyFont),
    bodySize: Math.min(28, Math.max(12, Number(body.bodySize) || DEFAULT_BLOG_TYPOGRAPHY.bodySize)),
    h2Scale: Math.min(2.6, Math.max(1.1, Number(body.h2Scale) || DEFAULT_BLOG_TYPOGRAPHY.h2Scale)),
    h3Scale: Math.min(2.2, Math.max(1.0, Number(body.h3Scale) || DEFAULT_BLOG_TYPOGRAPHY.h3Scale)),
    lineHeight: Math.min(2.2, Math.max(1.2, Number(body.lineHeight) || DEFAULT_BLOG_TYPOGRAPHY.lineHeight)),
  }
  await blogTypography.save(next)
  return NextResponse.json({ typography: next })
}
