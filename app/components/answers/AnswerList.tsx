'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';

interface Answer {
  id?: string;
  _id?: string;
  content: string;
  createdAt: string;
  author?: {
    name?: string;
  };
  user?: {
    name?: string;
  };
  isAIGenerated?: boolean;
  personality?: string;
}

interface AnswerListProps {
  answers: Answer[];
  questionId?: string;
  onAnswerUpdate?: (answer: Answer) => void;
  onAnswerDelete?: (answerId: string) => void;
}

const AnswerList = ({ answers, questionId, onAnswerUpdate, onAnswerDelete }: AnswerListProps) => {
  const [expandedAnswers, setExpandedAnswers] = useState<Record<string, boolean>>({});

  // 回答の展開/折りたたみを切り替える
  const toggleAnswerExpand = (answerId: string) => {
    setExpandedAnswers(prev => ({
      ...prev,
      [answerId]: !prev[answerId]
    }));
  };

  // 回答が空の場合
  if (!answers || answers.length === 0) {
    return <p className="text-gray-600">まだ回答はありません。最初の回答を投稿してみましょう！</p>;
  }

  console.log('[AnswerList] 表示する回答数:', answers.length);

  return (
    <div className="space-y-6">
      {answers.map((answer, index) => {
        // IDを取得（_idまたはid、または代替としてインデックス）
        const answerId = answer._id || answer.id || `answer-${index}`;
        console.log(`[AnswerList] 回答ID: ${answerId}`);
        
        const isExpanded = expandedAnswers[answerId] || false;
        
        // 日付形式の処理を改善
        let timeAgo = '';
        try {
          const createdAt = new Date(answer.createdAt);
          timeAgo = formatDistanceToNow(createdAt, { locale: ja, addSuffix: true });
        } catch (err) {
          console.error(`[AnswerList] 日付の変換に失敗しました:`, err);
          timeAgo = '不明な日時';
        }
        
        const longContent = answer.content && answer.content.length > 300;
        const displayContent = longContent && !isExpanded 
          ? answer.content.substring(0, 300) + '...' 
          : answer.content;

        // 作者名の取得（authorまたはuser）
        const authorName = answer.author?.name || answer.user?.name || '不明';

        return (
          <div key={answerId} className="bg-gray-50 rounded-lg p-5 border border-gray-200">
            <div className="prose max-w-none">
              <p className="whitespace-pre-wrap">{displayContent}</p>
              
              {longContent && (
                <button 
                  onClick={() => toggleAnswerExpand(answerId)}
                  className="text-blue-600 hover:underline text-sm mt-2"
                >
                  {isExpanded ? '折りたたむ' : 'もっと見る'}
                </button>
              )}
            </div>
            
            <div className="flex justify-between items-center mt-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <span>回答者: {authorName}</span>
                {answer.isAIGenerated && (
                  <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full text-xs">
                    AI生成
                  </span>
                )}
                {answer.personality && (
                  <span className="bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full text-xs">
                    {answer.personality}
                  </span>
                )}
              </div>
              <span>{timeAgo}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AnswerList; 