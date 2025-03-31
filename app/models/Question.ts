import mongoose from 'mongoose';

// ユーザースキーマ
const QuestionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'タイトルは必須です'],
      trim: true,
      maxlength: [200, 'タイトルは200文字以下にしてください'],
    },
    content: {
      type: String,
      required: [true, '質問内容は必須です'],
      trim: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    tags: [String],
    upvotes: {
      type: Number,
      default: 0,
    },
    downvotes: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
    isAIGenerated: {
      type: Boolean,
      default: false
    },
    customId: {
      type: String,
      index: true,
      sparse: true
    }
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// 仮想フィールドの設定
QuestionSchema.virtual('answers', {
  ref: 'Answer',
  localField: '_id',
  foreignField: 'question',
  justOne: false,
  options: { sort: { createdAt: -1 } }
});

// インデックスの設定
QuestionSchema.index({ title: 'text', content: 'text' });
QuestionSchema.index({ tags: 1 });
QuestionSchema.index({ createdAt: -1 });
QuestionSchema.index({ upvotes: -1 });

// モデルをキャッシュから取得するか、作成する
const Question = mongoose.models.Question || mongoose.model('Question', QuestionSchema);

export default Question; 