import mongoose, { Schema, Document, models, Model, Types } from 'mongoose';
import bcrypt from 'bcryptjs';

// User ドキュメントのインターフェース定義 (パスワードは含めない)
export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  name?: string;
  isAdmin: boolean;
  password?: string; // 保存時にはハッシュ化されるため、取得時は通常不要
  createdAt: Date;
  updatedAt: Date;
  // パスワード比較メソッド
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Mongoose スキーマ定義
const UserSchema: Schema<IUser> = new Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required.'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/.+\@.+\..+/, 'Please fill a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required.'],
      select: false, // デフォルトでは取得しないように設定
    },
    name: {
      type: String,
      trim: true,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // createdAt と updatedAt を自動的に管理
  }
);

// パスワードをハッシュ化する pre-save フック
UserSchema.pre<IUser>('save', async function (next) {
  // パスワードが変更されていない場合は次へ
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  try {
    // パスワードをハッシュ化
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (error: any) {
    return next(error);
  }
});

// パスワード比較メソッド
UserSchema.methods.comparePassword = function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// モデルが既に存在する場合はそれを使い、なければ新しいモデルを作成
const UserModel: Model<IUser> = models.User || mongoose.model<IUser>('User', UserSchema);

export default UserModel; 