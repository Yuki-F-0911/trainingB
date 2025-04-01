/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['lh3.googleusercontent.com'],
  },
  experimental: {
    serverComponentsExternalPackages: ['mongoose']
  },
  // クライアント側で使用する環境変数のみを公開
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    MONGODB_URI: process.env.MONGODB_URI,
  },
};

module.exports = nextConfig; 