import mongoose, { Schema, Document, models, Model, Types } from 'mongoose';

// Answer ドキュメントのインターフェース定義
export interface IAnswer extends Document {
  content: string;
  question: Types.ObjectId; // Questionへの参照
  user?: Types.ObjectId | null; // Userへの参照、Nullable
  isAIGenerated: boolean;
  aiPersonality?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Mongoose スキーマ定義
const AnswerSchema: Schema<IAnswer> = new Schema(
  {
    content: {
      type: String,
      required: [true, 'Content is required.'],
    },
    question: {
      type: Schema.Types.ObjectId,
      ref: 'Question', // Questionモデルへの参照
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User', // Userモデルへの参照
      default: null, // デフォルトはnull（AI生成などの場合）
    },
    isAIGenerated: {
      type: Boolean,
      default: false,
    },
    aiPersonality: {
      type: String,
    },
  },
  {
    timestamps: true, // createdAt と updatedAt を自動的に管理
  }
);

// モデルが既に存在する場合はそれを使い、なければ新しいモデルを作成
const AnswerModel: Model<IAnswer> = models.Answer || mongoose.model<IAnswer>('Answer', AnswerSchema);

export default AnswerModel; 