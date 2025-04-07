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
    const questionId = params?.id as string;
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

    if (loading) return <div className="text-center py-10"><p className="text-gray-500">質問を読み込み中...</p></div>;
    if (error) return <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert"><p>エラー: {error}</p></div>;
    if (!question) return <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert"><p>質問が見つかりませんでした。</p></div>;

    // 回答をベストアンサー優先でソート
    const sortedAnswers = [...question.answers].sort((a, b) => {
      if (a._id === question.bestAnswer) return -1;
      if (b._id === question.bestAnswer) return 1;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    return (
        <div className="space-y-8">
            {/* 質問セクション */}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                <div className="px-6 py-5 border-b">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{question.title}</h1>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                        <span>投稿者: <span className="font-medium text-gray-800">{question.author?.name || question.author?.email || '匿名'}</span></span>
                        <span>投稿日時: {new Date(question.createdAt).toLocaleString('ja-JP')}</span>
                        {question.tags && question.tags.length > 0 && (
                           <div className="flex items-center gap-1">
                             <span>タグ:</span>
                             {question.tags.map(tag => (
                               <Link key={tag} href={`/tags/${encodeURIComponent(tag)}`} className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs hover:bg-gray-200">
                                 {tag}
                               </Link>
                             ))}
                           </div>
                        )}
                    </div>
                </div>
                <div className="px-6 py-6">
                     {/* 質問内容 (リッチテキスト表示) */}
                    <div
                        className="prose prose-sm sm:prose max-w-none ql-editor"
                        dangerouslySetInnerHTML={{ __html: question.content || '' }}
                    />
                </div>
            </div>

            {/* 回答セクション */}
            <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">{sortedAnswers.length}件の回答</h2>

                {sortedAnswers.length > 0 ? (
                    <ul className="space-y-6">
                        {sortedAnswers.map(answer => (
                            <li key={answer._id} id={`answer-${answer._id}`} className={`bg-white shadow-sm rounded-lg overflow-hidden ${answer._id === question.bestAnswer ? 'border-2 border-green-500' : 'border border-gray-200'}`}>
                                <div className={`px-5 py-4 ${answer._id === question.bestAnswer ? 'bg-green-50' : ''}`}>
                                    {answer._id === question.bestAnswer && (
                                        <div className="inline-flex items-center bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold mb-3">
                                            <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                                            ベストアンサー
                                        </div>
                                    )}
                                    <div
                                        className="prose prose-sm sm:prose max-w-none mb-4 ql-editor"
                                        dangerouslySetInnerHTML={{ __html: answer.content || '' }}
                                    />
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-4 border-t border-gray-200 pt-4">
                                        <div className="text-xs text-gray-500 mb-3 sm:mb-0">
                                            <span className="font-medium text-gray-700 mr-2">{answer.user?.name || answer.user?.email || '匿名'}</span>
                                            <span>{new Date(answer.createdAt).toLocaleString('ja-JP')} に回答</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded ${
                                                    answer.likedBy?.includes(currentUserId as string)
                                                        ? 'bg-blue-100 text-blue-700'
                                                        : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                                                }`}
                                                onClick={() => handleLikeAnswer(answer._id)}
                                                disabled={!session}
                                            >
                                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.868.868L6 10.333z"></path></svg>
                                                <span>いいね！ ({answer.likes || 0})</span>
                                            </button>
                                            {isAuthor && !question.bestAnswer && (
                                                <button
                                                    className="bg-green-100 hover:bg-green-200 text-green-700 text-xs px-2.5 py-1 rounded"
                                                    onClick={() => handleSetBestAnswer(answer._id)}
                                                >
                                                    ベストアンサーに選ぶ
                                                </button>
                                            )}
                                            {isAuthor && question.bestAnswer === answer._id && (
                                                <span className="text-green-700 text-xs font-medium">選択済み</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="bg-white shadow-sm rounded-lg p-6 text-center">
                      <p className="text-gray-500">まだ回答はありません。</p>
                    </div>
                )}
            </div>

            {/* 回答投稿フォーム */}
            <div className="bg-white shadow-sm rounded-lg p-6">
                <AnswerForm questionId={questionId} onAnswerPosted={fetchQuestionData} />
            </div>
        </div>
    );
} 