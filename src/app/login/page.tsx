'use client'; // This needs to be a client component to use hooks

import { useState, useEffect, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import LoginForm from '@/components/auth/LoginForm';

// Define a loading component to show while the LoginForm is loading
function LoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
         {/* You can add a spinner or a simple text */}
         <p className="text-center text-gray-500">読み込み中...</p>
      </div>
    </div>
  );
}

// The page itself remains a server component (or can be client, but doesn't need hooks)
export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      {/* Wrap the component that uses useSearchParams in Suspense */}
      <Suspense fallback={<LoadingFallback />}>
        <LoginForm />
      </Suspense>
    </div>
  );
} 