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
  outputFileTracingIncludes: {
    '**/*': ['./node_modules/.prisma/client/**/*'],
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
    ]
  },
}

export default nextConfig

// Membuat getCloudflareContext() (binding Hyperdrive dll.) tersedia saat
// `next dev`, bukan hanya di Worker hasil build.
if (process.env.NODE_ENV === 'development') {
  const { initOpenNextCloudflareForDev } = await import('@opennextjs/cloudflare')
  await initOpenNextCloudflareForDev()
}
