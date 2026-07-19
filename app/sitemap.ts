import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://iaundang.online'

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/order`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ]

  // Dibatasi seperti query undangan di bawah. Tanpa `take`, jumlah barisnya
  // tumbuh tanpa batas seiring blog bertambah, dan sitemap dirender di tiap
  // permintaan (force-dynamic) di dalam Worker yang punya batas CPU & memori.
  // 5.000 URL juga masih di bawah batas 50.000 per file sitemap.
  const articles = await prisma.article.findMany({
    where: { isPublished: true },
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' },
    take: 5000,
  })

  const blogPages: MetadataRoute.Sitemap = articles.map(a => ({
    url: `${baseUrl}/blog/${a.slug}`,
    lastModified: a.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  const invitations = await prisma.invitation.findMany({
    where: { isPublished: true, isPaid: true },
    select: { slug: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: 500,
  })

  const invPages: MetadataRoute.Sitemap = invitations.map(inv => ({
    url: `${baseUrl}/invitation/${inv.slug}`,
    lastModified: inv.createdAt,
    changeFrequency: 'monthly' as const,
    priority: 0.4,
  }))

  return [...staticPages, ...blogPages, ...invPages]
}
