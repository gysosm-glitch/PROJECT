import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.contestkorea.com',
      },
      {
        protocol: 'https',
        hostname: 'www.wevity.com',
      },
      {
        protocol: 'https',
        hostname: 'linkareer.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
}

export default nextConfig
