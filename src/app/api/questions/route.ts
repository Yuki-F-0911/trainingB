import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import dbConnect from '@/lib/dbConnect';
import QuestionModel from '@/models/Question';
import '@/models/User'; // Import User model to ensure schema registration
// NextAuthの設定をインポート (getServerSessionで使用する可能性があるため)
// import { options } from '../auth/[...nextauth]/route'; // 必要に応じてパスを確認

// POST: 新しい質問を作成
export async function POST(request: Request) {
  // セッション情報を取得 (注: App Router での getServerSession の使い方)
  // NextAuth v5 以降ではよりシンプルな方法が提供される可能性があります。
  // ここでは getServerSession が authOptions を必要とする場合を想定。
  // authOptions を正しくインポートまたは定義する必要があります。
  // 現状の route.ts の構成だと authOptions を export していないため、
  // 直接 NextAuth(authOptions) を呼び出す形になるかもしれません。
  // 簡単のため、ここではセッション取得部分をコメントアウトし、
  // 認証が必要な場合は後で NextAuth v5 の Auth.js 等を使う想定とします。
  /*
  const session = await getServerSession(options); // options のインポートが必要
  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const userId = (session.user as any).id; // 型アサーション
  */

  // ★★★ 認証チェック (現状スキップ) ★★★
  const userId = null; 

  try {
    const { title, content, tags } = await request.json(); // tags を受け取る

    // tags が配列であることを確認 (任意だが安全)
    const validTags = Array.isArray(tags) ? tags.filter(tag => typeof tag === 'string') : [];

    if (!title || !content) {
      return NextResponse.json({ message: 'Title and content are required' }, { status: 400 });
    }

    await dbConnect();

    const newQuestion = new QuestionModel({
      title,
      content,
      tags: validTags, // 保存するデータに tags を追加
      author: userId,
      isAIGenerated: false,
    });

    await newQuestion.save();
    return NextResponse.json(newQuestion, { status: 201 });

  } catch (error) {
    console.error('Error creating question:', error);
    // エラー内容に応じてより詳細なレスポンスを返すことも検討
    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json({ message: 'Validation Error', errors: (error as any).errors }, { status: 400 });
    }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// GET: 質問リストを取得
export async function GET(request: Request) {
    try {
        await dbConnect();

        // クエリパラメータからページネーション情報を取得 (例: /api/questions?page=1&limit=10)
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '10', 10);
        const skip = (page - 1) * limit;

        // 質問を最新順に取得し、author情報をpopulate（ユーザー名など）
        const questions = await QuestionModel.find()
            .select('+answers') // 明示的に answers フィールドを含める
            .populate('author', 'name email') // authorフィールドを展開し、nameとemailを取得
            .sort({ createdAt: -1 }) // 作成日時の降順でソート
            .skip(skip)
            .limit(limit)
            .exec();

        // 総質問数を取得 (ページネーションのため)
        const totalQuestions = await QuestionModel.countDocuments();

        return NextResponse.json({
            questions,
            totalPages: Math.ceil(totalQuestions / limit),
            currentPage: page,
            totalQuestions
        }, { status: 200 });

    } catch (error) {
        console.error('Error fetching questions:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
} 