import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import QuestionModel from '@/models/Question';
import { Types } from 'mongoose';
import { IQuestion } from '@/models/Question';

// シリアライズされた質問データの型を定義
type SerializedQuestion = Omit<IQuestion, '_id' | 'author' | 'bestAnswer' | 'createdAt' | 'updatedAt'> & {
  _id: string;
  author: {
    _id: string;
    name?: string;
    email: string;
  } | null;
  bestAnswer: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function getQuestion(id: string): Promise<SerializedQuestion | null> {
  try {
    await connectToDatabase();
    const question = await QuestionModel.findById(id)
      .lean()
      .exec();

    if (!question) {
      return null;
    }

    // シリアライズされた質問データを作成
    const serializedQuestion: SerializedQuestion = {
      ...question,
      _id: question._id.toString(),
      author: question.author ? {
        ...question.author,
        _id: question.author._id.toString(),
      } : null,
      bestAnswer: question.bestAnswer ? question.bestAnswer.toString() : null,
      createdAt: question.createdAt.toISOString(),
      updatedAt: question.updatedAt.toISOString(),
    };

    // answersプロパティの存在チェックを追加
    if (Array.isArray(question.answers)) {
      return {
        ...serializedQuestion,
        answers: question.answers.map(answer => answer.toString()),
      };
    }

    return serializedQuestion;
  } catch (error) {
    console.error('Error fetching question:', error);
    throw error;
  }
} 