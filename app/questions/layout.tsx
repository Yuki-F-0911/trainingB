import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '質問一覧 | トレーニング掲示板',
  description: 'マラソンを中心とする市民ランナーのトレーニングに関する質問一覧',
};

export default function QuestionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
    </>
  );
} 