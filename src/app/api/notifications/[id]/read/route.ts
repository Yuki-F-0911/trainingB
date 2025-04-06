import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { markNotificationAsRead } from '@/lib/notificationService';
import { authOptions } from '@/lib/auth';

// 指定した通知を既読にするAPI
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const notificationId = params.id;

    // 認証済みセッションを取得
    const session = await getServerSession(authOptions);

    // 未認証の場合は401エラー
    if (!session || !session.user) {
      return NextResponse.json(
        { message: '認証が必要です' },
        { status: 401 }
      );
    }

    // 通知を既読に
    const success = await markNotificationAsRead(notificationId, session.user.id);

    if (!success) {
      return NextResponse.json(
        { message: '通知が見つからないか、既に既読です' },
        { status: 404 }
      );
    }

    // 結果を返す
    return NextResponse.json({
      success: true,
      message: '通知を既読にしました',
    });
  } catch (error: any) {
    console.error('通知既読化エラー:', error);
    return NextResponse.json(
      { message: error.message || 'An error occurred' },
      { status: 500 }
    );
  }
} 