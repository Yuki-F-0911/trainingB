import { promises as fs } from 'fs';
import path from 'path';
import dbConnect from '../../lib/dbConnect';
import QuestionModel from '../../models/Question';

export default async function handler(req, res) {
  try {
    const { type } = req.query;
    let filePath;

    // サイトマップの種類によってファイルパスを決定
    switch(type) {
      case 'main':
        filePath = path.join(process.cwd(), 'public', 'sitemap-main.xml');
        break;
      case 'questions':
        // DBから質問IDを取得して動的にSiteMapを生成
        await dbConnect();
        const questions = await QuestionModel.find().select('_id updatedAt').lean();
        const urls = questions.map(q => `
    <url>
      <loc>https://www.training-board-test.com/questions/${q._id}</loc>
      <lastmod>${q.updatedAt.toISOString().split('T')[0]}</lastmod>
    </url>`).join('');
        const sitemapQuestions = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
        res.setHeader('Content-Type', 'application/xml');
        res.status(200).send(sitemapQuestions);
        return;
      case 'users':
        filePath = path.join(process.cwd(), 'public', 'sitemap-users.xml');
        break;
      default:
        filePath = path.join(process.cwd(), 'public', 'sitemap.xml');
    }

    // ファイルを読み込む
    const fileContents = await fs.readFile(filePath, 'utf8');

    // XML形式でレスポンスを返す
    res.setHeader('Content-Type', 'application/xml');
    res.status(200).send(fileContents);
  } catch (error) {
    console.error('サイトマップの取得に失敗しました:', error);
    res.status(500).json({ error: 'サイトマップの取得に失敗しました' });
  }
} 