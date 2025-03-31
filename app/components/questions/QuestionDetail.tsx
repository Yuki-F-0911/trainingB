'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import AnswerList from '../answers/AnswerList';

// APIのエンドポイントを環境変数から取得
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// APIベースURLの正規化関数
const normalizeApiUrl = (url: string) => {
  // /api で終わる場合はそのまま返す
  if (url.endsWith('/api')) {
    return url;
  }
  // /で終わる場合は api を追加
  if (url.endsWith('/')) {
    return `${url}api`;
  }
  // その他の場合は /api を追加
  return `${url}/api`;
};

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

interface QuestionDetailProps {
  questionId?: string;
}

export const QuestionDetail = ({ questionId: propQuestionId }: QuestionDetailProps) => {
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const searchParams = useSearchParams();
  const params = useParams();

  useEffect(() => {
    const fetchQuestionDetail = async () => {
      try {
        // まずpropsから渡されたIDを確認
        let id = propQuestionId;
        
        // 空文字列チェックを追加
        if (id === '') {
          console.error('[QuestionDetail] IDが空文字列です');
          id = undefined;
        }
        
        // propsにIDがない場合はURLパラメータを確認（[id]フォルダの場合）
        if (!id) {
          id = typeof params?.id === 'string' ? String(params.id) : undefined;
          console.log('[QuestionDetail] URLパラメータからID取得:', id);
        }
        
        // クエリパラメータからも確認（下位互換性のため）
        if (!id) {
          const queryId = searchParams?.get('id');
          id = queryId || undefined;
          console.log('[QuestionDetail] クエリパラメータからID取得:', id);
        }
        
        // コンソールにIDを出力（デバッグ用）
        console.log('[QuestionDetail] 最終的なID:', id, 'タイプ:', typeof id);
        
        // IDが無効な場合はエラーを設定
        if (!id || id === 'undefined' || id === 'null' || id === '') {
          console.error('[QuestionDetail] 無効な質問ID:', id);
          setError('無効な質問IDです。');
          setLoading(false);
          return;
        }

        // AIによって生成された質問IDの検出（MongoDB ObjectIdではない形式）
        const isMongoId = /^[0-9a-fA-F]{24}$/.test(id);
        const isAIGenId = !isMongoId && id.length > 0;
        console.log(`[QuestionDetail] MongoDBのID形式: ${isMongoId}, AI生成ID形式の可能性: ${isAIGenId}`);

        // APIを呼び出して質問の詳細を取得
        // APIエンドポイントパスの修正 - /api/ を含めるかどうかを確認
        const baseUrl = normalizeApiUrl(API_URL);
        const apiEndpoint = `${baseUrl}/questions/${id}`;
        console.log(`[QuestionDetail] API呼び出し: ${apiEndpoint}`);
        
        // 異なるエンドポイントも試してみる（AI生成質問用の別エンドポイントがある場合）
        let response;
        try {
          response = await fetch(apiEndpoint);
          console.log('[QuestionDetail] 通常APIレスポンスステータス:', response.status);
        } catch (fetchError) {
          console.error('[QuestionDetail] 通常API呼び出しエラー:', fetchError);
          // 代替エンドポイントを試す
          const altApiEndpoint = `${baseUrl}/ai-questions/${id}`;
          console.log(`[QuestionDetail] 代替API呼び出し: ${altApiEndpoint}`);
          response = await fetch(altApiEndpoint);
        }
        
        // レスポンスのステータスを確認
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('[QuestionDetail] APIエラー:', errorData);
          throw new Error(errorData.message || '質問の取得に失敗しました。');
        }

        const data = await response.json();
        console.log('[QuestionDetail] 取得した質問データ:', data);
        
        if (!data || (!data.question && !data.title)) {
          throw new Error('質問データが見つかりませんでした。');
        }

        // データ形式の正規化（APIレスポンスの形式が異なる場合に対応）
        const questionData = data.question || data;
        
        // 回答データを確認して利用可能であれば設定
        if (data.answers && Array.isArray(data.answers)) {
          questionData.answers = data.answers;
          console.log(`[QuestionDetail] APIから取得した回答数: ${data.answers.length}`);
        } else {
          console.log('[QuestionDetail] APIレスポンスに回答データが含まれていません');
          // デフォルトで空の配列を設定
          questionData.answers = [];
          
          // 回答データを別途取得
          try {
            // 回答リストを取得するためのAPIエンドポイント
            const answersEndpoint = `${baseUrl}/answers?questionId=${id}`;
            console.log(`[QuestionDetail] 回答データ取得API呼び出し: ${answersEndpoint}`);
            
            const answersResponse = await fetch(answersEndpoint);
            if (answersResponse.ok) {
              const answersData = await answersResponse.json();
              console.log('[QuestionDetail] 取得した回答データ:', answersData);
              
              // 回答データを質問オブジェクトにマージ
              if (answersData.answers && Array.isArray(answersData.answers)) {
                questionData.answers = answersData.answers;
              } else if (Array.isArray(answersData)) {
                questionData.answers = answersData;
              }
              console.log(`[QuestionDetail] 設定した回答数: ${questionData.answers.length}`);
            } else {
              console.warn('[QuestionDetail] 回答データの取得に失敗しました。ステータス:', answersResponse.status);
            }
          } catch (answersError) {
            console.error('[QuestionDetail] 回答データ取得エラー:', answersError);
          }
        }
        
        setQuestion(questionData);
      } catch (err: any) {
        console.error('[QuestionDetail] エラー:', err.message);
        setError(err.message || '質問の取得中にエラーが発生しました。');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestionDetail();
  }, [params, searchParams, propQuestionId]);

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
        {question.answers && question.answers.length > 0 ? (
          <>
            <AnswerList answers={question.answers} questionId={question._id || question.id} />
            <div className="mt-4 text-sm text-gray-600">
              <p>デバッグ情報: 回答 {question.answers.length}件</p>
            </div>
          </>
        ) : (
          <p className="text-gray-600">まだ回答はありません。最初の回答を投稿してみましょう！</p>
        )}
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