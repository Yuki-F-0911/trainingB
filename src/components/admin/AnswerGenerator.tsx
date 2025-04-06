"use client";

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { IQuestion } from '@/models/Question'; // Import IQuestion instead of Question
import Link from 'next/link';

interface QuestionsApiResponse {
    questions: IQuestion[]; // Use IQuestion
    totalPages: number;
    currentPage?: number;
    totalQuestions?: number;
}

export default function AnswerGenerator() {
    const [questions, setQuestions] = useState<IQuestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generateCount, setGenerateCount] = useState<number>(3); // デフォルト生成数
    const [page, setPage] = useState(1); // ページネーション用
    const [totalPages, setTotalPages] = useState(1);

    const fetchQuestions = async (pageNum = 1) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/questions?page=${pageNum}&limit=10`); // 表示数を調整
            if (!response.ok) {
                 const errorData = await response.text(); // エラー内容を確認
                 throw new Error(`Failed to fetch questions. Status: ${response.status}, Body: ${errorData}`)
            };
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                 throw new Error('Received non-JSON response from server when fetching questions.');
            }
            const data: QuestionsApiResponse = await response.json();
            setQuestions(data.questions || []);
            setTotalPages(data.totalPages || 1);
            setPage(pageNum);
        } catch (error: any) {
            toast.error(`質問の読み込みエラー: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuestions(page);
    }, [page]);

    const handleGenerateAnswers = async () => {
        if (generateCount < 1 || generateCount > 10) {
            toast.error('生成数は1から10の間で指定してください。');
            return;
        }
        setIsGenerating(true);
        const loadingToast = toast.loading(`${generateCount}件の回答を生成中... (時間がかかる場合があります)`);

        try {
            const response = await fetch('/api/admin/generate/answers', { // エンドポイント変更
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ count: generateCount }), // 生成数を送信
            });

            const resultText = await response.text(); // まずテキストで取得
            let result;
            try {
                result = JSON.parse(resultText); // JSONとしてパース試行
            } catch (e) {
                 console.error("Failed to parse JSON response:", resultText);
                 throw new Error(`サーバーからの応答が無効です。 Status: ${response.status}, Body: ${resultText}`);
            }

            if (!response.ok) {
                throw new Error(result.message || '回答の生成に失敗しました。');
            }

            toast.success(result.message || `${result.generatedCount || 0}件の回答を生成しました。`, {
                id: loadingToast
            });
            // 回答生成後に質問リストを再読み込み
            fetchQuestions(page);
        } catch (error: any) {
            toast.error(`回答生成エラー: ${error.message}`, {
                id: loadingToast
            });
            console.error('Error generating answers:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handlePreviousPage = () => {
      if (page > 1) fetchQuestions(page - 1);
    };

    const handleNextPage = () => {
      if (page < totalPages) fetchQuestions(page + 1);
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h2 className="text-2xl font-semibold mb-6">AI 回答生成</h2>

            <div className="mb-6 flex items-center space-x-4">
                <label htmlFor="generate-count" className="font-medium">生成する回答数:</label>
                <input
                    id="generate-count"
                    type="number"
                    min="1"
                    max="10" // APIの上限と合わせる
                    value={generateCount}
                    onChange={(e) => setGenerateCount(parseInt(e.target.value, 10))}
                    className="border rounded px-2 py-1 w-20"
                    disabled={isGenerating}
                />
                <button
                    onClick={handleGenerateAnswers}
                    disabled={isGenerating || loading}
                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isGenerating ? '生成中...' : 'まとめて回答を生成'}
                </button>
            </div>

            {loading && <p>質問を読み込み中...</p>}
            {!loading && questions.length === 0 && <p>回答待ちの質問はありません。</p>}

            {!loading && questions.length > 0 && (
                <>
                    <ul className="space-y-4 mb-6">
                        {questions.map((q) => (
                            <li key={q._id.toString()} className="border p-4 rounded shadow-sm">
                                <Link href={`/questions/${q._id.toString()}`} className="hover:text-blue-600">
                                    <h3 className="text-lg font-semibold mb-2">{q.title}</h3>
                                </Link>
                                <p className="text-gray-600 text-sm mb-2">{new Date(q.createdAt).toLocaleString()}</p>
                                {/* 個別の生成ボタンは削除 */}
                                {/* 既存の回答があるかどうかの表示はあっても良いかも */}
                                {
                                    q.answers && q.answers.length > 0 && (
                                        <p className="text-sm text-green-700 mt-2">{q.answers.length}件の回答あり</p>
                                    )
                                }
                                {
                                     (!q.answers || q.answers.length === 0) && (
                                        <p className="text-sm text-red-700 mt-2">回答なし</p>
                                    )
                                }
                            </li>
                        ))}
                    </ul>

                    {/* ページネーション */}
                    <div className="flex justify-between items-center mt-6">
                        <button
                            onClick={handlePreviousPage}
                            disabled={page <= 1 || loading}
                            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            前のページ
                        </button>
                        <span>ページ {page} / {totalPages}</span>
                        <button
                            onClick={handleNextPage}
                            disabled={page >= totalPages || loading}
                            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            次のページ
                        </button>
                    </div>
                </>
            )}
        </div>
    );
} 