'use client'; // To use hooks like useSession

import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';
import Image from 'next/image'; // Import Image component
import { useState, FormEvent } from 'react'; // useState と FormEvent をインポート
import { useRouter } from 'next/navigation'; // useRouter をインポート

export default function Header() {
  // useSession フックからセッション状態とステータスを取得
  const { data: session, status } = useSession();
  const loading = status === 'loading'; // Check if session is loading
  const router = useRouter(); // useRouter フックを使用
  const [searchQuery, setSearchQuery] = useState(''); // 検索クエリの状態

  // 検索フォームの送信ハンドラ
  const handleSearchSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // デフォルトのフォーム送信をキャンセル
    if (!searchQuery.trim()) return; // クエリが空または空白のみの場合は何もしない
    router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`); // /search ページに遷移
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Left Section: Logo and Navigation */}
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-2xl font-bold text-gray-800">
              Training Board
            </Link>
            {/* Add main navigation links here if needed */}
            {/* Example: */}
            {/* <nav className="hidden md:flex space-x-4">
              <Link href="/categories" className="text-gray-600 hover:text-gray-900">カテゴリ</Link>
              <Link href="/tags" className="text-gray-600 hover:text-gray-900">タグ</Link>
            </nav> */}
          </div>

          {/* Center Section: Search Bar */}
          <div className="flex-1 px-4 lg:px-12">
            <form onSubmit={handleSearchSubmit} className="relative w-full max-w-lg mx-auto">
              <input
                type="search"
                placeholder="質問を検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-full border border-gray-300 bg-gray-50 py-2 pl-4 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
              />
              <button
                type="submit"
                className="absolute inset-y-0 right-0 flex items-center justify-center px-3 text-gray-400 hover:text-gray-600"
                aria-label="検索"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
              </button>
            </form>
          </div>

          {/* Right Section: Actions and User Menu */}
          <div className="flex items-center space-x-4">
            {/* Ask Question Button (Visible when logged in) */}
            {status === 'authenticated' && (
              <Link
                href="/questions/ask"
                className="hidden sm:inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                質問する
              </Link>
            )}

            {/* User Menu / Login/Signup */}
            <div className="relative">
              {loading && (
                <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse"></div>
              )}
              {!loading && session?.user && (
                <MenuButton session={session} />
              )}
              {!loading && !session?.user && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => signIn()}
                    className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
                  >
                    ログイン
                  </button>
                  <Link
                    href="/signup"
                    className="rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-200"
                  >
                    新規登録
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

// Simple Dropdown Menu Button Component (can be moved to a separate file)
function MenuButton({ session }: { session: any }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        <span className="sr-only">ユーザーメニューを開く</span>
        {session.user.image ? (
          <Image
            src={session.user.image}
            alt="User avatar"
            width={32}
            height={32}
            className="h-8 w-8 rounded-full"
          />
        ) : (
          // Default Icon (simple circle for now)
          <span className="inline-block h-8 w-8 overflow-hidden rounded-full bg-gray-300">
            <svg className="h-full w-full text-gray-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="user-menu-button"
          tabIndex={-1}
        >
          <div className="px-4 py-2 text-sm text-gray-700 border-b">
            <p className="font-medium">{session.user.name || 'ユーザー'}</p>
            <p className="text-xs text-gray-500 truncate">{session.user.email}</p>
          </div>
          {/* Add other menu items like Profile, Settings here */}
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
            role="menuitem"
            tabIndex={-1}
          >
            ログアウト
          </button>
        </div>
      )}
    </div>
  );
} 