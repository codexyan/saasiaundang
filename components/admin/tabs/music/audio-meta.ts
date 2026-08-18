/**
 * Baca durasi lagu di browser sebelum diunggah.
 *
 * Kolom `duration` sudah lama ada di tabel music_tracks dan dipakai untuk
 * menampilkan "3:42" di daftar — tapi tidak pernah ada satu pun yang
 * mengisinya, jadi SELURUH perpustakaan menampilkan "0:00", termasuk di
 * daftar pilihan yang dilihat pengguna saat menyusun undangannya.
 *
 * Dibaca di sini (bukan di server) karena server berjalan di Cloudflare
 * Workers: tidak ada ffmpeg, dan mem-parsing header MP3 sendiri berarti
 * menulis dekoder untuk selusin varian bitrate. Browser sudah punya
 * dekodernya.
 */
export function readAudioDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const audio = new Audio()

    // File rusak atau format yang tidak dikenal browser tidak boleh
    // menggagalkan unggahan — durasi 0 hanya berarti "tidak diketahui".
    const done = (value: number) => {
      URL.revokeObjectURL(url)
      audio.removeAttribute('src')
      resolve(Number.isFinite(value) && value > 0 ? Math.round(value) : 0)
    }

    // Sebagian berkas tidak pernah memicu event apa pun (mis. stream tanpa
    // header durasi). Tanpa batas waktu, unggahan menggantung selamanya.
    const timeout = setTimeout(() => done(0), 8000)

    audio.preload = 'metadata'
    audio.onloadedmetadata = () => { clearTimeout(timeout); done(audio.duration) }
    audio.onerror = () => { clearTimeout(timeout); done(0) }
    audio.src = url
  })
}

export function formatDuration(sec: number) {
  if (!sec || sec < 0) return '—'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function formatFileSize(bytes: number) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
