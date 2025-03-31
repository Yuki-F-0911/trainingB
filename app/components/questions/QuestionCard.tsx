'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';

interface Question {
  _id?: string;
  id?: string;
  title: string;
  content: string;
  createdAt: string;
  user?: {
    name?: string;
  };
  author?: {
    name?: string;
  };
  answers?: any[];
  tags?: string[];
  isAIGenerated?: boolean;
  views?: number;
}

interface QuestionCardProps {
  question: Question;
  showPreview?: boolean;
}

const QuestionCard = ({ question, showPreview = true }: QuestionCardProps) => {
  // idを確実に取得（_idとidの両方をチェック）
  const questionId = question.id || question._id;
  
  // デバッグログの追加
  if (!questionId) {
    console.error('QuestionCard: 質問IDが見つかりません', question);
  } else {
    console.log('QuestionCard: 質問ID', questionId, 'タイプ:', typeof questionId);
  }
  
  // 作成日を整形
  const createdAt = new Date(question.createdAt);
  const timeAgo = formatDistanceToNow(createdAt, { locale: ja, addSuffix: true });
  
  // コンテンツのプレビュー（表示文字数を制限）
  const contentPreview = showPreview 
    ? question.content.length > 150 
      ? question.content.substring(0, 150) + '...' 
      : question.content
    : '';

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
      <Link href={`/questions/${questionId}`} className="block">
        <h2 className="text-xl font-semibold text-gray-800 mb-2 hover:text-blue-600 transition-colors">
          {question.title}
        </h2>
      </Link>
      
      <div className="flex items-center text-sm text-gray-600 mb-3">
        <span className="mr-4">投稿: {timeAgo}</span>
        <span className="mr-4">回答: {question.answers?.length || 0}件</span>
        <span>閲覧数: {question.views || 0}</span>
        {question.isAIGenerated && (
          <span className="ml-4 bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full text-xs">
            AI生成
          </span>
        )}
      </div>
      
      {showPreview && (
        <div className="mb-4 text-gray-700 line-clamp-3">
          {contentPreview}
        </div>
      )}
      
      <div className="flex flex-wrap gap-2 mb-3">
        {question.tags && question.tags.map((tag, index) => (
          <span 
            key={index} 
            className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-xs"
          >
            {tag}
          </span>
        ))}
      </div>
      
      <div className="text-sm text-gray-600">
        投稿者: {question.user?.name || question.author?.name || '不明なユーザー'}
      </div>
    </div>
  );
};

export default QuestionCard; 