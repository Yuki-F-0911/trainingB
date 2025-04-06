import mongoose, { Schema, Document, models, Model, Types } from 'mongoose';

// 通知のタイプを定義
export enum NotificationType {
  NEW_ANSWER = 'new_answer',        // 質問に対する新しい回答
  ANSWER_LIKED = 'answer_liked',    // 回答へのいいね
  BEST_ANSWER = 'best_answer',      // ベストアンサーに選ばれた
  MENTION = 'mention',              // メンション（将来的な拡張用）
}

// 通知ドキュメントのインターフェース定義
export interface INotification extends Document {
  _id: mongoose.Types.ObjectId;
  recipient: Types.ObjectId;        // 通知の受信者（User参照）
  type: NotificationType;           // 通知の種類
  relatedQuestion?: Types.ObjectId; // 関連する質問（Question参照）
  relatedAnswer?: Types.ObjectId;   // 関連する回答（Answer参照）
  actor?: Types.ObjectId;           // アクションを起こしたユーザー（User参照）
  isRead: boolean;                  // 既読状態
  message: string;                  // 通知メッセージ
  createdAt: Date;
  updatedAt: Date;
}

// Mongoose スキーマ定義
const NotificationSchema: Schema<INotification> = new Schema(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      required: true,
    },
    relatedQuestion: {
      type: Schema.Types.ObjectId,
      ref: 'Question',
    },
    relatedAnswer: {
      type: Schema.Types.ObjectId,
      ref: 'Answer',
    },
    actor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    message: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true, // createdAt と updatedAt を自動的に管理
  }
);

// インデックスを追加して既読状態での検索とソートを最適化
NotificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

// モデルが既に存在する場合はそれを使い、なければ新しいモデルを作成
const NotificationModel: Model<INotification> = models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);

export default NotificationModel; 