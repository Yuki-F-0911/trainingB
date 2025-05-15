import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "質問一覧 | トレーニング掲示板",
  description: "ランニングやマラソンに関する質問一覧です。初心者から上級者まで、ランニングに関するあらゆる疑問にお答えします。",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    }
  },
  openGraph: {
    title: "質問一覧 | トレーニング掲示板",
    description: "ランニングやマラソンに関する質問一覧です。",
    type: "website",
    locale: "ja_JP",
    siteName: "トレーニング掲示板",
  },
  twitter: {
    card: "summary_large_image",
    title: "質問一覧 | トレーニング掲示板",
    description: "ランニングやマラソンに関する質問一覧です。",
  },
};

export default function QuestionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 