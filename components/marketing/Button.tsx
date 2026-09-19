import Link from 'next/link'
import { cn } from '@/lib/utils'

// Button permukaan publik (landing & halaman turunan) — Arah A Elegant Editorial.
// components/ui/Button.tsx yang lama tetap melayani admin/dashboard, jangan dicampur.

type Variant = 'primary' | 'secondary' | 'ghost' | 'gold' | 'inverse'
type Size = 'sm' | 'md' | 'lg'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-forest text-chalk hover:bg-forest-deep',
  secondary: 'bg-chalk text-carbon border border-hairline hover:border-ash/60 hover:text-graphite',
  ghost: 'text-concrete hover:text-forest-deep',
  // gold & inverse hanya untuk section berlatar gelap (forest-deep)
  gold: 'bg-gold text-forest-deep hover:bg-gold-light',
  inverse: 'bg-chalk text-forest-deep hover:bg-forest-50',
}

const SIZES: Record<Size, string> = {
  // 44px, bukan 36. Ukuran sm tetap terlihat kecil karena padding dan ukuran
  // hurufnya, tapi area sentuhnya memenuhi batas minimum jempol (R-03).
  sm: 'text-button-sm px-4 py-2 gap-1.5 min-h-[44px]',
  md: 'text-button-base px-6 py-3 gap-2 min-h-[44px]',
  lg: 'text-button-lg px-7 py-3.5 gap-2.5 min-h-[48px]',
}

interface CommonProps {
  variant?: Variant
  size?: Size
  className?: string
  children: React.ReactNode
}

type ButtonAsLink = CommonProps & { href: string; external?: boolean } & Omit<
    React.AnchorHTMLAttributes<HTMLAnchorElement>,
    'href' | 'className' | 'children'
  >
type ButtonAsButton = CommonProps & { href?: undefined } & Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    'className' | 'children'
  >

export type MarketingButtonProps = ButtonAsLink | ButtonAsButton

export function Button(props: MarketingButtonProps) {
  const { variant = 'primary', size = 'md', className, children } = props
  const cls = cn(
    'group inline-flex items-center justify-center font-semibold rounded-button',
    'transition-colors duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40 focus-visible:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    VARIANTS[variant],
    SIZES[size],
    className,
  )

  if (props.href !== undefined) {
    const { href, external, variant: _v, size: _s, className: _c, children: _ch, ...rest } = props
    if (external) {
      return (
        <a href={href} className={cls} target="_blank" rel="noopener noreferrer" {...rest}>
          {children}
        </a>
      )
    }
    return (
      <Link href={href} className={cls} {...rest}>
        {children}
      </Link>
    )
  }

  const { variant: _v, size: _s, className: _c, children: _ch, ...rest } = props
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  )
}
