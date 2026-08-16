/** @type {import('next').NextConfig} */
const nextConfig = {
  // WAJIB untuk Cloudflare. Tanpa ini webpack membundel @prisma/client memakai
  // kondisi resolusi "node", sehingga yang ikut adalah build engine biner dan
  // saat jalan errornya: "Could not locate the Query Engine for runtime
  // debian-openssl-1.1.x" — padahal build dan deploy sama sekali tidak
  // mengeluh. Ditandai eksternal, resolusinya diserahkan ke tahap bundling
  // OpenNext yang memakai kondisi "workerd" (-> build WASM).
  serverExternalPackages: ['@prisma/client', '.prisma/client'],

  // serverExternalPackages mencocokkan berdasarkan NAMA PAKET, jadi subpath
  // '.prisma/client/wasm' yang diimpor lib/prisma.ts tidak ikut tercakup —
  // webpack tetap mencoba mem-parse query_engine_bg.wasm dan build gagal
  // ("module is not flagged as WebAssembly module"). Di sini subpath itu
  // ditandai eksternal secara eksplisit, sehingga resolusinya diserahkan ke
  // esbuild OpenNext yang memang bisa menangani impor .wasm untuk workerd.
  // Build WASM tidak bisa dimuat Node biasa ("Unknown file extension .wasm"),
  // jadi hanya dipakai untuk build produksi yang menuju Workers. `next dev`
  // dialihkan ke build Node biasa supaya pengembangan lokal tetap normal.
  webpack: (config, { isServer, dev }) => {
    if (!isServer) return config

    if (dev) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '.prisma/client/wasm': '@prisma/client',
      }
      return config
    }

    config.externals = config.externals || []
    config.externals.push(({ request }, callback) => {
      if (request === '.prisma/client/wasm') {
        return callback(null, `commonjs ${request}`)
      }
      return callback()
    })
    return config
  },

  // Penelusuran file Next mengikuti kondisi resolusi "node", jadi yang tersalin
  // ke output hanya index.js + engine biner platform build — sementara
  // wasm.js dan query_engine_bg.wasm ditinggal. Akibatnya esbuild OpenNext
  // (yang memakai kondisi "workerd") tidak menemukan varian WASM-nya, lalu
  // jatuh ke build biner dan saat jalan errornya:
  // "Could not locate the Query Engine for runtime debian-openssl-1.1.x".
  // Menyertakan seluruh isi .prisma/client memastikan varian WASM ikut terbawa.
  // Daftarnya SENGAJA spesifik, bukan '**/*'.
  //
  // `prisma generate` selalu ikut memancarkan engine native platform build
  // (di Windows ~21 MB, plus sisa .tmp dari generate yang terputus — pernah
  // 78 MB total). Biner itu MUSTAHIL dijalankan di Workers; yang dipakai hanya
  // varian WASM 2,2 MB. Menyalin semuanya membengkakkan bundle dari 2,1 MB ke
  // 3,0 MB gzip — nyaris menembus batas 3 MB paket Free.
  //
  // outputFileTracingExcludes TIDAK bisa dipakai untuk membuang biner itu:
  // include menang atas exclude, jadi satu-satunya cara adalah tidak
  // menyertakannya sejak awal.
  //
  // Isi daftar ini diturunkan dari rantai require yang sebenarnya:
  //   lib/prisma.ts -> .prisma/client/wasm.js
  //     -> ./query_engine_bg.js  -> ./query_engine_bg.wasm
  //     -> @prisma/client/runtime/wasm-engine-edge.js (paket terpisah)
  // package.json diperlukan karena resolusi subpath "./wasm" melewatinya.
  outputFileTracingIncludes: {
    '**/*': [
      './node_modules/.prisma/client/package.json',
      './node_modules/.prisma/client/wasm.js',
      './node_modules/.prisma/client/wasm-worker-loader.mjs',
      './node_modules/.prisma/client/wasm-edge-light-loader.mjs',
      './node_modules/.prisma/client/query_engine_bg.js',
      './node_modules/.prisma/client/query_engine_bg.wasm',
      './node_modules/.prisma/client/schema.prisma',
    ],
  },

  images: {
    // Optimizer bawaan Next memakai `sharp`, yang tidak bisa jalan di Workers.
    // Gambar disajikan apa adanya dari Supabase Storage; ukurannya sudah
    // dikecilkan di sisi browser sebelum upload (lihat lib/image-resize.ts).
    // Kalau nanti berlangganan Cloudflare Images, ganti ini dengan loader
    // kustom dan hapus `unoptimized`.
    unoptimized: true,
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'plus.unsplash.com',
      },
    ],
  },

  // Header keamanan. Sengaja TANPA Content-Security-Policy untuk sekarang:
  // CSP yang benar butuh audit inline script/style lebih dulu, dan CSP asal
  // pasang justru merusak halaman diam-diam. Yang di bawah ini aman diterapkan
  // menyeluruh dan menjadi lapis kedua di belakang perbaikan XSS markdown
  // (lib/html-safe.ts).
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Jangan menebak-nebak tipe konten — penting karena upload
          // pengguna disajikan dari bucket publik.
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Cegah clickjacking pada dashboard/admin.
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Tidak ada fitur ini yang dipakai; matikan semuanya.
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
          // 2 tahun, seluruh subdomain — undangan pelanggan juga berjalan di
          // subdomain, jadi harus ikut terlindungi.
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
      // Halaman ini `force-dynamic` (wajib — lihat catatan Prisma/workerd di
      // app/sitemap.ts), tapi isinya cuma berubah saat admin publish sesuatu,
      // bukan tiap detik. Cache-Control di sini di-cache oleh EDGE CLOUDFLARE
      // sendiri (bukan browser) — permintaan berikutnya dalam jendela
      // s-maxage langsung dijawab dari edge tanpa menyentuh Worker/Hyperdrive
      // sama sekali. Gratis, tanpa D1/R2/ISR, konsisten dengan keputusan
      // sengaja di open-next.config.ts untuk tidak memakai incremental cache.
      //
      // SENGAJA tidak termasuk /templates/[slug] (detail template) maupun
      // /invitation/[slug] (undangan tamu) — keduanya di luar cakupan
      // perbaikan ini.
      {
        source: '/templates',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=300, stale-while-revalidate=3600' },
        ],
      },
      {
        source: '/blog',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=300, stale-while-revalidate=3600' },
        ],
      },
      {
        source: '/blog/:slug',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=300, stale-while-revalidate=3600' },
        ],
      },
      // Hanya dibaca crawler, jadi jendelanya lebih longgar.
      {
        source: '/sitemap.xml',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=3600' },
        ],
      },
    ]
  },
}

export default nextConfig

// Membuat getCloudflareContext() (binding Hyperdrive dll.) tersedia saat
// `next dev`, bukan hanya di Worker hasil build.
if (process.env.NODE_ENV === 'development') {
  // WAJIB diset SEBELUM init: proxy platform lokal menolak jalan kalau binding
  // Hyperdrive tidak punya connection string lokal, dan kegagalannya membuat
  // `next dev` mati saat start — bukan sekadar peringatan. Nilainya hanya untuk
  // emulasi lokal; Worker yang sesungguhnya tetap memakai binding HYPERDRIVE.
  const BINDING_ENV = 'CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE'
  if (!process.env[BINDING_ENV] && process.env.DATABASE_URL) {
    process.env[BINDING_ENV] = process.env.DATABASE_URL
  }

  if (!process.env[BINDING_ENV]) {
    console.warn(
      `[next.config] ${BINDING_ENV} maupun DATABASE_URL tidak diset — ` +
      'getCloudflareContext() kemungkinan gagal saat dev.'
    )
  }

  const { initOpenNextCloudflareForDev } = await import('@opennextjs/cloudflare')
  await initOpenNextCloudflareForDev()
}
