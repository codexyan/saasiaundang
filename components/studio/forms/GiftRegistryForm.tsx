'use client'

import { ShoppingBag, Plus, Trash2 } from 'lucide-react'
import FormField from '../ui/FormField'
import { StudioInput, StudioSelect } from '../ui/StudioInput'
import SectionCard from '../ui/SectionCard'
import StudioImageField from '@/components/studio/ui/StudioImageField'
import type { GiftRegistryLink } from '@/lib/types'

interface GiftRegistryFormProps {
  items: GiftRegistryLink[]
  onItemsChange: (items: GiftRegistryLink[]) => void
}

const MARKETPLACES: { value: GiftRegistryLink['marketplace']; label: string }[] = [
  { value: 'tokopedia', label: 'Tokopedia' },
  { value: 'shopee', label: 'Shopee' },
  { value: 'bukalapak', label: 'Bukalapak' },
  { value: 'lazada', label: 'Lazada' },
  { value: 'other', label: 'Lainnya' },
]

export default function GiftRegistryForm({ items, onItemsChange }: GiftRegistryFormProps) {
  function addItem() {
    onItemsChange([...items, { label: '', url: '', marketplace: 'tokopedia' }])
  }

  function updateItem(idx: number, patch: Partial<GiftRegistryLink>) {
    onItemsChange(items.map((item, i) => i === idx ? { ...item, ...patch } : item))
  }

  function removeItem(idx: number) {
    onItemsChange(items.filter((_, i) => i !== idx))
  }

  return (
    <SectionCard title="Gift Registry" icon={ShoppingBag} description="Daftar kado yang diinginkan dari marketplace">
      {items.map((item, idx) => (
        <div key={idx} className="relative p-3 border border-hairline rounded-xl space-y-2.5 group hover:border-gold-dark/50 transition-colors">
          <button type="button" onClick={() => removeItem(idx)}
            className="absolute top-2 right-2 w-6 h-6 rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">
            <Trash2 size={12} />
          </button>

          <div className="grid grid-cols-2 gap-2.5">
            <FormField label="Nama Barang">
              <StudioInput type="text" value={item.label}
                onChange={e => updateItem(idx, { label: e.target.value })}
                placeholder="Set Piring Keramik" />
            </FormField>
            <FormField label="Marketplace">
              <StudioSelect value={item.marketplace ?? 'other'}
                onChange={e => updateItem(idx, { marketplace: e.target.value as GiftRegistryLink['marketplace'] })}>
                {MARKETPLACES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </StudioSelect>
            </FormField>
          </div>

          <FormField label="Link Produk">
            <StudioInput type="url" value={item.url}
              onChange={e => updateItem(idx, { url: e.target.value })}
              placeholder="https://tokopedia.com/..." />
          </FormField>

          <div className="grid grid-cols-2 gap-2.5">
            <FormField label="Harga (opsional)">
              <StudioInput type="text" value={item.price ?? ''}
                onChange={e => updateItem(idx, { price: e.target.value })}
                placeholder="Rp 250.000" />
            </FormField>
            <FormField label="Foto Produk">
              <StudioImageField
                value={item.image_url}
                onChange={(url) => updateItem(idx, { image_url: url || '' })}
                hint="Opsional"
              />
            </FormField>
          </div>
        </div>
      ))}

      <button type="button" onClick={addItem}
        className="w-full py-3 border-2 border-dashed border-hairline rounded-xl flex items-center justify-center gap-2 text-sm font-semibold text-concrete hover:border-gold-dark/50 hover:text-forest hover:bg-forest-50/50 transition-all">
        <Plus size={18} />
        Tambah Barang
      </button>
    </SectionCard>
  )
}
