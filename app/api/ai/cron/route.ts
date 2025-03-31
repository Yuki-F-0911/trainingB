import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Question } from '@/models/Question';
import { generateQuestions } from '@/lib/ai';

export async function GET() {
  try {
    // データベースに接続
    await connectToDatabase();

    // 既存の質問数を確認
    const existingQuestionsCount = await Question.countDocuments();

    // 既存の質問が少ない場合のみ新しい質問を生成
    if (existingQuestionsCount < 10) {
      const questions = await generateQuestions();
      
      // 質問をデータベースに保存
      await Question.insertMany(questions);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Cron job executed successfully',
      existingQuestionsCount
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to execute cron job' },
      { status: 500 }
    );
  }
} 