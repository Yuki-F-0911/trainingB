import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import dbConnect from '@/lib/dbConnect';
import AnswerModel from '@/models/Answer';
import { authOptions } from '@/lib/auth';
import { notifyAnswerAuthorOfLike } from '@/lib/notificationService';

export async function POST(request: Request) {
  try {
    // セッションを取得（認証済みユーザーかどうかの確認）
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // URLから回答IDを取得
    const pathParts = request.url.split('/');
    const answerId = pathParts[pathParts.length - 2];

    if (!answerId) {
      return NextResponse.json({ message: 'Answer ID is required' }, { status: 400 });
    }

    // DBに接続
    await dbConnect();

    // 該当する回答を取得
    const answer = await AnswerModel.findById(answerId);
    if (!answer) {
      return NextResponse.json({ message: 'Answer not found' }, { status: 404 });
    }

    const userId = session.user.id;

    // ユーザーが既にいいねしているかチェック
    const alreadyLiked = answer.likedBy.some(id => id.toString() === userId);

    if (alreadyLiked) {
      // 既にいいねしている場合はいいねを取り消す（トグル機能）
      answer.likedBy = answer.likedBy.filter(id => id.toString() !== userId);
      answer.likes = Math.max(0, answer.likes - 1); // いいね数を1減らす（0未満にはならないようにする）
    } else {
      // まだいいねしていない場合はいいねを追加
      answer.likedBy.push(userId as any);
      answer.likes += 1; // いいね数を1増やす

      // 回答者に通知を送る（自分自身の回答の場合は除く）
      if (answer.user && answer.user.toString() !== userId) {
        try {
          await notifyAnswerAuthorOfLike(answerId, userId);
          console.log(`通知送信: 回答${answerId}の作成者にいいねについて通知しました`);
        } catch (notifyError) {
          // 通知の送信に失敗しても、メイン処理は続行
          console.error(`通知エラー: 回答${answerId}の作成者への通知に失敗しました`, notifyError);
        }
      }
    }

    // 変更を保存
    await answer.save();

    // レスポンスを返す
    return NextResponse.json({ 
      success: true, 
      liked: !alreadyLiked, 
      likes: answer.likes,
      message: alreadyLiked ? 'Like removed successfully' : 'Liked successfully' 
    }, { status: 200 });
  } catch (error) {
    console.error('Error toggling like status:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
} 