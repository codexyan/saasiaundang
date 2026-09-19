'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  PenLine,
  Megaphone,
  Shield,
} from 'lucide-react'
import { useSession } from '@/components/ui/SessionProvider'

type Role = 'admin' | 'content_writer' | 'affiliate' | 'user'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  roles: Role[]
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard className="h-4 w-4" />,
    roles: ['admin', 'content_writer', 'affiliate', 'user'],
  },
  {
    label: 'Admin Panel',
    href: '/admin',
    icon: <Shield className="h-4 w-4" />,
    roles: ['admin'],
  },
  {
    label: 'Artikel Saya',
    href: '/writer',
    icon: <PenLine className="h-4 w-4" />,
    roles: ['admin', 'content_writer'],
  },
  {
    label: 'Affiliate',
    href: '/affiliate',
    icon: <Megaphone className="h-4 w-4" />,
    roles: ['admin', 'affiliate'],
  },
]

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useSession()
  const role = (user?.role as Role | undefined) ?? null
  const email = user?.email ?? ''
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [needsRevisionCount, setNeedsRevisionCount] = useState(0)

  // Badge on "Artikel Saya" for revision requests the writer hasn't seen yet.
  useEffect(() => {
    if (role !== 'content_writer' && role !== 'admin') return
    fetch('/api/writer/notifications')
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setNeedsRevisionCount(data.needsRevisionUnseen ?? 0))
      .catch(() => {})
  }, [role])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      router.push('/login')
    }
  }

  const visibleLinks = role
    ? navItems.filter((item) => item.roles.includes(role))
    : []

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  const isAdmin = pathname.startsWith('/admin')
  const isDashboard = pathname.startsWith('/dashboard')

  if (isAdmin || isDashboard) {
    return <>{children}</>
  }

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-40 h-14 border-b border-gray-100 bg-white">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* Left: Logo + Nav */}
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="text-lg font-bold text-forest-700 tracking-tight"
            >
              iaundang
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {visibleLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    isActive(item.href)
                      ? 'text-forest-600 border-b-2 border-forest-500'
                      : 'text-gray-600 hover:text-forest-600 hover:bg-forest-50'
                  }`}
                >
                  {item.icon}
                  {item.label}
                  {item.href === '/writer' && needsRevisionCount > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[16px] h-4 px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
                      {needsRevisionCount}
                    </span>
                  )}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right: email + logout (desktop) */}
          <div className="hidden md:flex items-center gap-4">
            {email && (
              <span className="max-w-[180px] truncate text-sm text-gray-500">
                {email}
              </span>
            )}
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 transition-colors disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" />
              Keluar
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 text-gray-600 hover:text-forest-700"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Tutup menu' : 'Buka menu'}
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <div className="md:hidden border-b border-gray-100 bg-white shadow-sm">
            <nav className="flex flex-col px-4 py-2 gap-1">
              {visibleLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${
                    isActive(item.href)
                      ? 'text-forest-600 bg-forest-50'
                      : 'text-gray-600 hover:text-forest-600 hover:bg-gray-50'
                  }`}
                >
                  {item.icon}
                  {item.label}
                  {item.href === '/writer' && needsRevisionCount > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[16px] h-4 px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
                      {needsRevisionCount}
                    </span>
                  )}
                </Link>
              ))}

              {/* Email + logout in mobile */}
              <div className="mt-2 border-t border-gray-100 pt-2">
                {email && (
                  <p className="px-3 py-1 text-xs text-gray-400 truncate">
                    {email}
                  </p>
                )}
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                >
                  <LogOut className="h-4 w-4" />
                  Keluar
                </button>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Page content */}
      <main>{children}</main>
    </>
  )
}
