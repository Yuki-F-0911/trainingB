import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import QuestionModel from '@/models/Question';
import UserModel from '@/models/User'; // Userモデルをインポート (populateで使用するため)

const DEFAULT_PAGE_LIMIT = 10; // 1ページあたりのデフォルト表示件数

export async function GET(
    request: NextRequest,
    { params }: { params: { tag: string } }
) {
    await dbConnect();
    // User モデルが登録されていることを保証（populateエラー対策）
    UserModel;

    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || String(DEFAULT_PAGE_LIMIT), 10);
    const tag = decodeURIComponent(params.tag); // URLエンコードされたタグ名をデコード

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

    try {
        // 指定されたタグを持つ質問を検索
        const query = { tags: tag };
        const questions = await QuestionModel.find(query)
            .populate('author', 'name email') // 投稿者の名前とemailを取得
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