import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/db";
import Question from "@/app/models/Question";
import Answer from "@/app/models/Answer";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth.config";

// Answerのインターフェースを定義
interface AnswerType {
  _id: any;
  content: string;
  user?: any;
  question: any;
  upvotes?: number;
  downvotes?: number;
  isAIGenerated?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// 質問の詳細を取得
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // IDの検証を強化
    const questionId = params.id;
    console.log('API: 質問詳細リクエスト:', questionId);
    
    if (!questionId || questionId === 'undefined') {
      console.error('API: 無効な質問ID:', questionId);
      return NextResponse.json(
        { error: '無効な質問IDです', message: '有効な質問IDを指定してください' },
        { status: 400 }
      );
    }
    
    // MongoDBのObjectId形式かどうかをチェック
    const isMongoId = /^[0-9a-fA-F]{24}$/.test(questionId);
    const isAIGenId = !isMongoId && questionId.length > 0;
    console.log(`API: ID形式 - MongoDBのID: ${isMongoId}, AI生成ID可能性: ${isAIGenId}`);
    
    // データベース接続
    console.log('API: データベース接続開始');
    await connectToDatabase();
    console.log('API: データベース接続完了');
    
    // MongoDBからのクエリのデバッグログを追加
    console.log('API: 質問検索', questionId);
    
    let question;
    
    // 標準的なMongoDBのIDの場合
    if (isMongoId) {
      try {
        question = await Question.findById(questionId)
          .populate("user", "name profileImage")
          .lean();
      } catch (mongoError) {
        console.error('API: MongoDBでの検索エラー:', mongoError);
      }
    }
    
    // AI生成IDまたはMongoDBでの検索が失敗した場合、customIdフィールドで検索
    if (!question && isAIGenId) {
      console.log('API: カスタムIDで検索:', questionId);
      question = await Question.findOne({ customId: questionId })
        .populate("user", "name profileImage")
        .lean();
    }
    
    if (!question) {
      console.log('API: 質問が見つかりません', questionId);
      return NextResponse.json(
        { error: "質問が見つかりません" },
        { status: 404 }
      );
    }
    
    // 型アサーションを使用して_idにアクセス
    const questionData = question as any;
    console.log('API: 質問が見つかりました:', questionData._id);
    
    // MongoDBの_idを文字列に変換
    const formattedQuestion = {
      ...question,
      id: questionData._id.toString(),
    };
    
    // 関連する回答も取得
    console.log('API: 関連回答検索 - 質問ID:', questionId);
    let answers: AnswerType[] = [];
    try {
      answers = await Answer.find({ question: questionId })
        .populate("user", "name profileImage")
        .sort({ createdAt: -1 })
        .lean() as unknown as AnswerType[];
      console.log(`API: ${answers.length}件の回答が見つかりました`);
    } catch (error) {
      console.error('API: 回答取得エラー:', error);
    }
    
    // 回答のIDも文字列に変換
    const formattedAnswers = (answers as AnswerType[]).map(answer => {
      const answerData = answer as any;
      return {
        ...answer,
        id: answerData._id.toString(),
      };
    });
    
    // CORS設定を追加
    return NextResponse.json(
      {
        question: formattedQuestion,
        answers: formattedAnswers,
      },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      }
    );
  } catch (error: any) {
    console.error("API質問取得エラー:", error);
    // メッセージの改善
    const errorMessage = error.name === 'CastError' && error.kind === 'ObjectId'
      ? '無効な質問IDフォーマットです'
      : error.message || "質問の取得中にエラーが発生しました";
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// 質問を更新
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      );
    }
    
    const questionId = params.id;
    const { title, content, tags } = await req.json();
    
    await connectToDatabase();
    
    const question = await Question.findById(questionId);
    
    if (!question) {
      return NextResponse.json(
        { error: "質問が見つかりません" },
        { status: 404 }
      );
    }
    
    // 権限チェック
    if (question.user.toString() !== session.user.id && !session.user.isAdmin) {
      return NextResponse.json(
        { error: "この操作を行う権限がありません" },
        { status: 403 }
      );
    }
    
    // 更新
    question.title = title || question.title;
    question.content = content || question.content;
    question.tags = tags || question.tags;
    
    await question.save();
    
    return NextResponse.json({
      message: "質問が更新されました",
      question,
    });
  } catch (error) {
    console.error("質問更新エラー:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}

// 質問を削除
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      );
    }
    
    const questionId = params.id;
    
    await connectToDatabase();
    
    const question = await Question.findById(questionId);
    
    if (!question) {
      return NextResponse.json(
        { error: "質問が見つかりません" },
        { status: 404 }
      );
    }
    
    // 権限チェック
    if (question.user.toString() !== session.user.id && !session.user.isAdmin) {
      return NextResponse.json(
        { error: "この操作を行う権限がありません" },
        { status: 403 }
      );
    }
    
    // 関連する回答も削除
    await Answer.deleteMany({ question: questionId });
    
    // 質問を削除
    await Question.findByIdAndDelete(questionId);
    
    return NextResponse.json({
      message: "質問と関連する回答が削除されました",
    });
  } catch (error) {
    console.error("質問削除エラー:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
} 