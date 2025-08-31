'use client';

import { useUser } from '@/contexts/user-context';
import {
  useActiveQuestions,
  usePastQuestions,
} from '@/hooks/use-active-questions';
import type { Question as ActiveQuestion } from '@/hooks/use-active-questions';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function Home() {
  const { user, isLoading, signIn } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();

  const tab = searchParams.get('tab') || 'active';
  const isActiveTab = tab === 'active';

  const {
    data: activeQuestions,
    isLoading: activeQuestionsLoading,
    error: activeQuestionsError,
  } = useActiveQuestions();

  const {
    data: pastQuestions,
    isLoading: pastQuestionsLoading,
    error: pastQuestionsError,
  } = usePastQuestions();

  const questions = isActiveTab ? activeQuestions : pastQuestions;
  const questionsLoading = isActiveTab
    ? activeQuestionsLoading
    : pastQuestionsLoading;
  const questionsError = isActiveTab
    ? activeQuestionsError
    : pastQuestionsError;

  const handleTabChange = (newTab: 'active' | 'past') => {
    if (newTab === 'active') {
      router.push('/');
    } else {
      router.push('/?tab=past');
    }
  };

  // Single ticking clock for all cards to avoid multiple intervals
  const [now, setNow] = useState<number>(Date.now());
  const [currentStep, setCurrentStep] = useState<number>(0);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const formatCountdown = (msRemaining: number) => {
    if (msRemaining <= 0) return 'ENDED';
    const totalSeconds = Math.floor(msRemaining / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (days > 0) return `${days}D ${hours}H ${minutes}M ${seconds}S`;
    if (hours > 0) return `${hours}H ${minutes}M ${seconds}S`;
    if (minutes > 0) return `${minutes}M ${seconds}S`;
    return `${seconds}S`;
  };

  const truncateAddress = (addr: string) =>
    addr && addr.startsWith('0x')
      ? `${addr.slice(0, 6)}…${addr.slice(-4)}`
      : addr;

  const getDisplayName = (username: string | null, wallet: string) =>
    username && username.trim().length > 0 ? username : truncateAddress(wallet);

  const getInitial = (text: string) => (text?.[0] ?? '?').toUpperCase();

  if (!user.data) {
    const steps = [
      {
        id: 0,
        title: 'Welcome to Stoa',
        kicker: 'Get rewarded for thoughtful answers',
        body: (
          <>
            <p className="text-slate-300 text-sm">
              Stoa rewards thoughtful discourse. Community leaders pose
              time-limited questions, and the best answers earn rewards.
            </p>
          </>
        ),
      },
      {
        id: 1,
        title: 'How it works',
        kicker: 'Simple, rewarding process',
        body: (
          <ul className="text-slate-300 text-sm space-y-2 text-left">
            <li className="flex items-start gap-2">
              <span className="text-amber-400">•</span>
              <span>Browse open questions with live countdowns</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400">•</span>
              <span>Submit your best answer before time expires</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400">•</span>
              <span>Earn rewards for high-quality responses</span>
            </li>
          </ul>
        ),
      },
      {
        id: 2,
        title: 'How answers are rewarded',
        kicker: 'AI-powered, bias-free evaluation',
        body: (
          <>
            <ul className="text-slate-300 text-sm space-y-2 text-left">
              <li className="flex items-start gap-2">
                <span className="text-amber-400">•</span>
                <span>AI evaluates answers against clear criteria</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400">•</span>
                <span>Get detailed feedback on your submission</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400">•</span>
                <span>Qualifying answers receive token rewards</span>
              </li>
            </ul>
            <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 text-left">
              <p className="text-amber-300/90 text-xs font-medium uppercase mb-2">
                Example
              </p>
              <p className="text-slate-200 text-sm">
                Feedback: Clear reasoning with citations. Consider
                counterarguments.
              </p>
              <div className="mt-2 text-slate-300 text-sm">
                Reward:{' '}
                <span className="text-amber-400 font-medium">12 tokens</span>
              </div>
            </div>
          </>
        ),
      },
    ];

    const isFirst = currentStep === 0;
    const isLast = currentStep === steps.length - 1;

    return (
      <div className="min-h-screen flex flex-col px-4 pb-24">
        <div className="flex-1 w-full flex flex-col items-center justify-center">
          <div className="mt-8 max-w-md w-full text-center space-y-4">
            <p className="text-amber-300/90 text-sm sm:text-base font-medium tracking-wide uppercase">
              {steps[currentStep].kicker}
            </p>
            <h2 className="text-slate-100 text-2xl sm:text-3xl font-semibold">
              {steps[currentStep].title}
            </h2>
            <div className="mx-auto max-w-md">{steps[currentStep].body}</div>

            <div className="mt-4 flex items-center justify-center gap-2">
              {steps.map((_, idx) => (
                <span
                  key={idx}
                  className={
                    'h-1.5 w-6 rounded-full transition-colors ' +
                    (idx === currentStep ? 'bg-amber-400' : 'bg-white/15')
                  }
                />
              ))}
            </div>

            <p className="text-slate-400 text-sm sm:text-base">
              New here?{' '}
              <Link
                href="/about"
                className="underline decoration-amber-400/50 underline-offset-2 hover:text-slate-200"
              >
                Learn more
              </Link>
              .
            </p>
          </div>
        </div>
        <div
          style={{
            background:
              'radial-gradient(1200px 600px at 50% -200px, rgba(251, 191, 36, 0.08), transparent 60%), linear-gradient(180deg, #0b1120 0%, #0a0f1f 100%)',
          }}
          className="fixed bottom-0 right-0 left-0 px-4 py-6 border-t border-white/10"
        >
          {isFirst ? (
            <button
              onClick={() =>
                setCurrentStep((s) => Math.min(s + 1, steps.length - 1))
              }
              disabled={isLoading}
              className="cta-button inline-flex w-full items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setCurrentStep((s) => Math.max(s - 1, 0))}
                disabled={isLoading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Back
              </button>
              <button
                onClick={
                  isLast
                    ? signIn
                    : () =>
                        setCurrentStep((s) => Math.min(s + 1, steps.length - 1))
                }
                disabled={isLoading}
                className="cta-button inline-flex w-full items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLast ? (
                  isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/80 border-t-transparent" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    'Sign in'
                  )
                ) : (
                  'Continue'
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 pt-16 pb-36">
      {/* Content */}
      <div className="max-w-2xl mx-auto px-0">
        {/* Tabs */}
        <div className="mb-4">
          <div className="flex bg-white/5 rounded-xl p-1">
            <button
              onClick={() => handleTabChange('active')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                isActiveTab
                  ? 'bg-amber-500/20 text-amber-300 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => handleTabChange('past')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                !isActiveTab
                  ? 'bg-amber-500/20 text-amber-300 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Past
            </button>
          </div>
        </div>
        {questionsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-amber-400 border-t-transparent" />
          </div>
        ) : questionsError ? (
          <div className="rounded-xl border border-rose-500/30 bg-rose-950/50 p-4 text-rose-200">
            Error loading questions: {questionsError.message}
          </div>
        ) : questions?.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-slate-900/40 p-8 text-center text-slate-400">
            {isActiveTab
              ? 'No active questions available yet'
              : 'No past questions found'}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {questions?.map((question: ActiveQuestion) => {
              const displayName = getDisplayName(
                question.creator_username ?? null,
                question.creator
              );
              const pfpUrl = question.creator_pfp as string | null;
              const initial = getInitial(displayName);
              return (
                <div key={question.id} className="space-y-2">
                  <Link href={`/questions/${question.question_id}`}>
                    <div className="glass-card group relative overflow-hidden rounded-2xl p-4 sm:p-5">
                      <div className="pointer-events-none absolute -top-20 right-1/2 h-40 w-40 translate-x-1/2 rounded-full bg-amber-500/10 blur-2xl group-hover:bg-amber-500/15" />

                      {/* Creator */}
                      <div className="flex items-center gap-3">
                        {pfpUrl ? (
                          <img
                            src={pfpUrl}
                            alt={`${displayName}'s avatar`}
                            className="h-8 w-8 rounded-full object-cover ring-1 ring-white/10"
                            loading="lazy"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-500/30 to-amber-300/20 ring-1 ring-white/10 flex items-center justify-center text-[11px] font-semibold text-slate-100">
                            {initial}
                          </div>
                        )}
                        <Link
                          href={`/profile/${question.creator}`}
                          className="text-slate-200 text-sm font-medium hover:text-white"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {displayName}
                        </Link>
                      </div>

                      {/* Question */}
                      <h2 className="mt-3 text-slate-100 leading-6 font-semibold">
                        {question.content}
                      </h2>

                      {/* Stats */}
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-white/80 text-xs sm:text-sm font-medium bg-white/5 rounded-full px-2.5 py-1">
                          {question.total_submissions}{' '}
                          {question.total_submissions === 1
                            ? 'submission'
                            : 'submissions'}
                        </span>
                      </div>

                      {/* Countdown or Status - bottom right */}
                      <div className="absolute bottom-4 right-4 sm:bottom-5 sm:right-5">
                        {isActiveTab ? (
                          <span className="text-white/80 text-xs sm:text-sm font-medium bg-white/5 rounded-full px-2.5 py-1">
                            {formatCountdown(
                              new Date(question.end_time).getTime() - now
                            )}
                          </span>
                        ) : (
                          <span
                            className={`text-xs sm:text-sm font-medium rounded-full px-2.5 py-1 ${
                              question.status === 'evaluated'
                                ? 'text-emerald-300 bg-emerald-500/20'
                                : question.status === 'ended'
                                ? 'text-amber-300 bg-amber-500/20'
                                : 'text-red-300 bg-red-500/20'
                            }`}
                          >
                            {question.status === 'evaluated'
                              ? 'Evaluated'
                              : question.status === 'ended'
                              ? 'Ended'
                              : question.status === 'emergency'
                              ? 'Emergency'
                              : question.status.charAt(0).toUpperCase() +
                                question.status.slice(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div
        style={{
          background:
            'radial-gradient(1200px 600px at 50% -200px, rgba(251, 191, 36, 0.08), transparent 60%), linear-gradient(180deg, #0b1120 0%, #0a0f1f 100%)',
        }}
        className="fixed bottom-0 right-0 left-0 px-4 py-6 border-t border-white/10"
      >
        <Link href="/new">
          <button className="cta-button w-full">Create a Question</button>
        </Link>
      </div>
    </div>
  );
}
