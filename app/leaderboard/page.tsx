'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface LeaderboardUser {
  creator_id: number;
  wallet: string;
  username: string | null;
  pfp: string | null;
  reputation: number;
  total_questions_created: number;
  total_answers_submitted: number;
  total_rewards_earned: string;
  total_fees_earned: string;
  total_earnings: string;
  rank: number;
  joined_at: string;
  last_activity: string;
}

interface LeaderboardResponse {
  success: boolean;
  data: LeaderboardUser[];
  pagination: {
    limit: number;
    offset: number;
    has_more: boolean;
  };
  sort: string;
}

type SortOption =
  | 'total_earnings'
  | 'creator_earnings'
  | 'answerer_earnings'
  | 'reputation'
  | 'total_questions'
  | 'total_answers';

const sortLabels: Record<SortOption, string> = {
  total_earnings: 'Total Earnings',
  creator_earnings: 'Creator Earnings',
  answerer_earnings: 'Answerer Earnings',
  reputation: 'Reputation',
  total_questions: 'Games Started',
  total_answers: 'Replies Posted',
};

export default function LeaderboardPage() {
  const [data, setData] = useState<LeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('total_earnings');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const limit = 50;

  const fetchLeaderboard = async (sortOption: SortOption, pageNum: number) => {
    try {
      setIsLoading(true);
      const offset = pageNum * limit;
      const response = await fetch(
        `/api/leaderboard?sortBy=${sortOption}&limit=${limit}&offset=${offset}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }

      const result: LeaderboardResponse = await response.json();

      if (pageNum === 0) {
        setData(result.data);
      } else {
        setData((prev) => [...prev, ...result.data]);
      }

      setHasMore(result.pagination.has_more);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setPage(0);
    fetchLeaderboard(sortBy, 0);
  }, [sortBy]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchLeaderboard(sortBy, nextPage);
  };

  const formatTokenAmount = (amountStr: string) => {
    const amount = BigInt(amountStr || '0');
    const zero = BigInt(0);
    if (amount === zero) return '0';

    // Convert from wei to tokens (assuming 18 decimals)
    const divisor = BigInt(10 ** 18);
    const tokens = amount / divisor;
    const remainder = amount % divisor;

    if (tokens > zero) {
      return tokens.toString();
    } else if (remainder > zero) {
      // Show fractional part for small amounts
      const fractional = remainder.toString().padStart(18, '0');
      const trimmed = fractional.replace(/0+$/, '');
      return `0.${trimmed.slice(0, 6)}`;
    }
    return '0';
  };

  const truncateAddress = (addr: string) =>
    addr && addr.startsWith('0x')
      ? `${addr.slice(0, 6)}…${addr.slice(-4)}`
      : addr;

  const getDisplayName = (username: string | null, wallet: string) =>
    username && username.trim().length > 0 ? username : truncateAddress(wallet);

  const getInitial = (text: string) => (text?.[0] ?? '?').toUpperCase();

  if (error) {
    return (
      <div className="min-h-screen px-4 pt-16 pb-36">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-xl border border-rose-500/30 bg-rose-950/50 p-4 text-rose-200">
            Error loading leaderboard: {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 pt-16 pb-36">
      <div className="max-w-4xl mx-auto">
        {/* Sort Controls */}
        <div className="mb-6">
          <div className="flex gap-2 flex-wrap">
            {(Object.entries(sortLabels) as [SortOption, string][]).map(
              ([key, label]) => (
                <button
                  key={key}
                  onClick={() => setSortBy(key)}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    sortBy === key
                      ? 'bg-amber-500/20 text-amber-300 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-white/5 border border-white/10'
                  }`}
                >
                  {label}
                </button>
              )
            )}
          </div>
        </div>

        {/* Leaderboard Table */}
        {isLoading && data.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-amber-400 border-t-transparent" />
          </div>
        ) : (
          <>
            <div className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-4 px-4 text-slate-300 font-medium">
                        Rank
                      </th>
                      <th className="text-left py-4 px-4 text-slate-300 font-medium">
                        Creator
                      </th>
                      <th className="text-right py-4 px-4 text-slate-300 font-medium">
                        {sortBy === 'total_earnings'
                          ? 'Earnings'
                          : sortBy === 'creator_earnings'
                          ? 'Creator Earnings'
                          : sortBy === 'answerer_earnings'
                          ? 'Answerer Earnings'
                          : sortBy === 'reputation'
                          ? 'Reputation'
                          : sortBy === 'total_questions'
                          ? 'Games'
                          : 'Replies'}
                      </th>
                      <th className="text-right py-4 px-4 text-slate-300 font-medium hidden sm:table-cell">
                        Games
                      </th>
                      <th className="text-right py-4 px-4 text-slate-300 font-medium hidden sm:table-cell">
                        Replies
                      </th>
                      <th className="text-right py-4 px-4 text-slate-300 font-medium hidden md:table-cell">
                        Reputation
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((user, index) => {
                      const displayName = getDisplayName(
                        user.username,
                        user.wallet
                      );
                      const pfpUrl = user.pfp;
                      const initial = getInitial(displayName);

                      const primaryValue =
                        sortBy === 'total_earnings'
                          ? formatTokenAmount(user.total_earnings)
                          : sortBy === 'creator_earnings'
                          ? formatTokenAmount(user.total_fees_earned)
                          : sortBy === 'answerer_earnings'
                          ? formatTokenAmount(user.total_rewards_earned)
                          : sortBy === 'reputation'
                          ? user.reputation.toFixed(1)
                          : sortBy === 'total_questions'
                          ? user.total_questions_created.toString()
                          : user.total_answers_submitted.toString();

                      return (
                        <tr
                          key={user.creator_id}
                          className="border-b border-white/5 hover:bg-white/5 transition-colors"
                        >
                          <td className="py-4 px-4">
                            <span
                              className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${
                                user.rank <= 3
                                  ? user.rank === 1
                                    ? 'bg-amber-500/20 text-amber-300'
                                    : user.rank === 2
                                    ? 'bg-slate-400/20 text-slate-300'
                                    : 'bg-amber-600/20 text-amber-400'
                                  : 'bg-white/5 text-slate-400'
                              }`}
                            >
                              {user.rank}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <Link
                              href={`/profile/${user.wallet}`}
                              className="flex items-center gap-3 hover:text-white transition-colors"
                            >
                              {pfpUrl ? (
                                <img
                                  src={pfpUrl}
                                  alt={`${displayName}'s avatar`}
                                  className="h-10 w-10 rounded-full object-cover ring-1 ring-white/10"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-500/30 to-amber-300/20 ring-1 ring-white/10 flex items-center justify-center text-sm font-semibold text-slate-100">
                                  {initial}
                                </div>
                              )}
                              <div>
                                <div className="text-slate-200 font-medium">
                                  {displayName}
                                </div>
                              </div>
                            </Link>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <span className="text-slate-100 font-semibold">
                              {sortBy.includes('earnings') ? (
                                <span className="text-amber-400">
                                  {primaryValue}
                                </span>
                              ) : (
                                primaryValue
                              )}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right text-slate-300 hidden sm:table-cell">
                            {user.total_questions_created}
                          </td>
                          <td className="py-4 px-4 text-right text-slate-300 hidden sm:table-cell">
                            {user.total_answers_submitted}
                          </td>
                          <td className="py-4 px-4 text-right text-slate-300 hidden md:table-cell">
                            {user.reputation.toFixed(1)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Load More */}
              {hasMore && (
                <div className="p-4 border-t border-white/10">
                  <button
                    onClick={loadMore}
                    disabled={isLoading}
                    className="w-full py-3 px-4 text-slate-300 hover:text-white hover:bg-white/5 border border-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Loading...' : 'Load More'}
                  </button>
                </div>
              )}

              {data.length === 0 && !isLoading && (
                <div className="p-8 text-center text-slate-400">
                  No leaderboard data available yet.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
