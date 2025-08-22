'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function AppHeader() {
  return (
    <div
      style={{
        background:
          'radial-gradient(1200px 600px at 50% -200px, rgba(251, 191, 36, 0.08), transparent 60%), linear-gradient(180deg, #0b1120 0%, #0a0f1f 100%)',
      }}
      className="fixed inset-x-0 top-0 z-50 border-b border-white/10"
    >
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between rounded-2xl px-4 py-2">
          <Link href="/" aria-label="Home">
            <Image
              src="/logo.png"
              alt="Stoa Logo"
              className="h-8 w-8"
              width={20}
              height={20}
            />
          </Link>

          <Link href="/about" aria-label="About">
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
