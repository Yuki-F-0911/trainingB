"use client";

import QuestionForm from "@/components/QuestionForm";
import Link from "next/link";

export default function AskQuestionPage() {
  return (
    <div className="space-y-6">
      {/* ページタイトル */}
      <div className="flex justify-between items-center border-b pb-3">
        <h1 className="text-2xl font-bold text-gray-900">新しい質問を投稿する</h1>
        <Link href="/" className="text-sm text-blue-600 hover:underline">
           &larr; 質問一覧に戻る
        </Link>
      </div>

      {/* 質問投稿フォームをカード内に表示 */}
      <div className="bg-white shadow-sm rounded-lg p-6 md:p-8">
        <QuestionForm />
      </div>
    </div>
  );
} 