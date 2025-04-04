import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/db";
import Question from "@/app/models/Question";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth.config"

// 質問一覧を取得
export async function GET(req: NextRequest) {
  try {
    console.log('API: 質問一覧取得開始');
    await connectToDatabase();
    console.log('API: データベース接続完了');
    
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;
    const sort = searchParams.get("sort") || "-createdAt"; // デフォルトは新しい順
    const search = searchParams.get("search") || "";
    
    console.log(`API: パラメータ - page:${page}, limit:${limit}, sort:${sort}, search:${search}`);
    
    let query = {};
    if (search) {
      query = {
        $or: [
          { title: { $regex: search, $options: "i" } },
          { content: { $regex: search, $options: "i" } },
        ],
      };
    }
    
    console.log('API: 質問データ取得クエリ実行');
    const questions = await Question.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate("user", "name")
      .lean();
    
    console.log(`API: ${questions.length}件の質問データを取得`);
    
    // IDが正しく取得されているか確認
    const processedQuestions = questions.map(q => {
      // MongoDBの_idオブジェクトを文字列に変換し、確実にIDを持つようにする
      if (q._id) {
        return {
          ...q,
          id: q._id.toString(),
          _id: q._id.toString()
        };
      }
      console.error('質問データにIDがありません:', q);
      return q;
    }).filter(q => q._id); // IDが存在する質問のみ返す
    
    console.log('API: 質問データの処理完了');
    const total = await Question.countDocuments(query);
    
    return NextResponse.json({
      questions: processedQuestions,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("質問一覧取得エラー:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}

// 質問を投稿
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      );
    }
    
    const { title, content, tags, isAIGenerated = false } = await req.json();
    
    if (!title || !content) {
      return NextResponse.json(
        { error: "タイトルと内容は必須です" },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    const newQuestion = new Question({
      title,
      content,
      user: session.user.id,
      tags: tags || [],
      isAIGenerated,
    });
    
    await newQuestion.save();
    
    return NextResponse.json(
      { message: "質問が投稿されました", questionId: newQuestion._id },
      { status: 201 }
    );
  } catch (error) {
    console.error("質問投稿エラー:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
} 