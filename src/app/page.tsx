"use client"; // クライアントコンポーネントにする

import { useState } from 'react'; // useState をインポート
import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link"; // Linkを追加
import QuestionForm from "@/components/QuestionForm"; // QuestionForm をインポート
import QuestionList from "@/components/QuestionList"; // QuestionList をインポート

export default function Home() {
  const { data: session, status } = useSession();
  // QuestionList を再レンダリングするためのキー
  const [questionListKey, setQuestionListKey] = useState(Date.now());

  const handleQuestionPosted = () => {
    // 質問が投稿されたらキーを更新して QuestionList を再取得させる
    setQuestionListKey(Date.now());
  };

  if (status === "loading") {
    return <p className="text-center py-10">Loading...</p>;
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-6 sm:p-12 md:p-24">
      {/* ヘッダー部分: ログイン状態表示 */}
      <header className="w-full max-w-5xl flex justify-between items-center mb-10 pb-4 border-b">
        <h1 className="text-3xl font-bold">
          <Link href="/">Training Board</Link>
        </h1>
        <div>
          {session ? (
            <div className="flex items-center gap-4">
              <span>{session.user?.name ?? session.user?.email}</span>
              {session.user?.isAdmin && (
                <Link href="/admin" className="text-sm text-red-600 hover:underline">
                  (管理者)
                </Link>
              )}
              <button
                onClick={() => signOut()}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-1 px-3 rounded text-sm"
              >
                ログアウト
              </button>
            </div>
          ) : (
            <button
              onClick={() => signIn()} // デフォルトのログインページへ
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm"
            >
              ログイン
            </button>
          )}
        </div>
      </header>

      {/* メインコンテンツ */}
      <div className="w-full max-w-5xl">
        {/* 質問投稿フォーム (ログイン時のみ表示) */}
        {status === 'authenticated' && (
          <QuestionForm onQuestionPosted={handleQuestionPosted} />
        )}
        {/* 質問リスト */}
        <QuestionList key={questionListKey} />
      </div>

    </main>
  );
}
