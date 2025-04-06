"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css'; // QuillのCSSをインポート

// React-Quill をクライアントサイドでのみ動作するようにダイナミックインポート
const ReactQuill = dynamic(() => import('react-quill'), { 
  ssr: false,
  loading: () => <div className="h-64 border border-gray-300 rounded-md animate-pulse bg-gray-50"></div>
});

interface QuestionFormProps {
  onSuccess?: () => void;
  onQuestionPosted?: () => void;
}

export default function QuestionForm({ onSuccess, onQuestionPosted }: QuestionFormProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contentError, setContentError] = useState('');

  // Quill エディタのモジュール設定
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{'list': 'ordered'}, {'list': 'bullet'}],
      ['link', 'code-block'],
      ['clean']
    ],
  };

  // Quill エディタのフォーマット設定
  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'link', 'code-block'
  ];

  // コンテンツの変更をハンドリング（エラーチェックを含む）
  const handleContentChange = (value: string) => {
    setContent(value);
    // HTML要素を除去してテキストのみを取得し、最低文字数をチェック
    const textContent = value.replace(/<[^>]*>/g, '').trim();
    if (textContent.length < 10) {
      setContentError('質問内容は10文字以上入力してください');
    } else {
      setContentError('');
    }
  };

  // ログインしていない場合はログインを促す
  if (status === 'unauthenticated') {
    return (
      <div className="text-center p-4 bg-gray-50 rounded-lg">
        <p className="text-gray-700 mb-2">質問を投稿するにはログインが必要です。</p>
        <button
          onClick={() => router.push('/login')}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          ログインする
        </button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const loadingToast = toast.loading('質問を投稿しています...');

    try {
      // タグを配列に変換 (カンマ区切り)
      const tagArray = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content,
          tags: tagArray,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '質問の投稿に失敗しました');
      }

      toast.success('質問を投稿しました！', { id: loadingToast });
      setTitle('');
      setContent('');
      setTags('');

      // 成功時のコールバックがあれば実行
      if (onSuccess) {
        onSuccess();
      }
      
      // 質問投稿後のコールバックがあれば実行
      if (onQuestionPosted) {
        onQuestionPosted();
      }

      // 投稿が成功したら質問一覧ページにリダイレクト
      router.push('/');
      router.refresh();
    } catch (error: any) {
      toast.error(`エラー: ${error.message}`, { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-2xl">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          タイトル <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          disabled={isSubmitting}
          minLength={5}
          maxLength={150}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="質問のタイトルを入力してください"
        />
      </div>

      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
          質問内容 <span className="text-red-500">*</span>
        </label>
        <ReactQuill
          theme="snow"
          value={content}
          onChange={handleContentChange}
          modules={modules}
          formats={formats}
          placeholder="質問内容を入力してください（マークダウン記法が使えます）"
          className="h-64 mb-10"
        />
        {contentError && (
          <p className="text-red-500 text-sm mt-1">{contentError}</p>
        )}
      </div>

      <div>
        <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
          タグ (カンマ区切りで複数入力可能)
        </label>
        <input
          type="text"
          id="tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          disabled={isSubmitting}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="例: トレーニング,ダイエット,食事"
        />
        <p className="text-sm text-gray-500 mt-1">
          関連するキーワードを入力すると、質問が見つけやすくなります
        </p>
      </div>

      <div className="pt-4">
        <button
          type="submit"
          disabled={isSubmitting || !title || !content || contentError !== ''}
          className="w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isSubmitting ? '投稿中...' : '質問を投稿する'}
        </button>
      </div>
    </form>
  );
} 