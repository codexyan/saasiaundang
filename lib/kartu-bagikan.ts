import type { NewInvitationData, TemplateRecord } from './types'

/**
 * Menggambar kartu berbagi 1080x1920 untuk status WhatsApp dan Instagram.
 *
 * Kenapa fitur ini ada: dari pembacaan pasar (lihat bagian 12 di
 * SPEC_KANVAS_2026-09.md), undangan digital ditemukan orang lewat rekomendasi
 * di media sosial, bukan lewat pencarian. Balasan jauh melebihi suka di
 * hampir semua postingan yang bertanya. Yang disebarkan di sana adalah
 * GAMBAR, dan sekarang pasangan harus membuatnya sendiri di aplikasi lain.
 *
 * Kenapa digambar di peramban, bukan di server dengan next/og: anggaran
 * Worker tinggal sekitar 156 KiB dari batas 3.072 KiB, dan satori plus
 * resvg bukan tetangga yang ringan. Selain itu berkasnya memang harus
 * mendarat di galeri ponsel supaya bisa diunggah ke status, jadi mengunduh
 * dari peramban adalah jalan yang paling pendek.
 *
 * Yang digambar hanya data yang benar benar ada. Tidak ada teks contoh,
 * tidak ada nama karangan: bagian yang kosong dilewati, bukan diisi.
 */

const LEBAR = 1080
const TINGGI = 1920

export interface HasilKartu {
  blob: Blob
  /** Data URL untuk pratinjau di layar, tanpa perlu mengunduh dulu. */
  pratinjau: string
}

/** Memuat font tema supaya kartunya memakai huruf yang sama dengan undangannya. */
async function muatFont(namaHeading: string, namaBody: string): Promise<void> {
  const keluarga = [namaHeading, namaBody]
    .filter(Boolean)
    .map(f => `family=${f.replace(/ /g, '+')}:wght@400;700`)
    .join('&')
  if (!keluarga) return

  const href = `https://fonts.googleapis.com/css2?${keluarga}&display=swap`

  /**
   * Tautannya DIBIARKAN terpasang, tidak dicabut sesudah selesai.
   *
   * Versi pertama mencabutnya di blok finally, dan itu membuang aturan
   * @font-face-nya sebelum kanvas sempat menggambar: fontnya terunduh, lalu
   * hilang lagi, lalu canvas diam diam jatuh ke serif bawaan. Tidak ada
   * error, tidak ada peringatan, hanya kartu yang hurufnya tidak mirip
   * undangannya. Ketahuan dari melihat gambarnya, bukan dari konsol.
   */
  const sudahAda = document.querySelector(`link[data-font-kartu="${href}"]`)
  if (!sudahAda) {
    /**
     * Ditunggu sampai stylesheet-nya BENAR BENAR terurai sebelum lanjut.
     *
     * document.fonts.load() hanya memuat @font-face yang sudah terdaftar.
     * Dipanggil sedetik terlalu cepat, ia menemukan nol kecocokan, langsung
     * resolve, dan document.fonts.ready ikut resolve karena memang tidak ada
     * yang tertunda. Kanvas lalu menggambar dengan serif bawaan, dan fontnya
     * baru siap beberapa saat sesudahnya. Tidak ada error sama sekali, dan
     * pemeriksaan fonts.check() sesudah kejadian justru menjawab true, jadi
     * jejaknya hilang. Ketahuan hanya dari melihat gambarnya.
     */
    await new Promise<void>(selesai => {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = href
      link.setAttribute('data-font-kartu', href)
      const lanjut = () => selesai()
      link.onload = lanjut
      link.onerror = lanjut
      // Jaring pengaman: jaringan lambat bukan alasan kartunya tidak jadi.
      setTimeout(lanjut, 4000)
      document.head.appendChild(link)
    })
  }

  try {
    // Memaksa kedua font benar benar terunduh sebelum menggambar. Tanpa ini
    // canvas jatuh diam diam ke serif bawaan, dan kartunya tidak mirip
    // undangannya sama sekali.
    // Diminta pada ketebalan 400, bukan 700. Font skrip pernikahan seperti
    // Sacramento atau Great Vibes hanya punya satu ketebalan, dan meminta 700
    // membuat pencocokannya gagal diam diam: canvas jatuh ke serif bawaan dan
    // kartunya tidak mirip undangannya sama sekali. Terjadi di percobaan
    // pertama, dan tidak menimbulkan satu pun error di konsol.
    await Promise.all([
      document.fonts.load(`400 120px '${namaHeading}'`),
      document.fonts.load(`400 40px '${namaBody}'`),
    ])
    await document.fonts.ready
  } catch {
    /* Font gagal dimuat bukan alasan gagal membuat kartu. */
  }
}

/** Memuat gambar lintas domain. Mengembalikan null kalau ditolak, bukan melempar. */
function muatGambar(url: string): Promise<HTMLImageElement | null> {
  return new Promise(resolve => {
    const img = new Image()
    // Wajib: tanpa ini canvas jadi "tainted" dan toBlob() melempar, jadi
    // seluruh kartunya gagal hanya karena satu foto.
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = url
  })
}

function gambarPenuh(ctx: CanvasRenderingContext2D, img: HTMLImageElement, tinggiArea: number) {
  const rasioArea = LEBAR / tinggiArea
  const rasioGambar = img.width / img.height
  let sx = 0, sy = 0, sw = img.width, sh = img.height
  if (rasioGambar > rasioArea) {
    sw = img.height * rasioArea
    sx = (img.width - sw) / 2
  } else {
    sh = img.width / rasioArea
    sy = (img.height - sh) / 2
  }
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, LEBAR, tinggiArea)
}

function tulisTengah(
  ctx: CanvasRenderingContext2D,
  teks: string,
  y: number,
  font: string,
  warna: string,
  spasiHuruf = 0,
) {
  ctx.font = font
  ctx.fillStyle = warna
  ctx.textAlign = 'center'
  if (spasiHuruf === 0) {
    ctx.fillText(teks, LEBAR / 2, y)
    return
  }
  // Canvas 2D tidak punya letterSpacing di semua peramban, jadi digambar
  // per huruf. Dipakai hemat, hanya untuk label kecil.
  const huruf = [...teks]
  const lebarTotal = huruf.reduce((n, h) => n + ctx.measureText(h).width + spasiHuruf, -spasiHuruf)
  let x = LEBAR / 2 - lebarTotal / 2
  ctx.textAlign = 'left'
  for (const h of huruf) {
    ctx.fillText(h, x, y)
    x += ctx.measureText(h).width + spasiHuruf
  }
  ctx.textAlign = 'center'
}

/** Luminansi relatif WCAG, dipakai memilih warna teks yang terbaca. */
function luminansi(hex: string): number {
  const h = hex.replace('#', '')
  const penuh = h.length === 3 ? h.split('').map(c => c + c).join('') : h
  const nilai = [0, 2, 4].map(i => {
    const c = parseInt(penuh.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * nilai[0] + 0.7152 * nilai[1] + 0.0722 * nilai[2]
}

function rasioKontras(a: string, b: string): number {
  const la = luminansi(a), lb = luminansi(b)
  const terang = Math.max(la, lb), gelap = Math.min(la, lb)
  return (terang + 0.05) / (gelap + 0.05)
}

/**
 * Warna teks yang pasti terbaca di atas latar kartu.
 *
 * Warna teks tema dipakai kalau memang cukup kontras. Kalau tidak, kartunya
 * jatuh ke putih atau hitam, mana pun yang lebih kontras. Tanpa ini, tema
 * yang menyimpan teks gelap di atas latar gelap menghasilkan kartu dengan
 * nama mempelai yang nyaris tidak terlihat, dan itu benar benar terjadi
 * pada percobaan pertama: teks #1a1a1a di atas latar #123f8c.
 *
 * Ambangnya 4.5:1, sama dengan ambang teks normal WCAG AA (R-25), walaupun
 * namanya dicetak besar: kartu ini dilihat sebagai gambar kecil di daftar
 * status, bukan seukuran layar penuh.
 */
function warnaTerbaca(warnaTema: string, latar: string): string {
  if (rasioKontras(warnaTema, latar) >= 4.5) return warnaTema

  // Dicampur bertahap ke arah putih atau hitam, bukan langsung dilompati.
  // Melompat ke putih memang aman, tapi warna aksen tema ikut hilang dan
  // kartunya kehilangan nyawanya. Mencampur mempertahankan warnanya dan
  // hanya menaikkan terang secukupnya sampai lolos ambang.
  const keArahPutih = rasioKontras('#ffffff', latar) >= rasioKontras('#111111', latar)
  const tujuan = keArahPutih ? 255 : 17
  const h = warnaTema.replace('#', '')
  const penuh = h.length === 3 ? h.split('').map(c => c + c).join('') : h
  const asal = [0, 2, 4].map(i => parseInt(penuh.slice(i, i + 2), 16))

  for (let langkah = 1; langkah <= 10; langkah++) {
    const t = langkah / 10
    const campur = asal.map(v => Math.round(v + (tujuan - v) * t))
    const hex = '#' + campur.map(v => v.toString(16).padStart(2, '0')).join('')
    if (rasioKontras(hex, latar) >= 4.5) return hex
  }
  return keArahPutih ? '#ffffff' : '#111111'
}

function tanggalIndonesia(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

export async function buatKartuBagikan(
  data: NewInvitationData,
  template: TemplateRecord,
  alamat: string,
): Promise<HasilKartu> {
  const meta = template.config.meta
  const primer = data.primary_color || meta.color_scheme.primary
  const aksen = data.accent_color || meta.color_scheme.accent
  const teksTema = data.text_color || meta.color_scheme.text
  // Dihitung SESUDAH latar diketahui, bukan diambil mentah dari tema.
  const teks = warnaTerbaca(teksTema, primer)
  const fontJudul = data.font_heading || meta.font.heading
  const fontIsi = data.font_body || meta.font.body

  await muatFont(fontJudul, fontIsi)

  const canvas = document.createElement('canvas')
  canvas.width = LEBAR
  canvas.height = TINGGI
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Peramban ini tidak mendukung canvas')

  const aksenTerbaca = warnaTerbaca(aksen, primer)

  ctx.fillStyle = primer
  ctx.fillRect(0, 0, LEBAR, TINGGI)

  const foto = data.couple_photo_url ? await muatGambar(data.couple_photo_url) : null
  const tinggiFoto = Math.round(TINGGI * 0.58)

  if (foto) {
    gambarPenuh(ctx, foto, tinggiFoto)
    // Tirai gelap dari bawah supaya teks di bawahnya selalu terbaca, berapa
    // pun terangnya foto yang dipilih pasangan.
    const tirai = ctx.createLinearGradient(0, tinggiFoto * 0.35, 0, tinggiFoto)
    tirai.addColorStop(0, 'rgba(0,0,0,0)')
    tirai.addColorStop(1, primer)
    ctx.fillStyle = tirai
    ctx.fillRect(0, Math.round(tinggiFoto * 0.35), LEBAR, Math.round(tinggiFoto * 0.65) + 2)
  }

  // Bingkai tipis, satu satunya hiasan. Kartu status dilihat sekilas di layar
  // kecil, jadi yang ditambahkan harus benar benar menambah.
  ctx.strokeStyle = `${aksen}66`
  ctx.lineWidth = 3
  ctx.strokeRect(48, 48, LEBAR - 96, TINGGI - 96)

  const pusatY = foto ? tinggiFoto + 200 : Math.round(TINGGI * 0.42)

  tulisTengah(ctx, 'THE WEDDING OF', pusatY - 140, `400 34px '${fontIsi}', sans-serif`, `${aksenTerbaca}cc`, 14)

  const nama = [data.groom_name, data.bride_name].filter(Boolean)
  if (nama.length === 2) {
    tulisTengah(ctx, nama[0]!, pusatY, `400 116px '${fontJudul}', serif`, teks)
    tulisTengah(ctx, '&', pusatY + 92, `400 56px '${fontJudul}', serif`, aksenTerbaca)
    tulisTengah(ctx, nama[1]!, pusatY + 208, `400 116px '${fontJudul}', serif`, teks)
  } else if (nama.length === 1) {
    tulisTengah(ctx, nama[0]!, pusatY + 60, `400 116px '${fontJudul}', serif`, teks)
  }

  const tanggal = tanggalIndonesia(data.akad?.date || data.resepsi?.date)
  if (tanggal) {
    const y = pusatY + (nama.length === 2 ? 320 : 180)
    ctx.strokeStyle = `${aksen}80`
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(LEBAR / 2 - 90, y - 48)
    ctx.lineTo(LEBAR / 2 + 90, y - 48)
    ctx.stroke()
    tulisTengah(ctx, tanggal.toUpperCase(), y + 12, `400 38px '${fontIsi}', sans-serif`, `${teks}cc`, 6)
  }

  const bersih = alamat.replace(/^https?:\/\//, '')
  tulisTengah(ctx, bersih, TINGGI - 150, `400 34px '${fontIsi}', sans-serif`, `${aksenTerbaca}dd`, 2)

  const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/png'))
  if (!blob) throw new Error('Kartunya gagal dibuat')

  return { blob, pratinjau: canvas.toDataURL('image/png') }
}
