import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/db';
import Question from '@/app/models/Question';
import Answer from '@/app/models/Answer';
import User from '@/app/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { headers } from 'next/headers';

// APIキーの設定を確認
const apiKey = process.env.GEMINI_API_KEY || '';
console.log('Gemini API Key設定状況:', apiKey ? '設定されています' : '未設定です');

// CRONシークレットキー
const CRON_SECRET = process.env.CRON_SECRET;

// Gemini APIクライアントの初期化
const genAI = new GoogleGenerativeAI(apiKey);

// パーソナリティ定義
const personalities = [
  {
    name: '市民ランナー',
    prompt: 'あなたは一般の市民ランナーです。マラソンやランニングに関する質問に、一般ランナーの視点から回答してください。',
  },
  {
    name: '専門家',
    prompt: 'あなたはランニングの専門家です。科学的な根拠に基づいて、マラソンやランニングに関する質問に回答してください。',
  },
  {
    name: 'BACKAGINGトレーナー',
    prompt: 'あなたはBACKAGINGジムのトレーナーです。実践的なアドバイスと、ジムでのトレーニング経験に基づいて回答してください。',
  },
];

// 回答生成関数
const generateAnswer = async (questionId: string, personality: typeof personalities[0]) => {
  try {
    console.log('generateAnswer開始: モデル初期化');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    // 質問の詳細を取得
    const question = await Question.findById(questionId).lean() as any;
    if (!question) {
      throw new Error(`質問が見つかりません: ${questionId}`);
    }
    
    console.log(`質問データ取得完了: ${questionId}, タイトル: ${question.title}`);
    
    const prompt = `${personality.prompt}
以下の質問に対して、専門的な視点から回答を生成してください：

質問タイトル：${question.title}
質問内容：${question.content}

回答は具体的で実用的な内容にしてください。`;

    console.log('generateAnswer: コンテンツ生成開始');
    const response = await model.generateContent(prompt);
    console.log('generateAnswer: コンテンツ生成完了');
    
    const result = response.response;
    const text = result.text();

    return {
      content: text.trim(),
      isAIGenerated: true,
      personality: personality.name,
      questionId,
    };
  } catch (error: any) {
    console.error('回答生成エラー詳細:', error);
    throw new Error(`回答生成中にエラーが発生しました: ${error.message}`);
  }
};

// 認証チェック関数
const checkAuthorization = async (req: Request) => {
  // CRONジョブからの呼び出しの場合
  const headersList = headers();
  const authorization = headersList.get('authorization');

  if (CRON_SECRET && authorization === `Bearer ${CRON_SECRET}`) {
    console.log('CRONジョブからの呼び出しを認証しました');
    return true;
  }

  // 通常のユーザー認証
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return false;
  }

  // 管理者チェック（必要に応じて）
  const user = await User.findOne({ email: session.user.email });
  return user && user.isAdmin;
};

// AI回答を自動生成するエンドポイント
export async function POST(request: Request) {
  try {
    // 認証チェック
    const isAuthorized = await checkAuthorization(request);
    if (!isAuthorized) {
      return NextResponse.json(
        { error: "この操作には管理者権限が必要です" },
        { status: 401 }
      );
    }
    
    // データベースに接続
    await connectToDatabase();
    
    // リクエストボディから質問IDまたは条件を取得
    const { questionId, limit = 1 } = await request.json();
    
    // 回答を生成する質問を決定
    let targetQuestions = [];
    if (questionId) {
      // 特定の質問を指定した場合
      const question = await Question.findById(questionId);
      if (!question) {
        return NextResponse.json(
          { error: "指定された質問が見つかりません" },
          { status: 404 }
        );
      }
      targetQuestions = [question];
    } else {
      // 回答がまだない質問を最大limit件数取得
      // 1. 既に回答がある質問のIDを取得
      const answeredQuestionIds = await Answer.distinct('question');
      
      // 2. 回答がない質問を検索
      targetQuestions = await Question.find({
        _id: { $nin: answeredQuestionIds }
      })
      .sort({ createdAt: -1 })
      .limit(limit);
      
      if (targetQuestions.length === 0) {
        return NextResponse.json(
          { message: "回答が必要な質問が見つかりませんでした" },
          { status: 200 }
        );
      }
    }
    
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
    
    // 生成結果を格納する配列
    const results = [];
    
    // 各質問に対してAI回答を生成
    for (const question of targetQuestions) {
      // ランダムなパーソナリティを選択
      const personality = personalities[Math.floor(Math.random() * personalities.length)];
      console.log(`質問「${question.title}」に対して「${personality.name}」から回答を生成します`);
      
      try {
        // 回答を生成
        const answerData = await generateAnswer(question._id.toString(), personality);
        
        // 回答をデータベースに保存
        const answer = await Answer.create({
          content: answerData.content,
          user: aiUser._id,
          question: question._id,
          isAIGenerated: true,
        });
        
        results.push({
          questionId: question._id,
          questionTitle: question.title,
          answerId: answer._id,
          personality: personality.name,
          success: true
        });
      } catch (error: any) {
        console.error(`質問ID ${question._id} への回答生成中にエラー:`, error);
        results.push({
          questionId: question._id,
          questionTitle: question.title,
          error: error.message,
          success: false
        });
      }
    }
    
    return NextResponse.json({
      message: `${results.filter(r => r.success).length}件の回答が生成されました`,
      results
    });
    
  } catch (error: any) {
    console.error('自動回答生成エラー:', error);
    return NextResponse.json(
      { error: error.message || 'AIの自動回答生成中にエラーが発生しました' },
      { status: 500 }
    );
  }
}

// Vercelの定期実行を確実にするためのディレクティブ
export const dynamic = 'force-dynamic'; 