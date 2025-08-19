import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import QuestionModel from '@/models/Question';
import UserModel from '@/models/User';

// 型定義
interface SitemapItem {
  _id: string;
  updatedAt: Date;
  createdAt: Date;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const baseUrl = 'https://www.training-board-test.com';

  try {
    let xml = '';
    
    if (type === 'main') {
      // メインページのsitemap - トレーニング掲示板の核となるページ
      xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/questions</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/search</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/tags</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
</urlset>`;
    } else if (type === 'questions') {
      // 質問ページのsitemap - トレーニング掲示板の主要コンテンツ
      await connectToDatabase();
      const questions = await QuestionModel.find({}, '_id updatedAt createdAt')
        .lean()
        .sort({ updatedAt: -1 })
        .limit(1000) // パフォーマンス考慮で制限
        .exec();

      xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${questions.map(question => `
  <url>
    <loc>${baseUrl}/questions/${question._id}</loc>
    <lastmod>${new Date(question.updatedAt || question.createdAt).toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('')}
</urlset>`;
    } else if (type === 'users') {
      // ユーザーページのsitemap - コミュニティ形成のためのページ
      await connectToDatabase();
      const users = await UserModel.find({}, '_id updatedAt createdAt')
        .lean()
        .sort({ updatedAt: -1 })
        .limit(500) // パフォーマンス考慮で制限
        .exec();

      xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${users.map(user => `
  <url>
    <loc>${baseUrl}/users/${user._id}</loc>
    <lastmod>${new Date(user.updatedAt || user.createdAt).toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`).join('')}
</urlset>`;
    } else {
      return new NextResponse('Invalid sitemap type', { status: 400 });
    }

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return new NextResponse('Error generating sitemap', { status: 500 });
  }
}
