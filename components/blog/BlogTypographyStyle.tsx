import { blogTypography, DEFAULT_BLOG_TYPOGRAPHY } from '@/lib/db'
import { sanitizeFontFamily } from '@/lib/html-safe'

// Server component: injects the admin-configured blog typography as CSS
// variables/rules scoped to .markdown-content, without touching globals.css.
export default async function BlogTypographyStyle() {
  const t = await blogTypography.get()

  // Dibersihkan lagi di sini, bukan hanya saat disimpan: baris lama di database
  // bisa saja sudah terlanjur berisi nilai berbahaya, dan nilai ini masuk ke
  // <style dangerouslySetInnerHTML>.
  const bodyFont = sanitizeFontFamily(t.bodyFont, DEFAULT_BLOG_TYPOGRAPHY.bodyFont)
  const headingFont = sanitizeFontFamily(t.headingFont, DEFAULT_BLOG_TYPOGRAPHY.headingFont)

  // Angka pun dipaksa ke rentang yang sama seperti saat disimpan — nilainya
  // datang dari database dan ikut masuk ke dalam blok <style>.
  const num = (value: unknown, fallback: number, min: number, max: number): number => {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback
  }
  const bodySize = num(t.bodySize, DEFAULT_BLOG_TYPOGRAPHY.bodySize, 12, 28)
  const lineHeight = num(t.lineHeight, DEFAULT_BLOG_TYPOGRAPHY.lineHeight, 1.2, 2.2)
  const h2Scale = num(t.h2Scale, DEFAULT_BLOG_TYPOGRAPHY.h2Scale, 1.1, 2.6)
  const h3Scale = num(t.h3Scale, DEFAULT_BLOG_TYPOGRAPHY.h3Scale, 1.0, 2.2)

  const css = `
.markdown-content {
  font-family: ${bodyFont};
  font-size: ${bodySize}px;
  line-height: ${lineHeight};
}
.markdown-content h1, .markdown-content h2, .markdown-content h3, .markdown-content h4 {
  font-family: ${headingFont};
}
.markdown-content h2 { font-size: ${(bodySize * h2Scale).toFixed(1)}px; }
.markdown-content h3 { font-size: ${(bodySize * h3Scale).toFixed(1)}px; }
`.trim()
  return <style dangerouslySetInnerHTML={{ __html: css }} />
}
