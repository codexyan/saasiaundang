'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Instagram, Mail, MessageCircle } from 'lucide-react'
import { Button } from '@/components/marketing/Button'
import { useSession } from '@/components/ui/SessionProvider'

const productLinks = [
  { href: '/templates', label: 'Template' },
  { href: '/#fitur', label: 'Fitur' },
  { href: '/#harga', label: 'Harga' },
  { href: '/demo/renderer?id=javanese-gold', label: 'Demo Live' },
]

const companyLinks = [
  { href: '/#cara-kerja', label: 'Cara Kerja' },
  { href: '/#faq', label: 'FAQ' },
  { href: '/blog', label: 'Blog' },
]

// Nomor WhatsApp datang dari pengaturan admin lewat props, bukan ditulis mati.
// Dulu `628123456789` dipajang di sini dan di blok kontak di bawah: nomor contoh
// yang tidak dimiliki siapa pun, jadi setiap pengunjung yang menekannya mendarat
// di ruang kosong.
const socials = [
  { href: 'https://instagram.com/ia.undang', icon: Instagram, label: 'Instagram' },
]

function FooterLinkGroup({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h4 className="text-eyebrow text-graphite mb-4">{title}</h4>
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-body-sm text-concrete hover:text-forest-deep transition-colors duration-200"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function Footer({ whatsapp }: { whatsapp?: string }) {
  const waLink = whatsapp ? `https://wa.me/${whatsapp}` : null
  const currentYear = new Date().getFullYear()
  const { user } = useSession()

  const accountLinks = user
    ? [
        ...(user.role === 'admin'
          ? [{ href: '/admin', label: 'Admin Panel' }]
          : user.role === 'content_writer'
            ? [{ href: '/writer', label: 'Writer Dashboard' }]
            : user.role === 'affiliate'
              ? [{ href: '/affiliate', label: 'Affiliate' }]
              : []),
        { href: '/dashboard', label: 'Dashboard' },
      ]
    : [
        { href: '/login', label: 'Masuk' },
        { href: '/templates', label: 'Buat Undangan' },
      ]

  return (
    <footer className="relative bg-ivory border-t border-hairline">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-12 sm:py-16">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8">
          <div className="lg:col-span-4">
            <Link href="/" className="inline-block mb-4">
              <Image
                src="/logos/logo-horizontal.png"
                alt="iaundang"
                width={140}
                height={40}
                className="object-contain"
                priority
              />
            </Link>
            <p className="text-body-sm text-concrete leading-relaxed mb-5 max-w-[280px]">
              Undangan digital yang menyapa setiap tamu dengan namanya sendiri.
            </p>
            <div className="flex items-center gap-2">
              {[
                ...socials,
                ...(waLink ? [{ href: waLink, icon: MessageCircle, label: 'WhatsApp' }] : []),
              ].map(({ href, icon: Icon, label }) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-11 h-11 rounded-xl bg-chalk border border-hairline flex items-center justify-center text-concrete hover:text-forest hover:border-forest-light/40 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40 focus-visible:ring-offset-2"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          <div className="lg:col-span-6 grid grid-cols-2 sm:grid-cols-3 gap-8">
            <FooterLinkGroup title="Produk" links={productLinks} />
            <FooterLinkGroup title="Perusahaan" links={companyLinks} />
            <FooterLinkGroup title="Akun" links={accountLinks} />
          </div>

          <div className="lg:col-span-2">
            <h4 className="text-eyebrow text-graphite mb-4">Kontak</h4>
            <ul className="space-y-2.5 mb-5">
              <li>
                <a
                  href="mailto:halo@iaundang.online"
                  className="text-body-sm text-concrete hover:text-forest-deep transition-colors duration-200 flex items-center gap-2"
                >
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  halo@iaundang.online
                </a>
              </li>
              {waLink && (
                <li>
                  <a
                    href={waLink}
                    className="text-body-sm text-concrete hover:text-forest-deep transition-colors duration-200 flex items-center gap-2"
                  >
                    <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                    WhatsApp
                  </a>
                </li>
              )}
            </ul>
            <Button href="/templates" size="sm">
              Buat Undangan
            </Button>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-hairline">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-body-xs text-concrete">
              &copy; {currentYear} <span className="text-graphite font-medium">iaundang</span>. Semua hak dilindungi.
            </p>
            <div className="flex items-center gap-5">
              <Link href="/privacy" className="text-body-xs text-concrete hover:text-graphite transition-colors">
                Privasi
              </Link>
              <Link href="/terms" className="text-body-xs text-concrete hover:text-graphite transition-colors">
                Syarat &amp; Ketentuan
              </Link>
            </div>
          </div>
        </div>

      </div>
    </footer>
  )
}
