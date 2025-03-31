"use client";

import { useState } from 'react';
import { toast } from 'react-hot-toast';

export default function AutoAnswerGenerator() {
  const [loading, setLoading] = useState(false);
  const [limit, setLimit] = useState(3);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const generateAutoAnswers = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    
    try {
      console.log('自動回答生成APIを呼び出します');
      const response = await fetch('/api/ai/autoAnswer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          limit: limit
        }),
      });
      
      // レスポンスの解析
      const responseData = await response.json();
      
      if (!response.ok) {
        console.error('API呼び出しエラー:', responseData);
        throw new Error(responseData.error || '回答の生成に失敗しました');
      }
      
      console.log('回答生成完了:', responseData);
      setResult(responseData);
      
      // 成功した回答数をカウント
      const successCount = responseData.results ? responseData.results.filter((r: any) => r.success).length : 0;
      toast.success(`${successCount}件の回答が生成されました`);
      
    } catch (error: any) {
      console.error('回答生成エラー:', error);
      setError(error.message || '回答の生成中にエラーが発生しました');
      toast.error(error.message || '回答の生成中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">AI回答自動生成</h2>
      
      <div className="mb-4 p-3 bg-gray-50 rounded-md">
        <p className="text-sm text-gray-700">
          <span className="font-medium">機能概要:</span> まだ回答がない質問に対して、AIが自動的に回答を生成します。生成された回答は「市民ランナー」「専門家」「BACKAGINGトレーナー」のいずれかのパーソナリティで作成されます。
        </p>
      </div>
      
      <div className="mb-4">
        <label htmlFor="limit" className="block text-sm font-medium text-gray-700 mb-1">
          生成数 (最大)
        </label>
        <select
          id="limit"
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          disabled={loading}
        >
          {[1, 3, 5, 10, 20].map((size) => (
            <option key={size} value={size}>
              {size}個
            </option>
          ))}
        </select>
        <p className="mt-1 text-sm text-gray-500">
          まだ回答がない質問の中から、指定した数だけ回答を生成します。
        </p>
      </div>
      
      <button
        onClick={generateAutoAnswers}
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
            回答生成中...
          </span>
        ) : (
          '回答を自動生成'
        )}
      </button>
      
      {error && (
        <div className="mt-4 p-3 border border-red-300 bg-red-50 rounded-md">
          <h3 className="text-red-700 text-md font-medium">エラーが発生しました</h3>
          <p className="text-red-600 mt-1 text-sm whitespace-pre-wrap">{error}</p>
        </div>
      )}
      
      {result && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-2">生成結果</h3>
          
          {result.results && result.results.length > 0 ? (
            <div className="space-y-4">
              {result.results.map((item: any, index: number) => (
                <div 
                  key={index} 
                  className={`border p-4 rounded-md ${
                    item.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                  }`}
                >
                  <h4 className="font-semibold text-md">{item.questionTitle}</h4>
                  <p className="mt-1 text-sm text-gray-600">
                    質問ID: {item.questionId}
                  </p>
                  {item.success ? (
                    <>
                      <p className="mt-2 text-sm text-green-600">
                        回答が生成されました (回答ID: {item.answerId})
                      </p>
                      <p className="text-sm text-gray-500">
                        生成タイプ: {item.personality}
                      </p>
                    </>
                  ) : (
                    <p className="mt-2 text-sm text-red-600">
                      エラー: {item.error}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">回答が必要な質問が見つかりませんでした。</p>
          )}
          
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setResult(null)}
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