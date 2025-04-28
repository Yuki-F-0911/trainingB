import Link from "next/link";
import type { Metadata } from "next";
import QuestionModel from '@/models/Question';
import { notFound } from "next/navigation";

export default async function QuestionPage({ params }: { params: { id: string } }) {
  const { id } = params;
  // DBから質問データを取得
  const question = await QuestionModel.findById(id).lean();
  if (!question) {
    // 存在しない場合は404を返す (Next.js 13+ の notFoundヘルパーを利用)
    notFound();
  }
    return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">{question.title}</h1>
      <div className="prose mb-6">{question.content}</div>
      <Link href="/questions" className="text-blue-600 hover:underline">
        &larr; 質問一覧に戻る
      </Link>
    </main>
  );
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const id = params.id;
  return {
    title: `質問詳細 - ${id}`,
    description: `質問ID ${id} の詳細ページです。`,
    alternates: { canonical: `https://www.training-board-test.com/questions/${id}` },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
      },
    },
  };
} 