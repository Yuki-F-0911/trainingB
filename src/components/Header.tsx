'use client'; // To use hooks like useSession

import Link from 'next/link';
import { useState, FormEvent } from 'react'; // useState と FormEvent をインポート
import { useRouter } from 'next/navigation'; // useRouter をインポート

export default function Header() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  // 検索フォームの送信ハンドラ
  const handleSearchSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-6">
          
          {/* サイトタイトル */}
          <div className="flex-shrink-0">
            <Link 
              href="/" 
              className="text-xl font-bold text-blue-600 hover:text-blue-700 transition-colors"
            >
              トレーニング掲示板
            </Link>
          </div>

          {/* 検索バー */}
          <div className="flex-1 max-w-2xl">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="search"
                placeholder="質問を検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pr-10 text-sm border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </form>
          </div>

          {/* 質問するボタン */}
          <div className="flex-shrink-0">
            <Link
              href="/questions/ask"
              className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors min-w-0"
            >
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="whitespace-nowrap">質問する</span>
            </Link>
          </div>

        </div>
      </div>
    </header>
  );
} 