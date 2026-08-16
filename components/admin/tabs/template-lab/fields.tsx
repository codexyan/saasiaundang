/**
 * Pembungkus label untuk field editor + kelas input yang dipakai berulang.
 *
 * Dipindah verbatim dari TemplateLab.tsx. Kecil tapi paling sering dipakai:
 * Field 64x, SectionField 51x, miniInput 29x, inputCls 15x di komponen utama.
 */

export function SectionField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[8px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      {children}
    </div>
  )
}

export const miniInput = 'w-full text-[11px] px-2.5 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 bg-white transition-shadow'

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

export const inputCls = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white'
