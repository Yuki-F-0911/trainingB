import { useState } from 'react';
import { toast } from 'react-hot-toast';

export default function AIGeneration() {
  const [loading, setLoading] = useState(false);
  const [batchSize, setBatchSize] = useState(1);

  const generateQuestion = async () => {
    setLoading(true);

    try {
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

      if (response.status !== 200) {
          let errorMsg = 'リクエストの送信に失敗しました';
          try {
              const errorData = await response.json();
              errorMsg = errorData.error || errorMsg;
          } catch (parseErr) {
              // Ignore if response body is not json
          }
          throw new Error(`${errorMsg} (Status: ${response.status})`);
      }

      const data = await response.json();
      toast.success(data.message || 'AI生成が完了しました');
      console.log('生成結果:', data);

    } catch (error: any) {
      console.error('質問生成リクエストエラー:', error);
      toast.error(error.message || 'リクエスト送信中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">AI質問生成 (非同期)</h2>
      
      <div className="mb-4 p-3 bg-gray-50 rounded-md">
        <p className="text-sm text-gray-700">
           リクエストされた質問はバックグラウンドで生成され、データベースに保存されます。
           結果は質問リストページなどで確認してください。
        </p>
      </div>
      
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
            リクエスト送信中...
          </span>
        ) : (
          '質問生成をリクエスト'
        )}
      </button>
    </div>
  );
} 