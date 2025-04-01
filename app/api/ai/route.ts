import { NextResponse } from 'next/server';
import { connectToDatabase } from "@/app/lib/db";
import { GoogleGenerativeAI } from '@google/generative-ai';
import Question from "@/app/models/Question";
import User from "@/app/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth.config";
import { headers } from 'next/headers';
import getConfig from 'next/config';

const { serverRuntimeConfig } = getConfig();

// APIキーの設定を確認
const apiKey = serverRuntimeConfig.GEMINI_API_KEY || '';
console.log('Gemini API Key設定状況:', apiKey ? '設定されています' : '未設定です');

// CRONシークレットキー
const CRON_SECRET = serverRuntimeConfig.CRON_SECRET;

// Gemini APIクライアントの初期化
const genAI = new GoogleGenerativeAI(apiKey);

// パーソナリティ定義
const personalities = [
  {
    name: '市民ランナー',
    prompt: 'あなたは一般の市民ランナーです。マラソンやランニングに関する質問を作成してください。',
    canGenerateQuestions: true,
    canGenerateAnswers: true,
  },
  {
    name: '専門家',
    prompt: 'あなたはランニングの専門家です。科学的な根拠に基づいて、マラソンやランニングに関する質問を作成してください。',
    canGenerateQuestions: false,
    canGenerateAnswers: true,
  },
  {
    name: 'BACKAGINGトレーナー',
    prompt: 'あなたはBACKAGINGジムのトレーナーです。実践的なアドバイスと、ジムでのトレーニング経験に基づいて質問を作成してください。',
    canGenerateQuestions: false,
    canGenerateAnswers: true,
  },
];

// 質問生成関数
const generateQuestion = async (count = 1) => {
  try {
    console.log('generateQuestion開始');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    // 質問生成が可能なパーソナリティだけをフィルタリング
    const questionablePersonalities = personalities.filter(p => p.canGenerateQuestions);
    if (questionablePersonalities.length === 0) {
      throw new Error('質問を生成できるパーソナリティが定義されていません');
    }
    
    // ランダムなパーソナリティを選択
    const personality = questionablePersonalities[
      Math.floor(Math.random() * questionablePersonalities.length)
    ];
    
    console.log(`選択されたパーソナリティ: ${personality.name}`);
    
    const prompt = `${personality.prompt}

以下の条件に合うマラソンやランニングに関する質問を${count}個生成してください：
- ランナーが実際に困っていて回答が欲しい質問であること
- 短すぎず、長すぎない、具体的な質問であること
- 回答が1つに定まらない、様々な観点から回答できる質問であること

出力形式:
{
  "questions": [
    {
      "title": "質問のタイトル",
      "content": "質問の詳細な内容。最低でも100文字以上。"
    },
    ...
  ]
}

JSONフォーマットで出力し、余計な説明は含めないでください。`;

    console.log('generateQuestion: コンテンツ生成開始');
    const response = await model.generateContent(prompt);
    console.log('generateQuestion: コンテンツ生成完了');
    
    const result = response.response;
    const text = result.text();

    try {
      // JSONの抽出と解析
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('JSONフォーマットが見つかりませんでした');
      }
      
      const questions = JSON.parse(jsonMatch[0]);
      
      if (!questions.questions || !Array.isArray(questions.questions)) {
        throw new Error('生成された質問が正しいフォーマットではありません');
      }
      
      // パーソナリティ情報を追加
      const questionsWithPersonality = questions.questions.map((q: { title: string; content: string }) => ({
        ...q,
        isAIGenerated: true,
        personality: personality.name,
      }));
      
      return questionsWithPersonality;
    } catch (parseError: unknown) {
      console.error('生成されたテキストからJSONを解析できませんでした:', text);
      const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
      throw new Error(`JSONの解析に失敗しました: ${errorMessage}`);
    }
  } catch (error) {
    console.error('質問生成エラー:', error);
    throw error;
  }
};

// 回答生成関数
const generateAnswer = async (questionId: string) => {
  try {
    console.log('generateAnswer開始');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    // 質問の詳細を取得
    const question = await Question.findById(questionId);
    if (!question) {
      throw new Error(`質問が見つかりません: ${questionId}`);
    }
    
    // 回答生成が可能なパーソナリティだけをフィルタリング
    const answerablePersonalities = personalities.filter(p => p.canGenerateAnswers);
    if (answerablePersonalities.length === 0) {
      throw new Error('回答を生成できるパーソナリティが定義されていません');
    }
    
    // ランダムなパーソナリティを選択
    const personality = answerablePersonalities[
      Math.floor(Math.random() * answerablePersonalities.length)
    ];
    
    console.log(`選択されたパーソナリティ: ${personality.name}`);
    
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
  } catch (error) {
    console.error('回答生成エラー:', error);
    throw error;
  }
};

// データベースに質問を保存する関数
const saveToDatabase = async (data: any, type = 'question') => {
  try {
    const baseUrl = serverRuntimeConfig.NEXTAUTH_URL || 'http://localhost:3000';
    const endpoint = `${baseUrl}/api/ai/saveToDatabase`;
    console.log('データベース保存エンドポイント:', endpoint);
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data,
        type,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'データベースへの保存に失敗しました');
    }

    return await response.json();
  } catch (error) {
    console.error('データベース保存エラー:', error);
    throw error;
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

    // リクエストから生成タイプを取得
    const { type = 'question', count = 1, questionId } = await request.json();

    console.log(`AI生成リクエスト: タイプ=${type}, カウント=${count}, 質問ID=${questionId || 'なし'}`);

    if (type === 'question') {
      // 質問を生成して保存
      const questions = await generateQuestion(count);
      
      // 各質問を順次データベースに保存
      const results = [];
      for (const question of questions) {
        try {
          const savedData = await saveToDatabase(question, 'question');
          results.push({
            ...savedData,
            success: true,
            personality: question.personality,
          });
        } catch (error: any) {
          results.push({
            error: error.message,
            success: false,
          });
        }
      }
      
      const successCount = results.filter(r => r.success).length;

      return NextResponse.json({
        message: `${successCount}件の質問が生成されました`,
        results,
      });
    } else if (type === 'answer') {
      // 質問IDの検証
      if (!questionId) {
        return NextResponse.json(
          { error: "回答生成には質問IDが必要です" },
          { status: 400 }
        );
      }

      // 回答を生成して保存
      const answer = await generateAnswer(questionId);
      const savedData = await saveToDatabase(answer, 'answer');

      return NextResponse.json({
        message: "回答が生成されました",
        answer: savedData,
      });
    } else {
      return NextResponse.json(
        { error: "不明な生成タイプです" },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('AI生成エラー:', error);
    return NextResponse.json(
      { error: error.message || 'AIの生成中にエラーが発生しました' },
      { status: 500 }
    );
  }
} 