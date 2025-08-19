import { connectToDatabase } from '@/lib/mongodb';
import UserModel from '@/models/User';

// シリアライズされたユーザーデータの型を定義
type SerializedUser = {
  _id: string;
  email: string;
  name?: string;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
};

// ユーザー一覧を取得する関数 - コミュニティ形成のため
export async function getUsers(limit: number = 100, page: number = 1): Promise<SerializedUser[]> {
  try {
    await connectToDatabase();
    const skip = (page - 1) * limit;
    
    const users = await UserModel.find({}, '-password') // パスワードは除外
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();

    return users.map(user => ({
      ...user,
      _id: user._id.toString(),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    }));
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
}

// 特定のユーザーを取得する関数
export async function getUser(id: string): Promise<SerializedUser | null> {
  try {
    await connectToDatabase();
    const user = await UserModel.findById(id, '-password')
      .lean()
      .exec();

    if (!user) {
      return null;
    }

    return {
      ...user,
      _id: user._id.toString(),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
}

// アクティブユーザーを取得する関数 - コミュニティ活性化のため
export async function getActiveUsers(limit: number = 50): Promise<SerializedUser[]> {
  try {
    await connectToDatabase();
    
    // 最近ログインしたユーザーや投稿したユーザーを取得
    // 現在は作成日順で取得（将来的にアクティビティ指標を追加可能）
    const users = await UserModel.find({}, '-password')
      .sort({ updatedAt: -1 })
      .limit(limit)
      .lean()
      .exec();

    return users.map(user => ({
      ...user,
      _id: user._id.toString(),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    }));
  } catch (error) {
    console.error('Error fetching active users:', error);
    throw error;
  }
}
