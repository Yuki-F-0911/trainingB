import { promises as fs } from 'fs';
import path from 'path';

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
        filePath = path.join(process.cwd(), 'public', 'sitemap-questions.xml');
        break;
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