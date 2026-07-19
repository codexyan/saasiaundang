/** @type {import('next').NextConfig} */
const nextConfig = {
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
