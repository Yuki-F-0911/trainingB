'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import AnswerList from '../answers/AnswerList';

// APIのエンドポイントを環境変数から取得
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Question {
  _id?: string;
  id?: string;
  title: string;
  content: string;
  createdAt: string;
  user?: {
    name?: string;
    profileImage?: string;
  };
  author?: {
    name?: string;
    profileImage?: string;
  };
  answers?: any[];
  tags?: string[];
  isAIGenerated?: boolean;
  views?: number;
}

export const QuestionDetail = () => {
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const searchParams = useSearchParams();

  useEffect(() => {
    const fetchQuestionDetail = async () => {
      try {
        // URLからIDを取得
        const id = searchParams?.get('id');
        
        // コンソールにIDを出力（デバッグ用）
        console.log('[QuestionDetail] URLから取得したID:', id);
        
        // IDが無効な場合はエラーを設定
        if (!id || id === 'undefined' || id === 'null') {
          console.error('[QuestionDetail] 無効な質問ID:', id);
          setError('無効な質問IDです。');
          setLoading(false);
          return;
        }

        // APIを呼び出して質問の詳細を取得
        console.log(`[QuestionDetail] API呼び出し: ${API_URL}/api/questions/${id}`);
        const response = await fetch(`${API_URL}/api/questions/${id}`);
        
        // レスポンスのステータスを確認
        console.log('[QuestionDetail] APIレスポンスステータス:', response.status);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('[QuestionDetail] APIエラー:', errorData);
          throw new Error(errorData.message || '質問の取得に失敗しました。');
        }

        const data = await response.json();
        console.log('[QuestionDetail] 取得した質問データ:', data);
        
        if (!data || !data.question) {
          throw new Error('質問データが見つかりませんでした。');
        }

        setQuestion(data.question);
      } catch (err: any) {
        console.error('[QuestionDetail] エラー:', err.message);
        setError(err.message || '質問の取得中にエラーが発生しました。');
      } finally {
        setLoading(false);
      }
    };

    if (searchParams) {
      fetchQuestionDetail();
    }
  }, [searchParams]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <div className="text-red-600 mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 mx-auto"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold mb-2">エラーが発生しました</h2>
        <p className="mb-6">{error}</p>
        <Link
          href="/questions"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
        >
          質問一覧に戻る
        </Link>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="text-center py-10">
        <div className="text-yellow-600 mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 mx-auto"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 12H4"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold mb-2">質問が見つかりませんでした</h2>
        <Link
          href="/questions"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
        >
          質問一覧に戻る
        </Link>
      </div>
    );
  }

  const createdAt = new Date(question.createdAt);
  const timeAgo = formatDistanceToNow(createdAt, { locale: ja, addSuffix: true });

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">{question.title}</h1>
        <div className="flex items-center text-sm text-gray-600 mb-4">
          <span className="mr-4">投稿: {timeAgo}</span>
          <span>閲覧数: {question.views || 0}</span>
          {question.isAIGenerated && (
            <span className="ml-4 bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full text-xs">
              AI生成
            </span>
          )}
        </div>
        <div className="prose max-w-none">
          <div className="whitespace-pre-wrap">{question.content}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {question.tags && question.tags.map((tag, index) => (
          <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm">
            {tag}
          </span>
        ))}
      </div>

      <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-3">
            {question.user?.profileImage ? (
              <Image
                src={question.user.profileImage}
                alt={question.user.name || ''}
                width={40}
                height={40}
                className="rounded-full"
              />
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            )}
          </div>
          <div>
            <div className="font-medium">{question.user?.name || question.author?.name || '不明なユーザー'}</div>
            <div className="text-sm text-gray-600">{timeAgo}</div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">回答 ({question.answers?.length || 0})</h2>
        <AnswerList answers={question.answers || []} questionId={question._id || question.id} />
      </div>

      <div className="mt-8 text-center">
        <Link
          href={`/questions/${question._id || question.id}/answer`}
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
        >
          回答する
        </Link>
      </div>
    </div>
  );
}; 