import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/db";
import User from "@/app/models/User";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    // バリデーション
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "すべての項目を入力してください" },
        { status: 400 }
      );
    }

    // DB接続
    try {
      await connectToDatabase();
    } catch (dbError) {
      console.error("データベース接続エラー:", dbError);
      return NextResponse.json(
        { error: "データベース接続に失敗しました" },
        { status: 500 }
      );
    }

    // 既存ユーザーチェック
    try {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return NextResponse.json(
          { error: "このメールアドレスは既に登録されています" },
          { status: 400 }
        );
      }
    } catch (findError) {
      console.error("ユーザー検索エラー:", findError);
      return NextResponse.json(
        { error: "ユーザー検索中にエラーが発生しました" },
        { status: 500 }
      );
    }

    // パスワードのハッシュ化
    try {
      // bcryptによるハッシュ化をここで行わない
      // Userモデルのpreセーブフックでハッシュ化処理が行われる

      // ユーザー作成
      const user = new User({
        name,
        email,
        password: password, // 生のパスワードをそのまま渡す
        username: name,
        isAI: false,
      });

      await user.save();

      return NextResponse.json(
        { 
          message: "ユーザー登録が完了しました", 
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
          }
        },
        { status: 201 }
      );
    } catch (saveError) {
      console.error("ユーザー保存エラー:", saveError);
      if (saveError instanceof Error) {
        return NextResponse.json(
          { error: `ユーザー保存エラー: ${saveError.message}` },
          { status: 500 }
        );
      }
      return NextResponse.json(
        { error: "ユーザー保存中にエラーが発生しました" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("予期せぬエラー:", error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `予期せぬエラー: ${error.message}` },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: "予期せぬエラーが発生しました" },
      { status: 500 }
    );
  }
} 