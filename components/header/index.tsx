'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { useUser } from '@/contexts/user-context';

export default function AppHeader() {
  const { address } = useAccount();
  const { user } = useUser();
  const pfp = user.data?.pfp_url;
  const profileHref = address ? `/profile/${address}` : '/about';

  if (!user.data) return null;

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
          <Link href="/">
            <Image src="/logo.png" alt="Stoa" width={28} height={28} />
          </Link>
          <Link href="/about" aria-label="About">
            <div className="relative h-8 w-8 overflow-hidden rounded-full bg-white/5 flex items-center justify-center border">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-6 w-6 text-white/95 hover:text-white"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 10.5v5"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 7.5h.01"
                />
              </svg>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
