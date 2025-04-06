import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import dbConnect from '@/lib/dbConnect';
import AnswerModel from '@/models/Answer';
import QuestionModel from '@/models/Question';
import mongoose from 'mongoose';
// import { options } from '../../../auth/[...nextauth]/route'; // 必要に応じてパスを確認

// POST: 特定の質問に回答を作成
// パラメータの型注釈を削除し、URLからIDを取得するように変更
export async function POST(request: Request) {
  
  // URLから質問IDを取得 (例: /api/questions/123/answers -> 123)
  const urlParts = request.url.split('/');
  const questionIdIndex = urlParts.findIndex(part => part === 'questions') + 1;
  const questionId = questionIdIndex > 0 && questionIdIndex < urlParts.length -1 ? urlParts[questionIdIndex] : null;

  if (!questionId) {
    return NextResponse.json({ message: 'Could not extract Question ID from URL' }, { status: 400 });
  }

  // ★★★ 一旦認証チェックをスキップ ★★★
  // const session = await getServerSession(options);
  // if (!session || !session.user) {
  //   return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  // }
  // const userId = (session.user as any).id;
  const userId = null; // 仮に null を設定（後で認証と連携）

  // Question ID が有効かチェック
  if (!mongoose.Types.ObjectId.isValid(questionId)) {
    return NextResponse.json({ message: 'Invalid Question ID' }, { status: 400 });
  }

  try {
    const { content } = await request.json();

    if (!content) {
      return NextResponse.json({ message: 'Content is required' }, { status: 400 });
    }

    await dbConnect();

    // 対象の質問が存在するか確認 (任意だが推奨)
    const questionExists = await QuestionModel.findById(questionId).select('_id').lean();
    if (!questionExists) {
        return NextResponse.json({ message: 'Question not found' }, { status: 404 });
    }

    // 新しい回答を作成
    const newAnswer = new AnswerModel({
      content,
      question: questionId,
      user: userId, // ログインユーザーのID (認証実装後)
      isAIGenerated: false, // ユーザー投稿
    });

    // 回答を保存
    await newAnswer.save();

    // --- ここから修正 ---
    try {
      // 質問ドキュメントの answers 配列に新しい回答の ID を追加し、更新結果を確認
      const updatedQuestion = await QuestionModel.findByIdAndUpdate(
        questionId,
        { $push: { answers: newAnswer._id } }, // $push で配列に追加
        { new: true } // 更新後のドキュメントを取得 (成功確認のため)
      );

      // 更新が成功したか確認 (ドキュメントが存在し、回答IDが含まれているか)
      if (!updatedQuestion) {
          // 質問が見つからなかった場合 (削除されたなど)
          console.warn(`Warning: Question ${questionId} not found when trying to push answer ${newAnswer._id}. Answer was saved but link failed.`);
          // ここで回答を削除するなどの補償処理も検討可能
      } else if (!updatedQuestion.answers.map(String).includes(String(newAnswer._id))) {
          // 何らかの理由で $push が失敗した場合
          console.warn(`Warning: Failed to push answer ${newAnswer._id} to question ${questionId}. Answer was saved but link might have failed.`);
          // エラー詳細を調査する必要があるかもしれない
      }
    } catch (updateError) {
        // QuestionModel.findByIdAndUpdate 自体がエラーを投げた場合
        console.error(`Error updating question ${questionId} to add answer ${newAnswer._id}:`, updateError);
        // 回答を削除するなどの補償処理も検討可能
    }
    // --- ここまで修正 ---

    // populate された回答を返すことも検討 (今回は保存した回答をそのまま返す)
    return NextResponse.json(newAnswer, { status: 201 });

  } catch (error) {
    console.error(`Error posting answer to question ${questionId} (outer catch):`, error); // エラー発生箇所を区別
    if (error instanceof Error && error.name === 'ValidationError') {
        return NextResponse.json({ message: 'Validation Error', errors: (error as any).errors }, { status: 400 });
    }
    // newAnswer.save() 失敗などもここで捕捉される
    return NextResponse.json({ message: 'Internal Server Error during answer creation' }, { status: 500 });
  }
} 