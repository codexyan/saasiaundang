/**
 * Resize + kompresi gambar artikel DI BROWSER, sebelum diupload.
 *
 * Pengganti `sharp` yang tidak bisa jalan di Cloudflare Workers. Perilaku
 * dibuat sepadan dengan implementasi sharp yang lama:
 *   - cover  : crop tengah ke rasio 1.91:1, lebar dibatasi 1600px
 *   - inline : lebar dibatasi 1600px, rasio dijaga, tidak pernah diperbesar
 *   - GIF    : dilewati apa adanya supaya animasinya tidak hilang
 *   - gagal  : kembalikan null, pemanggil mengupload file asli (upload tidak
 *              pernah diblokir gara-gara proses gambar — sama seperti dulu)
 *
 * Hanya boleh dipanggil dari komponen client.
 */
import { ARTICLE_IMAGE, type ImageVariant } from './image-process'

export interface ResizedImage {
  file: File
  width: number
  height: number
  /** true kalau SUMBER-nya lebih kecil dari lebar minimum yang disarankan */
  lowRes: boolean
}

function replaceExt(name: string, ext: string): string {
  const dot = name.lastIndexOf('.')
  const base = dot > 0 ? name.slice(0, dot) : name
  return `${base}${ext}`
}

export async function resizeArticleImage(
  file: File,
  variant: ImageVariant
): Promise<ResizedImage | null> {
  // GIF animasi akan diratakan jadi satu frame oleh canvas — biarkan apa adanya.
  if (file.type === 'image/gif') return null
  if (typeof createImageBitmap !== 'function' || typeof document === 'undefined') return null

  let bitmap: ImageBitmap | undefined
  try {
    // from-image = hormati orientasi EXIF, setara .rotate() milik sharp.
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })

    const srcW = bitmap.width
    const srcH = bitmap.height
    if (!srcW || !srcH) return null

    const targetW = Math.min(srcW, ARTICLE_IMAGE.maxWidth)
    const targetH =
      variant === 'cover'
        ? Math.round(targetW / ARTICLE_IMAGE.coverRatio)
        : Math.round(srcH * (targetW / srcW))

    const canvas = document.createElement('canvas')
    canvas.width = targetW
    canvas.height = targetH

    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.imageSmoothingQuality = 'high'

    if (variant === 'cover') {
      // Setara fit:'cover' + position:'centre' — perbesar sampai menutup, lalu
      // crop dari tengah.
      const scale = Math.max(targetW / srcW, targetH / srcH)
      const drawW = srcW * scale
      const drawH = srcH * scale
      ctx.drawImage(bitmap, (targetW - drawW) / 2, (targetH - drawH) / 2, drawW, drawH)
    } else {
      ctx.drawImage(bitmap, 0, 0, targetW, targetH)
    }

    const blob = await new Promise<Blob | null>(resolve =>
      canvas.toBlob(resolve, 'image/webp', ARTICLE_IMAGE.quality)
    )
    // Browser yang tidak bisa encode webp mengembalikan null atau diam-diam
    // menghasilkan PNG — dua-duanya lebih baik ditolak dan pakai file asli.
    if (!blob || blob.type !== 'image/webp') return null

    return {
      file: new File([blob], replaceExt(file.name, '.webp'), { type: 'image/webp' }),
      width: targetW,
      height: targetH,
      lowRes: srcW < ARTICLE_IMAGE.coverMinWidth,
    }
  } catch {
    return null
  } finally {
    bitmap?.close()
  }
}
