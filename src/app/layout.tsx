import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import AuthProvider from "@/components/AuthProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

// Google Analyticsの測定ID
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export const metadata: Metadata = {
  metadataBase: new URL('https://www.training-board-test.com'),
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
    url: 'https://www.training-board-test.com',
  },
  twitter: {
    card: "summary_large_image",
    title: "トレーニング掲示板 | ランニング・マラソンQ&A",
    description: "ランニングやマラソンに関する質問や回答を共有できる掲示板です。",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        <link
          rel="preload"
          href="/_next/static/css/8b54669db085020c.css"
          as="style"
        />
        {/* Google Analytics */}
        {GA_MEASUREMENT_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_MEASUREMENT_ID}', {
                  page_path: window.location.pathname,
                });
              `}
            </Script>
          </>
        )}
      </head>
      <body className={`${inter.className} min-h-screen bg-gray-50`}>
        <AuthProvider>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Toaster position="top-center" />
                {children}
              </div>
            </main>
            <Footer />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
