import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { markAllNotificationsAsRead } from '@/lib/notificationService';
import { authOptions } from '@/lib/auth';

// すべての通知を既読にするAPI
export async function POST(request: Request) {
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

    // すべての通知を既読に
    const modifiedCount = await markAllNotificationsAsRead(session.user.id);

    // 結果を返す
    return NextResponse.json({
      success: true,
      message: `${modifiedCount}件の通知を既読にしました`,
      modifiedCount,
    });
  } catch (error: any) {
    console.error('通知既読化エラー:', error);
    return NextResponse.json(
      { message: error.message || 'An error occurred' },
      { status: 500 }
    );
  }
} 