import Link from 'next/link'
import { articles } from '@/lib/db'
import { FileText, Clock, Eye, Tag, PenLine, ArrowRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Blog | Tips & Inspirasi Pernikahan | iaundang',
  description: 'Artikel seputar persiapan pernikahan, undangan digital, dan inspirasi untuk hari spesial kalian.',
}

export default async function BlogPage() {
  const list = await articles.findPublished()

  const allTags = Array.from(
    new Set(list.flatMap(a => a.tags.split(',').map(t => t.trim()).filter(Boolean)))
  ).slice(0, 12)

  const featured = list.find(a => a.settings.featured || a.settings.pinned) || list[0]
  const rest = list.filter(a => a.id !== featured?.id)

  return (
    <div className="min-h-screen bg-ivory">
      {/* Header */}
      <section className="bg-chalk border-b border-hairline pt-24 pb-10 sm:pb-12">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-eyebrow text-concrete mb-4">Blog</p>
            <h1 className="font-display text-display-lg text-forest-deep text-balance">
              Tips &amp; Inspirasi Pernikahan
            </h1>
            <p className="mt-4 text-body-lg text-concrete leading-relaxed">
              Catatan tentang persiapan pernikahan dan undangan digital,
              ditulis sendiri oleh orang yang membangun iaundang.
            </p>
          </div>

          {/* Tags */}
          {allTags.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mt-8">
              {allTags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 text-label-sm px-3 py-1.5 rounded-pill bg-ivory border border-hairline text-concrete"
                >
                  <Tag className="w-3 h-3" />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
        {list.length === 0 ? (
          /* Empty state yang disengaja — bukan sekadar teks kosong */
          <div className="max-w-xl mx-auto text-center bg-chalk rounded-card border border-hairline shadow-card px-6 sm:px-10 py-14">
            <div className="w-14 h-14 mx-auto rounded-full bg-forest-50 border border-forest-100 flex items-center justify-center mb-6">
              <PenLine className="w-6 h-6 text-forest" />
            </div>
            <h2 className="font-display text-h1 text-forest-deep text-balance">
              Belum ada tulisan di sini
            </h2>
            <div aria-hidden className="w-10 h-px bg-gold/70 mx-auto my-5" />
            <p className="text-body-base text-concrete leading-relaxed max-w-md mx-auto">
              Halaman ini akan diisi kalau memang ada yang layak ditulis, bukan
              diisi demi terlihat ramai. Sementara itu, tema undangannya sudah
              bisa kalian coba sekarang.
            </p>
            <Link
              href="/templates"
              className="group inline-flex items-center justify-center gap-2 mt-8 min-h-[44px] px-6 py-3 rounded-button bg-forest text-chalk text-button-base font-semibold hover:bg-forest-deep transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40 focus-visible:ring-offset-2"
            >
              Lihat Template
              <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        ) : (
          <>
            {/* Artikel Pilihan */}
            {featured && (
              <Link
                href={`/blog/${featured.slug}`}
                className="group block bg-chalk rounded-card border border-hairline shadow-card overflow-hidden hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300 mb-10 sm:mb-14"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2">
                  <div className="aspect-[16/10] lg:aspect-auto overflow-hidden bg-mist">
                    {featured.coverUrl ? (
                      <img
                        src={featured.coverUrl}
                        alt={featured.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full min-h-[240px] bg-forest-50 flex items-center justify-center">
                        <FileText className="w-16 h-16 text-forest-200" />
                      </div>
                    )}
                  </div>
                  <div className="p-6 sm:p-8 lg:p-10 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-label-sm px-2.5 py-1 rounded-pill bg-gold-50 text-gold-700 border border-gold-200">
                        Artikel Pilihan
                      </span>
                      {featured.tags && (
                        <span className="text-body-xs text-concrete">
                          {featured.tags.split(',')[0].trim()}
                        </span>
                      )}
                    </div>
                    <h2 className="font-display text-h1 text-graphite group-hover:text-forest-deep transition-colors leading-snug mb-3">
                      {featured.title}
                    </h2>
                    {featured.excerpt && (
                      <p className="text-body-base text-concrete leading-relaxed line-clamp-3 mb-5">{featured.excerpt}</p>
                    )}
                    <div className="flex items-center gap-4 text-body-xs text-concrete">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-forest-100 flex items-center justify-center text-forest-deep text-body-xs font-bold">
                          {featured.authorName.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-carbon">{featured.authorName}</span>
                      </div>
                      {featured.publishedAt && (
                        <span>{new Date(featured.publishedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {Math.max(1, Math.ceil(featured.content.split(/\s+/).length / 200))} mnt
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {/* Grid artikel */}
            {rest.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                {rest.map(article => (
                  <Link
                    key={article.id}
                    href={`/blog/${article.slug}`}
                    className="group bg-chalk rounded-card border border-hairline shadow-card overflow-hidden hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300 flex flex-col"
                  >
                    <div className="aspect-[16/10] overflow-hidden bg-mist">
                      {article.coverUrl ? (
                        <img
                          src={article.coverUrl}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-forest-50 flex items-center justify-center">
                          <FileText className="w-10 h-10 text-forest-200" />
                        </div>
                      )}
                    </div>
                    <div className="p-5 sm:p-6 flex flex-col flex-1">
                      {article.tags && (
                        <span className="text-label-sm text-forest mb-2">
                          {article.tags.split(',')[0].trim()}
                        </span>
                      )}
                      <h2 className="font-display text-h3 text-graphite group-hover:text-forest-deep transition-colors leading-snug mb-2 line-clamp-2">
                        {article.title}
                      </h2>
                      {article.excerpt && (
                        <p className="text-body-sm text-concrete line-clamp-2 mb-4 flex-1">{article.excerpt}</p>
                      )}
                      <div className="flex items-center justify-between pt-3 border-t border-hairline">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-md bg-forest-50 flex items-center justify-center text-forest text-[10px] font-bold">
                            {article.authorName.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-body-xs text-concrete">{article.authorName}</span>
                        </div>
                        <div className="flex items-center gap-3 text-body-xs text-concrete">
                          {article.publishedAt && (
                            <span>{new Date(article.publishedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                          )}
                          <span className="flex items-center gap-0.5">
                            <Eye className="w-3 h-3" />
                            {article.viewsCount}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
