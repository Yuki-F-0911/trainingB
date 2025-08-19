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
  keywords: "ランニング,マラソン,トレーニング,質問,掲示板,Q&A,ランナー,初心者,上級者",
  authors: [{ name: "トレーニング掲示板" }],
  creator: "トレーニング掲示板",
  publisher: "トレーニング掲示板",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    }
  },
  openGraph: {
    title: "トレーニング掲示板 | ランニング・マラソンQ&A",
    description: "ランニングやマラソンに関する質問や回答を共有できる掲示板です。",
    type: "website",
    locale: "ja_JP",
    siteName: "トレーニング掲示板",
    url: 'https://www.training-board-test.com',
    images: [
      {
        url: 'https://www.training-board-test.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'トレーニング掲示板',
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "トレーニング掲示板 | ランニング・マラソンQ&A",
    description: "ランニングやマラソンに関する質問や回答を共有できる掲示板です。",
    site: "@training_board",
  },
  alternates: {
    canonical: 'https://www.training-board-test.com',
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
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
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1 w-full">
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
