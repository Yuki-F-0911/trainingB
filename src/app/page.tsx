"use client"; // クライアントコンポーネントにする

import { useState, useEffect } from 'react'; // useEffectも追加 
import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link"; // Linkを追加
import QuestionForm from "@/components/QuestionForm"; // QuestionForm をインポート
import QuestionList from "@/components/QuestionList"; // QuestionList をインポート
import { IQuestion } from '@/models/Question'; // IQuestion型をインポート
import toast from 'react-hot-toast'; // トースト通知をインポート

export default function Home() {
  const { data: session, status } = useSession();
  // QuestionList を再レンダリングするためのキー
  const [questionListKey, setQuestionListKey] = useState(Date.now());

  const handleQuestionPosted = () => {
    // 質問が投稿されたらキーを更新して QuestionList を再取得させる
    setQuestionListKey(Date.now());
    // 必要であればtoast通知などをここに追加
  };

  if (status === "loading") {
    return <p className="text-center py-10">Loading...</p>;
  }

  return (
    <main className="flex flex-col items-center p-4 sm:p-8">
      {/* メインコンテンツ */}
      <div className="w-full max-w-3xl space-y-6">
        {/* 質問投稿フォーム (ログイン時のみ表示) - カードスタイルを適用 */}
        {status === 'authenticated' && (
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h2 className="text-xl font-semibold mb-4">質問を投稿する</h2>
            <QuestionForm onQuestionPosted={handleQuestionPosted} />
          </div>
        )}
        {/* 質問リスト - APIから自動的に質問を取得 - カードスタイルを適用 */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
           <QuestionList key={questionListKey} fetchFromApi={true} />
        </div>
      </div>
    </main>
  );
}
