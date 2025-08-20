'use client';

import { useUser } from '@/contexts/user-context';
import Image from 'next/image';
import Link from 'next/link';

export default function AppHeader() {
  const { user } = useUser();

  return (
    <div className="flex justify-between items-center mb-8 max-w-md mx-auto">
      <div className="flex items-center space-x-3">
        {user.isLoading ? (
          <div className="w-8 h-8 rounded-full bg-slate-700 animate-pulse" />
        ) : (
          <Image
            src={user.data?.pfp_url || '/images/icon.png'}
            alt="Profile"
            className="w-8 h-8 rounded-full border border-white/20"
            width={32}
            height={32}
          />
        )}
      </div>

      <Link href="/" className="flex items-center">
        <Image
          src="/logo.png"
          alt="Stoa Logo"
          className="w-8 h-8 hover:opacity-80 transition-opacity"
          width={32}
          height={32}
        />
      </Link>

      <Link
        href="/about"
        className="flex items-center text-gray-400 hover:text-white transition-colors"
      >
        <span className="text-sm mr-1">About</span>
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </Link>
    </div>
  );
}
