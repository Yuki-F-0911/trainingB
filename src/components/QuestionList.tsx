"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';

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

export default function QuestionList() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/questions?page=${page}&limit=10`); // ページとリミットを指定
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
      } catch (err: any) {
        setError(err.message || 'An error occurred');
        toast.error('質問の読み込みに失敗しました。');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [page]); // page が変更されたら再取得

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (data && page < data.totalPages) {
      setPage(page + 1);
    }
  };

  // --- ページネーションボタン生成ロジック --- 
  const renderPageNumbers = () => {
    if (!data) return null;
    const pageNumbers = [];
    const maxPagesToShow = 5; // 表示する最大ページ番号数
    const startPage = Math.max(1, data.currentPage - Math.floor(maxPagesToShow / 2));
    const endPage = Math.min(data.totalPages, startPage + maxPagesToShow - 1);

    // 開始ページが1より大きい場合、最初のページへのボタンを追加
    if (startPage > 1) {
        pageNumbers.push(
            <button key={1} onClick={() => setPage(1)} className="px-3 py-1 border rounded text-sm hover:bg-gray-100">
                1
            </button>
        );
        if (startPage > 2) {
            pageNumbers.push(<span key="start-ellipsis" className="px-1 py-1">...</span>);
        }
    }

    // 中間のページ番号ボタン
    for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(
            <button
                key={i}
                onClick={() => setPage(i)}
                disabled={i === data.currentPage}
                className={`px-3 py-1 border rounded text-sm ${i === data.currentPage ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}
            >
                {i}
            </button>
        );
    }

    // 終了ページが総ページ数より小さい場合、最後のページへのボタンを追加
    if (endPage < data.totalPages) {
        if (endPage < data.totalPages - 1) {
            pageNumbers.push(<span key="end-ellipsis" className="px-1 py-1">...</span>);
        }
        pageNumbers.push(
            <button key={data.totalPages} onClick={() => setPage(data.totalPages)} className="px-3 py-1 border rounded text-sm hover:bg-gray-100">
                {data.totalPages}
            </button>
        );
    }
    return pageNumbers;
};

  if (loading) return <p className="text-center mt-8">質問を読み込み中...</p>;
  if (error) return <p className="text-center text-red-500 mt-8">エラー: {error}</p>;
  if (!data || data.questions.length === 0) return <p className="text-center mt-8">まだ質問がありません。</p>;

  return (
    <div className="w-full max-w-4xl mx-auto mt-8">
      <h2 className="text-2xl font-semibold mb-6">質問リスト</h2>
      <ul className="space-y-4">
        {data.questions.map((q) => (
          <li key={q._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
            <Link href={`/questions/${q._id}`} className="block">
              <h3 className="text-xl font-medium text-blue-600 hover:underline mb-1">{q.title}</h3>
              {q.tags && q.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {q.tags.map(tag => (
                    <span key={tag} className="bg-gray-200 text-gray-700 text-xs font-medium px-2 py-0.5 rounded">
                      {tag}
                    </span>
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
            </Link>
          </li>
        ))}
      </ul>

      {/* ページネーション UI を改善 */}
      {data && data.totalPages > 1 && (
        <div className="mt-8 flex justify-center items-center gap-2">
          <button
            onClick={handlePreviousPage}
            disabled={page === 1}
            className="px-4 py-1 border rounded text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            前へ
          </button>
          {renderPageNumbers()} 
          <button
            onClick={handleNextPage}
            disabled={page === data.totalPages}
            className="px-4 py-1 border rounded text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            次へ
          </button>
        </div>
      )}
    </div>
  );
} 