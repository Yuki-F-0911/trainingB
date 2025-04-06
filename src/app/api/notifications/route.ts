import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getUserNotifications } from '@/lib/notificationService';
import { authOptions } from '@/lib/auth';

// 通知一覧を取得するAPI
export async function GET(request: Request) {
  try {
    // 認証済みセッションを取得
    const session = await getServerSession(authOptions);

    // 未認証の場合は401エラー
    if (!session || !session.user) {
      return NextResponse.json(
        { message: '認証が必要です' },
        { status: 401 }
      );
    }

    // クエリパラメータを取得
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10); 
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    // 通知を取得
    const result = await getUserNotifications(
      session.user.id,
      { limit, offset, unreadOnly }
    );

    // 結果を返す
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('通知取得エラー:', error);
    return NextResponse.json(
      { message: error.message || 'An error occurred' },
      { status: 500 }
    );
  }
} 