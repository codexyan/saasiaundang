import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/session'
import { isAdmin, isWriter, isAffiliate } from '@/lib/auth'
import { APP_DOMAIN, isMainSiteLabel } from '@/lib/subdomain'

const PROTECTED_PATHS = ['/dashboard', '/admin', '/writer', '/affiliate']

export async function middleware(req: NextRequest) {
  const hostname = req.headers.get('host') || ''
  const host = hostname.replace(/:\d+$/, '')
  const isLocalhost = host === 'localhost'

  let slug: string | null = null
  if (isLocalhost) {
    slug = req.nextUrl.searchParams.get('slug')
  } else if (host.endsWith(`.${APP_DOMAIN}`)) {
    slug = host.split('.')[0]
  }

  // Label situs utama diambil dari lib/subdomain.ts, fungsi yang sama yang
  // menolak alamat itu saat checkout. Dulu daftarnya hanya ditulis di sini,
  // sehingga checkout tetap menjual `www` dan `iaundang` walau alamat itu tidak
  // pernah diarahkan ke undangan.
  const isMainDomain = !slug || isMainSiteLabel(slug)

  const pathname = req.nextUrl.pathname
  const isApiOrInternal = pathname.startsWith('/api') || pathname.startsWith('/_next')

  if (!isMainDomain && slug && !isApiOrInternal) {
    const url = req.nextUrl.clone()
    const invPath = pathname === '/'
      ? `/invitation/${slug}`
      : `/invitation/${slug}${pathname}`
    url.pathname = invPath
    return NextResponse.rewrite(url)
  }

  const isProtected = PROTECTED_PATHS.some((p) => req.nextUrl.pathname.startsWith(p))
  if (!isProtected) return NextResponse.next()

  const session = await getSessionFromRequest(req)

  if (!session) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('redirect', req.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (req.nextUrl.pathname.startsWith('/admin') && !isAdmin(session)) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  if (req.nextUrl.pathname.startsWith('/writer') && !isWriter(session)) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  if (req.nextUrl.pathname.startsWith('/affiliate') && !isAffiliate(session)) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|uploads|.*\\..*).*)'],
}
