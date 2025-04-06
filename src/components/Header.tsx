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
    <header className="bg-white shadow-md sticky top-0 z-50"> {/* Add sticky positioning */}
      <nav className="container mx-auto flex items-center justify-between px-4 py-3 sm:px-6"> {/* Remove flex-wrap */}
        {/* Logo/Brand Name */}
        <Link href="/" className="text-xl font-bold text-gray-800 mr-4 shrink-0">
          Training Board
        </Link>

        {/* Search Form - Takes available space */}
        <div className="flex-grow mx-4 max-w-xl"> {/* Adjust classes for flexible width and max width */}
           <form onSubmit={handleSearchSubmit} className="relative">
             <input
               type="search"
               id="search-query"
               name="search-query"
               placeholder="質問を検索..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="w-full rounded-md border border-gray-300 py-1.5 px-3 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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

        {/* Auth Links/User Info */}
        <div className="flex items-center space-x-2 sm:space-x-4 shrink-0"> {/* Remove order classes */}
          {loading && (
            <span className="text-sm text-gray-500">読み込み中...</span>
          )}

          {!loading && session?.user && (
            <>
              {/* "質問する" ボタンを追加 */}
              <Link
                href="/questions/ask" // 質問投稿ページへのリンク
                className="hidden sm:inline-block rounded bg-green-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-600 mr-2"
              >
                質問する
              </Link>
              {/* Display User Image if available */}
              {session.user.image ? (
                 <Image
                   src={session.user.image}
                   alt={session.user.name ?? 'User avatar'}
                   width={32} // Specify width
                   height={32} // Specify height
                   className="h-8 w-8 rounded-full border border-gray-300"
                 />
              ) : (
                 // Placeholder icon if no image - コメントアウトして非表示にする
                 /*
                 <span className="inline-block h-8 w-8 overflow-hidden rounded-full bg-gray-200">
                    <svg className="inline-block h-full w-full text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                       <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                 </span>
                 */
                 null // アイコンを表示しない場合は null を返す
              )}
               {/* Display User Name - hidden on smaller screens */}
              <span className="hidden text-sm font-medium text-gray-700 sm:block">
                 {session.user.name || session.user.email?.split('@')[0]} {/* Show name or email part */}
              </span>
              {/* Logout Button */}
              <button
                onClick={() => signOut({ callbackUrl: '/' })} // Redirect to home after logout
                className="rounded bg-red-500 px-2 py-1 text-sm text-white hover:bg-red-600 sm:px-3"
              >
                ログアウト
              </button>
            </>
          )}

          {!loading && !session?.user && (
            <>
              {/* Login Button */}
              <button
                onClick={() => signIn()} // Redirects to /login page defined in authOptions
                className="rounded border border-blue-500 px-2 py-1 text-sm text-blue-500 hover:bg-blue-50 sm:px-3"
              >
                ログイン
              </button>
              {/* Signup Link */}
              <Link
                href="/signup"
                className="rounded bg-blue-500 px-2 py-1 text-sm text-white hover:bg-blue-600 sm:px-3"
              >
                新規登録
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
} 