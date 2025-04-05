import { NextResponse } from 'next/server';
import { connectToDatabase } from "@/app/lib/db";
import { GoogleGenerativeAI } from '@google/generative-ai'; // Import Gemini
import mongoose from 'mongoose'; // Import mongoose
import Question from "@/app/models/Question"; // Import Question model
import Answer from "@/app/models/Answer";   // Import Answer model
import User from "@/app/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth.config";
import { headers } from 'next/headers';
// SQS関連のインポートは削除
// import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

// --- 環境変数 ---
const apiKey = process.env.GEMINI_API_KEY || '';
const mongoUri = process.env.MONGODB_URI || ''; // すでに connectToDatabase で使われているかもしれないが、念のため定義

if (!apiKey) {
    console.error("環境変数が不足しています: GEMINI_API_KEY");
    // 起動時にエラーを投げる (APIルートではリクエスト時にチェック)
    // throw new Error("必要な環境変数が設定されていません。");
}

// --- Gemini AI Client Initialization ---
let genAI: GoogleGenerativeAI;
if (apiKey) {
    genAI = new GoogleGenerativeAI(apiKey);
} else {
    console.error('起動時エラー: GEMINI_API_KEY 環境変数が設定されていません。');
    // genAI will be undefined, POST handler should check apiKey again
}

// --- データベース接続状態管理 ---
// connectToDatabase内で管理されているはずなので、ここでは不要
// let isDbConnected = false;
// const connectToDb = async () => { ... }; // connectToDatabase を使う

// --- パーソナリティ定義 (Lambdaから移植) ---
const personalities = [
  { name: '市民ランナー', prompt: 'あなたは一般の市民ランナーです。マラソンやランニングに関する質問を作成してください。', canGenerateQuestions: true, canGenerateAnswers: true },
  { name: '専門家', prompt: 'あなたはランニングの専門家です。科学的な根拠に基づいて、マラソンやランニングに関する質問を作成してください。', canGenerateQuestions: false, canGenerateAnswers: true },
  { name: 'BACKAGINGトレーナー', prompt: 'あなたはBACKAGINGジムのトレーナーです。実践的なアドバイスと、ジムでのトレーニング経験に基づいて質問を作成してください。', canGenerateQuestions: false, canGenerateAnswers: true },
];


// --- Define interface for the lean result ---
// Userモデルの型からisAdminと_idを取得するように変更も検討できる
interface LeanAdminInfo {
  _id: any;
  isAdmin: boolean;
}

// --- 認証チェック関数 (変更なし) ---
const checkAuthorization = async (req: Request) => {
  const headersList = headers();
  const authorization = headersList.get('authorization');
  const CRON_SECRET = process.env.CRON_SECRET;
  if (CRON_SECRET && authorization === `Bearer ${CRON_SECRET}`) {
    console.warn('CRONジョブはこのエンドポイントを呼び出すべきではありません。');
    return { authorized: false, isAdmin: false, userId: null };
  }

  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.email) {
    console.log('セッションが見つかりません');
    return { authorized: false, isAdmin: false, userId: null };
  }

  try {
    // DB接続を試みる (初回リクエスト時など)
    await connectToDatabase();
    const user: LeanAdminInfo | null = await User.findOne({ email: session.user.email }).select('_id isAdmin').lean<LeanAdminInfo>();
    if (!user) {
        console.log('ユーザーが見つかりません:', session.user.email);
        return { authorized: false, isAdmin: false, userId: null };
    }
    if (!user.isAdmin) {
        console.log('管理者権限がありません:', session.user.email);
        return { authorized: false, isAdmin: false, userId: user._id };
    }
    console.log('管理者として認証しました:', session.user.email);
    return { authorized: true, isAdmin: true, userId: user._id };
  } catch(dbError) {
    console.error("ユーザー検索中のDBエラー:", dbError);
    // DB接続失敗などもここでキャッチされる可能性がある
    await connectToDatabase(); // エラー時でもDB接続を試みる
    return { authorized: false, isAdmin: false, userId: null };
  }
};

// --- 質問生成実行関数 (Lambdaから移植・調整) ---
const executeQuestionGeneration = async (parameters: { batchSize?: number }, userId?: string) => {
    const count = parameters.batchSize || 1;
    let rawResponseText = '';
    const logPrefix = `[Job:Question, Cnt:${count}]`; // ログ識別用プレフィックス (MessageIdなし)

    if (!genAI) throw new Error('Gemini AI Clientが初期化されていません。GEMINI_API_KEYを確認してください。');

    try {
        console.log(`${logPrefix} 開始`);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const questionablePersonalities = personalities.filter(p => p.canGenerateQuestions);
        if (questionablePersonalities.length === 0) throw new Error('質問生成可能なパーソナリティなし');
        const personality = questionablePersonalities[Math.floor(Math.random() * questionablePersonalities.length)];
        console.log(`${logPrefix} 選択パーソナリティ: ${personality.name}`);

        const prompt = `${personality.prompt}\n\n以下の条件に合うマラソンやランニングに関する質問を${count}個生成してください：\n- ランナーが実際に困っていて回答が欲しい質問であること\n- 短すぎず、長すぎない、具体的な質問であること\n- 回答が1つに定まらない、様々な観点から回答できる質問であること\n\n出力形式:\n{\n  "questions": [\n    {\n      "title": "質問のタイトル",\n      "content": "質問の詳細な内容。最低でも100文字以上。"\n    },\n    ...\n  ]\n}\n\nJSONフォーマットで出力し、余計な説明は含めないでください。`;

        console.log(`${logPrefix} Geminiコンテンツ生成開始`);
        let apiResponse;
        try {
            apiResponse = await model.generateContent(prompt);
        } catch (apiError: unknown) {
            const msg = apiError instanceof Error ? apiError.message : String(apiError);
            console.error(`${logPrefix} Gemini API generateContent エラー:`, apiError);
            // APIエラーは上位にスローして500エラーにする
            throw new Error(`Gemini API 呼び出し失敗: ${msg}`);
        }
        console.log(`${logPrefix} Geminiコンテンツ生成完了`);

        rawResponseText = apiResponse.response.text();

        // JSONの抽出と解析
        const jsonMatch = rawResponseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error(`${logPrefix} JSONフォーマットが見つかりませんでした。応答テキスト:`, rawResponseText);
            throw new Error('AI応答にJSONフォーマットなし');
        }

        let questionsData;
        try {
            questionsData = JSON.parse(jsonMatch[0]);
        } catch (parseError) {
             console.error(`${logPrefix} 生成JSON解析エラー。応答テキスト:`, rawResponseText);
             throw new Error('AI生成JSON解析エラー');
        }

        if (!questionsData.questions || !Array.isArray(questionsData.questions)) {
            console.error(`${logPrefix} 生成JSON形式不正。応答テキスト:`, rawResponseText);
            throw new Error('AI生成JSON形式不正');
        }

        // DB接続を確認（connectToDatabaseが呼ばれている前提だが念のため）
        await connectToDatabase();

        // DBに保存
        const savedQuestionIds: string[] = [];
        for (const q of questionsData.questions) {
             if (!q.title || !q.content) {
                console.warn(`${logPrefix} 不正な質問データをスキップ:`, q);
                continue; // タイトルや内容がないものはスキップ
            }
            const newQuestion = new Question({
                title: q.title,
                content: q.content,
                // userIdはObjectIdである必要があるため変換
                author: userId ? new mongoose.Types.ObjectId(userId) : null,
                isAIGenerated: true,
                aiPersonality: personality.name,
            });
            await newQuestion.save();
            savedQuestionIds.push(newQuestion._id.toString());
            console.log(`${logPrefix} 質問保存完了: ${newQuestion._id}`);
        }

        if (savedQuestionIds.length === 0) {
             throw new Error('有効な質問が生成されませんでした。');
        }

        return { generatedQuestionIds: savedQuestionIds };

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`${logPrefix} エラー:`, error);
        if (rawResponseText) console.error(`${logPrefix} エラー時の応答(一部): ${rawResponseText.substring(0, 200)}...`);
        // エラーをハンドラーに伝播させる
        throw new Error(`質問生成失敗: ${errorMessage}`); // 上位でキャッチして500エラーにする
    }
};

// --- 回答生成実行関数 (Lambdaから移植・調整) ---
const executeAnswerGeneration = async (parameters: { questionId?: string }, userId?: string) => {
    const questionId = parameters.questionId;
    if (!questionId) throw new Error('回答生成ジョブに questionId がありません');

    let rawResponseText = '';
    const logPrefix = `[Job:Answer, QID:${questionId}]`;

    if (!genAI) throw new Error('Gemini AI Clientが初期化されていません。GEMINI_API_KEYを確認してください。');

    try {
        console.log(`${logPrefix} 開始`);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        // DB接続を確認
        await connectToDatabase();

        const question = await Question.findById(questionId);
        if (!question) throw new Error(`質問が見つかりません: ${questionId}`);

        const answerablePersonalities = personalities.filter(p => p.canGenerateAnswers);
        if (answerablePersonalities.length === 0) throw new Error('回答生成可能なパーソナリティなし');
        const personality = answerablePersonalities[Math.floor(Math.random() * answerablePersonalities.length)];
        console.log(`${logPrefix} 選択パーソナリティ: ${personality.name}`);

        const prompt = `${personality.prompt}\n以下の質問に対して、専門的な視点から回答を生成してください：\n\n質問タイトル：${question.title}\n質問内容：${question.content}\n\n回答は具体的で実用的な内容にしてください。`;

        console.log(`${logPrefix} Geminiコンテンツ生成開始`);
        let apiResponse;
         try {
            apiResponse = await model.generateContent(prompt);
        } catch (apiError: unknown) {
            const msg = apiError instanceof Error ? apiError.message : String(apiError);
            console.error(`${logPrefix} Gemini API generateContent エラー:`, apiError);
            throw new Error(`Gemini API 呼び出し失敗: ${msg}`);
        }
        console.log(`${logPrefix} Geminiコンテンツ生成完了`);

        rawResponseText = apiResponse.response.text();

        // DB接続を確認 (再度)
        await connectToDatabase();

        // 回答をDBに保存
        const newAnswer = new Answer({
            content: rawResponseText.trim(),
            question: new mongoose.Types.ObjectId(questionId),
             // userIdはObjectIdである必要があるため変換
            user: userId ? new mongoose.Types.ObjectId(userId) : null,
            isAIGenerated: true,
            aiPersonality: personality.name,
        });
        await newAnswer.save();
        console.log(`${logPrefix} 回答保存完了: ${newAnswer._id}`);
        return { generatedAnswerId: newAnswer._id.toString() };

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`${logPrefix} エラー:`, error);
      if (rawResponseText) console.error(`${logPrefix} エラー時の応答(一部): ${rawResponseText.substring(0, 200)}...`);
      // エラーをハンドラーに伝播させる
      throw new Error(`回答生成失敗: ${errorMessage}`);
    }
};


// --- POST Handler (直接生成を実行) ---
export async function POST(request: Request) {
  try {
    // 0. 環境変数チェック
    if (!apiKey || !genAI) {
      console.error('サーバー設定エラー: GEMINI_API_KEYが設定されていないか、AIクライアント初期化失敗');
      return NextResponse.json({ error: 'サーバー設定エラー (AI設定)' }, { status: 500 });
    }

    // 1. 認証チェック
    const authResult = await checkAuthorization(request);
    if (!authResult.authorized || !authResult.isAdmin) {
      return NextResponse.json(
        { error: "この操作には管理者権限が必要です" },
        { status: 403 }
      );
    }

    // 2. リクエストボディの解析
    let requestBody;
    try {
        requestBody = await request.json();
    } catch (e) {
        return NextResponse.json({ error: 'リクエストボディのJSON形式が正しくありません' }, { status: 400 });
    }
    const { type = 'question', batchSize = 1, questionId } = requestBody;
    const userId = authResult.userId?.toString(); // ObjectIdを文字列に変換

    console.log(`AI直接生成リクエスト受付: タイプ=${type}, バッチ=${batchSize}, QID=${questionId || 'N/A'}`);

    // 3. パラメータ検証
     if (type !== 'question' && type !== 'answer') {
       return NextResponse.json({ error: '無効な生成タイプです' }, { status: 400 });
     }
     if (type === 'answer' && !questionId) {
         return NextResponse.json({ error: '回答生成ジョブには questionId が必要です' }, { status: 400 });
     }
     if (type === 'question' && (typeof batchSize !== 'number' || batchSize < 1 || batchSize > 10)) { // 上限は要検討
         return NextResponse.json({ error: 'バッチサイズは1から10の間で指定してください' }, { status: 400 });
     }

    // 4. DB接続 (すでに行われているかもしれないが、念のため)
    await connectToDatabase();

    // 5. AI生成とDB保存を実行
    let result;
    if (type === 'question') {
        result = await executeQuestionGeneration({ batchSize }, userId);
    } else if (type === 'answer') {
        result = await executeAnswerGeneration({ questionId }, userId);
    } else {
         // この分岐は理論上到達しないはず
         return NextResponse.json({ error: '内部サーバーエラー: 不明なジョブタイプ' }, { status: 500 });
    }

    // 6. 成功レスポンス
    console.log(`AI直接生成 成功: タイプ=${type}`, result);
    return NextResponse.json(
        {
            message: `${type === 'question' ? '質問' : '回答'}の生成が完了しました。`,
            ...result // { generatedQuestionIds: [...] } または { generatedAnswerId: "..." }
        },
        { status: 200 } // OK
    );

  } catch (error: unknown) {
    // 7. エラーハンドリング
    console.error('/api/ai POST エラー (直接生成):', error);
    const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました';
    let status = 500; // デフォルトはInternal Server Error

    // エラーメッセージの内容に応じてステータスコードを調整することも可能
    if (errorMessage.includes('管理者権限')) status = 403;
    else if (errorMessage.includes('認証')) status = 401; // 通常はcheckAuthorizationで処理されるはず
    else if (errorMessage.includes('JSON形式')) status = 400;
    else if (errorMessage.includes('questionId が必要')) status = 400;
    else if (errorMessage.includes('バッチサイズ')) status = 400;
    else if (errorMessage.includes('質問が見つかりません')) status = 404; // Not Found

    // 特にGemini API関連のエラーやDBエラーは500のまま
    return NextResponse.json({ error: `AI生成エラー: ${errorMessage}` }, { status });
  }
} 