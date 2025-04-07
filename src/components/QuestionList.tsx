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
  
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
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
    if (sort === 'newest') {
      params.delete('sort');
    } else {
      params.set('sort', sort);
    }
    return `${pathname}?${params.toString()}`;
  };

  // 並び替え選択時の処理
  const handleSortChange = (sort: SortOption) => {
    router.push(createPageUrl(1, sort));
  };

  // ページネーションボタン生成ロジック
  const renderPageNumbers = () => {
    if (!data) return null;
    const pageNumbers = [];
    const maxPagesToShow = 5;
    const startPage = Math.max(1, data.currentPage - Math.floor(maxPagesToShow / 2));
    const endPage = Math.min(data.totalPages, startPage + maxPagesToShow - 1);

    if (startPage > 1) {
        pageNumbers.push(
            <Link key={1} href={createPageUrl(1)} className="px-4 py-2 border rounded hover:bg-gray-100">
                1
            </Link>
        );
        if (startPage > 2) {
            pageNumbers.push(<span key="start-ellipsis" className="px-1 py-1">...</span>);
        }
    }
    for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(
            i === data.currentPage ? (
              <span key={i} className="px-4 py-2 border rounded bg-blue-500 text-white">{i}</span>
            ) : (
              <Link key={i} href={createPageUrl(i)} className="px-4 py-2 border rounded hover:bg-gray-100">{i}</Link>
            )
        );
    }
    if (endPage < data.totalPages) {
        if (endPage < data.totalPages - 1) {
            pageNumbers.push(<span key="end-ellipsis" className="px-1 py-1">...</span>);
        }
        pageNumbers.push(
            <Link key={data.totalPages} href={createPageUrl(data.totalPages)} className="px-4 py-2 border rounded hover:bg-gray-100">
                {data.totalPages}
            </Link>
        );
    }
    return pageNumbers;
  };

  if (loading) return <p className="text-center mt-8 text-gray-500">質問を読み込み中...</p>;
  if (error) return <p className="text-center text-red-500 mt-8">エラー: {error}</p>;
  if (!data || data.questions.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-8 text-center">
        <p className="text-gray-500">現在表示できる質問がありません。</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      {/* List Header: Sorting Options */}
      <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-700">質問一覧</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">並び替え:</span>
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value as SortOption)}
            className="border border-gray-300 rounded px-2 py-1 text-sm bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="newest">新着順</option>
            <option value="most_answers">回答数順</option>
            <option value="unanswered">未回答</option>
          </select>
        </div>
      </div>

      {/* Question List Table/Rows */}
      <ul>
        {data.questions.map((question) => (
          <li key={question._id} className="border-b last:border-b-0 hover:bg-gray-50 transition-colors">
            <div className="flex items-center px-6 py-4">
              {/* Author Avatar (optional) */}
              {/* <div className="mr-4 shrink-0">
                <span className="inline-block h-10 w-10 rounded-full bg-gray-200"></span>
              </div> */} 
              
              {/* Main Content: Title, Tags, Author */}
              <div className="flex-1 min-w-0">
                <Link href={`/questions/${question._id}`} className="block group">
                  <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600 truncate mb-1">
                    {question.title}
                  </h3>
                </Link>
                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                  {question.tags && question.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {question.tags.slice(0, 3).map((tag) => ( // Show max 3 tags
                        <span key={tag} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                      {question.tags.length > 3 && (
                         <span className="text-xs text-gray-400">...</span>
                      )}
                    </div>
                  )}
                  <span className="hidden sm:inline">・</span>
                  <span>
                    投稿者: {question.author?.name || question.author?.email?.split('@')[0] || '匿名'}
                  </span>
                  <span>・</span>
                   <span>{new Date(question.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Stats: Answers, Views (Views not implemented yet) */}
              <div className="ml-4 flex shrink-0 items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center gap-1" title="回答数">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                     <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                   </svg>
                  <span>{question.answers?.length || 0}</span>
                </div>
                {/* <div className="flex items-center gap-1" title="閲覧数">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                     <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                     <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                   </svg>
                  <span>...</span> 
                </div> */} 
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* Pagination */} 
      {data.totalPages > 1 && (
        <div className="px-6 py-4 border-t bg-gray-50">
          <nav className="flex justify-center items-center space-x-3">
            {data.currentPage > 1 ? (
              <Link href={createPageUrl(data.currentPage - 1)} className="px-4 py-2 border rounded hover:bg-gray-100">前へ</Link>
            ) : (
              <span className="px-4 py-2 border rounded text-gray-400 cursor-not-allowed">前へ</span>
            )}
            {renderPageNumbers()}
            {data.currentPage < data.totalPages ? (
              <Link href={createPageUrl(data.currentPage + 1)} className="px-4 py-2 border rounded hover:bg-gray-100">次へ</Link>
            ) : (
              <span className="px-4 py-2 border rounded text-gray-400 cursor-not-allowed">次へ</span>
            )}
          </nav>
        </div>
      )}
    </div>
  );
} 