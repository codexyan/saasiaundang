import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session-server'
import { isAdmin } from '@/lib/auth'
import { settings } from '@/lib/db'
import type { AdminTemplateConfig } from '@/lib/db'
import { readJsonBody } from '@/lib/request-body'

export const dynamic = 'force-dynamic'


export async function GET() {
  const session = await getSession()
  if (!isAdmin(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({ templates: (await settings.get()).templates })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!isAdmin(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await readJsonBody(req)
  const s = await settings.get()

  const existing = s.templates.find((t) => t.id === body.id)
  if (existing) return NextResponse.json({ error: 'Template ID sudah ada' }, { status: 409 })

  const newTemplate: AdminTemplateConfig = {
    id: body.id || crypto.randomUUID().slice(0, 8),
    name: body.name || 'Template Baru',
    description: body.description || '',
    thumbnailUrl: body.thumbnailUrl || '',
    demoSlug: body.demoSlug || '',
    tags: body.tags || [],
    enabled: false,
    price: typeof body.price === 'number' ? body.price : 0,
    required_package: body.required_package ?? 'all',
    sortOrder: s.templates.length + 1,
    themeColor: body.themeColor || '#e11d48',
    isBuiltIn: false,
    features: {
      gallery: body.features?.gallery ?? true,
      music: body.features?.music ?? true,
      countdown: body.features?.countdown ?? true,
      rsvp: body.features?.rsvp ?? true,
      wishes: body.features?.wishes ?? true,
    },
  }

  s.templates.push(newTemplate)
  await settings.save(s)
  return NextResponse.json({ template: newTemplate }, { status: 201 })
}
