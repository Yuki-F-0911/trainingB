"use client";

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useSession } from 'next-auth/react';

interface AnswerItem {
  _id: string;
  content: string;
  question: string;
  aiPersonality?: string;
  createdAt: string;
  updatedAt: string;
}

export default function AnswerEditor() {
  const { data: session, status } = useSession();
  const [answers, setAnswers] = useState<AnswerItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.isAdmin) {
      fetchAnswers();
    }
  }, [status, session]);

  const fetchAnswers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/answers');
      if (!res.ok) throw new Error('回答の取得に失敗しました');
      const data = await res.json();
      setAnswers(data.answers);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (answer: AnswerItem) => {
    setEditingId(answer._id);
    setEditedContent(answer.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditedContent('');
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/answers/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editedContent }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || '更新に失敗しました');
      }
      toast.success('回答を更新しました');
      cancelEdit();
      fetchAnswers();
    } catch (e: any) {
      toast.error(`更新エラー: ${e.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (status === 'loading' || loading) {
    return <p>読み込み中...</p>;
  }

  if (status !== 'authenticated' || !session?.user?.isAdmin) {
    return <p>権限がありません。</p>;
  }

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-semibold mb-4">AI生成回答編集</h2>
      {answers.length === 0 && <p>編集可能なAI生成回答はありません。</p>}
      {answers.map(answer => (
        <div key={answer._id} className="border p-4 mb-4 rounded">
          {editingId === answer._id ? (
            <>
              <textarea
                className="w-full border rounded p-2 mb-2"
                rows={5}
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                disabled={isSaving}
              />
              <div className="flex space-x-2">
                <button
                  onClick={saveEdit}
                  disabled={isSaving}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                >
                  {isSaving ? '保存中...' : '保存'}
                </button>
                <button
                  onClick={cancelEdit}
                  disabled={isSaving}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
                >
                  キャンセル
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="mb-2 whitespace-pre-wrap">{answer.content}</p>
              <button
                onClick={() => startEdit(answer)}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded"
              >
                編集
              </button>
            </>
          )}
        </div>
      ))}
    </div>
  );
} 