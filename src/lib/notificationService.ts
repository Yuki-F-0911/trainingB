import dbConnect from './dbConnect';
import NotificationModel, { NotificationType, INotification } from '@/models/Notification';
import QuestionModel from '@/models/Question';
import AnswerModel from '@/models/Answer';
import UserModel from '@/models/User';
import { Types } from 'mongoose';

/**
 * 通知を作成する関数
 */
export async function createNotification({
  recipientId,
  type,
  relatedQuestionId,
  relatedAnswerId,
  actorId,
  message,
}: {
  recipientId: string | Types.ObjectId;
  type: NotificationType;
  relatedQuestionId?: string | Types.ObjectId;
  relatedAnswerId?: string | Types.ObjectId;
  actorId?: string | Types.ObjectId;
  message: string;
}): Promise<INotification> {
  await dbConnect();

  // 自分自身への通知は作成しない
  if (actorId && actorId.toString() === recipientId.toString()) {
    throw new Error('Cannot create notification for yourself');
  }

  const notification = await NotificationModel.create({
    recipient: recipientId,
    type,
    relatedQuestion: relatedQuestionId,
    relatedAnswer: relatedAnswerId,
    actor: actorId,
    message,
    isRead: false,
  });

  return notification;
}

/**
 * 質問に回答があった時の通知を作成
 */
export async function notifyQuestionAuthorOfNewAnswer(
  questionId: string | Types.ObjectId,
  answerId: string | Types.ObjectId,
  answerAuthorId: string | Types.ObjectId
): Promise<INotification | null> {
  await dbConnect();

  // 質問を取得
  const question = await QuestionModel.findById(questionId);
  if (!question || !question.author) return null;

  // 回答を取得（ユーザー名のため）
  const answer = await AnswerModel.findById(answerId).populate('user', 'name email');
  if (!answer) return null;

  // 回答者の名前を取得（リッチな通知のため）
  const answerAuthor = await UserModel.findById(answerAuthorId);
  const answerAuthorName = answerAuthor?.name || answerAuthor?.email || '匿名ユーザー';

  // 通知メッセージを作成
  const message = `${answerAuthorName}さんがあなたの質問「${question.title.substring(0, 30)}...」に回答しました`;

  // 通知を作成
  return createNotification({
    recipientId: question.author,
    type: NotificationType.NEW_ANSWER,
    relatedQuestionId: questionId,
    relatedAnswerId: answerId,
    actorId: answerAuthorId,
    message,
  });
}

/**
 * 回答にいいねがあった時の通知を作成
 */
export async function notifyAnswerAuthorOfLike(
  answerId: string | Types.ObjectId,
  likingUserId: string | Types.ObjectId
): Promise<INotification | null> {
  await dbConnect();

  // 回答を取得
  const answer = await AnswerModel.findById(answerId);
  if (!answer || !answer.user) return null;

  // 質問を取得（タイトルのため）
  const question = await QuestionModel.findOne({ answers: { $in: [answerId] } });
  if (!question) return null;

  // いいねした人の名前を取得
  const likingUser = await UserModel.findById(likingUserId);
  const likingUserName = likingUser?.name || likingUser?.email || '匿名ユーザー';

  // 通知メッセージを作成
  const message = `${likingUserName}さんがあなたの回答に「いいね！」しました`;

  // 通知を作成
  return createNotification({
    recipientId: answer.user,
    type: NotificationType.ANSWER_LIKED,
    relatedQuestionId: question._id,
    relatedAnswerId: answerId,
    actorId: likingUserId,
    message,
  });
}

/**
 * ベストアンサーに選ばれた時の通知を作成
 */
export async function notifyBestAnswerSelection(
  answerId: string | Types.ObjectId,
  questionId: string | Types.ObjectId
): Promise<INotification | null> {
  await dbConnect();

  // 回答を取得
  const answer = await AnswerModel.findById(answerId);
  if (!answer || !answer.user) return null;

  // 質問を取得
  const question = await QuestionModel.findById(questionId).populate('author', 'name email');
  if (!question) return null;

  // 質問作成者の情報を取得
  let questionAuthorName = '匿名ユーザー';
  let authorId: Types.ObjectId | undefined = undefined;
  
  if (question.author) {
    if (typeof question.author === 'object') {
      // populate された場合
      const author = question.author as any;
      questionAuthorName = author.name || author.email || '匿名ユーザー';
      authorId = author._id;
    } else {
      // populate されていない場合
      authorId = question.author as Types.ObjectId;
    }
  }

  // 通知メッセージを作成
  const message = `${questionAuthorName}さんがあなたの回答をベストアンサーに選びました！`;

  // 通知を作成
  return createNotification({
    recipientId: answer.user,
    type: NotificationType.BEST_ANSWER,
    relatedQuestionId: questionId,
    relatedAnswerId: answerId,
    actorId: authorId,
    message,
  });
}

/**
 * ユーザーの通知を取得する
 */
export async function getUserNotifications(
  userId: string | Types.ObjectId,
  { limit = 10, offset = 0, unreadOnly = false } = {}
): Promise<{
  notifications: INotification[];
  totalCount: number;
  unreadCount: number;
}> {
  await dbConnect();

  // 検索条件の設定
  const query: any = { recipient: userId };
  if (unreadOnly) {
    query.isRead = false;
  }

  // 通知の総数と未読数を非同期で取得
  const [notifications, totalCount, unreadCount] = await Promise.all([
    NotificationModel.find(query)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .populate('actor', 'name email')
      .populate('relatedQuestion', 'title')
      .lean(),
    NotificationModel.countDocuments({ recipient: userId }),
    NotificationModel.countDocuments({ recipient: userId, isRead: false }),
  ]);

  return {
    notifications,
    totalCount,
    unreadCount,
  };
}

/**
 * 通知を既読にする
 */
export async function markNotificationAsRead(
  notificationId: string | Types.ObjectId,
  userId: string | Types.ObjectId
): Promise<boolean> {
  await dbConnect();

  const result = await NotificationModel.updateOne(
    { _id: notificationId, recipient: userId },
    { $set: { isRead: true } }
  );

  return result.modifiedCount > 0;
}

/**
 * すべての通知を既読にする
 */
export async function markAllNotificationsAsRead(userId: string | Types.ObjectId): Promise<number> {
  await dbConnect();

  const result = await NotificationModel.updateMany(
    { recipient: userId, isRead: false },
    { $set: { isRead: true } }
  );

  return result.modifiedCount;
} 