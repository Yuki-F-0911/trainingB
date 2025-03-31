import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// APIキーの設定を確認
const apiKey = process.env.GEMINI_API_KEY || '';
console.log('Gemini API Key設定状況:', apiKey ? '設定されています' : '未設定です');

// Gemini APIクライアントの初期化
const genAI = new GoogleGenerativeAI(apiKey);

// パーソナリティ定義
const personalities = [
  {
    name: '市民ランナー',
    prompt: 'あなたは一般の市民ランナーです。マラソンやランニングに関する質問に、一般ランナーの視点から回答してください。',
    canGenerateQuestions: true, // 質問生成可能
    canGenerateAnswers: true,   // 回答生成可能
  },
  {
    name: '専門家',
    prompt: 'あなたはランニングの専門家です。科学的な根拠に基づいて、マラソンやランニングに関する質問に回答してください。',
    canGenerateQuestions: false, // 質問生成不可
    canGenerateAnswers: true,    // 回答生成可能
  },
  {
    name: 'BACKAGINGトレーナー',
    prompt: 'あなたはBACKAGINGジムのトレーナーです。実践的なアドバイスと、ジムでのトレーニング経験に基づいて回答してください。',
    canGenerateQuestions: false, // 質問生成不可
    canGenerateAnswers: true,    // 回答生成可能
  },
];

// 質問生成関数
const generateQuestion = async (personality: typeof personalities[0]) => {
  try {
    console.log('generateQuestion開始: モデル初期化');
    // 最新のGemini 2.0モデルを使用
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    const prompt = `${personality.prompt}
以下のような質問を生成してください：
- マラソンやランニングに関する質問
- 具体的で実践的な内容
- 一般のランナーが抱える疑問や悩み
- タイトルと本文を分けて出力

出力形式：
タイトル：[タイトル]
本文：[本文]`;

    console.log('generateQuestion: コンテンツ生成開始');
    // 直接テキストプロンプトを渡す
    const response = await model.generateContent(prompt);
    console.log('generateQuestion: コンテンツ生成完了');
    
    const result = response.response;
    const text = result.text();

    console.log('generateQuestion: レスポンステキスト解析');
    const titleMatch = text.match(/タイトル：(.+)/);
    const contentMatch = text.match(/本文：(.+)/s);
    
    if (!titleMatch || !contentMatch) {
      console.error('AIの応答形式不正:', text);
      throw new Error('AIの応答形式が不正です');
    }

    return {
      title: titleMatch[1].trim(),
      content: contentMatch[1].trim(),
      isAIGenerated: true,
      personality: personality.name,
    };
  } catch (error: any) {
    console.error('質問生成エラー詳細:', error);
    throw new Error(`質問生成中にエラーが発生しました: ${error.message}`);
  }
};

// 回答生成関数
const generateAnswer = async (questionId: string, personality: typeof personalities[0]) => {
  try {
    console.log('generateAnswer開始: モデル初期化');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    const questionResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/questions/${questionId}`);
    if (!questionResponse.ok) {
      throw new Error(`質問データの取得に失敗しました: ${questionResponse.status}`);
    }
    
    const questionData = await questionResponse.json();
    console.log('質問データ取得完了:', questionId);
    
    const prompt = `${personality.prompt}
以下の質問に対して、専門的な視点から回答を生成してください：

質問タイトル：${questionData.question.title}
質問内容：${questionData.question.content}

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
    };
  } catch (error: any) {
    console.error('回答生成エラー詳細:', error);
    throw new Error(`回答生成中にエラーが発生しました: ${error.message}`);
  }
};

// パーソナリティに基づいて質問または回答を生成
export async function POST(request: Request) {
  try {
    const { type, questionId, batchSize } = await request.json();
    
    if (!type) {
      return NextResponse.json(
        { error: 'タイプを指定してください' },
        { status: 400 }
      );
    }

    if (type === 'question') {
      // 質問生成の場合は市民ランナーのパーソナリティのみを使用
      const questionGenerators = personalities.filter(p => p.canGenerateQuestions);
      if (questionGenerators.length === 0) {
        return NextResponse.json(
          { error: '質問を生成できるパーソナリティが設定されていません' },
          { status: 500 }
        );
      }
      
      // 質問生成可能なパーソナリティからランダムに選択（現在は市民ランナーのみ）
      const personality = questionGenerators[Math.floor(Math.random() * questionGenerators.length)];
      console.log(`選択されたパーソナリティ: ${personality.name}`);

      if (batchSize && batchSize > 1) {
        // バッチ処理：複数の質問を並列で生成
        const questions = await Promise.all(
          Array(batchSize).fill(null).map(() => generateQuestion(personality))
        );
        return NextResponse.json(questions);
      } else {
        // 単一の質問生成
        const question = await generateQuestion(personality);
        return NextResponse.json(question);
      }
    } else if (type === 'answer' && questionId) {
      // 回答生成の場合は全てのパーソナリティから選択
      const answerGenerators = personalities.filter(p => p.canGenerateAnswers);
      const personality = answerGenerators[Math.floor(Math.random() * answerGenerators.length)];
      console.log(`回答生成: ${personality.name}`);
      
      // 回答生成
      const answer = await generateAnswer(questionId, personality);
      return NextResponse.json(answer);
    } else if (type === 'questionAndAnswer' && questionId) {
      // 質問と回答を並列で生成
      const questionGenerators = personalities.filter(p => p.canGenerateQuestions);
      const answerGenerators = personalities.filter(p => p.canGenerateAnswers);
      
      const questionPersonality = questionGenerators[Math.floor(Math.random() * questionGenerators.length)];
      const answerPersonality = answerGenerators[Math.floor(Math.random() * answerGenerators.length)];
      
      const [question, answer] = await Promise.all([
        generateQuestion(questionPersonality),
        generateAnswer(questionId, answerPersonality)
      ]);
      return NextResponse.json({ question, answer });
    }

  } catch (error: any) {
    console.error('AI生成エラー:', error);
    return NextResponse.json(
      { error: error.message || 'AIの応答生成中にエラーが発生しました' },
      { status: 500 }
    );
  }
} 