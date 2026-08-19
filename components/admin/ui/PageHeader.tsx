'use client'

/** Judul + subjudul standar untuk tiap tab admin. */
export default function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="px-8 py-5 border-b border-gray-100 bg-white">
      <h1 className="text-lg font-bold text-gray-900 tracking-tight">{title}</h1>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
  )
}
