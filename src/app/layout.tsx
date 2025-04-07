import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import { Toaster } from 'react-hot-toast';
import Header from "@/components/Header";

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
