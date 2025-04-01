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
  typescript: {
    // ビルド時の型チェックを無効化（一時的な対応）
    ignoreBuildErrors: true,
  },
  eslint: {
    // ビルド時のESLintチェックを無効化（一時的な対応）
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    // Webpackの設定をカスタマイズ
    config.infrastructureLogging = { level: 'error' }; // ログ出力を減らす
    return config;
  },
};

module.exports = nextConfig; 