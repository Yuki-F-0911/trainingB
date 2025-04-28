import Link from "next/link";

export default function DashboardPage() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">ダッシュボード</h1>
      <p>このページはダッシュボードのスタブです。コンテンツを追加してください。</p>
      <Link href="/">ホームに戻る</Link>
    </main>
  );
} 