import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/prisma';

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

export async function POST(request: Request) {
  try {
    const { secret } = await request.json();
    
    // Webhookのシークレットキーを検証
    if (secret !== process.env.WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: '無効なシークレットキーです' },
        { status: 401 }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const personality = personalities[Math.floor(Math.random() * personalities.length)];

    // 質問を生成
    const questionPrompt = `${personality.prompt}
以下のような質問を生成してください：
- マラソンやランニングに関する質問
- 具体的で実践的な内容
- 一般のランナーが抱える疑問や悩み
- タイトルと本文を分けて出力

出力形式：
タイトル：[タイトル]
本文：[本文]`;

    const questionResponse = await model.generateContent(questionPrompt);
    const questionResult = await questionResponse.response;
    const questionText = questionResult.text();

    const titleMatch = questionText.match(/タイトル：(.+)/);
    const contentMatch = questionText.match(/本文：(.+)/s);
    
    if (!titleMatch || !contentMatch) {
      throw new Error('AIの応答形式が不正です');
    }

    // 質問をデータベースに保存
    const question = await prisma.question.create({
      data: {
        title: titleMatch[1].trim(),
        content: contentMatch[1].trim(),
        isAIGenerated: true,
        personality: personality.name,
        userId: 'system', // システム生成の質問
      },
    });

    // 回答を生成
    const answerPrompt = `${personality.prompt}
以下の質問に対して、専門的な視点から回答を生成してください：

質問タイトル：${question.title}
質問内容：${question.content}

回答は具体的で実用的な内容にしてください。`;

    const answerResponse = await model.generateContent(answerPrompt);
    const answerResult = await answerResponse.response;
    const answerText = answerResult.text();

    // 回答をデータベースに保存
    await prisma.answer.create({
      data: {
        content: answerText.trim(),
        isAIGenerated: true,
        personality: personality.name,
        questionId: question.id,
        userId: 'system', // システム生成の回答
      },
    });

    return NextResponse.json({ 
      message: 'AIの質問と回答の生成が完了しました',
      questionId: question.id 
    });
  } catch (error: any) {
    console.error('Webhookエラー:', error);
    return NextResponse.json(
      { error: error.message || 'エラーが発生しました' },
      { status: 500 }
    );
  }
} 