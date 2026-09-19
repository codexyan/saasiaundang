'use client'

import { useState } from 'react'
import type { TemplateRecord, TemplateCategory, ColorPalette, PriceTier } from '@/lib/types'
import TemplateModule from '@/components/admin/tabs/template/TemplateModule'

/**
 * SEMENTARA. Pembungkus klien untuk melihat modul Template tanpa login.
 *
 * Seluruh perubahan hanya hidup di state komponen ini. Id template sengaja
 * dipalsukan di halaman induk, dan semua rute tulis modul ini dijaga
 * withAdminAuth, jadi pratinjau ini tidak bisa menyentuh tema sungguhan
 * meskipun ada yang membukanya sambil login sebagai admin.
 */
export default function PratinjauTemplateClient({
  records: awal, categories: kategoriAwal, palettes, tiers,
}: {
  records: TemplateRecord[]
  categories: TemplateCategory[]
  palettes: ColorPalette[]
  tiers: PriceTier[]
}) {
  const [records, setRecords] = useState<TemplateRecord[]>(awal)
  const [categories, setCategories] = useState<TemplateCategory[]>(kategoriAwal)

  return (
    <div className="h-[100dvh] flex flex-col bg-white">
      <div className="shrink-0 bg-amber-50 border-b border-amber-200 px-4 py-2 text-[11px] text-amber-800">
        Pratinjau pengembangan. Tidak terhubung ke akun admin, dan tidak bisa menyimpan ke tema sungguhan.
      </div>
      <div className="flex-1 min-h-0">
        <TemplateModule
          records={records}
          categories={categories}
          palettes={palettes}
          tiers={tiers}
          onRecordsUpdate={setRecords}
          onCategoriesUpdate={setCategories}
        />
      </div>
    </div>
  )
}
