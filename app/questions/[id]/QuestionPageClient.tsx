'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { QuestionDetail } from '@/app/components/questions/QuestionDetail';

interface QuestionPageClientProps {
  questionId: string;
}

export default function QuestionPageClient({ questionId }: QuestionPageClientProps) {
  const searchParams = useSearchParams();
  
  // useEffectを使ってIDをURLに追加
  useEffect(() => {
    // IDが有効な場合、search paramsに追加
    if (questionId && questionId !== 'undefined' && questionId !== 'null') {
      console.log('[QuestionPageClient] 有効なID:', questionId);
      
      // 現在のURLを取得
      const url = new URL(window.location.href);
      
      // search paramsにidを設定
      if (!url.searchParams.has('id')) {
        url.searchParams.set('id', questionId);
        
        // 履歴を更新せずにURLを変更（replaceStateを使用）
        window.history.replaceState({}, '', url.toString());
        console.log('[QuestionPageClient] URLを更新:', url.toString());
      }
    }
  }, [questionId]);
  
  return (
    <div className="space-y-8">
      <QuestionDetail />
    </div>
  );
} 