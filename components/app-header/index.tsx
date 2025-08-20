'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function AppHeader() {
  return (
    <div className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto max-w-2xl px-6">
        <div className="glass-panel my-3 flex items-center justify-between rounded-2xl px-3 py-2 sm:px-4 sm:py-3">
          <Link href="/" className="flex items-center">
            <div className="glass-button rounded-xl p-1.5 shadow-md shadow-black/20">
              <Image
                src="/logo.png"
                alt="Stoa Logo"
                className="w-9 h-9"
                width={36}
                height={36}
              />
            </div>
          </Link>

          <Link
            href="/about"
            aria-label="About"
            className="glass-button inline-flex h-12 w-12 items-center justify-center rounded-xl text-slate-300 hover:text-white transition-colors"
          >
            <svg
              className="h-6 w-6"
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
      </div>
    </div>
  );
}
