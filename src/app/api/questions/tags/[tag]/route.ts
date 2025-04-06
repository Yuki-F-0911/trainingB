import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import QuestionModel from '@/models/Question';
import UserModel from '@/models/User';

const DEFAULT_PAGE_LIMIT = 10;

// Next.js App Router API Routeの正しいシグネチャ
export async function GET(
  request: Request,
  { params }: { params: { tag: string } }
) {
  try {
    await dbConnect();
    // User モデルの参照を確保
    await UserModel.findOne().select('_id').lean().exec();

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || String(DEFAULT_PAGE_LIMIT), 10);
    const tag = decodeURIComponent(params.tag);

    if (page < 1) {
      return NextResponse.json({ message: 'Page must be greater than or equal to 1' }, { status: 400 });
    }
    if (limit < 1) {
      return NextResponse.json({ message: 'Limit must be greater than or equal to 1' }, { status: 400 });
    }
    if (!tag) {
      return NextResponse.json({ message: 'Tag parameter is required' }, { status: 400 });
    }

    const skip = (page - 1) * limit;

    // 指定されたタグを持つ質問を検索
    const query = { tags: tag };
    const questions = await QuestionModel.find(query)
      .populate('author', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // 総件数を取得して総ページ数を計算
    const totalQuestions = await QuestionModel.countDocuments(query);
    const totalPages = Math.ceil(totalQuestions / limit);

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