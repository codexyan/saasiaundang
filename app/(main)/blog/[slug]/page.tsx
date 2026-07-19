import { notFound } from 'next/navigation'
import Link from 'next/link'
import { articles } from '@/lib/db'
import { ArrowLeft, Calendar, Clock, Eye, Heart, User } from 'lucide-react'
import MarkdownContent from '@/components/blog/MarkdownContent'
import BlogTypographyStyle from '@/components/blog/BlogTypographyStyle'
import ViewTracker from '@/components/blog/ViewTracker'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const params = await props.params;
  const article = await articles.findBySlug(params.slug)
  if (!article) return {}
  return {
    title: article.metaTitle || `${article.title} | Blog iaundang`,
    description: article.metaDesc || article.excerpt,
    openGraph: {
      title: article.metaTitle || article.title,
      description: article.metaDesc || article.excerpt,
      images: article.coverUrl ? [article.coverUrl] : undefined,
    },
  }
}

export default async function BlogArticlePage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const article = await articles.findBySlug(params.slug)
  if (!article || !article.isPublished) notFound()

  const readTime = Math.max(1, Math.ceil(article.content.split(/\s+/).length / 200))
  const tagList = article.tags.split(',').map(t => t.trim()).filter(Boolean)

  const allArticles = await articles.findPublished()
  const related = allArticles
    .filter(a => a.id !== article.id)
    .slice(0, 3)

  return (
    <>
      <BlogTypographyStyle />
      <ViewTracker slug={params.slug} />

      <article className="min-h-screen">
        {/* Hero */}
        {article.coverUrl && (
          <div className="w-full bg-mist">
            <div className="max-w-5xl mx-auto">
              <img
                src={article.coverUrl}
                alt={article.title}
                className="w-full aspect-[2.2/1] sm:aspect-[2.5/1] object-cover"
              />
            </div>
          </div>
        )}

        <div className="max-w-3xl mx-auto px-5 sm:px-8 py-8 sm:py-14">
          {/* Back */}
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-body-sm text-concrete hover:text-forest transition-colors mb-6 sm:mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Semua Artikel
          </Link>

          {/* Tags */}
          {tagList.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {tagList.map(tag => (
                <span key={tag} className="text-label-sm px-2.5 py-1 rounded-pill bg-forest-50 text-forest border border-forest-100">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <h1 className="font-display text-display-lg text-graphite leading-tight text-balance">
            {article.title}
          </h1>

          {article.excerpt && (
            <p className="mt-4 text-body-xl text-concrete leading-relaxed">{article.excerpt}</p>
          )}

          {/* Author & Meta */}
          <div className="flex flex-wrap items-center gap-4 mt-6 sm:mt-8 pb-8 border-b border-hairline">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-forest flex items-center justify-center text-chalk font-bold text-body-sm">
                {article.authorAvatar ? (
                  <img src={article.authorAvatar} alt={article.authorName} className="w-full h-full rounded-full object-cover" />
                ) : (
                  article.authorName.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <p className="text-body-sm font-semibold text-graphite">{article.authorName}</p>
                <div className="flex items-center gap-3 text-body-xs text-concrete">
                  {article.publishedAt && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(article.publishedAt).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'long', year: 'numeric',
                      })}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {readTime} mnt baca
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 ml-auto text-body-xs text-concrete">
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                {article.viewsCount} views
              </span>
              {article.allowLikes && (
                <span className="flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5" />
                  {article.likesCount}
                </span>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="mt-8 sm:mt-10">
            <MarkdownContent content={article.content} />
          </div>

          {/* Author Box */}
          <div className="mt-12 sm:mt-16 p-6 sm:p-8 bg-chalk border border-hairline rounded-card shadow-card">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-full bg-forest flex items-center justify-center text-chalk font-bold text-body-lg flex-shrink-0">
                {article.authorAvatar ? (
                  <img src={article.authorAvatar} alt={article.authorName} className="w-full h-full rounded-full object-cover" />
                ) : (
                  article.authorName.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <p className="text-body-base font-semibold text-graphite">Ditulis oleh {article.authorName}</p>
                <p className="text-body-sm text-concrete mt-1">
                  Kontributor di blog iaundang. Berbagi tips dan inspirasi seputar pernikahan dan undangan digital.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Related Articles */}
        {related.length > 0 && (
          <section className="border-t border-hairline">
            <div className="max-w-6xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
              <h2 className="font-display text-h1 text-forest-deep mb-8 text-center">
                Artikel Lainnya
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                {related.map(a => (
                  <Link
                    key={a.id}
                    href={`/blog/${a.slug}`}
                    className="group bg-chalk rounded-card border border-hairline shadow-card overflow-hidden hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300"
                  >
                    <div className="aspect-[16/10] overflow-hidden bg-mist">
                      {a.coverUrl ? (
                        <img src={a.coverUrl} alt={a.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full bg-forest-50 flex items-center justify-center">
                          <User className="w-8 h-8 text-forest-200" />
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="text-body-base font-semibold text-graphite group-hover:text-forest-deep transition-colors line-clamp-2 mb-2">
                        {a.title}
                      </h3>
                      <div className="flex items-center gap-2 text-body-xs text-concrete">
                        <span>{a.authorName}</span>
                        <span>&middot;</span>
                        {a.publishedAt && (
                          <span>{new Date(a.publishedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </article>
    </>
  )
}
