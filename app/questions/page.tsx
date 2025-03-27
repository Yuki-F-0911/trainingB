import { Suspense } from 'react';
import QuestionsContent from './QuestionsContent';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '質問一覧 | トレーニング掲示板',
  description: 'マラソンを中心とする市民ランナーのトレーニングに関する質問一覧',
};

export default function QuestionsPage() {
  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <QuestionsContent />
    </Suspense>
  );
} 