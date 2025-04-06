"use client";

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useSession } from "next-auth/react"; // セッション情報を取得

export default function QuestionForm({ onQuestionPosted }: { onQuestionPosted?: () => void }) {
  const { data: session, status } = useSession(); // セッション取得
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    const loadingToast = toast.loading('質問を投稿しています...');

    // 認証チェック (API側でも行うが、UIでも制限)
    if (status !== 'authenticated') {
      toast.error('質問を投稿するにはログインが必要です。', { id: loadingToast });
      setIsSubmitting(false);
      return;
    }

    // タグをカンマで分割し、トリムして空要素を除去
    const tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');

    try {
      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, content, tags: tagsArray }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to post question');
      }

      toast.success('質問を投稿しました！', { id: loadingToast });
      setTitle('');
      setContent('');
      setTags('');
      // 投稿成功後にリストを更新するためのコールバックを実行 (任意)
      if (onQuestionPosted) {
        onQuestionPosted();
      }

    } catch (error: any) {
      console.error('Error posting question:', error);
      toast.error(`投稿エラー: ${error.message || '不明なエラー'}`, { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ログインしていない場合はフォームを表示しない
  if (status !== 'authenticated') {
      return (
          <div className="w-full max-w-xl mx-auto mt-8 p-6 bg-yellow-100 border border-yellow-300 rounded-lg text-center">
              <p className="text-yellow-800">質問を投稿するにはログインしてください。</p>
          </div>
      );
  }

  return (
    <div className="w-full max-w-xl mx-auto mt-8">
      <h2 className="text-2xl font-semibold mb-6">新しい質問を投稿</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            タイトル
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            disabled={isSubmitting}
          />
        </div>
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
            内容
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={5}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            disabled={isSubmitting}
          />
        </div>
        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
            タグ (カンマ区切り)
          </label>
          <input
            type="text"
            id="tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="例: トレーニング, シューズ, 初心者"
            disabled={isSubmitting}
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting || !title || !content || !tags}
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? '投稿中...' : '投稿する'}
        </button>
      </form>
    </div>
  );
} 