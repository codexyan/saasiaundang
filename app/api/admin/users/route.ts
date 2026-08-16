import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { withAdminAuth } from '@/lib/route-guards'
import { prisma } from '@/lib/prisma'
import type { UserRole } from '@/lib/db'
import { readJsonBody } from '@/lib/request-body'

export const dynamic = 'force-dynamic'


export const GET = withAdminAuth(async () => {
  const allUsers = await prisma.user.findMany({
    where: { role: { not: 'admin' } },
    orderBy: { createdAt: 'desc' },
    include: {
      invitations: {
        orderBy: { createdAt: 'desc' },
      },
      supportTickets: {
        orderBy: { createdAt: 'desc' },
        include: {
          replies: {
            orderBy: { createdAt: 'asc' },
          },
        },
      },
    },
  })

  const data = allUsers.map((u) => ({
    id: u.id,
    email: u.email,
    role: u.role ?? 'user',
    created_at: u.createdAt.toISOString(),
    invitations: u.invitations.map((i) => ({
      id: i.id,
      slug: i.slug,
      template_id: i.templateId,
      is_published: i.isPublished,
      is_paid: i.isPaid,
      package_tier: i.packageTier,
      expires_at: i.expiresAt ? i.expiresAt.toISOString() : null,
      created_at: i.createdAt.toISOString(),
    })),
    tickets: u.supportTickets.map((t) => ({
      id: t.id,
      subject: t.subject,
      message: t.message,
      status: t.status,
      priority: t.priority,
      created_at: t.createdAt.toISOString(),
      closed_at: t.closedAt ? t.closedAt.toISOString() : null,
      replies: t.replies.map((r) => ({
        id: r.id,
        message: r.message,
        is_admin: r.isAdmin,
        created_at: r.createdAt.toISOString(),
      })),
    })),
  }))

  return NextResponse.json({ users: data })
})

export const POST = withAdminAuth(async (req) => {
  const { email, password, role } = await readJsonBody(req) as { email?: string; password?: string; role?: UserRole }

  if (!email || !email.includes('@')) return NextResponse.json({ error: 'Email tidak valid' }, { status: 400 })
  if (!password || password.length < 6) return NextResponse.json({ error: 'Passwordnya minimal 6 karakter ya.' }, { status: 400 })

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
  if (existing) return NextResponse.json({ error: 'Email ini sudah punya akun. Silakan masuk, atau pakai email lain.' }, { status: 409 })

  const passwordHash = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: { email: email.toLowerCase(), passwordHash, role: role || 'user' },
  })

  return NextResponse.json({ user: { id: user.id, email: user.email, role: user.role } }, { status: 201 })
})
