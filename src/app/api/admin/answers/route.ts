import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import AnswerModel from '@/models/Answer';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();
  const answers = await AnswerModel.find({ isAIGenerated: true }).sort({ createdAt: -1 }).lean();
  const result = answers.map(a => ({
    _id: a._id.toString(),
    content: a.content,
    question: a.question.toString(),
    aiPersonality: a.aiPersonality,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  }));

  return NextResponse.json({ answers: result });
} 