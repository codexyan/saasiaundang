import { PrismaClient } from '@prisma/client'
import JG from '../lib/template-configs/javanese-gold'

const prisma = new PrismaClient()

async function main() {
  const rec = await prisma.templateRecord.upsert({
    where: { id: 'javanese-gold' },
    update: {
      name: JG.name, slug: JG.slug, category: JG.category,
      config: JG.config as object, thumbnailUrl: JG.thumbnail_url,
      status: JG.status, sortOrder: JG.sort_order,
      description: JG.description, price: JG.price,
      requiredPackage: JG.required_package,
    },
    create: {
      id: 'javanese-gold', name: JG.name, slug: JG.slug, category: JG.category,
      config: JG.config as object, thumbnailUrl: JG.thumbnail_url,
      status: JG.status, sortOrder: JG.sort_order,
      description: JG.description, price: JG.price,
      requiredPackage: JG.required_package,
    },
  })
  console.log('Seeded:', rec.id, rec.name)
  await prisma.$disconnect()
}

main().catch(e => { console.error('ERR:', e.message); process.exit(1) })
