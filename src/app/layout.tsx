import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import { Toaster } from 'react-hot-toast';
import Header from "@/components/Header";

const inter = Inter({ subsets: ["latin"] });

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
  alternates: {
    canonical: 'https://www.training-board-test.com/',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${inter.className} min-h-screen bg-red-200`}>
        <AuthProvider>
          <Header />
          <main className="container mx-auto px-4 py-8">
            <Toaster position="top-center" />
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
