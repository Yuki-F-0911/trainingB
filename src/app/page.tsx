"use client"; // クライアントコンポーネントにする

import { useState, useEffect } from 'react'; // useEffectも追加 
import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link"; // Linkを追加
// import QuestionForm from "@/components/QuestionForm"; // QuestionForm のインポートをコメントアウトまたは削除
import QuestionList from "@/components/QuestionList"; // QuestionList をインポート
import { IQuestion } from '@/models/Question'; // IQuestion型をインポート
import toast from 'react-hot-toast'; // トースト通知をインポート

export default function Home() {
  const { status } = useSession();

  return (
    <div className="space-y-6">
      {/* ページ上部のアクション（例：質問するボタン）- モバイル表示用 */}
      {status === 'authenticated' && (
        <div className="sm:hidden text-right mb-4">
          <Link
             href="/questions/ask"
             className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
           >
             質問する
           </Link>
        </div>
      )}

      {/* 質問リストコンポーネント */}
      <QuestionList fetchFromApi={true} />
    </div>
  );
}
