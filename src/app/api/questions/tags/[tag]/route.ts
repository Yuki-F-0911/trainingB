import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import QuestionModel from '@/models/Question';

const DEFAULT_PAGE_LIMIT = 10;

// Next.js 15の型定義に合わせた単純化したAPIルート
export async function GET(
  req: NextRequest,
  { params }: { params: { tag: string } }  // contextパラメータを正しく使用
) {
  try {
    // パラメータからタグを直接取得（URLからの抽出ではなく）
    const tag = params.tag ? decodeURIComponent(params.tag) : '';
    
    if (!tag) {
      return NextResponse.json({ message: 'Tag parameter is required' }, { status: 400 });
    }
    
    console.log(`タグ検索API: "${tag}"`); // デバッグログ
    
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

    const skip = (page - 1) * limit;

    // 指定されたタグを持つ質問を検索（パフォーマンス向上のためlean()を使用）
    // タグのマッチングで大文字小文字を区別しないようにする
    const tagRegex = new RegExp(`^${tag}$`, 'i');
    const query = { tags: tagRegex };
    
    console.log(`タグ検索クエリ:`, query); // デバッグログ
    
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

    console.log(`タグ検索結果: ${questions.length}件 / 合計: ${totalQuestions}件`); // デバッグログ

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