/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        // Warning: This allows production builds to successfully complete even if
        // your project has ESLint errors.
        ignoreDuringBuilds: true,
    },
    async headers() {
        return [
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
    // 静的ファイルの配信設定
    async rewrites() {
        return [
            {
                source: '/robots.txt',
                destination: '/robots.txt',
            },
            {
                source: '/sitemap.xml',
                destination: '/sitemap.xml',
            },
            {
                source: '/sitemap-main.xml',
                destination: '/sitemap-main.xml',
            },
            {
                source: '/sitemap-questions.xml',
                destination: '/sitemap-questions.xml',
            },
            {
                source: '/sitemap-users.xml',
                destination: '/sitemap-users.xml',
            },
        ];
    },
    // 他の設定があればここに追加
};

export default nextConfig; 