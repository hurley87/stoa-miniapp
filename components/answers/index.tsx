'use client';

import Link from 'next/link';
import { useQuestionAnswers } from '@/hooks/use-question-answers';
import { useClaimReward } from '@/hooks/use-claim-reward';
import { formatRelativeTime } from '@/lib/time-utils';
import { useUser } from '@/contexts/user-context';
import { useState, useEffect } from 'react';

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
  const {
    claimReward,
    checkClaimableAmount,
    isLoading: isClaimLoading,
    error: claimError,
  } = useClaimReward();
  const [claimableAmounts, setClaimableAmounts] = useState<{
    [key: string]: { amount: number; canClaim: boolean; hasClaimed: boolean };
  }>({});
  const [claimingAnswers, setClaimingAnswers] = useState<Set<string>>(
    new Set()
  );

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

  // Check claimable amounts when answers are available and evaluated
  useEffect(() => {
    if (!answers || !isEvaluated || !user.data?.creator?.wallet) return;

    const checkClaims = async () => {
      const newClaimableAmounts: {
        [key: string]: {
          amount: number;
          canClaim: boolean;
          hasClaimed: boolean;
        };
      } = {};

      for (const answer of answers) {
        // Only check for current user's answers (compare wallet addresses)
        if (
          answer.wallet?.toLowerCase() ===
          user.data?.creator?.wallet.toLowerCase()
        ) {
          try {
            // New factory-based claim check - no contract address needed
            const claimInfo = await checkClaimableAmount();
            newClaimableAmounts[answer.id] = claimInfo;
          } catch (error) {
            console.error(
              'Error checking claimable amount for answer',
              answer.id,
              error
            );
            newClaimableAmounts[answer.id] = {
              amount: 0,
              canClaim: false,
              hasClaimed: false,
            };
          }
        }
      }

      setClaimableAmounts(newClaimableAmounts);
    };

    checkClaims();
  }, [answers, isEvaluated, user.data?.creator?.wallet, checkClaimableAmount]);

  // Don't render anything if questionId is undefined (after hooks to satisfy rules of hooks)
  if (questionId === undefined) {
    return null;
  }

  const handleClaim = async (answerId: string) => {
    setClaimingAnswers((prev) => new Set(prev.add(answerId)));

    try {
      // New factory-based claim - no contract address needed
      const result = await claimReward();

      // Update claimable amounts after successful claim
      setClaimableAmounts((prev) => ({
        ...prev,
        [answerId]: {
          amount: 0,
          canClaim: false,
          hasClaimed: result.hasClaimed,
        },
      }));

      // Show success message or handle success
      console.log(`Successfully claimed ${result.amount} USDC!`);
    } catch (error) {
      console.error('Claim failed:', error);
    } finally {
      setClaimingAnswers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(answerId);
        return newSet;
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-amber-400 border-t-transparent" />
        <span className="ml-2 text-white/80 text-sm">Loading replies...</span> {/* copy:updated */}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-500/30 bg-rose-950/50 p-4">
        <p className="text-rose-200 text-sm">Failed to load replies</p> {/* copy:updated */}
      </div>
    );
  }

  if (!answers || answers.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center">
        <p className="text-white/60 text-sm">No replies yet. Be the first to make a move!</p> {/* copy:updated */}
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
          // Compact view for non-judged prompts (original layout) // copy:updated
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

            {/* Reply Content */} {/* copy:updated */}
            <div className="p-3 bg-white/5 rounded-lg">
              <p className="text-sm text-slate-300 leading-relaxed">
                {answer.content}
              </p>
            </div>

            {/* Judging Results */} {/* copy:updated */}
            {((answer.ai_reward_amount ?? 0) > 0 ||
              (answer.creator_reward_amount ?? 0) > 0 ||
              (answer.reward_amount ?? 0) > 0) && (
              <div className="space-y-3">
                {/* AI Judging */} {/* copy:updated */}
                {(answer.ai_reward_amount ?? 0) > 0 && (
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-blue-300">AI judging</h4> {/* copy:updated */}
                      <span className="text-sm font-medium text-emerald-400">
                        $
                        {formatEarnings(
                          parseFloat((answer.ai_reward_amount ?? 0).toString())
                        )}
                      </span>
                    </div>
                    {answer.ai_reward_reason && (
                      <p className="text-xs text-blue-200/80">
                        {answer.ai_reward_reason}
                      </p>
                    )}
                  </div>
                )}

                {/* Human Judge Review */} {/* copy:updated */}
                {(answer.creator_reward_amount ?? 0) > 0 && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-amber-300">Whitelisted Human Judge</h4> {/* copy:updated */}
                      <span className="text-sm font-medium text-emerald-400">
                        $
                        {formatEarnings(
                          parseFloat(
                            (answer.creator_reward_amount ?? 0).toString()
                          )
                        )}
                      </span>
                    </div>
                    {answer.creator_reward_reason && (
                      <p className="text-xs text-amber-200/80">
                        {answer.creator_reward_reason}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Claim Button - Show for user's own answers if they have claimable rewards */}
            {user.data?.creator?.wallet &&
              answer.wallet?.toLowerCase() ===
                user.data.creator.wallet.toLowerCase() &&
              claimableAmounts[answer.id]?.canClaim && (
                <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-emerald-300 mb-1">
                        Reward available
                      </h4>
                      <p className="text-xs text-emerald-200/80">
                        You can claim $
                        {formatEarnings(claimableAmounts[answer.id].amount)}{' '}
                        USDC
                      </p>
                    </div>
                    <button
                      onClick={() => handleClaim(answer.id.toString())}
                      disabled={claimingAnswers.has(answer.id.toString())}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 text-white text-sm font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
                    >
                      {claimingAnswers.has(answer.id.toString()) ? (
                        <span className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/60 border-t-transparent mr-2" />
                          Claiming...
                        </span>
                      ) : (
                        'Claim reward'
                      )}
                    </button>
                  </div>
                </div>
              )}

            {/* Already Claimed - Show for user's own answers if they have already claimed */}
            {user.data?.creator?.wallet &&
              answer.wallet?.toLowerCase() ===
                user.data.creator.wallet.toLowerCase() &&
              claimableAmounts[answer.id]?.hasClaimed && (
                <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                      <svg
                        className="w-3 h-3 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-blue-300 mb-1">
                        Reward claimed
                      </h4>
                      <p className="text-xs text-blue-200/80">
                        You have already claimed your reward for this answer
                      </p>
                    </div>
                  </div>
                </div>
              )}
          </div>
        );
      })}
    </div>
  );
}
