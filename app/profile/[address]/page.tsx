'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CopyAddress } from '@/components/profile/copy-address';
import { useUserAnswers } from '@/hooks/use-user-answers';
import { useUserQuestions } from '@/hooks/use-user-questions';

interface ProfilePageProps {
  params: { address: string };
}

type User = {
  display_name?: string;
  username?: string;
  pfp_url?: string;
  profile?: {
    bio?: {
      text?: string;
    };
  };
};

async function getUser(address: string): Promise<User | null> {
  const response = await fetch(`/api/users/${address}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error('Failed to load user profile');
  return response.json();
}

export default function ProfilePage({ params }: ProfilePageProps) {
  const { address } = params;
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'answers' | 'questions'>(
    'answers'
  );

  const {
    data: userAnswersData,
    isLoading: answersLoading,
    error: answersError,
  } = useUserAnswers(address?.toLowerCase());

  const {
    data: userQuestionsData,
    isLoading: questionsLoading,
    error: questionsError,
  } = useUserQuestions(address?.toLowerCase());

  useEffect(() => {
    getUser(address.toLowerCase())
      .then(setUser)
      .catch((err) => {
        console.error('Failed to load user:', err);
        setError('Failed to load user profile');
      })
      .finally(() => setLoading(false));
  }, [address]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-10 w-10 rounded-full border-2 border-amber-400 border-t-transparent" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold mb-2">User not found</h1>
          <p className="text-white/60 mb-4">
            The profile you&apos;re looking for doesn&apos;t exist.
          </p>
          <Link href="/" className="cta-button inline-block">
            Go home
          </Link>
        </div>
      </div>
    );
  }

  const displayName = user.display_name || user.username || 'Farcaster User';
  const pfp = user.pfp_url;

  const formatEarnings = (amount: number) => {
    return amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'evaluated':
        return 'text-emerald-300 bg-emerald-500/20';
      case 'ended':
        return 'text-amber-300 bg-amber-500/20';
      case 'emergency':
        return 'text-red-300 bg-red-500/20';
      default:
        return 'text-blue-300 bg-blue-500/20';
    }
  };

  const getRankDisplay = (rank?: number) => {
    if (!rank) return null;
    const suffix =
      rank === 1 ? 'st' : rank === 2 ? 'nd' : rank === 3 ? 'rd' : 'th';
    return `${rank}${suffix}`;
  };

  return (
    <main className="mx-auto max-w-2xl px-4 pb-36 pt-20">
      {/* Profile Header */}
      <section className="flex flex-col items-center gap-3">
        <div className="relative h-24 w-24 overflow-hidden rounded-full ring-2 ring-white/10">
          {pfp ? (
            <Image
              src={pfp}
              alt={displayName}
              fill
              sizes="96px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-white/5 text-sm">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="text-center">
          <h1 className="text-xl font-semibold tracking-tight">
            {displayName}
          </h1>
          <CopyAddress address={address} />
        </div>
      </section>

      {user.profile?.bio?.text && (
        <p className="mt-6 whitespace-pre-wrap text-sm text-white/80 text-center">
          {user.profile.bio.text}
        </p>
      )}

      {/* Stats Section */}
      {(userAnswersData || userQuestionsData) && (
        <section className="mt-8">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="glass-card p-4 text-center">
              <div className="text-lg font-bold ">
                {userAnswersData?.stats.totalAnswers || 0}
              </div>
              <div className="text-xs text-white/60 uppercase tracking-wide">
                Replies
              </div>
            </div>
            <div className="glass-card p-4 text-center">
              <div className="text-lg font-bold ">
                $
                {formatEarnings(
                  (userAnswersData?.stats.totalEarnings || 0) +
                    (userQuestionsData?.stats.totalFeesEarned || 0)
                )}
              </div>
              <div className="text-xs text-white/60 uppercase tracking-wide">
                Total Earned
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Tabbed Content */}
      <section className="mt-8">
        {/* Tab Navigation */}
        <div className="flex gap-1 mb-6 p-1 bg-white/5 rounded-xl">
          <button
            onClick={() => setActiveTab('answers')}
            className={`flex-1 py-3 px-4 text-sm font-medium rounded-lg transition-all ${
              activeTab === 'answers'
                ? 'bg-white/10 text-white shadow-lg'
                : 'text-white/60 hover:text-white/80'
            }`}
          >
            Replies ({userAnswersData?.stats.totalAnswers || 0})
          </button>
          <button
            onClick={() => setActiveTab('questions')}
            className={`flex-1 py-3 px-4 text-sm font-medium rounded-lg transition-all ${
              activeTab === 'questions'
                ? 'bg-white/10 text-white shadow-lg'
                : 'text-white/60 hover:text-white/80'
            }`}
          >
            Prompts ({userQuestionsData?.stats.totalQuestions || 0})
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'answers' && (
          <div>
            {answersLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-amber-400 border-t-transparent" />
              </div>
            ) : answersError ? (
              <div className="rounded-xl border border-rose-500/30 bg-rose-950/50 p-4 text-rose-200 text-center">
                Failed to load answers
              </div>
            ) : !userAnswersData?.answers.length ? (
              <div className="rounded-2xl border border-dashed border-white/15 bg-slate-900/40 p-8 text-center text-slate-400">
                No replies yet
              </div>
            ) : (
              <div className="space-y-4">
                {userAnswersData.answers.map((answer) => (
                  <div key={answer.id} className="glass-card p-4">
                    {/* Prompt */}
                    <div className="mb-3">
                      <Link
                        href={`/questions/${answer.question.question_id}`}
                        className="text-slate-200 hover:text-white transition-colors"
                      >
                        <h3 className="font-medium text-sm mb-2">
                          {truncateText(answer.question.content, 120)}
                        </h3>
                      </Link>
                      <div className="flex items-center gap-2 text-xs text-white/60">
                        <span>
                          by {answer.question.creator_username || 'Anonymous'}
                        </span>
                        <span>•</span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            answer.question.status
                          )}`}
                        >
                          {answer.question.status.charAt(0).toUpperCase() +
                            answer.question.status.slice(1)}
                        </span>
                      </div>
                    </div>

                    {/* Reply */}
                    <div className="mb-3 p-3 bg-white/5 rounded-lg">
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {truncateText(answer.content, 200)}
                      </p>
                    </div>

                    {/* Results */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm">
                        {answer.score > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="text-white/60">Score:</span>
                            <span className="font-medium text-amber-400">
                              {answer.score}
                            </span>
                          </div>
                        )}
                        {answer.rank && (
                          <div className="flex items-center gap-1">
                            <span className="text-white/60">Rank:</span>
                            <span className="font-medium text-purple-400">
                              {getRankDisplay(answer.rank)}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        {(() => {
                          const earnings =
                            answer.creator_reward_amount ||
                            answer.ai_reward_amount ||
                            answer.reward_amount ||
                            0;
                          if (earnings > 0) {
                            return (
                              <div className="text-sm">
                                <span className="text-white/60">Earned: </span>
                                <span className="font-medium text-emerald-400">
                                  $
                                  {formatEarnings(
                                    parseFloat(earnings.toString())
                                  )}
                                </span>
                              </div>
                            );
                          }
                          return (
                            <span className="text-xs text-white/40">
                              No reward
                            </span>
                          );
                        })()}
                      </div>
                    </div>

                    {/* AI/Creator Feedback */}
                    {(answer.ai_reward_reason ||
                      answer.creator_reward_reason) && (
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <div className="text-xs text-white/60">
                          <span className="font-medium">Feedback: </span>
                          <span>
                            {answer.creator_reward_reason ||
                              answer.ai_reward_reason}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'questions' && (
          <div>
            {questionsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-amber-400 border-t-transparent" />
              </div>
            ) : questionsError ? (
              <div className="rounded-xl border border-rose-500/30 bg-rose-950/50 p-4 text-rose-200 text-center">
                Failed to load questions
              </div>
            ) : !userQuestionsData?.questions.length ? (
              <div className="rounded-2xl border border-dashed border-white/15 bg-slate-900/40 p-8 text-center text-slate-400">
                No prompts created yet
              </div>
            ) : (
              <div className="space-y-4">
                {userQuestionsData.questions.map((question) => (
                  <div key={question.id} className="glass-card p-4">
                    {/* Question Content */}
                    <div className="mb-3">
                      <Link
                        href={`/questions/${question.question_id}`}
                        className="text-slate-200 hover:text-white transition-colors"
                      >
                        <h3 className="font-medium text-sm mb-2">
                          {truncateText(question.content, 120)}
                        </h3>
                      </Link>
                      <div className="flex items-center gap-2 text-xs text-white/60">
                        <span>Prompt #{question.question_id}</span>
                        <span>•</span>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-white/10 text-white/70">
                          {question.status.charAt(0).toUpperCase() +
                            question.status.slice(1)}
                        </span>
                      </div>
                    </div>

                    {/* Question Stats */}
                    <div className="flex items-center justify-start gap-6">
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <span className="text-white/60">Submissions:</span>
                          <span className="font-semibold text-white">
                            {question.total_submissions}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-white/60">Max Winners:</span>
                          <span className="font-semibold text-white">
                            {question.max_winners}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-white/60">Entry Fee:</span>
                          <span className="font-semibold text-white">
                            $
                            {formatEarnings(
                              parseFloat(question.submission_cost || '0') /
                                1000000
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Prize Pool Info */}
                    {parseFloat(question.total_reward_pool || '0') > 0 && (
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <div className="text-xs text-white/60">
                          <span className="font-medium">
                            Total Prize Pool:{' '}
                          </span>
                          <span className="text-white">
                            $
                            {formatEarnings(
                              parseFloat(question.total_reward_pool) / 1000000
                            )}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
