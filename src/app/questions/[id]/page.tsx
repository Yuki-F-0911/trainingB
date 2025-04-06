"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation'; // useSearchParams ではなく useParams を使う
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css'; // QuillのCSSをインポート

// React-Quill をクライアントサイドでのみ動作するようにダイナミックインポート
const ReactQuill = dynamic(() => import('react-quill'), {
  ssr: false,
  loading: () => <div className="h-32 border border-gray-300 rounded-md animate-pulse bg-gray-50"></div>
});

// 型定義 (仮。APIルートや別ファイルで共通化推奨)
interface Answer {
    _id: string;
    content: string;
    user?: { _id: string; name?: string; email: string } | null;
    createdAt: string;
    likes: number;
    likedBy?: string[]; // いいねした人のID配列
    isBestAnswer?: boolean; // ベストアンサーかどうか
}

interface Question {
    _id: string;
    title: string;
    content: string;
    author?: { _id: string; name?: string; email: string } | null;
    createdAt: string;
    answers: Answer[]; // 回答リストを含むように変更 (API側でのpopulateが必要)
    tags: string[]; // tags プロパティを追加
    bestAnswer?: string; // ベストアンサーのID
}

// --- 回答投稿フォームコンポーネント --- (このファイル内に定義)
function AnswerForm({ questionId, onAnswerPosted }: { questionId: string, onAnswerPosted: () => void }) {
    const { data: session, status } = useSession();
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [contentError, setContentError] = useState('');

    // Quill エディタのモジュール設定
    const modules = {
        toolbar: [
            ['bold', 'italic', 'underline'],
            [{'list': 'ordered'}, {'list': 'bullet'}],
            ['link', 'code-block'],
            ['clean']
        ],
    };

    // Quill エディタのフォーマット設定
    const formats = [
        'bold', 'italic', 'underline',
        'list', 'bullet',
        'link', 'code-block'
    ];

    // コンテンツの変更をハンドリング（エラーチェックを含む）
    const handleContentChange = (value: string) => {
        setContent(value);
        // HTML要素を除去してテキストのみを取得し、最低文字数をチェック
        const textContent = value.replace(/<[^>]*>/g, '').trim();
        if (textContent.length < 10) {
            setContentError('回答内容は10文字以上入力してください');
        } else {
            setContentError('');
        }
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (status !== 'authenticated') {
            toast.error('回答するにはログインが必要です。');
            return;
        }
        setIsSubmitting(true);
        const loadingToast = toast.loading('回答を投稿しています...');

        try {
            const response = await fetch(`/api/questions/${questionId}/answers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to post answer');
            }
            toast.success('回答を投稿しました！', { id: loadingToast });
            setContent('');
            setContentError('');
            onAnswerPosted(); // 親コンポーネントに通知して再取得を促す
        } catch (error: any) {
            toast.error(`投稿エラー: ${error.message}`, { id: loadingToast });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (status !== 'authenticated') {
        return <p className="text-gray-600 mt-4">回答するにはログインしてください。</p>;
    }

    return (
        <form onSubmit={handleSubmit} className="mt-6">
            <h3 className="text-lg font-semibold mb-2">回答を投稿する</h3>
            <ReactQuill
                theme="snow"
                value={content}
                onChange={handleContentChange}
                modules={modules}
                formats={formats}
                placeholder="回答を入力してください"
                className="h-32 mb-10"
            />
            {contentError && (
                <p className="text-red-500 text-sm mt-1">{contentError}</p>
            )}
            <button
                type="submit"
                disabled={isSubmitting || !content || contentError !== ''}
                className="mt-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
                {isSubmitting ? '投稿中...' : '回答する'}
            </button>
        </form>
    );
}

// --- 個別質問ページ本体 --- 
export default function QuestionPage() {
    const params = useParams();
    const questionId = params?.id as string; // params.id を取得
    const [question, setQuestion] = useState<Question | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { data: session } = useSession();
    const currentUserId = session?.user?.id;
    const isAuthor = question?.author?._id === currentUserId;

    const fetchQuestionData = async () => {
        if (!questionId) return;
        setLoading(true);
        setError(null);
        try {
            // APIルートを実装する必要あり: GET /api/questions/[id]
            const response = await fetch(`/api/questions/${questionId}`);
            if (!response.ok) {
                if(response.status === 404) throw new Error('Question not found');
                throw new Error('Failed to fetch question details');
            }
            const data: Question = await response.json();
            console.log('Fetched question data:', data);
            setQuestion(data);
        } catch (err: any) {
            setError(err.message || 'An error occurred');
            toast.error('質問の読み込みに失敗しました。');
        } finally {
            setLoading(false);
        }
    };

    // 回答にいいねする関数
    const handleLikeAnswer = async (answerId: string) => {
        if (!session) {
            toast.error('いいねするにはログインが必要です');
            return;
        }

        try {
            const response = await fetch(`/api/questions/${questionId}/answers/${answerId}/like`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to like answer');
            }

            // 成功したら質問データを再取得
            await fetchQuestionData();
            toast.success('いいねしました！');
        } catch (error: any) {
            toast.error(`エラー: ${error.message}`);
        }
    };

    // ベストアンサーに設定する関数
    const handleSetBestAnswer = async (answerId: string) => {
        if (!session || !isAuthor) {
            toast.error('ベストアンサーを選択できるのは質問の投稿者のみです');
            return;
        }

        try {
            const response = await fetch(`/api/questions/${questionId}/best-answer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answerId }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to set best answer');
            }

            // 成功したら質問データを再取得
            await fetchQuestionData();
            toast.success('ベストアンサーを設定しました！');
        } catch (error: any) {
            toast.error(`エラー: ${error.message}`);
        }
    };

    useEffect(() => {
        fetchQuestionData();
    }, [questionId]);

    if (loading) return <p className="text-center py-10">質問を読み込み中...</p>;
    if (error) return <p className="text-center text-red-500 py-10">エラー: {error}</p>;
    if (!question) return <p className="text-center py-10">質問が見つかりませんでした。</p>;

    return (
        <main className="flex min-h-screen flex-col items-center p-6 sm:p-12 md:p-24">
             <header className="w-full max-w-4xl mb-8">
                <Link href="/" className="text-blue-600 hover:underline">
                    &larr; 質問リストに戻る
                </Link>
            </header>

            <div className="w-full max-w-4xl bg-white shadow-md rounded-lg p-6 md:p-8">
                {/* 質問詳細 */}
                <h1 className="text-2xl md:text-3xl font-bold mb-3">{question.title}</h1>
                {/* タグ表示をリンクに変更 */}
                {question.tags && question.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                        {question.tags.map(tag => (
                            <Link 
                                key={tag} 
                                href={`/tags/${encodeURIComponent(tag)}`} 
                                className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded hover:bg-blue-200 transition-colors duration-150"
                            >
                                {tag}
                            </Link>
                        ))}
                    </div>
                )}
                <div className="text-sm text-gray-500 mb-4">
                    <span>投稿者: {question.author?.name || question.author?.email || '匿名'}</span>
                    <span className="ml-4">投稿日時: {new Date(question.createdAt).toLocaleString('ja-JP')}</span>
                </div>
                <div className="prose max-w-none mb-8">
                    {/* ここでは単純にテキスト表示。Markdown対応が必要ならライブラリ導入 */}
                    <p>{question.content}</p>
                </div>

                <hr className="my-6 md:my-8"/>

                {/* 回答リスト */}
                <h2 className="text-xl font-semibold mb-4">回答 ({question.answers.length})</h2>
                {question.answers.length > 0 ? (
                    <ul className="space-y-6">
                        {question.answers.map(answer => (
                            <li key={answer._id} className={`border-t border-gray-200 pt-4 ${answer.isBestAnswer || answer._id === question.bestAnswer ? 'bg-green-50 p-4 rounded-lg border border-green-200' : ''}`}>
                                {(answer.isBestAnswer || answer._id === question.bestAnswer) && (
                                    <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium inline-block mb-3">
                                        ✓ ベストアンサー
                                    </div>
                                )}
                                <div className="prose max-w-none mb-2">
                                    <p>{answer.content}</p>
                                </div>
                                <div className="flex justify-between items-center mt-4">
                                    <div className="text-sm text-gray-500">
                                        <span>回答者: {answer.user?.name || answer.user?.email || '匿名'}</span>
                                        <span className="ml-4">回答日時: {new Date(answer.createdAt).toLocaleString('ja-JP')}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button 
                                            className={`flex items-center gap-1 text-sm px-3 py-1 rounded ${
                                                answer.likedBy?.includes(currentUserId as string) 
                                                    ? 'bg-blue-100 text-blue-700' 
                                                    : 'bg-gray-100 hover:bg-gray-200'
                                            }`}
                                            onClick={() => handleLikeAnswer(answer._id)}
                                            disabled={!session}
                                        >
                                            <span>👍</span>
                                            <span>いいね！ {answer.likes || 0}</span>
                                        </button>
                                        
                                        {isAuthor && !answer.isBestAnswer && answer._id !== question.bestAnswer && (
                                            <button 
                                                className="bg-green-100 hover:bg-green-200 text-green-800 text-sm px-3 py-1 rounded"
                                                onClick={() => handleSetBestAnswer(answer._id)}
                                            >
                                                ベストアンサーに選ぶ
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-600">まだ回答はありません。</p>
                )}

                {/* 回答投稿フォーム */}
                <AnswerForm questionId={questionId} onAnswerPosted={fetchQuestionData} />
            </div>
        </main>
    );
} 