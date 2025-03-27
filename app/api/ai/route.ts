import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

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

// 質問生成関数
const generateQuestion = async (personality: typeof personalities[0]) => {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  const prompt = `${personality.prompt}
以下のような質問を生成してください：
- マラソンやランニングに関する質問
- 具体的で実践的な内容
- 一般のランナーが抱える疑問や悩み
- タイトルと本文を分けて出力

出力形式：
タイトル：[タイトル]
本文：[本文]`;

  const response = await model.generateContent(prompt);
  const result = await response.response;
  const text = result.text();

  const titleMatch = text.match(/タイトル：(.+)/);
  const contentMatch = text.match(/本文：(.+)/s);
  
  if (!titleMatch || !contentMatch) {
    throw new Error('AIの応答形式が不正です');
  }

  return {
    title: titleMatch[1].trim(),
    content: contentMatch[1].trim(),
    isAIGenerated: true,
    personality: personality.name,
  };
};

// 回答生成関数
const generateAnswer = async (questionId: string, personality: typeof personalities[0]) => {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  const questionResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/questions/${questionId}`);
  const questionData = await questionResponse.json();
  
  const prompt = `${personality.prompt}
以下の質問に対して、専門的な視点から回答を生成してください：

質問タイトル：${questionData.question.title}
質問内容：${questionData.question.content}

回答は具体的で実用的な内容にしてください。`;

  const response = await model.generateContent(prompt);
  const result = await response.response;
  const text = result.text();

  return {
    content: text.trim(),
    isAIGenerated: true,
    personality: personality.name,
  };
};

export async function POST(request: Request) {
  try {
    const { type, questionId, batchSize } = await request.json();
    
    if (!type) {
      return NextResponse.json(
        { error: 'タイプを指定してください' },
        { status: 400 }
      );
    }

    const personality = personalities[Math.floor(Math.random() * personalities.length)];

    if (type === 'question') {
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
      // 回答生成
      const answer = await generateAnswer(questionId, personality);
      return NextResponse.json(answer);
    } else if (type === 'questionAndAnswer' && questionId) {
      // 質問と回答を並列で生成
      const [question, answer] = await Promise.all([
        generateQuestion(personality),
        generateAnswer(questionId, personality)
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