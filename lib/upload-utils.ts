/**
 * Util upload yang tidak bergantung pada modul Node.
 *
 * Sebelumnya route upload memakai `path.extname()` dari Node. Meski `path`
 * tersedia lewat nodejs_compat di Workers, satu-satunya yang dipakai adalah
 * ekstensi file — jadi lebih baik dihilangkan daripada menyeret polyfill.
 */

/**
 * Ekstensi file berikut titiknya, lowercase. String kosong kalau tidak ada.
 *
 * Sengaja dibuat sepadan dengan path.extname() pada hal yang penting untuk
 * keamanan: pemisah path diabaikan, jadi "../../evil" atau "a/b.png" tidak
 * bisa dipakai untuk menyelundupkan path. Nama berawalan titik tanpa ekstensi
 * lain (".htaccess") menghasilkan string kosong, sama seperti path.extname().
 */
export function fileExtension(filename: string): string {
  const base = filename.split(/[/\\]/).pop() ?? ''
  const dot = base.lastIndexOf('.')
  if (dot <= 0) return ''
  return base.slice(dot).toLowerCase()
}

/**
 * Cek magic byte terhadap potongan awal file.
 * Menerima Uint8Array supaya tidak perlu Buffer milik Node.
 */
export interface MagicSignature {
  kind: string
  bytes: number[]
  offset?: number
}

/**
 * Ambil angka positif dari field FormData. Mengembalikan undefined untuk
 * apa pun yang bukan angka wajar — dimensi ini berasal dari client, jadi
 * tidak boleh dipercaya mentah-mentah (hanya dipakai untuk tampilan).
 */
export function numberField(value: FormDataEntryValue | null): number | undefined {
  if (typeof value !== 'string' || value === '') return undefined
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 100_000) return undefined
  return Math.round(parsed)
}

export function matchesMagic(
  head: Uint8Array,
  signatures: MagicSignature[],
  kind: string
): boolean {
  const relevant = signatures.filter(s => s.kind === kind)
  if (relevant.length === 0) return true
  return relevant.some(sig => {
    const offset = sig.offset ?? 0
    return sig.bytes.every((byte, i) => head[offset + i] === byte)
  })
}
