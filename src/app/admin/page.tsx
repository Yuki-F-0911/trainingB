"use client";

import React, { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import QuestionGenerator from '@/components/admin/QuestionGenerator';
import AnswerGenerator from '@/components/admin/AnswerGenerator';

// ここにAI生成をトリガーするコンポーネントを後で追加します。
// import AIService from '@/components/admin/AIService';

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // useEffect をトップレベルに移動
  useEffect(() => {
    // 読み込み中または認証済み管理者の場合は何もしない
    if (status === "loading" || (status === "authenticated" && session?.user?.isAdmin)) {
      return;
    }
    // 上記以外（未認証または非管理者）の場合はリダイレクト
    router.replace('/');
  }, [status, session, router]); // 依存配列に status, session, router を追加

  // セッション読み込み中
  if (status === "loading") {
    return <p className="text-center py-10">Loading...</p>;
  }

  // 未認証または管理者でない場合 (リダイレクトが実行されるまでの表示)
  if (status !== "authenticated" || !session?.user?.isAdmin) {
    return <p className="text-center py-10 text-red-500">アクセス権がありません。リダイレクトします...</p>;
  }

  // 認証済みかつ管理者
  return (
    <main className="flex min-h-screen flex-col items-center p-6 sm:p-12 md:p-24">
      <header className="w-full max-w-4xl mb-8">
        <Link href="/" className="text-blue-600 hover:underline">
            &larr; ホームに戻る
        </Link>
      </header>

      <div className="w-full max-w-4xl bg-white shadow-md rounded-lg p-6 md:p-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">管理者ページ</h1>

        <p className="mb-4">ようこそ、管理者 {session.user.name || session.user.email} さん。</p>

        {/* AI生成機能 */}
        <div className="mt-8 border-t pt-6 space-y-6">
          <h2 className="text-xl font-semibold">AI 生成ツール</h2>
          {/* 質問生成コンポーネント */}
          <QuestionGenerator />
          {/* 回答生成コンポーネント */}
          <AnswerGenerator />
        </div>

        {/* その他の管理者機能 (オプション) */}
        {/* ... */}

      </div>
    </main>
  );
} 