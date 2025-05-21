import mongoose, { Schema, Document, models, Model, Types } from 'mongoose';

// Question ドキュメントのインターフェース定義
export interface IQuestion extends Document {
  _id: Types.ObjectId;
  title: string;
  content: string;
  author: {
    _id: Types.ObjectId;
    name?: string;
    email: string;
  } | null;
  answers: string[];
  tags: string[];
  isAIGenerated: boolean;
  aiPersonality?: string;
  bestAnswer: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

// Mongoose スキーマ定義
const QuestionSchema: Schema<IQuestion> = new Schema(
  {
    title: {
      type: String,
      required: [true, 'タイトルは必須です'],
      trim: true,
      maxlength: [200, 'タイトルは200文字以内で入力してください']
    },
    content: {
      type: String,
      required: [true, '内容は必須です'],
      trim: true
    },
    author: {
      type: {
        _id: Schema.Types.ObjectId,
        name: String,
        email: String
      },
      required: true
    },
    answers: [{
      type: String,
      ref: 'Answer'
    }],
    tags: [{
      type: String,
      trim: true
    }],
    isAIGenerated: {
      type: Boolean,
      default: false
    },
    aiPersonality: {
      type: String,
      trim: true
    },
    bestAnswer: {
      type: Schema.Types.ObjectId,
      ref: 'Answer',
      default: null
    }
  },
  {
    timestamps: true
  }
);

// モデルが既に存在する場合はそれを使い、なければ新しいモデルを作成
const QuestionModel: Model<IQuestion> = models.Question || mongoose.model<IQuestion>('Question', QuestionSchema);

export default QuestionModel; 