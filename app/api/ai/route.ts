import { NextResponse } from 'next/server';
import { connectToDatabase } from "@/app/lib/db";
import { GoogleGenerativeAI } from '@google/generative-ai';
import Question from "@/app/models/Question";
import User from "@/app/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth.config";
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
  let rawResponseText = ''; // Geminiからの生の応答を保持する変数
  try {
    console.log('generateQuestion開始');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }); // モデル名を最新に更新
    
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
    
    const prompt = `${personality.prompt}\n\n以下の条件に合うマラソンやランニングに関する質問を${count}個生成してください：\n- ランナーが実際に困っていて回答が欲しい質問であること\n- 短すぎず、長すぎない、具体的な質問であること\n- 回答が1つに定まらない、様々な観点から回答できる質問であること\n\n出力形式:\n{\n  "questions": [\n    {\n      "title": "質問のタイトル",\n      "content": "質問の詳細な内容。最低でも100文字以上。"\n    },\n    ...\n  ]\n}\n\nJSONフォーマットで出力し、余計な説明は含めないでください。`;

    console.log('generateQuestion: コンテンツ生成開始');
    // ***** Gemini API 呼び出しを try...catch で囲む *****
    let response;
    try {
        response = await model.generateContent(prompt);
    } catch (apiError: unknown) {
        console.error('Gemini API generateContent エラー:', apiError);
        // API呼び出し自体のエラーを処理
        const errorMessage = apiError instanceof Error ? apiError.message : String(apiError);
        throw new Error(`Gemini API 呼び出しに失敗しました: ${errorMessage}`);
    }
    console.log('generateQuestion: コンテンツ生成完了');

    const result = response.response;
    rawResponseText = result.text(); // 生の応答を取得

    try {
      // JSONの抽出と解析
      const jsonMatch = rawResponseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('JSONフォーマットが見つかりませんでした。応答テキスト:', rawResponseText); // 生のテキストをログに出力
        throw new Error('AIからの応答にJSONフォーマットが見つかりませんでした');
      }

      const questionsData = JSON.parse(jsonMatch[0]);

      if (!questionsData.questions || !Array.isArray(questionsData.questions)) {
        console.error('生成されたJSONの形式が不正です。応答テキスト:', rawResponseText); // 生のテキストをログに出力
        throw new Error('AIによって生成された質問が正しいフォーマットではありません');
      }

      // パーソナリティ情報を追加
      const questionsWithPersonality = questionsData.questions.map((q: { title: string; content: string }) => ({
        ...q,
        isAIGenerated: true,
        personality: personality.name,
      }));

      return questionsWithPersonality;

    } catch (parseError: unknown) {
      console.error('生成されたテキストからJSONを解析できませんでした。応答テキスト:', rawResponseText); // 生のテキストをログに出力
      const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
      throw new Error(`AIからの応答のJSON解析に失敗しました: ${errorMessage}`);
    }
  } catch (error) { // このcatchは generateQuestion 全体のエラーを捕捉
    console.error('質問生成プロセス全体のエラー:', error);
    // エラーを再スローして上位のハンドラ（POST関数内）に処理させる
    throw error;
  }
};

// 回答生成関数
const generateAnswer = async (questionId: string) => {
  try {
    console.log('generateAnswer開始');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }); // モデル名を更新
    
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
    
    const prompt = `${personality.prompt}\n以下の質問に対して、専門的な視点から回答を生成してください：\n\n質問タイトル：${question.title}\n質問内容：${question.content}\n\n回答は具体的で実用的な内容にしてください。`;

    console.log('generateAnswer: コンテンツ生成開始');
    let response;
    try {
      response = await model.generateContent(prompt);
    } catch (apiError: unknown) {
      console.error('Gemini API generateContent エラー (Answer):', apiError);
      const errorMessage = apiError instanceof Error ? apiError.message : String(apiError);
      throw new Error(`Gemini API 呼び出しに失敗しました (Answer): ${errorMessage}`);
    }

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
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
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
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { error: 'Failed to parse error response' };
      }
      console.error('DB Save API Error Response:', errorData);
      throw new Error(errorData.error || 'データベースへの保存に失敗しました');
    }

    return await response.json();
  } catch (error) {
    console.error('データベース保存プロセスエラー:', error);
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
    console.log('セッションが見つかりません');
    return false;
  }

  // 管理者チェック
  try {
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
        console.log('ユーザーが見つかりません:', session.user.email);
        return false;
    }
    if (!user.isAdmin) {
        console.log('管理者権限がありません:', session.user.email);
        return false;
    }
    console.log('管理者として認証しました:', session.user.email);
    return true;
  } catch(dbError) {
    console.error("ユーザー検索中のDBエラー:", dbError);
    return false;
  }
};

export async function POST(request: Request) {
  try {
    // 認証チェック
    const isAuthorized = await checkAuthorization(request);
    if (!isAuthorized) {
      return NextResponse.json(
        { error: "この操作には管理者権限が必要です" },
        { status: 403 } // 401 Unauthorized から 403 Forbidden に変更
      );
    }

    // データベースに接続
    await connectToDatabase();

    // リクエストから生成タイプを取得
    const { type = 'question', count = 1, questionId } = await request.json();

    console.log(`AI生成リクエスト: タイプ=${type}, カウント=${count}, 質問ID=${questionId || 'なし'}`);

    if (type === 'question') {
      // 質問を生成
      const questions = await generateQuestion(count);
      // 生成された質問をそのまま返す (保存は別途 saveToDatabase エンドポイントで行う)
      return NextResponse.json(questions);

    } else if (type === 'answer') {
      if (!questionId) {
        return NextResponse.json({ error: '回答を生成するには questionId が必要です' }, { status: 400 });
      }
      // 回答を生成
      const answer = await generateAnswer(questionId);
       // 生成された回答を返す (保存は別途)
      return NextResponse.json(answer);
    } else {
      return NextResponse.json({ error: '無効な生成タイプです' }, { status: 400 });
    }

  } catch (error: unknown) {
    console.error('/api/ai POST エラー:', error);
    const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました';
    let status = 500;

    // エラーメッセージに基づいてステータスコードを判断する（例）
    if (errorMessage.includes('タイムアウト') || errorMessage.toLowerCase().includes('timeout')) {
        status = 504; // Gateway Timeout
    } else if (errorMessage.includes('管理者権限')) {
        status = 403; // Forbidden
    } else if (errorMessage.includes('認証')) {
        status = 401; // Unauthorized
    } else if (errorMessage.includes('JSON解析') || errorMessage.includes('正しいフォーマットではありません')) {
        status = 500; // Internal Server Error (AIからの応答がおかしい)
    } else if (errorMessage.includes('Gemini API')) {
        status = 502; // Bad Gateway (外部APIエラー)
    } else if (errorMessage.includes('質問が見つかりません') || errorMessage.includes('not found')) {
        status = 404; // Not Found
    }

    // フロントエンドにエラー詳細を返す
    return NextResponse.json({ error: errorMessage }, { status });
  }
} 