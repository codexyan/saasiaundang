'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence, useMotionValueEvent, useScroll } from 'framer-motion'
import { Menu, X, LayoutDashboard, PenLine, Megaphone, Shield, ArrowRight } from 'lucide-react'
import Logo from './Logo'
import { Button } from '@/components/marketing/Button'
import { EASE } from '@/lib/motion'

const NAV_LINKS = [
  { href: '/#fitur', label: 'Fitur' },
  { href: '/#templates', label: 'Template' },
  { href: '/#harga', label: 'Harga' },
  { href: '/#faq', label: 'FAQ' },
  { href: '/blog', label: 'Blog' },
]

const ROLE_LINKS: Record<string, { href: string; label: string; icon: React.ReactNode }[]> = {
  admin: [
    { href: '/admin', label: 'Admin Panel', icon: <Shield className="w-4 h-4" /> },
    { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  ],
  content_writer: [
    { href: '/writer', label: 'Writer', icon: <PenLine className="w-4 h-4" /> },
    { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  ],
  affiliate: [
    { href: '/affiliate', label: 'Affiliate', icon: <Megaphone className="w-4 h-4" /> },
    { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  ],
  user: [
    { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  ],
}

function NavLink({ href, label, delay = 0 }: { href: string; label: string; delay?: number }) {
  const pathname = usePathname()
  const isAnchor = href.startsWith('/#')
  const isActive = !isAnchor && pathname.startsWith(href)

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: EASE }}
    >
      <Link
        href={href}
        className="group relative text-label-lg px-1 py-1.5 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40 focus-visible:ring-offset-2 rounded-sm"
      >
        <span className={isActive ? 'text-forest-deep' : 'text-concrete group-hover:text-forest-deep'}>
          {label}
        </span>
        <motion.span
          className="absolute -bottom-0.5 left-0 right-0 h-[1.5px] bg-gold-dark origin-left rounded-full"
          initial={false}
          animate={{ scaleX: isActive ? 1 : 0 }}
          transition={{ duration: 0.3, ease: EASE }}
          style={{ transformOrigin: 'left' }}
        />
        {!isActive && (
          <span className="absolute -bottom-0.5 left-0 right-0 h-[1.5px] bg-gold-dark/40 rounded-full origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]" />
        )}
      </Link>
    </motion.div>
  )
}

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<{ email: string; role?: string } | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [lastY, setLastY] = useState(0)

  const { scrollY } = useScroll()

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then(({ user }) => { setUser(user ?? null); setLoaded(true) })
      .catch(() => setLoaded(true))
  }, [])

  useMotionValueEvent(scrollY, 'change', useCallback((latest: number) => {
    setScrolled(latest > 16)
    setHidden(latest > 120 && latest > lastY)
    setLastY(latest)
  }, [lastY]))

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    router.push('/')
    router.refresh()
  }

  const isLanding = pathname === '/'
  const roleLinks = ROLE_LINKS[user?.role ?? 'user'] ?? ROLE_LINKS.user

  return (
    <>
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{
          y: hidden ? -80 : 0,
          opacity: hidden ? 0 : 1,
        }}
        transition={{ duration: 0.4, ease: EASE }}
        className="fixed top-0 inset-x-0 z-50"
      >
        <div
          className={`transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            scrolled
              ? 'bg-ivory/85 backdrop-blur-xl border-b border-hairline'
              : isLanding
                ? 'bg-transparent'
                : 'bg-ivory border-b border-hairline/70'
          }`}
        >
          <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">

            {/* Logo */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, ease: EASE }}
            >
              <Logo variant="horizontal" size="sm" />
            </motion.div>

            {/* Desktop nav links — clean, no container */}
            <div className="hidden md:flex items-center gap-7">
              {NAV_LINKS.map((link, i) => (
                <NavLink key={link.href} href={link.href} label={link.label} delay={0.06 * i + 0.1} />
              ))}
            </div>

            {/* Right section */}
            <div className="flex items-center gap-3">
              {!loaded ? (
                <div className="flex gap-2">
                  <div className="w-14 h-8 bg-forest-50 rounded-lg animate-pulse" />
                  <div className="w-24 h-8 bg-forest-50 rounded-lg animate-pulse" />
                </div>
              ) : user ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.3, ease: EASE }}
                  className="flex items-center gap-2"
                >
                  <span className="hidden lg:block text-body-xs text-concrete truncate max-w-[120px]">
                    {user.email}
                  </span>
                  <div className="hidden md:flex items-center gap-1">
                    {roleLinks.map((rl) => (
                      <Link
                        key={rl.href}
                        href={rl.href}
                        className={`text-label-lg px-2.5 py-1.5 rounded-lg transition-colors duration-200 flex items-center gap-1.5 ${
                          pathname === rl.href
                            ? 'text-forest-deep bg-forest-50'
                            : 'text-concrete hover:text-forest-deep hover:bg-forest-50'
                        }`}
                      >
                        {rl.icon}
                        <span className="hidden lg:inline">{rl.label}</span>
                      </Link>
                    ))}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="hidden md:inline-flex text-label-lg text-concrete hover:text-forest-deep px-2.5 py-1.5 rounded-lg hover:bg-forest-50 transition-colors duration-200"
                  >
                    Keluar
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.3, ease: EASE }}
                  className="flex items-center gap-2"
                >
                  <Link
                    href="/login"
                    className="hidden sm:inline-flex text-label-lg text-concrete hover:text-forest-deep px-3 py-1.5 rounded-lg transition-colors duration-200"
                  >
                    Masuk
                  </Link>
                  <Button href="/templates" size="sm">
                    Buat Undangan
                    <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform duration-200" />
                  </Button>
                </motion.div>
              )}

              {/* Mobile toggle */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden w-11 h-11 flex items-center justify-center rounded-lg text-concrete hover:text-forest-deep transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40"
                aria-label={mobileOpen ? 'Tutup menu' : 'Buka menu'}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {mobileOpen ? (
                    <motion.div
                      key="close"
                      initial={{ opacity: 0, rotate: -90 }}
                      animate={{ opacity: 1, rotate: 0 }}
                      exit={{ opacity: 0, rotate: 90 }}
                      transition={{ duration: 0.2, ease: EASE }}
                    >
                      <X size={20} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="menu"
                      initial={{ opacity: 0, rotate: 90 }}
                      animate={{ opacity: 1, rotate: 0 }}
                      exit={{ opacity: 0, rotate: -90 }}
                      transition={{ duration: 0.2, ease: EASE }}
                    >
                      <Menu size={20} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: EASE }}
              className="fixed inset-0 z-40 bg-forest-deep/25 backdrop-blur-[2px] md:hidden"
              onClick={() => setMobileOpen(false)}
            />

            {/* Menu card */}
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: EASE }}
              className="fixed inset-x-4 top-[76px] z-50 md:hidden"
            >
              <div className="bg-ivory/95 backdrop-blur-xl rounded-card border border-hairline overflow-hidden shadow-card">
                <div className="p-3 space-y-0.5">
                  {NAV_LINKS.map((link, i) => {
                    const isAnchor = link.href.startsWith('/#')
                    const isActive = !isAnchor && pathname.startsWith(link.href)
                    return (
                      <motion.div
                        key={link.href}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.04 * i + 0.05, duration: 0.35, ease: EASE }}
                      >
                        <Link
                          href={link.href}
                          onClick={() => setMobileOpen(false)}
                          className={`flex items-center text-label-lg px-4 py-3 rounded-xl transition-colors duration-200 ${
                            isActive
                              ? 'text-forest-deep bg-forest-50'
                              : 'text-concrete hover:text-forest-deep hover:bg-forest-50'
                          }`}
                        >
                          {link.label}
                        </Link>
                      </motion.div>
                    )
                  })}
                </div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                  className="border-t border-forest-100/40 p-3 space-y-1"
                >
                  {user ? (
                    <>
                      <p className="px-4 py-1.5 text-body-xs text-concrete truncate">{user.email}</p>
                      {roleLinks.map((rl) => (
                        <Link
                          key={rl.href}
                          href={rl.href}
                          onClick={() => setMobileOpen(false)}
                          className={`flex items-center gap-2.5 text-label-lg px-4 py-3 rounded-xl transition-colors duration-200 ${
                            pathname === rl.href
                              ? 'text-forest-deep bg-forest-50'
                              : 'text-concrete hover:text-forest-deep hover:bg-forest-50'
                          }`}
                        >
                          {rl.icon}
                          {rl.label}
                        </Link>
                      ))}
                      <button
                        onClick={() => { setMobileOpen(false); handleLogout() }}
                        className="w-full flex items-center gap-2.5 text-label-lg text-concrete hover:text-forest-deep hover:bg-forest-50 px-4 py-3 rounded-xl transition-colors duration-200"
                      >
                        Keluar
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col gap-2 px-1 pb-1">
                      <Link
                        href="/login"
                        onClick={() => setMobileOpen(false)}
                        className="text-label-lg text-concrete text-center px-4 py-2.5 rounded-xl hover:bg-forest-50 transition-colors duration-200"
                      >
                        Masuk
                      </Link>
                      <Button href="/templates" onClick={() => setMobileOpen(false)} className="w-full">
                        Buat Undangan
                        <ArrowRight size={14} />
                      </Button>
                    </div>
                  )}
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
