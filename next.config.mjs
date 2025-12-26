/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        // Warning: This allows production builds to successfully complete even if
        // your project has ESLint errors.
        ignoreDuringBuilds: true,
    },
    // サーバーコンポーネントのエラー詳細を表示
    logging: {
        fetches: {
            fullUrl: true
        }
    },
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    {
                        key: 'X-Robots-Tag',
                        value: 'index, follow',
                    },
                ],
            },
            {
                source: '/_next/static/css/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
            {
                source: '/robots.txt',
                headers: [
                    {
                        key: 'Content-Type',
                        value: 'text/plain',
                    },
                ],
            },
            {
                source: '/sitemap.xml',
                headers: [
                    {
                        key: 'Content-Type',
                        value: 'application/xml',
                    },
                ],
            },
            {
                source: '/sitemap-main.xml',
                headers: [
                    {
                        key: 'Content-Type',
                        value: 'application/xml',
                    },
                ],
            },
            {
                source: '/sitemap-questions.xml',
                headers: [
                    {
                        key: 'Content-Type',
                        value: 'application/xml',
                    },
                ],
            },
            {
                source: '/sitemap-users.xml',
                headers: [
                    {
                        key: 'Content-Type',
                        value: 'application/xml',
                    },
                ],
            },
        ];
    },
    // Note: robots.txt, sitemap.xml等のファイルはpublicフォルダから直接配信される
    // ドメインが apex → www に飛ぶリダイレクトもあれば追加
    async redirects() {
        return [
            {
                source: '/:path*',
                has: [{ type: 'host', value: 'training-board-test.com' }],
                destination: 'https://www.training-board-test.com/:path*',
                permanent: false,
            },
            // 重複コンテンツ解消: /register から /signup へリダイレクト
            {
                source: '/register',
                destination: '/signup',
                permanent: true,
            },
        ];
    },
    // 他の設定があればここに追加
};

export default nextConfig; 