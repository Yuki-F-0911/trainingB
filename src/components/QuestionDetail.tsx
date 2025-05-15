'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { IQuestion } from '@/models/Question';
import { formatDate } from '@//lib/utils';

interface Props {
  question: IQuestion;
}

export default function QuestionDetail({ question }: Props) {
  const { data: session } = useSession();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('この質問を削除してもよろしいですか？')) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/questions/${question._id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('質問の削除に失敗しました');
      }

      window.location.href = '/questions';
    } catch (error) {
      console.error('Error deleting question:', error);
      alert('質問の削除に失敗しました');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-2xl font-bold">{question.title}</h1>
          <div className="flex gap-2">
            {session?.user?.email === question.author?.email && (
              <>
                <Link
                  href={`/questions/${question._id}/edit`}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  編集
                </Link>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                >
                  {isDeleting ? '削除中...' : '削除'}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="prose max-w-none mb-6">
          {question.content}
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {question.tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="text-sm text-gray-500 mb-6">
          <p>投稿者: {question.author?.name || '匿名'}</p>
          <p>投稿日時: {formatDate(question.createdAt)}</p>
        </div>

        <Link
          href="/questions"
          className="text-blue-600 hover:underline"
        >
          &larr; 質問一覧に戻る
        </Link>
      </div>
    </div>
  );
} 