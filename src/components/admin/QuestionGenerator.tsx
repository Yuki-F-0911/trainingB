"use client";

import React, { useState } from 'react';
import toast from 'react-hot-toast';

export default function QuestionGenerator() {
  const [count, setCount] = useState<number>(1);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    const loadingToast = toast.loading(`${count}件の質問を生成中... (時間がかかる場合があります)`);

    try {
      const response = await fetch('/api/admin/generate/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to generate questions');
      }

      toast.success(`${result.questions?.length || 0} 件の質問を生成・保存しました！`, { 
        id: loadingToast,
        duration: 5000 // 長めに表示
      });
      // TODO: 必要であれば生成された質問リストを表示するなどの処理を追加
      console.log('Generated questions:', result.questions);

    } catch (error: any) {
      console.error('Error generating questions:', error);
      toast.error(`質問生成エラー: ${error.message}`, { id: loadingToast });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="border rounded-lg p-4 shadow-sm">
      <h3 className="text-lg font-medium mb-3">AIで質問を生成</h3>
      <div className="flex items-center gap-4">
        <div>
          <label htmlFor="question-count" className="block text-sm font-medium text-gray-700 mb-1">
            生成数:
          </label>
          <select
            id="question-count"
            value={count}
            onChange={(e) => setCount(parseInt(e.target.value, 10))}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            disabled={isGenerating}
          >
            <option value={1}>1</option>
            <option value={3}>3</option>
            <option value={5}>5</option>
            <option value={10}>10</option>
          </select>
        </div>
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="self-end py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
        >
          {isGenerating ? '生成中...' : '生成開始'}
        </button>
      </div>
    </div>
  );
} 