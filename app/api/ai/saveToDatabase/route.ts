import { NextResponse } from 'next/server';
import { connectToDatabase } from "@/app/lib/db";
import Question from "@/app/models/Question";
import User from "@/app/models/User";
import { getServerSession } from 'next-auth';
import { authOptions } from "@/app/api/auth/[...nextauth]/auth.config";

export async function POST(request: Request) {
  try {
    // 認証チェック
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      );
    }
    
    // リクエストボディから質問データを取得
    const questionData = await request.json();
    
    if (!questionData.title || !questionData.content) {
      return NextResponse.json(
        { error: "タイトルと内容は必須です" },
        { status: 400 }
      );
    }
    
    // データベースに接続
    await connectToDatabase();
    
    // AIユーザーを取得または作成
    let aiUser = await User.findOne({ email: 'ai@training-board.com' });
    
    if (!aiUser) {
      aiUser = await User.create({
        name: 'AI Assistant',
        email: 'ai@training-board.com',
        password: require('crypto').randomBytes(32).toString('hex'),
        isAdmin: false,
      });
    }
    
    // 質問をデータベースに保存
    const question = await Question.create({
      title: questionData.title,
      content: questionData.content,
      user: aiUser._id,
      isAIGenerated: true,
      tags: ['AI生成', questionData.personality || '自動生成'],
      customId: `ai-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    });
    
    // 保存に成功したら、質問データを返す
    return NextResponse.json({
      message: "質問がデータベースに保存されました",
      question: {
        id: question._id,
        title: question.title,
        content: question.content,
        tags: question.tags,
        isAIGenerated: question.isAIGenerated,
        createdAt: question.createdAt,
      }
    });
    
  } catch (error: any) {
    console.error('AIデータ保存エラー:', error);
    return NextResponse.json(
      { error: error.message || "データベースへの保存中にエラーが発生しました" },
      { status: 500 }
    );
  }
} 