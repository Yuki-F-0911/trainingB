"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import QuestionList from "@/components/QuestionList";

export default function QuestionsPage() {
  const { status } = useSession();

  return (
    <div>
      {status === 'authenticated' && (
        <div className="sm:hidden text-right mb-4">
          <Link
            href="/questions/ask"
            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          >
            質問する
          </Link>
        </div>
      )}
      <QuestionList fetchFromApi={true} />
    </div>
  );
} 