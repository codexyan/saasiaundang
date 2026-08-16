import { prisma } from '../prisma'

//  BLOG TYPOGRAPHY (global)

export interface BlogTypography {
  headingFont: string
  bodyFont: string
  bodySize: number   // px, paragraph base
  h2Scale: number    // multiplier of bodySize
  h3Scale: number
  lineHeight: number
}

export const DEFAULT_BLOG_TYPOGRAPHY: BlogTypography = {
  headingFont: 'var(--font-geist-sans), system-ui, sans-serif',
  bodyFont: 'var(--font-geist-sans), system-ui, sans-serif',
  bodySize: 17,
  h2Scale: 1.6,
  h3Scale: 1.3,
  lineHeight: 1.75,
}

export const blogTypography = {
  async get(): Promise<BlogTypography> {
    const row = await prisma.appSetting.findUnique({ where: { key: 'blog_typography' } })
    if (!row) return DEFAULT_BLOG_TYPOGRAPHY
    return { ...DEFAULT_BLOG_TYPOGRAPHY, ...(row.value as Partial<BlogTypography>) }
  },
  async save(data: BlogTypography): Promise<void> {
    await prisma.appSetting.upsert({
      where: { key: 'blog_typography' },
      update: { value: data as object },
      create: { key: 'blog_typography', value: data as object },
    })
  },
}
