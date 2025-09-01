'use client';

import Link from 'next/link';
import { useQuestionAnswers } from '@/hooks/use-question-answers';
import { formatRelativeTime } from '@/lib/time-utils';
import { useUser } from '@/contexts/user-context';
import { useState } from 'react';

interface AnswersProps {
  questionId: number | undefined;
  isEvaluated?: boolean;
  contractAddress?: string;
}

export default function Answers({
  questionId,
  isEvaluated,
  contractAddress,
}: AnswersProps) {
  console.log('questionId', questionId);
  const { data: answers, isLoading, error } = useQuestionAnswers(questionId);
  const { user } = useUser();

  const truncateAddress = (addr: string) =>
    addr && addr.startsWith('0x')
      ? `${addr.slice(0, 6)}…${addr.slice(-4)}`
      : addr;

  const getDisplayName = (username: string | null, wallet: string | null) => {
    if (username && username.trim().length > 0) return username;
    if (wallet) return truncateAddress(wallet);
    return 'Anonymous';
  };

  const getInitial = (text: string) => (text?.[0] ?? '?').toUpperCase();

  const formatEarnings = (amount: number) => {
    return amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const getRankDisplay = (rank?: number) => {
    if (!rank) return null;
    const suffix =
      rank === 1 ? 'st' : rank === 2 ? 'nd' : rank === 3 ? 'rd' : 'th';
    return `${rank}${suffix}`;
  };

  // Don't render anything if questionId is undefined (after hooks to satisfy rules of hooks)
  if (questionId === undefined) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-amber-400 border-t-transparent" />
        <span className="ml-2 text-white/80 text-sm">Loading replies...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-500/30 bg-rose-950/50 p-4">
        <p className="text-rose-200 text-sm">Failed to load replies</p>
      </div>
    );
  }

  if (!answers || answers.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center">
        <p className="text-white/60 text-sm">
          No replies yet. Be the first to make a move!
        </p>
      </div>
    );
  }

  console.log('user', user);

  return (
    <div className="space-y-4">
      {answers.map((answer) => {
        console.log('Answer data:', answer); // Debug log
        const displayName = getDisplayName(answer.username, answer.wallet);
        console.log(
          'Display name:',
          displayName,
          'Username:',
          answer.username,
          'Wallet:',
          answer.wallet,
          'PFP:',
          answer.pfp
        ); // Debug log

        // Show different layouts based on evaluation status
        if (!isEvaluated) {
          // Compact view for non-judged prompts (original layout)
          return (
            <div
              key={answer.id}
              className="flex items-center justify-between gap-3 p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            >
              {/* Profile Picture */}
              <div className="flex-shrink-0">
                {answer.pfp ? (
                  <img
                    src={answer.pfp}
                    alt={`${displayName}'s avatar`}
                    className="h-10 w-10 rounded-full object-cover ring-1 ring-white/10"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-500/30 to-amber-300/20 ring-1 ring-white/10 flex items-center justify-center text-sm font-semibold text-slate-100">
                    {getInitial(displayName)}
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  {answer.wallet ? (
                    <Link
                      href={`/profile/${answer.wallet}`}
                      className="text-white font-medium hover:text-amber-300 transition-colors text-sm"
                    >
                      {displayName}
                    </Link>
                  ) : (
                    <span className="text-white font-medium text-sm">
                      {displayName}
                    </span>
                  )}
                  {answer.rank && answer.rank <= 3 && (
                    <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-lg text-xs font-medium">
                      #{answer.rank}
                    </span>
                  )}
                </div>
                <span className="text-white/60 text-xs flex-shrink-0">
                  {formatRelativeTime(answer.timestamp)}
                </span>
              </div>
            </div>
          );
        }

        // Expanded view for evaluated questions
        return (
          <div key={answer.id} className="glass-card p-4 space-y-4">
            {/* Header with author and ranking */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Profile Picture */}
                {answer.pfp ? (
                  <img
                    src={answer.pfp}
                    alt={`${displayName}'s avatar`}
                    className="h-10 w-10 rounded-full object-cover ring-1 ring-white/10"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-500/30 to-amber-300/20 ring-1 ring-white/10 flex items-center justify-center text-sm font-semibold text-slate-100">
                    {getInitial(displayName)}
                  </div>
                )}
                <div>
                  {answer.wallet ? (
                    <Link
                      href={`/profile/${answer.wallet}`}
                      className="text-white font-medium hover:text-amber-300 transition-colors text-sm"
                    >
                      {displayName}
                    </Link>
                  ) : (
                    <span className="text-white font-medium text-sm">
                      {displayName}
                    </span>
                  )}
                  <div className="text-xs text-white/60">
                    {formatRelativeTime(answer.timestamp)}
                  </div>
                </div>
              </div>
            </div>

            {/* Reply Content */}
            <div className="p-3 bg-white/5 rounded-lg">
              <p className="text-sm text-slate-300 leading-relaxed">
                {answer.content}
              </p>
            </div>

            {/* Judging Results: Only show Whitelisted Human Judge */}
            {(() => {
              const creatorAmount = parseFloat(
                (answer.creator_reward_amount ?? 0).toString()
              );
              const hasCreatorReward = creatorAmount > 0;
              return (
                <div
                  className={`p-3 rounded-lg ${
                    hasCreatorReward
                      ? 'bg-emerald-500/10 border border-emerald-500/20'
                      : 'bg-white/5 border border-white/10'
                  }`}
                >
                  <div className="mb-2">
                    <span className="text-sm font-medium text-emerald-400">
                      ${formatEarnings(creatorAmount)}
                    </span>
                  </div>
                  {answer.creator_reward_reason && (
                    <p className="text-xs text-white/70">
                      {answer.creator_reward_reason}
                    </p>
                  )}
                </div>
              );
            })()}

            {/* Claiming is centralized on the game page */}
          </div>
        );
      })}
    </div>
  );
}
