/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'ydpcoaxjkiewyyteobvs.supabase.co',
      },
    ],
  },
  // Enable SWC minification
  swcMinify: true,
  // Strict mode for better development experience
  reactStrictMode: true,
  // Optimize production build
  compress: true,
}

module.exports = nextConfig
