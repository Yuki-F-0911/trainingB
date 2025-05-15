import { Suspense } from 'react';
import Link from "next/link";
import QuestionList from "@/components/QuestionList";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { ErrorBoundary } from "@//components/ErrorBoundary";

// クライアントコンポーネントとして質問ボタンを分離
const AskQuestionButton = () => {
  return (
    <div className="sm:hidden text-right mb-4">
      <Link
        href="/questions/ask"
        className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
      >
        質問する
      </Link>
    </div>
  );
};

// ローディング状態のコンポーネント
const LoadingState = () => (
  <div className="animate-pulse">
    <div className="h-8 bg-gray-200 rounded mb-4"></div>
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white p-4 rounded shadow">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      ))}
    </div>
  </div>
);

export default async function QuestionsPage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="space-y-6">
      {session?.user && <AskQuestionButton />}
      <ErrorBoundary fallback={<div>質問の読み込み中にエラーが発生しました。後でもう一度お試しください。</div>}>
        <Suspense fallback={<LoadingState />}>
          <QuestionList fetchFromApi={true} />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
} 