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
}

export default nextConfig

// Membuat getCloudflareContext() (binding Hyperdrive dll.) tersedia saat
// `next dev`, bukan hanya di Worker hasil build.
if (process.env.NODE_ENV === 'development') {
  const { initOpenNextCloudflareForDev } = await import('@opennextjs/cloudflare')
  await initOpenNextCloudflareForDev()
}
