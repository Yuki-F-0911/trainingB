import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import dbConnect from '@/lib/dbConnect';
import QuestionModel from '@/models/Question';
import AnswerModel from '@/models/Answer';
import { authOptions } from '@/lib/auth';
import { notifyBestAnswerSelection } from '@/lib/notificationService';

export async function POST(request: Request) {
  try {
    // セッションを取得（認証済みユーザーかどうかの確認）
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // URLから質問IDを取得
    const pathParts = request.url.split('/');
    const questionId = pathParts[pathParts.length - 2];

    // リクエストボディからベストアンサーIDを取得
    const requestData = await request.json();
    const { answerId } = requestData;

    if (!answerId) {
      return NextResponse.json({ message: 'Answer ID is required' }, { status: 400 });
    }

    // DBに接続
    await dbConnect();

    // 質問とその著者を取得
    const question = await QuestionModel.findById(questionId);
    if (!question) {
      return NextResponse.json({ message: 'Question not found' }, { status: 404 });
    }

    // 質問の著者かどうかを確認（ベストアンサーは質問者のみが選択可能）
    if (question.author && question.author.toString() !== session.user.id) {
      return NextResponse.json({ message: 'Only the question author can select the best answer' }, { status: 403 });
    }

    // 該当する回答が存在するか確認
    const answer = await AnswerModel.findById(answerId);
    if (!answer) {
      return NextResponse.json({ message: 'Answer not found' }, { status: 404 });
    }

    // この質問に対する回答かどうか確認
    if (answer.question.toString() !== questionId) {
      return NextResponse.json({ message: 'This answer does not belong to the specified question' }, { status: 400 });
    }

    // 以前のベストアンサーがある場合はリセット
    if (question.bestAnswer) {
      const previousBest = await AnswerModel.findById(question.bestAnswer);
      if (previousBest) {
        previousBest.isBestAnswer = false;
        await previousBest.save();
      }
    }

    // 新しいベストアンサーを設定
    question.bestAnswer = answerId as any;
    await question.save();

    // 回答のベストアンサーフラグを更新
    answer.isBestAnswer = true;
    await answer.save();

    // 回答者に通知を送信（自分自身の回答の場合は除く）
    if (answer.user && answer.user.toString() !== session.user.id) {
      try {
        await notifyBestAnswerSelection(answerId, questionId);
        console.log(`通知送信: 回答${answerId}の作成者にベストアンサー選択について通知しました`);
      } catch (notifyError) {
        // 通知の送信に失敗しても、メイン処理は続行
        console.error(`通知エラー: 回答${answerId}の作成者への通知に失敗しました`, notifyError);
      }
    }

    return NextResponse.json({ success: true, message: 'Best answer selected successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error setting best answer:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
} 