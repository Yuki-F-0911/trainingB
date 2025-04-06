"use client"; // クライアントコンポーネントにする

import { useState, useEffect } from 'react'; // useEffectも追加 
import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link"; // Linkを追加
// import QuestionForm from "@/components/QuestionForm"; // QuestionForm のインポートをコメントアウトまたは削除
import QuestionList from "@/components/QuestionList"; // QuestionList をインポート
import { IQuestion } from '@/models/Question'; // IQuestion型をインポート
import toast from 'react-hot-toast'; // トースト通知をインポート

export default function Home() {
  const { data: session, status } = useSession();
  // QuestionList を再レンダリングするためのキー
  const [questionListKey, setQuestionListKey] = useState(Date.now());

  // 質問投稿ハンドラは不要になるのでコメントアウトまたは削除
  // const handleQuestionPosted = () => {
  //   setQuestionListKey(Date.now());
  // };

  if (status === "loading") {
    return <p className="text-center py-10">Loading...</p>;
  }

  return (
    <main className="flex flex-col items-center p-4 sm:p-8">
      {/* メインコンテンツ */}
      <div className="w-full max-w-3xl space-y-6">
        {/* 質問投稿フォームを削除 */}

        {/* 質問リスト - ラップしているdivのスタイルを削除 */}
        {/* <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200"> */}
           <QuestionList key={questionListKey} fetchFromApi={true} />
        {/* </div> */}
      </div>
    </main>
  );
}
