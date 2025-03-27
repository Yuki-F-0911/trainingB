import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/auth.config';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // 管理者のみアクセス可能
    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { error: '権限がありません' },
        { status: 403 }
      );
    }

    // AIの質問生成を実行
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/ai/cron`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('AIの質問生成に失敗しました');
    }

    return NextResponse.json({ message: 'AIの質問生成が完了しました' });
  } catch (error: any) {
    console.error('手動トリガーエラー:', error);
    return NextResponse.json(
      { error: error.message || 'エラーが発生しました' },
      { status: 500 }
    );
  }
} 