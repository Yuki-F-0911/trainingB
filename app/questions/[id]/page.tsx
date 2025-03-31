'use client';

import { Metadata } from 'next';
import { QuestionDetail } from '@/app/components/questions/QuestionDetail';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

interface Props {
  params: {
    id: string;
  };
}

// メタデータを動的に生成
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    // idが無効な場合はデフォルトのメタデータを返す
    const questionId = params.id;
    if (!questionId || questionId === 'undefined') {
      console.error('generateMetadata: 無効な質問ID', questionId);
      return {
        title: '質問詳細',
        description: '質問の詳細ページです',
      };
    }

    // デバッグログの追加
    console.log('質問メタデータ生成のID:', questionId);
    
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'https://training-board-server.vercel.app/api'}/questions/${questionId}`;
    console.log('APIリクエストURL:', apiUrl);
    
    const response = await fetch(apiUrl, {
      cache: 'no-store',
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    const question = data.question || data;
    
    return {
      title: question?.title || '質問詳細',
      description: question?.content?.substring(0, 160) || '質問の詳細ページです',
    };
  } catch (error) {
    console.error('メタデータ生成エラー:', error);
    return {
      title: '質問詳細',
      description: '質問の詳細ページです',
    };
  }
}

export default function QuestionPage({ params }: Props) {
  // IDを明示的に文字列として扱う
  const questionId = String(params.id);
  const searchParams = useSearchParams();
  
  // useEffectを使ってIDをURLに追加
  useEffect(() => {
    // IDが有効な場合、search paramsに追加
    if (questionId && questionId !== 'undefined' && questionId !== 'null') {
      console.log('[QuestionPage] 有効なID:', questionId);
      
      // 現在のURLを取得
      const url = new URL(window.location.href);
      
      // search paramsにidを設定
      if (!url.searchParams.has('id')) {
        url.searchParams.set('id', questionId);
        
        // 履歴を更新せずにURLを変更（replaceStateを使用）
        window.history.replaceState({}, '', url.toString());
        console.log('[QuestionPage] URLを更新:', url.toString());
      }
    }
  }, [questionId]);
  
  return (
    <div className="space-y-8">
      <QuestionDetail />
    </div>
  );
} 