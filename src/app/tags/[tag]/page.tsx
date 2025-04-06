'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import QuestionList from '@/components/QuestionList'; // 質問リストコンポーネントをインポート
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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totalQuestions, setTotalQuestions] = useState(0);

    // useSearchParamsはリレンダリングごとに新しいオブジェクトを返すため、
    // その値を直接依存配列に使用せず、実際の値だけを使用する
    useEffect(() => {
        let isMounted = true;
        let abortController = new AbortController();

        const fetchQuestionsByTag = async () => {
            if (!tag) return;
            setLoading(true);
            setError(null);
            try {
                console.log(`Fetching questions for tag: ${tag}, page: ${page}`);
                const response = await fetch(
                    `/api/questions/tags/${encodeURIComponent(tag)}?page=${page}`, 
                    { signal: abortController.signal }
                );
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to fetch questions for this tag');
                }
                
                const data: TagPageResponse = await response.json();
                
                if (isMounted) {
                    setQuestions(data.questions || []);
                    setTotalQuestions(data.totalQuestions || 0);
                }
            } catch (err: any) {
                if (err.name !== 'AbortError' && isMounted) {
                    setError(err.message || 'An error occurred');
                    toast.error(`質問の読み込みエラー: ${err.message}`);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchQuestionsByTag();

        return () => {
            isMounted = false;
            abortController.abort();
        };
    }, [tag, page]); // 明示的にtagとpageだけを依存配列に含める

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
                    <QuestionList questions={questions} fetchFromApi={false} />
                ) : (
                    <p className="text-center text-gray-600 py-10">このタグが付いた質問はまだありません。</p>
                )}
            </div>
        </main>
    );
} 