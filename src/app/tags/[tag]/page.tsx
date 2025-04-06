'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import QuestionList from '@/components/QuestionList'; // 質問リストコンポーネントをインポート
import Pagination from '@/components/Pagination'; // ページネーションコンポーネントをインポート
import { IQuestion } from '@/models/Question'; // Questionの型定義をインポート

interface TagPageResponse {
    questions: IQuestion[];
    currentPage: number;
    totalPages: number;
    totalQuestions: number;
}

export default function TagPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const tag = params?.tag ? decodeURIComponent(params.tag as string) : '';
    const page = parseInt(searchParams.get('page') || '1', 10);

    const [questions, setQuestions] = useState<IQuestion[]>([]);
    const [currentPage, setCurrentPage] = useState(page);
    const [totalPages, setTotalPages] = useState(1);
    const [totalQuestions, setTotalQuestions] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchQuestionsByTag = async () => {
            if (!tag) return;
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(`/api/questions/tags/${encodeURIComponent(tag)}?page=${currentPage}`);
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to fetch questions for this tag');
                }
                const data: TagPageResponse = await response.json();
                setQuestions(data.questions || []);
                setCurrentPage(data.currentPage || 1);
                setTotalPages(data.totalPages || 1);
                setTotalQuestions(data.totalQuestions || 0);
            } catch (err: any) {
                setError(err.message || 'An error occurred');
                toast.error(`質問の読み込みエラー: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchQuestionsByTag();
    }, [tag, currentPage]); // tagまたはcurrentPageが変わったら再取得

    if (loading) return <p className="text-center py-10">読み込み中...</p>;
    if (error) return <p className="text-center text-red-500 py-10">エラー: {error}</p>;

    return (
        <main className="flex min-h-screen flex-col items-center p-6 sm:p-12 md:p-24">
            <header className="w-full max-w-4xl mb-8">
                <Link href="/" className="text-blue-600 hover:underline mb-4 block">
                    &larr; 質問リストに戻る
                </Link>
                <h1 className="text-2xl md:text-3xl font-bold mb-3">
                    タグ: <span className="bg-blue-100 text-blue-800 text-lg font-medium px-2.5 py-1 rounded">{tag}</span>
                </h1>
                <p className="text-gray-600">（{totalQuestions} 件の質問）</p>
            </header>

            <div className="w-full max-w-4xl">
                {questions.length > 0 ? (
                    <>
                        <QuestionList questions={questions} />
                        {totalPages > 1 && (
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                baseHref={`/tags/${encodeURIComponent(tag)}`}
                            />
                        )}
                    </>
                ) : (
                    <p className="text-center text-gray-600 py-10">このタグが付いた質問はまだありません。</p>
                )}
            </div>
        </main>
    );
} 