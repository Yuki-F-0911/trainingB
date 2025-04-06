"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { IQuestion } from '@/models/Question'; // Or the correct path to your Question type

// Question 型定義 (APIレスポンスに合わせる)
interface Question {
  _id: string;
  title: string;
  content: string;
  author?: {
    _id: string;
    name?: string;
    email: string;
  } | null;
  createdAt: string;
  tags: string[];
  // 他のフィールドも必要に応じて追加
}

interface ApiResponse {
    questions: Question[];
    totalPages: number;
    currentPage: number;
    totalQuestions: number;
}

interface QuestionListProps {
  questions?: IQuestion[]; // オプショナルに変更
  fetchFromApi?: boolean; // APIから取得するかどうかのフラグを追加
}

// propsから渡された質問データをApiResponseに変換するヘルパー関数
function convertQuestionsToApiResponse(questions: IQuestion[]): ApiResponse {
  // IQuestionからQuestion型に変換（_idをstringとして扱う）
  const convertedQuestions = questions.map(q => ({
    ...q,
    _id: q._id.toString(), // ObjectIdをstringに変換
    createdAt: q.createdAt instanceof Date ? q.createdAt.toISOString() : q.createdAt,
  })) as unknown as Question[];

  return {
    questions: convertedQuestions,
    totalPages: 1,
    currentPage: 1,
    totalQuestions: questions.length
  };
}

// APIからのデータ取得キャンセル用のAbortControllerを管理する
let abortController: AbortController | null = null;

export default function QuestionList({ questions: propQuestions = [], fetchFromApi = true }: QuestionListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // 現在のページをURLから取得（デフォルトは1）
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(fetchFromApi);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchedPage, setLastFetchedPage] = useState<number | null>(null);

  // コンポーネントがアンマウントされたときにフェッチを中止
  useEffect(() => {
    return () => {
      if (abortController) {
        abortController.abort();
        abortController = null;
      }
    };
  }, []);

  // 初回マウント時と、URLのページパラメータが変わったときのみデータを取得
  useEffect(() => {
    // propQuestionsが提供され、APIからのフェッチが不要な場合はそれを使用
    if (propQuestions.length > 0 && !fetchFromApi) {
      setData(convertQuestionsToApiResponse(propQuestions));
      setLoading(false);
      return;
    }

    // 既に同じページのデータを取得済みなら再取得しない
    if (fetchFromApi && (lastFetchedPage !== currentPage)) {
      // 前のリクエストをキャンセル
      if (abortController) {
        abortController.abort();
      }
      
      // 新しいAbortControllerを作成
      abortController = new AbortController();
      const currentController = abortController;
      
      const fetchQuestions = async () => {
        setLoading(true);
        setError(null);
        try {
          console.log(`Fetching page ${currentPage}...`); // デバッグ用ログ
          
          const response = await fetch(`/api/questions?page=${currentPage}&limit=10`, {
            signal: currentController.signal
          });
          
          if (!response.ok) {
            throw new Error('Failed to fetch questions');
          }

          // レスポンスがJSON形式か確認
          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Received non-JSON response from server');
          }

          const result: ApiResponse = await response.json();
          setData(result);
          setLastFetchedPage(currentPage); // 取得したページを記録
        } catch (err: any) {
          // AbortErrorの場合はエラーメッセージを表示しない
          if (err.name === 'AbortError') {
            console.log('Fetch aborted');
            return;
          }
          
          setError(err.message || 'An error occurred');
          toast.error('質問の読み込みに失敗しました。');
        } finally {
          setLoading(false);
        }
      };

      fetchQuestions();
    }
  }, [currentPage, propQuestions, fetchFromApi, lastFetchedPage]); // searchParamsとpathnameを依存配列から削除

  // クエリパラメータを更新する関数
  const createPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) {
      params.delete('page');
    } else {
      params.set('page', page.toString());
    }
    return `${pathname}?${params.toString()}`;
  };

  // ページネーションボタン生成ロジック
  const renderPageNumbers = () => {
    if (!data) return null;
    const pageNumbers = [];
    const maxPagesToShow = 5;
    const startPage = Math.max(1, data.currentPage - Math.floor(maxPagesToShow / 2));
    const endPage = Math.min(data.totalPages, startPage + maxPagesToShow - 1);

    // 開始ページが1より大きい場合、最初のページへのリンクを追加
    if (startPage > 1) {
        pageNumbers.push(
            <Link key={1} href={createPageUrl(1)} className="px-3 py-1 border rounded text-sm hover:bg-gray-100">
                1
            </Link>
        );
        if (startPage > 2) {
            pageNumbers.push(<span key="start-ellipsis" className="px-1 py-1">...</span>);
        }
    }

    // 中間のページ番号リンク
    for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(
            i === data.currentPage ? (
              <span
                  key={i}
                  className="px-3 py-1 border rounded text-sm bg-blue-500 text-white"
              >
                  {i}
              </span>
            ) : (
              <Link
                  key={i}
                  href={createPageUrl(i)}
                  className="px-3 py-1 border rounded text-sm hover:bg-gray-100"
              >
                  {i}
              </Link>
            )
        );
    }

    // 終了ページが総ページ数より小さい場合、最後のページへのリンクを追加
    if (endPage < data.totalPages) {
        if (endPage < data.totalPages - 1) {
            pageNumbers.push(<span key="end-ellipsis" className="px-1 py-1">...</span>);
        }
        pageNumbers.push(
            <Link key={data.totalPages} href={createPageUrl(data.totalPages)} className="px-3 py-1 border rounded text-sm hover:bg-gray-100">
                {data.totalPages}
            </Link>
        );
    }
    return pageNumbers;
  };

  if (loading) return <p className="text-center mt-8">質問を読み込み中...</p>;
  if (error) return <p className="text-center text-red-500 mt-8">エラー: {error}</p>;
  
  // データが無い場合のメッセージを明確化
  if (!data || data.questions.length === 0) {
    return <p className="text-center mt-8">現在表示できる質問がありません。</p>;
  }

  return (
    <div className="w-full max-w-4xl mx-auto mt-8">
      <h2 className="text-2xl font-semibold mb-6">質問リスト</h2>
      <ul className="space-y-4">
        {data.questions.map((q) => (
          <li key={q._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
            <Link href={`/questions/${q._id}`} className="block">
              <h3 className="text-xl font-medium text-blue-600 hover:underline mb-1">{q.title}</h3>
            </Link>
            {q.tags && q.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {q.tags.map(tag => (
                  <Link 
                    key={tag} 
                    href={`/tags/${encodeURIComponent(tag)}`} 
                    className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded hover:bg-blue-200 transition-colors"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            )}
            <p className="text-gray-700 truncate mb-2">{q.content}</p>
            <div className="text-sm text-gray-500 flex justify-between">
              <span>
                投稿者: {q.author?.name || q.author?.email || '匿名'}
              </span>
              <span>
                投稿日時: {new Date(q.createdAt).toLocaleString('ja-JP')}
              </span>
            </div>
          </li>
        ))}
      </ul>

      {/* ページネーション UI をリンクベースに変更 */}
      {data && data.totalPages > 1 && fetchFromApi && (
        <div className="mt-8 flex justify-center items-center gap-2">
          {data.currentPage > 1 ? (
            <Link
              href={createPageUrl(data.currentPage - 1)}
              className="px-4 py-1 border rounded text-sm hover:bg-gray-100"
            >
              前へ
            </Link>
          ) : (
            <span className="px-4 py-1 border rounded text-sm opacity-50 cursor-not-allowed">
              前へ
            </span>
          )}
          
          {renderPageNumbers()}
          
          {data.currentPage < data.totalPages ? (
            <Link
              href={createPageUrl(data.currentPage + 1)}
              className="px-4 py-1 border rounded text-sm hover:bg-gray-100"
            >
              次へ
            </Link>
          ) : (
            <span className="px-4 py-1 border rounded text-sm opacity-50 cursor-not-allowed">
              次へ
            </span>
          )}
        </div>
      )}
    </div>
  );
} 