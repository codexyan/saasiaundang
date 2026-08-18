import { PrismaClient } from '@prisma/client'
import JG from '../lib/template-configs/javanese-gold'
import RG from '../lib/template-configs/rose-garden'
import ML from '../lib/template-configs/midnight-luxe'

const prisma = new PrismaClient()

async function upsertTemplate(t: typeof JG) {
  return prisma.templateRecord.upsert({
    where: { id: t.id },
    update: {
      name: t.name, slug: t.slug, category: t.category,
      description: t.description, config: t.config as object, thumbnailUrl: t.thumbnail_url,
      status: t.status, sortOrder: t.sort_order,
      price: t.price,
      requiredPackage: t.required_package,
    },
    create: {
      id: t.id, name: t.name, slug: t.slug, category: t.category,
      description: t.description, config: t.config as object, thumbnailUrl: t.thumbnail_url,
      status: t.status, sortOrder: t.sort_order,
      price: t.price,
      requiredPackage: t.required_package,
    },
  })
}

async function main() {
  for (const t of [JG, RG, ML]) {
    const rec = await upsertTemplate(t)
    console.log('Seeded:', rec.id, rec.name, `(${t.required_package})`)
  }
  await prisma.$disconnect()
}

main().catch(e => { console.error('ERR:', e.message); process.exit(1) })
