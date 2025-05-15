"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchProfile();
    }
  }, [status, router]);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/users/profile");
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      }
    } catch (error) {
      console.error("プロフィールの取得に失敗しました:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading" || isLoading) {
    return <div className="flex justify-center items-center min-h-screen">読み込み中...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">プロフィール</h1>
      {profile ? (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">基本情報</h2>
            <p className="mt-2">名前: {profile.name}</p>
            <p className="mt-2">メールアドレス: {profile.email}</p>
          </div>
          <div className="mb-4">
            <h2 className="text-lg font-semibold">活動統計</h2>
            <p className="mt-2">投稿した質問: {profile.questionCount || 0}</p>
            <p className="mt-2">投稿した回答: {profile.answerCount || 0}</p>
          </div>
        </div>
      ) : (
        <p>プロフィール情報の取得に失敗しました。</p>
      )}
    </div>
  );
} 