'use client'

import { useCallback, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import toast from 'react-hot-toast'
import { Loader2, Trash2, Archive, Rocket } from 'lucide-react'
import type { TemplateRecord, TemplateCategory, PriceTier, ColorPalette } from '@/lib/types'
import ConfirmDialog from '@/components/admin/ui/ConfirmDialog'
import TemplateCollection from './TemplateCollection'
import TemplateSettingsDrawer from './TemplateSettingsDrawer'
import CategoryManager from './CategoryManager'
import NewTemplateDialog from './NewTemplateDialog'

const TemplateEditor = dynamic(() => import('./editor/TemplateEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center h-full">
      <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
    </div>
  ),
})

interface Props {
  records: TemplateRecord[]
  categories: TemplateCategory[]
  palettes: ColorPalette[]
  tiers: PriceTier[]
  /** Sengaja Dispatch<SetStateAction>, bukan (records) => void: seluruh mutasi
   *  di sini memakai bentuk fungsi supaya dua aksi yang selesai berdekatan
   *  (mis. duplikat sambil autosave editor berjalan) tidak saling menimpa
   *  lewat salinan daftar yang sudah basi. */
  onRecordsUpdate: React.Dispatch<React.SetStateAction<TemplateRecord[]>>
  onCategoriesUpdate: (categories: TemplateCategory[]) => void
}

type PendingAction =
  | { kind: 'delete'; record: TemplateRecord }
  | { kind: 'archive'; record: TemplateRecord }
  | { kind: 'unpublish'; record: TemplateRecord }

/**
 * Modul Template — koleksi dan editor dalam satu tempat.
 *
 * Menggantikan pasangan "Studio Desain" + "Manajemen" yang dulu terpisah.
 * Keduanya mengelola OBJEK YANG SAMA (template_records) tapi dipecah dua, dan
 * pemisahan itulah sumber sebagian besar masalahnya: daftar template digambar
 * dua kali dengan kartu berbeda, kategori punya dua jalur simpan yang saling
 * menimpa, dan satu pekerjaan ("bikin tema lalu kasih harga") memaksa admin
 * berpindah modul di tengah jalan — kehilangan seluruh state editor.
 */
export default function TemplateModule({
  records, categories, palettes, tiers, onRecordsUpdate, onCategoriesUpdate,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [settingsId, setSettingsId] = useState<string | null>(null)
  const [showCategories, setShowCategories] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [pending, setPending] = useState<PendingAction | null>(null)
  const [confirmBusy, setConfirmBusy] = useState(false)

  const editingRecord = useMemo(
    () => records.find(r => r.id === editingId) ?? null,
    [records, editingId],
  )
  const settingsRecord = useMemo(
    () => records.find(r => r.id === settingsId) ?? null,
    [records, settingsId],
  )

  /** Titik awal desain yang ditawarkan saat membuat template baru. */
  const bases = useMemo(() => {
    const preferred = records.filter(r => r.status === 'active')
    return (preferred.length > 0 ? preferred : records).slice(0, 10)
  }, [records])

  const upsertLocal = useCallback((rec: TemplateRecord) => {
    onRecordsUpdate(prev => {
      const existing = prev.find(r => r.id === rec.id)
      // usage_count TIDAK ikut dari respons mutasi. Endpoint tulis tidak
      // menghitungnya (itu agregasi atas tabel undangan, terlalu mahal untuk
      // dijalankan tiap autosave), jadi nilainya di respons selalu 0 — dan
      // menerimanya mentah-mentah akan membuat "dipakai 12 undangan" berubah
      // jadi 0 begitu admin menyimpan pengaturan.
      const merged = { ...rec, usage_count: existing?.usage_count ?? rec.usage_count }
      return existing ? prev.map(r => (r.id === rec.id ? merged : r)) : [...prev, merged]
    })
  }, [onRecordsUpdate])

  //  Mutasi

  async function patchRecord(id: string, patch: Partial<TemplateRecord>, successMessage?: string): Promise<boolean> {
    const res = await fetch(`/api/admin/template-records/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    const data = await res.json().catch(() => null)
    if (!res.ok) {
      toast.error(data?.error || 'Perubahannya gagal disimpan. Coba lagi ya.')
      return false
    }
    upsertLocal(data.record)
    if (successMessage) toast.success(successMessage)
    return true
  }

  async function handleCreate(input: { name: string; description: string; category: string; baseId: string }) {
    const base = records.find(r => r.id === input.baseId)
    if (!base) { toast.error('Template dasar tidak ditemukan'); return }

    setCreating(true)
    try {
      const res = await fetch('/api/admin/template-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: input.name,
          category: input.category,
          description: input.description,
          // Desain awal disalin dari versi TERBIT template dasar, bukan draft
          // yang mungkin sedang setengah jadi.
          config: base.config,
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) { toast.error(data?.error || 'Template gagal dibuat'); return }

      upsertLocal(data.record)
      setShowCreate(false)
      // Langsung masuk editor — itu yang admin mau lakukan berikutnya.
      setEditingId(data.record.id)
      toast.success(`"${data.record.name}" dibuat sebagai draft`)
    } finally {
      setCreating(false)
    }
  }

  async function handleDuplicate(rec: TemplateRecord) {
    setBusyId(rec.id)
    try {
      const res = await fetch(`/api/admin/template-records/${rec.id}/duplicate`, { method: 'POST' })
      const data = await res.json().catch(() => null)
      if (!res.ok) { toast.error(data?.error || 'Template gagal diduplikasi'); return }
      upsertLocal(data.record)
      toast.success(`"${data.record.name}" dibuat`)
    } finally { setBusyId(null) }
  }

  async function handlePublish(rec: TemplateRecord) {
    setBusyId(rec.id)
    try {
      // Lewat /publish, bukan PATCH status: kalau ada draft tertunda, inilah
      // yang menaikkannya jadi versi terbit sekaligus.
      const res = await fetch(`/api/admin/template-records/${rec.id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) { toast.error(data?.error || 'Template gagal diterbitkan'); return }
      upsertLocal(data.record)
      toast.success(`"${rec.name}" terbit di galeri`)
    } finally { setBusyId(null) }
  }

  async function runPending() {
    if (!pending) return
    const { kind, record } = pending
    setConfirmBusy(true)
    try {
      if (kind === 'delete') {
        const res = await fetch(`/api/admin/template-records/${record.id}`, { method: 'DELETE' })
        const data = await res.json().catch(() => null)
        if (!res.ok) { toast.error(data?.error || 'Template gagal dihapus'); return }
        onRecordsUpdate(prev => prev.filter(r => r.id !== record.id))
        toast.success(`"${record.name}" dihapus`)
      } else if (kind === 'archive') {
        if (!(await patchRecord(record.id, { status: 'archived' }, `"${record.name}" diarsipkan`))) return
      } else {
        if (!(await patchRecord(record.id, { status: 'draft' }, `"${record.name}" ditarik jadi draft`))) return
      }
      setPending(null)
    } finally { setConfirmBusy(false) }
  }

  const confirmCopy = pending && {
    delete: {
      title: 'Hapus template?',
      message: <>Template <strong>{pending.record.name}</strong> akan dihapus permanen beserta seluruh desainnya. Tindakan ini tidak bisa dibatalkan.</>,
      confirmLabel: 'Ya, hapus',
      tone: 'danger' as const,
      icon: Trash2,
    },
    archive: {
      title: 'Arsipkan template?',
      message: <><strong>{pending.record.name}</strong> akan hilang dari galeri publik. Undangan yang sudah memakainya tetap berjalan normal.</>,
      confirmLabel: 'Ya, arsipkan',
      tone: 'warning' as const,
      icon: Archive,
    },
    unpublish: {
      title: 'Tarik dari galeri?',
      message: <><strong>{pending.record.name}</strong> kembali jadi draft dan tidak bisa dipilih user baru. Undangan yang sudah jadi tidak terpengaruh.</>,
      confirmLabel: 'Ya, tarik',
      tone: 'warning' as const,
      icon: Rocket,
    },
  }[pending.kind]

  // Koleksi dan editor bergantian, TAPI panel Pengaturan dan Kategori dirender
  // di LUAR percabangan itu — keduanya bisa dibuka dari kedua sisi. Versi
  // pertama return lebih awal saat editor terbuka, sehingga tombol Pengaturan
  // di header editor menyetel state tapi drawer-nya tidak pernah ikut dirender:
  // tombol yang tidak melakukan apa-apa.
  return (
    <>
      {editingRecord ? (
        <TemplateEditor
          key={editingRecord.id}
          record={editingRecord}
          categories={categories}
          palettes={palettes}
          onExit={() => setEditingId(null)}
          onRecordChange={upsertLocal}
          onOpenSettings={() => setSettingsId(editingRecord.id)}
        />
      ) : (
        <TemplateCollection
          records={records}
          categories={categories}
          tiers={tiers}
          busyId={busyId}
          onCreate={() => setShowCreate(true)}
          onManageCategories={() => setShowCategories(true)}
          onEditDesign={rec => setEditingId(rec.id)}
          onOpenSettings={rec => setSettingsId(rec.id)}
          onDuplicate={handleDuplicate}
          onPublish={handlePublish}
          onUnpublish={rec => setPending({ kind: 'unpublish', record: rec })}
          onArchive={rec => setPending({ kind: 'archive', record: rec })}
          onDelete={rec => setPending({ kind: 'delete', record: rec })}
        />
      )}

      <NewTemplateDialog
        open={showCreate}
        categories={categories}
        bases={bases}
        creating={creating}
        onCancel={() => setShowCreate(false)}
        onCreate={handleCreate}
      />

      <TemplateSettingsDrawer
        record={settingsRecord}
        categories={categories}
        tiers={tiers}
        saving={savingSettings}
        onClose={() => setSettingsId(null)}
        onManageCategories={() => setShowCategories(true)}
        onSave={async (id, patch) => {
          setSavingSettings(true)
          try { return await patchRecord(id, patch, 'Pengaturan tersimpan') }
          finally { setSavingSettings(false) }
        }}
      />

      <CategoryManager
        open={showCategories}
        categories={categories}
        records={records}
        onClose={() => setShowCategories(false)}
        onChanged={onCategoriesUpdate}
      />

      {!editingRecord && confirmCopy && (
        <ConfirmDialog
          open
          busy={confirmBusy}
          title={confirmCopy.title}
          message={confirmCopy.message}
          confirmLabel={confirmCopy.confirmLabel}
          tone={confirmCopy.tone}
          icon={confirmCopy.icon}
          onConfirm={runPending}
          onCancel={() => setPending(null)}
        />
      )}
    </>
  )
}
