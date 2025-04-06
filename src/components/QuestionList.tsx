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
  answers?: any[]; // 回答数用に追加
  // 他のフィールドも必要に応じて追加
}

// ソートオプション追加
type SortOption = 'newest' | 'most_answers' | 'unanswered';

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
  
  // 並び替えオプションをURLから取得（デフォルトは新着順）
  const sortBy = searchParams.get('sort') as SortOption || 'newest';
  
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(fetchFromApi);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchedPage, setLastFetchedPage] = useState<number | null>(null);
  const [lastSortOption, setLastSortOption] = useState<SortOption | null>(null);

  // コンポーネントがアンマウントされたときにフェッチを中止
  useEffect(() => {
    return () => {
      if (abortController) {
        abortController.abort();
        abortController = null;
      }
    };
  }, []);

  // 初回マウント時と、URLのページパラメータやソートオプションが変わったときのみデータを取得
  useEffect(() => {
    // propQuestionsが提供され、APIからのフェッチが不要な場合はそれを使用
    if (propQuestions.length > 0 && !fetchFromApi) {
      setData(convertQuestionsToApiResponse(propQuestions));
      setLoading(false);
      return;
    }

    // 既に同じページのデータを取得済みなら再取得しない
    if (fetchFromApi && (lastFetchedPage !== currentPage || lastSortOption !== sortBy)) {
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
          console.log(`Fetching page ${currentPage} with sort option ${sortBy}...`); // デバッグ用ログ
          
          // ソートオプションをクエリに追加
          const response = await fetch(`/api/questions?page=${currentPage}&limit=10&sort=${sortBy}`, {
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
          setLastSortOption(sortBy); // 取得した並び順を記録
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
  }, [currentPage, propQuestions, fetchFromApi, lastFetchedPage, sortBy, lastSortOption]); // 依存配列にsortByとlastSortOptionを追加

  // クエリパラメータを更新する関数
  const createPageUrl = (page: number, sort: SortOption = sortBy) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) {
      params.delete('page');
    } else {
      params.set('page', page.toString());
    }
    
    // ソートオプションを設定
    if (sort === 'newest') {
      params.delete('sort'); // デフォルト値の場合はクエリパラメータから削除
    } else {
      params.set('sort', sort);
    }
    
    return `${pathname}?${params.toString()}`;
  };

  // 並び替え選択時の処理
  const handleSortChange = (sort: SortOption) => {
    router.push(createPageUrl(1, sort)); // ソート変更時は1ページ目に戻す
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
    return <p className="text-center mt-8 text-gray-500">現在表示できる質問がありません。</p>;
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h2 className="text-2xl font-semibold">質問リスト</h2>
        <div className="flex gap-2 items-center">
          <span className="text-sm text-gray-600">並び替え:</span>
          <select 
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value as SortOption)}
            className="border border-gray-300 rounded px-3 py-1.5 text-sm bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="newest">新着順</option>
            <option value="most_answers">回答数順</option>
            <option value="unanswered">未回答のみ</option>
          </select>
        </div>
      </div>
      <ul className="space-y-4">
        {data.questions.map((q) => (
          <li key={q._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow duration-200 bg-white">
            <Link href={`/questions/${q._id}`} className="block mb-2">
              <h3 className="text-lg font-medium text-blue-700 hover:text-blue-800 hover:underline">{q.title}</h3>
            </Link>
            {q.tags && q.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {q.tags.map(tag => (
                  <Link 
                    key={tag} 
                    href={`/tags/${encodeURIComponent(tag)}`} 
                    className="bg-gray-100 text-gray-700 text-xs font-medium px-2.5 py-1 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            )}
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">{q.content}</p>
            <div className="text-xs text-gray-500 flex justify-between items-center border-t pt-3 mt-3">
              <span>
                投稿者: {q.author?.name || q.author?.email || '匿名'}
              </span>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-3.04 8.25-7.125 8.25a9.75 9.75 0 0 1-3.375 0C5.04 20.25 2 16.556 2 12c0-4.556 3.04-8.25 7.125-8.25a9.75 9.75 0 0 1 3.375 0C17.96 3.75 21 7.444 21 12Z" />
                  </svg>
                  {q.answers?.length || 0}
                </span>
                <span>
                  {new Date(q.createdAt).toLocaleString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* ページネーション UI */}
      {data && data.totalPages > 1 && fetchFromApi && (
        <div className="mt-10 flex justify-center items-center gap-2">
          {data.currentPage > 1 ? (
            <Link
              href={createPageUrl(data.currentPage - 1)}
              className="px-4 py-2 border rounded-md text-sm hover:bg-gray-100 transition-colors duration-150"
            >
              前へ
            </Link>
          ) : (
            <span className="px-4 py-2 border rounded-md text-sm text-gray-400 bg-gray-50 cursor-not-allowed">
              前へ
            </span>
          )}
          
          {renderPageNumbers()?.map((el, index) => 
            <React.Fragment key={index}>{el}</React.Fragment>)
          }
          
          {data.currentPage < data.totalPages ? (
            <Link
              href={createPageUrl(data.currentPage + 1)}
              className="px-4 py-2 border rounded-md text-sm hover:bg-gray-100 transition-colors duration-150"
            >
              次へ
            </Link>
          ) : (
            <span className="px-4 py-2 border rounded-md text-sm text-gray-400 bg-gray-50 cursor-not-allowed">
              次へ
            </span>
          )}
        </div>
      )}
    </div>
  );
} 