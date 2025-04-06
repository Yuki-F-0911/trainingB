'use client'; // To use hooks like useSession

import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';
import Image from 'next/image'; // Import Image component

export default function Header() {
  // useSession フックからセッション状態とステータスを取得
  const { data: session, status } = useSession();
  const loading = status === 'loading'; // Check if session is loading

  return (
    <header className="bg-white shadow-md sticky top-0 z-50"> {/* Add sticky positioning */}
      <nav className="container mx-auto flex items-center justify-between px-4 sm:px-6 py-3">
        {/* Logo/Brand Name */}
        <Link href="/" className="text-xl font-bold text-gray-800 hover:text-blue-600">
          Training Board
        </Link>

        {/* Auth Links/User Info */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {loading && (
            <div className="h-8 w-20 animate-pulse rounded bg-gray-200"></div> // Simple loading placeholder
          )}

          {!loading && session?.user && (
            <>
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
                 // Placeholder icon if no image
                 <span className="inline-block h-8 w-8 overflow-hidden rounded-full bg-gray-200">
                    <svg className="h-full w-full text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                       <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                 </span>
              )}
               {/* Display User Name - hidden on smaller screens */}
              <span className="hidden text-sm font-medium text-gray-700 sm:block">
                 {session.user.name || session.user.email?.split('@')[0]} {/* Show name or email part */}
              </span>
              {/* Logout Button */}
              <button
                onClick={() => signOut({ callbackUrl: '/' })} // Redirect to home after logout
                className="flex items-center rounded bg-red-500 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
              >
                 <svg xmlns="http://www.w3.org/2000/svg" className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                 </svg>
                ログアウト
              </button>
            </>
          )}

          {!loading && !session?.user && (
            <>
              {/* Login Button */}
              <button
                onClick={() => signIn()} // Redirects to /login page defined in authOptions
                className="rounded border border-blue-500 px-3 py-1.5 text-sm font-medium text-blue-500 transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
              >
                ログイン
              </button>
              {/* Signup Link */}
              <Link
                href="/signup"
                className="rounded bg-blue-500 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
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