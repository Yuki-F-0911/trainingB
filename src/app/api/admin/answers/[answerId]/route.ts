import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import AnswerModel from '@/models/Answer';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export const runtime = 'nodejs';

export async function PATCH(
  request: Request,
  { params }: { params: { answerId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { answerId } = params;
  const body = await request.json();
  const { content } = body;
  if (!content || typeof content !== 'string') {
    return NextResponse.json({ message: 'Invalid content' }, { status: 400 });
  }

  await dbConnect();
  const answer = await AnswerModel.findById(answerId);
  if (!answer) {
    return NextResponse.json({ message: 'Answer not found' }, { status: 404 });
  }

  answer.content = content;
  await answer.save();

  return NextResponse.json({ message: '回答を更新しました' }, { status: 200 });
} 