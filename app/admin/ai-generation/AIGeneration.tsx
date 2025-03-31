"use client";

import { useState } from 'react';
import { toast } from 'react-hot-toast';

export default function AIGeneration() {
  const [loading, setLoading] = useState(false);
  const [batchSize, setBatchSize] = useState(1);
  const [result, setResult] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [savedQuestions, setSavedQuestions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const generateQuestion = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    
    try {
      console.log('質問生成APIを呼び出します');
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'question',
          batchSize: batchSize
        }),
      });
      
      // レスポンスの解析
      const responseData = await response.json();
      
      if (!response.ok) {
        console.error('API呼び出しエラー:', responseData);
        throw new Error(responseData.error || '質問の生成に失敗しました');
      }
      
      console.log('質問生成完了:', responseData);
      setResult(responseData);
      toast.success(`${batchSize > 1 ? `${responseData.length}個の質問` : '質問'}が生成されました`);
      
    } catch (error: any) {
      console.error('質問生成エラー:', error);
      setError(error.message || '質問の生成中にエラーが発生しました');
      toast.error(error.message || '質問の生成中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };
  
  // 生成された質問をデータベースに保存する関数
  const saveToDatabase = async (question: any) => {
    if (savedQuestions.includes(question.title)) {
      toast.error('この質問はすでに保存されています');
      return;
    }
    
    setSaving(true);
    
    try {
      const response = await fetch('/api/ai/saveToDatabase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(question),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'データベースへの保存に失敗しました');
      }
      
      const data = await response.json();
      setSavedQuestions([...savedQuestions, question.title]);
      toast.success('質問がデータベースに保存されました');
      
    } catch (error: any) {
      console.error('保存エラー:', error);
      toast.error(error.message || 'データベースへの保存中にエラーが発生しました');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">AI質問生成</h2>
      
      <div className="mb-4">
        <label htmlFor="batchSize" className="block text-sm font-medium text-gray-700 mb-1">
          生成数
        </label>
        <select
          id="batchSize"
          value={batchSize}
          onChange={(e) => setBatchSize(Number(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          disabled={loading}
        >
          {[1, 3, 5, 10].map((size) => (
            <option key={size} value={size}>
              {size}個
            </option>
          ))}
        </select>
      </div>
      
      <button
        onClick={generateQuestion}
        disabled={loading}
        className={`w-full py-2 px-4 rounded-md ${
          loading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        } transition-colors duration-200`}
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            生成中...
          </span>
        ) : (
          '質問を生成'
        )}
      </button>
      
      {error && (
        <div className="mt-4 p-3 border border-red-300 bg-red-50 rounded-md">
          <h3 className="text-red-700 text-md font-medium">エラーが発生しました</h3>
          <p className="text-red-600 mt-1 text-sm whitespace-pre-wrap">{error}</p>
          <div className="mt-2 text-sm text-gray-500">
            <p>以下をご確認ください：</p>
            <ul className="list-disc list-inside mt-1 ml-2">
              <li>Gemini APIキーが正しく設定されているか</li>
              <li>インターネット接続が安定しているか</li>
              <li>APIの利用制限に達していないか</li>
            </ul>
          </div>
        </div>
      )}
      
      {result && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-2">生成結果</h3>
          
          {Array.isArray(result) ? (
            <div className="space-y-4">
              {result.map((item, index) => (
                <div key={index} className="border p-4 rounded-md">
                  <h4 className="font-semibold text-md">{item.title}</h4>
                  <p className="mt-2 text-gray-600 whitespace-pre-wrap">{item.content}</p>
                  <p className="mt-2 text-sm text-gray-500">
                    生成タイプ: {item.personality || 'ランダム'}
                  </p>
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => saveToDatabase(item)}
                      disabled={saving || savedQuestions.includes(item.title)}
                      className={`text-sm px-2 py-1 rounded ${
                        savedQuestions.includes(item.title)
                          ? 'bg-green-100 text-green-700 cursor-not-allowed'
                          : saving
                          ? 'bg-gray-100 text-gray-500 cursor-wait'
                          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }`}
                    >
                      {savedQuestions.includes(item.title)
                        ? '保存済み'
                        : saving
                        ? '保存中...'
                        : 'DBに保存'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="border p-4 rounded-md">
              <h4 className="font-semibold text-md">{result.title}</h4>
              <p className="mt-2 text-gray-600 whitespace-pre-wrap">{result.content}</p>
              <p className="mt-2 text-sm text-gray-500">
                生成タイプ: {result.personality || 'ランダム'}
              </p>
              <div className="mt-3 flex justify-end">
                <button
                  onClick={() => saveToDatabase(result)}
                  disabled={saving || savedQuestions.includes(result.title)}
                  className={`text-sm px-2 py-1 rounded ${
                    savedQuestions.includes(result.title)
                      ? 'bg-green-100 text-green-700 cursor-not-allowed'
                      : saving
                      ? 'bg-gray-100 text-gray-500 cursor-wait'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                >
                  {savedQuestions.includes(result.title)
                    ? '保存済み'
                    : saving
                    ? '保存中...'
                    : 'DBに保存'}
                </button>
              </div>
            </div>
          )}
          
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => {
                setResult(null);
                setSavedQuestions([]);
              }}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              クリア
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 