'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'

/**
 * Satu pembacaan sesi untuk seluruh permukaan klien.
 *
 * Dulu Navbar, Footer, dan AppShell masing-masing memanggil /api/auth/me
 * sendiri. Setiap pengunjung anonim memicu dua sampai tiga permintaan yang
 * semuanya dibalas 401, dan semuanya muncul sebagai error di konsol browser.
 * Sekarang satu permintaan dibagikan lewat context.
 */

export interface SessionUser {
  id: string
  email: string
  role?: string
  isAdmin: boolean
  isWriter: boolean
}

interface NilaiSesi {
  user: SessionUser | null
  /** False selama permintaan pertama belum selesai. */
  loaded: boolean
  /** Dipanggil sesudah logout, supaya tampilan tidak menunggu muat ulang. */
  bersihkan: () => void
}

const KonteksSesi = createContext<NilaiSesi>({
  user: null,
  loaded: false,
  bersihkan: () => {},
})

export function useSession(): NilaiSesi {
  return useContext(KonteksSesi)
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let dibatalkan = false
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(({ user }) => {
        if (dibatalkan) return
        setUser(user ?? null)
        setLoaded(true)
      })
      .catch(() => {
        if (!dibatalkan) setLoaded(true)
      })
    return () => { dibatalkan = true }
  }, [])

  const bersihkan = useCallback(() => setUser(null), [])

  return (
    <KonteksSesi.Provider value={{ user, loaded, bersihkan }}>
      {children}
    </KonteksSesi.Provider>
  )
}
