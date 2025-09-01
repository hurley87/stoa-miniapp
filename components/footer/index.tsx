'use client';

import Link from 'next/link';
import { useAccount } from 'wagmi';
import { useUser } from '@/contexts/user-context';
import { Plus, MessagesSquare, BarChart } from 'lucide-react';

export default function AppFooter() {
  const { address } = useAccount();
  const { user } = useUser();
  const pfp = user.data?.pfp_url;
  const profileHref = address ? `/profile/${address}` : '/about';

  if (!user.data) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 bg-transparent">
      <div className="mb-8 mx-4 glass-panel">
        <div className="flex items-center justify-around rounded-2xl px-4 py-3">
          <Link href="/" aria-label="Home">
            <MessagesSquare
              className="h-6 w-6 text-white/95 hover:text-white"
              aria-hidden="true"
            />
          </Link>

          <Link href="/new" aria-label="New Question">
            <Plus
              className="h-6 w-6 text-white/95 hover:text-white"
              aria-hidden="true"
            />
          </Link>

          <Link href="/leaderboard" aria-label="Leaderboard">
            <BarChart
              className="h-6 w-6 text-white/95 hover:text-white"
              aria-hidden="true"
            />
          </Link>

          <Link href={profileHref} aria-label="Profile">
            <img
              src={pfp}
              alt="Profile"
              className="h-8 w-8 rounded-full object-cover ring-1 ring-white/10"
            />
          </Link>
        </div>
      </div>
    </div>
  );
}
