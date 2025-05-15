import { Metadata } from 'next';
import QuestionList from "@/components/QuestionList";

export const metadata: Metadata = {
  title: "トレーニング掲示板 | ランニング・マラソンQ&A",
  description: "ランニングやマラソンに関する質問や回答を共有できる掲示板です。初心者から上級者まで、ランニングに関するあらゆる疑問にお答えします。",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    }
  },
  openGraph: {
    title: "トレーニング掲示板 | ランニング・マラソンQ&A",
    description: "ランニングやマラソンに関する質問や回答を共有できる掲示板です。",
    type: "website",
    locale: "ja_JP",
    siteName: "トレーニング掲示板",
  },
  twitter: {
    card: "summary_large_image",
    title: "トレーニング掲示板 | ランニング・マラソンQ&A",
    description: "ランニングやマラソンに関する質問や回答を共有できる掲示板です。",
  },
};

export default function Home() {
  return <QuestionList fetchFromApi={true} />;
}
