import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import QuestionModel from '@/models/Question';
import AnswerModel from '@/models/Answer'; // AnswerModelもインポート
import UserModel from '@/models/User'; // UserModelもインポート
import mongoose from 'mongoose';

// モデルを早期に参照して Mongoose に認識させる
try {
  QuestionModel;
  AnswerModel;
  UserModel;
} catch (e) {
  // 開発サーバーの初回起動時などに一時的にエラーになる可能性はあるが、
  // リクエスト処理時には登録されているはずなので警告に留める
  console.warn("Models might not be registered yet on initial load:", e);
}

// GET: 特定の質問を取得
// パラメータの型注釈を削除し、URLからIDを取得するように変更
export async function GET(request: Request) {
  
  // URLから質問IDを取得 (例: /api/questions/123 -> 123)
  const urlParts = request.url.split('/');
  const id = urlParts[urlParts.length - 1]; // 末尾の要素をIDとみなす

  if (!id) {
    return NextResponse.json({ message: 'Could not extract Question ID from URL' }, { status: 400 });
  }

  // ID が有効な ObjectId かチェック
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: 'Invalid Question ID' }, { status: 400 });
  }

  try {
    await dbConnect();

    const question = await QuestionModel.findById(id)
      .populate('author', 'name email') // 質問の投稿者情報を populate
      .populate({
        path: 'answers', // 回答リストを populate
        populate: {
          path: 'user', // 各回答の投稿者情報を populate
          select: 'name email', // ユーザー名とメールアドレスを選択
        },
        options: { sort: { createdAt: 1 } } // 回答を古い順にソート (任意)
      })
      .exec();

    if (!question) {
      return NextResponse.json({ message: 'Question not found' }, { status: 404 });
    }

    return NextResponse.json(question, { status: 200 });

  } catch (error) {
    console.error(`Error fetching question ${id}:`, error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// 他のメソッド (PUT, DELETE など) は必要に応じてここに追加 