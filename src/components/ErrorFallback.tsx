'use client';

export default function ErrorFallback() {
  return (
    <div className="text-center py-8">
      <p className="text-red-500 mb-4">質問の読み込み中にエラーが発生しました</p>
      <button
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        再読み込み
      </button>
    </div>
  );
} 