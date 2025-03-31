'use client';

import { useState } from 'react';
import axios from 'axios';

interface Answer {
  id: string;
  content: string;
  createdAt: string;
  author?: {
    name?: string;
  };
  isAIGenerated?: boolean;
  personality?: string;
}

interface AnswerFormProps {
  questionId: string;
  onAnswerSubmit: (answer: Answer) => void;
}

const AnswerForm = ({ questionId, onAnswerSubmit }: AnswerFormProps) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      setError('回答内容を入力してください');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`/api/answers`, {
        questionId,
        content: content.trim(),
      });
      
      // 成功したら入力フォームをクリアして親コンポーネントに通知
      setContent('');
      onAnswerSubmit(response.data);
    } catch (err: any) {
      console.error('回答送信エラー:', err);
      setError(err.response?.data?.message || err.message || '回答の送信中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="あなたの回答を入力してください..."
          rows={6}
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={loading}
        />
      </div>
      
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className={`px-4 py-2 rounded-md text-white ${
            loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? '送信中...' : '回答を投稿'}
        </button>
      </div>
    </form>
  );
};

export default AnswerForm; 