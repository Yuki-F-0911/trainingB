import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import { Toaster } from 'react-hot-toast';
import Header from "@/components/Header";
import { Providers } from './providers';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Training Board",
  description: "Marathon and running Q&A board",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${inter.className} min-h-screen bg-gray-50`}>
        <Providers>
          <AuthProvider>
            <Header />
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <Toaster position="top-center" />
              {children}
            </main>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
