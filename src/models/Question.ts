import mongoose, { Schema, Document, models, Model, Types } from 'mongoose';

// Question ドキュメントのインターフェース定義
export interface IQuestion extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  content: string;
  author?: Types.ObjectId | null; // Userへの参照、Nullable
  answers: Types.ObjectId[]; // Answerへの参照配列
  tags: string[]; // tags フィールドを追加
  isAIGenerated: boolean;
  aiPersonality?: string;
  bestAnswer?: Types.ObjectId; // ベストアンサーへの参照
  createdAt: Date;
  updatedAt: Date;
}

// Mongoose スキーマ定義
const QuestionSchema: Schema<IQuestion> = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required.'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Content is required.'],
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User', // Userモデルへの参照
      default: null, // デフォルトはnull（AI生成などの場合）
    },
    answers: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Answer', // Answerモデルへの参照
      },
    ],
    tags: {
      type: [String], // 文字列の配列
      default: [], // デフォルトは空配列
      // 必要に応じてインデックスを追加
      // index: true,
    },
    isAIGenerated: {
      type: Boolean,
      default: false,
    },
    aiPersonality: {
      type: String,
    },
    bestAnswer: {
      type: Schema.Types.ObjectId,
      ref: 'Answer', // Answerモデルへの参照
      default: null, // デフォルトはnull
    },
  },
  {
    timestamps: true, // createdAt と updatedAt を自動的に管理
  }
);

// モデルが既に存在する場合はそれを使い、なければ新しいモデルを作成
const QuestionModel: Model<IQuestion> = models.Question || mongoose.model<IQuestion>('Question', QuestionSchema);

export default QuestionModel; 