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

// `sentuh:min-h-[44px]` di dua kelas input berikut membuat semua field dan
// dropdown editor cukup tinggi untuk jempol tanpa mengubah kerapatan panel di
// layar bertetikus. Lihat varian `sentuh` di tailwind.config.ts.
export const miniInput = 'w-full text-[11px] px-2.5 py-1.5 sentuh:min-h-[44px] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 bg-white transition-shadow'

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

export const inputCls = 'w-full px-3 py-2 sentuh:min-h-[44px] text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white'

/** Kelas tombol ikon: area sentuh 44px di perangkat jari, rapat di desktop. */
export const tombolIkon = 'inline-flex items-center justify-center rounded-lg transition-colors sentuh:min-w-[44px] sentuh:min-h-[44px]'

/**
 * Sakelar hidup/mati.
 *
 * Dulu markup pil ini disalin sembilan kali di lima berkas, dan setengahnya
 * tanpa label sama sekali, jadi pembaca layar hanya menyebut "tombol". Di sini
 * label wajib diisi.
 *
 * Pil yang terlihat tetap setipis aslinya, tapi tombol pembungkusnya setinggi
 * 44 piksel di perangkat sentuh: jempol tidak perlu mengenai persis pil
 * setebal 18 sampai 24 piksel.
 */
export function Sakelar({
  nyala, onUbah, label, warna = 'indigo', ukuran = 'normal',
}: {
  nyala: boolean
  onUbah: () => void
  label: string
  warna?: 'indigo' | 'purple' | 'emerald'
  ukuran?: 'normal' | 'kecil' | 'mini'
}) {
  const aktif = warna === 'purple' ? 'bg-purple-600' : warna === 'emerald' ? 'bg-emerald-500' : 'bg-indigo-600'
  const pil = ukuran === 'mini' ? 'h-[18px] w-8' : ukuran === 'kecil' ? 'h-5 w-9' : 'h-6 w-11'
  const knop = ukuran === 'mini' ? 'h-[14px] w-[14px]' : ukuran === 'kecil' ? 'h-3.5 w-3.5' : 'h-4 w-4'
  const geser = nyala
    ? (ukuran === 'mini' ? 'translate-x-[16px]' : ukuran === 'kecil' ? 'translate-x-[18px]' : 'translate-x-6')
    : 'translate-x-0.5'

  return (
    <button
      type="button"
      role="switch"
      aria-checked={nyala}
      aria-label={label}
      title={label}
      onClick={onUbah}
      className="shrink-0 inline-flex items-center justify-center sentuh:min-h-[44px] sentuh:min-w-[44px]"
    >
      <span className={`relative inline-flex ${pil} items-center rounded-full transition-colors ${nyala ? aktif : 'bg-gray-200'}`}>
        <span className={`inline-block ${knop} transform rounded-full bg-white shadow transition-transform ${geser}`} />
      </span>
    </button>
  )
}
