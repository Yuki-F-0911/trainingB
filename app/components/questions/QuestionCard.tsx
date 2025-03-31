'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';

interface QuestionCardProps {
  question: {
    _id?: string;
    id?: string;
    title: string;
    content: string;
    user?: {
      _id?: string;
      id?: string;
      name?: string;
    };
    author?: {
      _id?: string;
      id?: string;
      name?: string;
    };
    upvotes?: number;
    downvotes?: number;
    tags?: string[];
    createdAt: string;
    isAIGenerated?: boolean;
    answersCount?: number;
    views?: number;
  };
}

const QuestionCard = ({ question }: QuestionCardProps) => {
  const createdAt = new Date(question.createdAt);
  const timeAgo = formatDistanceToNow(createdAt, { locale: ja, addSuffix: true });
  const tags = question.tags || [];

  // 質問IDの取得（MongoDBの_idまたは通常のid）
  const questionId = question._id || question.id;
  
  // IDが無効な場合のデバッグ情報
  if (!questionId) {
    console.error('無効な質問ID:', question);
  }

  // ユーザー名を取得（異なるAPIのレスポンス形式に対応）
  const userName = question.user?.name || question.author?.name || '不明';

  return (
    <div className="border rounded-lg shadow-sm p-6 bg-white hover:shadow-md transition duration-300">
      <div className="flex justify-between items-start mb-2">
        <h2 className="text-xl font-semibold text-gray-900 hover:text-blue-600">
          {questionId ? (
            <Link href={`/questions/${questionId}`}>
              {question.title}
            </Link>
          ) : (
            <span>{question.title}</span>
          )}
        </h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">
            {question.answersCount || 0} 回答
          </span>
          <span className="text-sm text-gray-600">
            {question.views || 0} 閲覧
          </span>
        </div>
      </div>

      <p className="text-gray-700 mb-4 line-clamp-2">{question.content}</p>

      <div className="flex flex-wrap gap-2 mb-4">
        {tags.map((tag, index) => (
          <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm">
            {tag}
          </span>
        ))}
      </div>

      <div className="flex justify-between items-center text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <span>投稿者: {userName}</span>
          {question.isAIGenerated && (
            <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full text-xs">
              AI生成
            </span>
          )}
        </div>
        <span>{timeAgo}</span>
      </div>
    </div>
  );
};

export default QuestionCard; 