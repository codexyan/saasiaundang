import { NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/route-guards'
import { settings } from '@/lib/db'
import type { AdminTemplateConfig } from '@/lib/db'
import { readNonEmptyJsonBody } from '@/lib/request-body'

export const dynamic = 'force-dynamic'


export const GET = withAdminAuth(async () => {
  return NextResponse.json({ templates: (await settings.get()).templates })
})

export const POST = withAdminAuth(async (req) => {
  // Setiap field punya fallback, jadi body kosong tetap menghasilkan record
  // "Template Baru" berisi sampah dengan id acak — dibalas 200 seolah disengaja.
  const parsedBody = await readNonEmptyJsonBody(req)
  if (!parsedBody) {
    return NextResponse.json({ error: 'Body template tidak valid atau kosong' }, { status: 400 })
  }
  if (!parsedBody.name || typeof parsedBody.name !== 'string') {
    return NextResponse.json({ error: 'Nama template wajib diisi' }, { status: 400 })
  }
  // Setelah lolos pemeriksaan di atas, akses field dibiarkan longgar seperti
  // sebelumnya (tiap field sudah punya fallback masing-masing di bawah).
  const body = parsedBody as Record<string, any>

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
})
