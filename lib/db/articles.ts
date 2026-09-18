import { prisma } from '../prisma'

//  ARTICLES

export interface ArticleSettings {
  comments: {
    moderation: 'auto' | 'manual'
    bannedWords: string
    closeAfterDays: number
    requireLogin: boolean
    allowReplies: boolean
    maxLength: number
  }
  seo: {
    focusKeyword: string
    canonicalUrl: string
    ogImageUrl: string
    noIndex: boolean
  }
  ads: {
    enabled: boolean
    positions: string[]
    adCode: string
  }
  backlinks: {
    internal: string[]
    external: string[]
  }
  featured: boolean
  pinned: boolean
}

export const DEFAULT_ARTICLE_SETTINGS: ArticleSettings = {
  comments: {
    moderation: 'auto',
    bannedWords: '',
    closeAfterDays: 0,
    requireLogin: false,
    allowReplies: true,
    maxLength: 500,
  },
  seo: { focusKeyword: '', canonicalUrl: '', ogImageUrl: '', noIndex: false },
  ads: { enabled: false, positions: [], adCode: '' },
  backlinks: { internal: [], external: [] },
  featured: false,
  pinned: false,
}

export interface ArticleData {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  coverUrl: string
  authorId: string | null
  authorName: string
  authorAvatar: string
  isPublished: boolean
  publishedAt: string | null
  allowLikes: boolean
  allowComments: boolean
  likesCount: number
  viewsCount: number
  metaTitle: string
  metaDesc: string
  tags: string
  settings: ArticleSettings
  status: string
  submittedAt: string | null
  reviewNotes: string
  scheduledAt: string | null
  reviewedBy: string | null
  categoryId: string | null
  revisionSeenAt: string | null
  createdAt: string
  updatedAt: string
}

function mapArticle(row: {
  id: string; title: string; slug: string; excerpt: string; content: string;
  coverUrl: string; authorId: string | null; authorName: string; authorAvatar: string;
  isPublished: boolean; publishedAt: Date | null;
  allowLikes: boolean; allowComments: boolean; likesCount: number; viewsCount: number;
  metaTitle: string; metaDesc: string; tags: string; settings: import('@prisma/client').Prisma.JsonValue;
  status: string; submittedAt: Date | null; reviewNotes: string; scheduledAt: Date | null;
  reviewedBy: string | null; categoryId: string | null; revisionSeenAt: Date | null;
  createdAt: Date; updatedAt: Date;
}): ArticleData {
  const raw = (typeof row.settings === 'object' && row.settings !== null ? row.settings : {}) as Record<string, unknown>
  const settings: ArticleSettings = {
    ...DEFAULT_ARTICLE_SETTINGS,
    ...raw,
    comments: { ...DEFAULT_ARTICLE_SETTINGS.comments, ...(raw.comments as Record<string, unknown> ?? {}) },
    seo: { ...DEFAULT_ARTICLE_SETTINGS.seo, ...(raw.seo as Record<string, unknown> ?? {}) },
    ads: { ...DEFAULT_ARTICLE_SETTINGS.ads, ...(raw.ads as Record<string, unknown> ?? {}) },
    backlinks: { ...DEFAULT_ARTICLE_SETTINGS.backlinks, ...(raw.backlinks as Record<string, unknown> ?? {}) },
  }
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    content: row.content,
    coverUrl: row.coverUrl,
    authorId: row.authorId,
    authorName: row.authorName,
    authorAvatar: row.authorAvatar,
    isPublished: row.isPublished,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    allowLikes: row.allowLikes,
    allowComments: row.allowComments,
    likesCount: row.likesCount,
    viewsCount: row.viewsCount,
    metaTitle: row.metaTitle,
    metaDesc: row.metaDesc,
    tags: row.tags,
    settings,
    status: row.status,
    submittedAt: row.submittedAt?.toISOString() ?? null,
    reviewNotes: row.reviewNotes,
    scheduledAt: row.scheduledAt?.toISOString() ?? null,
    reviewedBy: row.reviewedBy,
    categoryId: row.categoryId,
    revisionSeenAt: row.revisionSeenAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export const articles = {
  async findAll(): Promise<ArticleData[]> {
    const rows = await prisma.article.findMany({ orderBy: { createdAt: 'desc' } })
    return rows.map(mapArticle)
  },

  /** Dipakai layout untuk memutuskan tautan Blog ditampilkan atau tidak. */
  async countPublished(): Promise<number> {
    return prisma.article.count({ where: { isPublished: true } })
  },

  async findPublished(): Promise<ArticleData[]> {
    const rows = await prisma.article.findMany({
      where: { isPublished: true },
      orderBy: { publishedAt: 'desc' },
    })
    return rows.map(mapArticle)
  },

  async findById(id: string): Promise<ArticleData | null> {
    const row = await prisma.article.findUnique({ where: { id } })
    return row ? mapArticle(row) : null
  },

  async findBySlug(slug: string): Promise<ArticleData | null> {
    const row = await prisma.article.findUnique({ where: { slug } })
    return row ? mapArticle(row) : null
  },

  async findByAuthorId(authorId: string): Promise<ArticleData[]> {
    const rows = await prisma.article.findMany({
      where: { authorId },
      orderBy: { createdAt: 'desc' },
    })
    return rows.map(mapArticle)
  },

  async incrementViews(id: string): Promise<void> {
    try { await prisma.article.update({ where: { id }, data: { viewsCount: { increment: 1 } } }) } catch {}
  },

  async incrementLikes(id: string): Promise<void> {
    try { await prisma.article.update({ where: { id }, data: { likesCount: { increment: 1 } } }) } catch {}
  },

  async create(data: {
    title: string; slug: string; excerpt: string; content: string; coverUrl?: string;
    authorId?: string; authorName?: string; authorAvatar?: string;
    allowLikes?: boolean; allowComments?: boolean; metaTitle?: string; metaDesc?: string; tags?: string;
    settings?: ArticleSettings; categoryId?: string | null;
  }): Promise<ArticleData> {
    const row = await prisma.article.create({
      data: {
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt,
        content: data.content,
        coverUrl: data.coverUrl ?? '',
        authorId: data.authorId ?? null,
        authorName: data.authorName ?? 'Tim iaundang',
        authorAvatar: data.authorAvatar ?? '',
        allowLikes: data.allowLikes,
        allowComments: data.allowComments,
        metaTitle: data.metaTitle ?? '',
        metaDesc: data.metaDesc ?? '',
        tags: data.tags ?? '',
        settings: (data.settings ?? DEFAULT_ARTICLE_SETTINGS) as unknown as import('@prisma/client').Prisma.InputJsonValue,
        categoryId: data.categoryId ?? null,
      },
    })
    return mapArticle(row)
  },

  async update(id: string, data: Partial<{
    title: string; slug: string; excerpt: string; content: string;
    coverUrl: string; authorId: string | null; authorName: string; authorAvatar: string;
    isPublished: boolean; publishedAt: string | null;
    allowLikes: boolean; allowComments: boolean; metaTitle: string; metaDesc: string; tags: string;
    settings: ArticleSettings; categoryId: string | null;
  }>): Promise<ArticleData> {
    const updateData: Record<string, unknown> = { ...data }
    if (data.publishedAt !== undefined) {
      updateData.publishedAt = data.publishedAt ? new Date(data.publishedAt) : null
    }
    const row = await prisma.article.update({ where: { id }, data: updateData })
    return mapArticle(row)
  },

  async delete(id: string): Promise<void> {
    await prisma.article.delete({ where: { id } })
  },

  //  Editorial workflow

  async submitForReview(id: string): Promise<ArticleData> {
    const row = await prisma.article.update({
      where: { id },
      data: { status: 'pending_review', submittedAt: new Date() },
    })
    return mapArticle(row)
  },

  async requestRevision(id: string, notes: string): Promise<ArticleData> {
    const row = await prisma.article.update({
      where: { id },
      // revisionSeenAt reset to null: this revision is "unseen" until the
      // writer opens the article again (drives the nav notification badge).
      data: { status: 'needs_revision', reviewNotes: notes, revisionSeenAt: null },
    })
    return mapArticle(row)
  },

  async approve(id: string, reviewedBy: string): Promise<ArticleData> {
    const existing = await prisma.article.findUnique({ where: { id }, select: { publishedAt: true } })
    const row = await prisma.article.update({
      where: { id },
      data: {
        status: 'published',
        isPublished: true,
        reviewedBy,
        publishedAt: existing?.publishedAt ?? new Date(),
      },
    })
    return mapArticle(row)
  },

  async schedule(id: string, scheduledAt: string | Date, reviewedBy: string): Promise<ArticleData> {
    const row = await prisma.article.update({
      where: { id },
      data: {
        status: 'scheduled',
        scheduledAt: new Date(scheduledAt),
        reviewedBy,
        isPublished: false,
      },
    })
    return mapArticle(row)
  },

  async archive(id: string): Promise<ArticleData> {
    const row = await prisma.article.update({
      where: { id },
      data: { status: 'archived', isPublished: false },
    })
    return mapArticle(row)
  },

  async findByStatus(status: string): Promise<ArticleData[]> {
    const rows = await prisma.article.findMany({
      where: { status },
      orderBy: { updatedAt: 'desc' },
    })
    return rows.map(mapArticle)
  },

  async findPendingCount(): Promise<number> {
    return prisma.article.count({ where: { status: 'pending_review' } })
  },

  async markRevisionSeen(id: string): Promise<ArticleData> {
    const row = await prisma.article.update({ where: { id }, data: { revisionSeenAt: new Date() } })
    return mapArticle(row)
  },

  async findUnseenRevisionCount(authorId: string): Promise<number> {
    return prisma.article.count({ where: { authorId, status: 'needs_revision', revisionSeenAt: null } })
  },

  // Cron helper: publish any 'scheduled' article whose scheduledAt has passed.
  async publishScheduledDue(): Promise<number> {
    const now = new Date()
    const res = await prisma.article.updateMany({
      where: { status: 'scheduled', scheduledAt: { lte: now } },
      data: { status: 'published', isPublished: true, publishedAt: now },
    })
    return res.count
  },
}

//  ARTICLE CATEGORIES

export interface ArticleCategoryData {
  id: string
  name: string
  slug: string
  sortOrder: number
  createdAt: string
}

function mapCategory(row: { id: string; name: string; slug: string; sortOrder: number; createdAt: Date }): ArticleCategoryData {
  return { id: row.id, name: row.name, slug: row.slug, sortOrder: row.sortOrder, createdAt: row.createdAt.toISOString() }
}

export const articleCategories = {
  async findAll(): Promise<ArticleCategoryData[]> {
    const rows = await prisma.articleCategory.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] })
    return rows.map(mapCategory)
  },

  async create(data: { name: string; slug: string; sortOrder?: number }): Promise<ArticleCategoryData> {
    const row = await prisma.articleCategory.create({
      data: { name: data.name, slug: data.slug, sortOrder: data.sortOrder ?? 0 },
    })
    return mapCategory(row)
  },

  async update(id: string, data: Partial<{ name: string; slug: string; sortOrder: number }>): Promise<ArticleCategoryData> {
    const row = await prisma.articleCategory.update({ where: { id }, data })
    return mapCategory(row)
  },

  async delete(id: string): Promise<void> {
    await prisma.articleCategory.delete({ where: { id } })
  },
}
