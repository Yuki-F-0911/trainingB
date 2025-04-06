import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import QuestionModel from '@/models/Question';
import UserModel from '@/models/User';

const DEFAULT_PAGE_LIMIT = 10;

// Next.js 15の型定義に合わせた単純化したAPIルート
export async function GET(
  req: NextRequest,
  // context引数を使わないようにする
) {
  try {
    // URLからタグを直接抽出（context経由ではなく）
    const path = req.nextUrl.pathname;
    const tagMatch = path.match(/\/api\/questions\/tags\/([^\/]+)/);
    const tag = tagMatch ? decodeURIComponent(tagMatch[1]) : '';
    
    if (!tag) {
      return NextResponse.json({ message: 'Tag parameter is required' }, { status: 400 });
    }
    
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || String(DEFAULT_PAGE_LIMIT), 10);

    if (page < 1) {
      return NextResponse.json({ message: 'Page must be greater than or equal to 1' }, { status: 400 });
    }
    if (limit < 1) {
      return NextResponse.json({ message: 'Limit must be greater than or equal to 1' }, { status: 400 });
    }

    // データベース接続
    await dbConnect();
    
    // UserModelを明示的に読み込む処理は必要な場合のみにする
    // (本APIでは単に参照するだけなので省略可能)
    // await UserModel.findOne().select('_id').lean().exec();

    const skip = (page - 1) * limit;

    // 指定されたタグを持つ質問を検索（パフォーマンス向上のためlean()を使用）
    const query = { tags: tag };
    
    // クエリを一度だけ実行し、結果を変数に保存
    const [questions, totalQuestions] = await Promise.all([
      QuestionModel.find(query)
        .populate('author', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      QuestionModel.countDocuments(query)
    ]);

    // 総ページ数を計算
    const totalPages = Math.ceil(totalQuestions / limit);

    // 結果を返す
    return NextResponse.json({
      questions,
      currentPage: page,
      totalPages,
      totalQuestions,
    });
  } catch (error) {
    console.error('Error fetching questions by tag:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
} 