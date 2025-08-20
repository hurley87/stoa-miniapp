'use client';

import { useUser } from '@/contexts/user-context';
import { useActiveQuestions } from '@/hooks/use-active-questions';
import Link from 'next/link';
import AppHeader from '@/components/app-header';
import Image from 'next/image';
import { useEffect, useState } from 'react';

export default function Home() {
  const { user, isLoading, signIn } = useUser();
  const {
    data: questions,
    isLoading: questionsLoading,
    error: questionsError,
  } = useActiveQuestions();

  // Single ticking clock for all cards to avoid multiple intervals
  const [now, setNow] = useState<number>(Date.now());
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

  if (!user.data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-between px-6 pt-10 pb-24">
        <div />
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="glass-panel rounded-2xl p-3">
            <Image src="/logo.png" alt="logo" width={128} height={128} />
          </div>
          <div className="flex flex-col items-center justify-center gap-1">
            <p className="text-slate-100 text-3xl font-semibold tracking-tight">
              Stoa
            </p>
            <p className="text-slate-400 text-sm">Proof of Knowledge</p>
          </div>
        </div>
        <div className="w-full max-w-md mx-auto flex flex-col gap-4 text-center">
          <button
            onClick={signIn}
            disabled={isLoading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-amber-400 to-orange-500 px-6 py-3 text-black font-semibold shadow-lg shadow-amber-500/20 ring-1 ring-black/10 transition-all duration-200 hover:brightness-105 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/80 border-t-transparent" />
                <span>Signing in...</span>
              </>
            ) : (
              'Sign in'
            )}
          </button>
          <p className="text-slate-400 text-sm">Get paid to answer questions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 pt-24 pb-6">
      <AppHeader />
      {/* Content */}
      <div className="max-w-2xl mx-auto px-0">
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
            No active questions available
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {questions?.map((question) => (
              <div key={question.id} className="space-y-2">
                <Link href={`/questions/${question.question_id}`}>
                  <div className="glass-card group relative overflow-hidden rounded-2xl p-4 sm:p-5">
                    <div className="pointer-events-none absolute -top-20 right-1/2 h-40 w-40 translate-x-1/2 rounded-full bg-amber-500/10 blur-2xl group-hover:bg-amber-500/15" />
                    {/* Question */}
                    <h2 className="text-slate-100 leading-6 font-semibold">
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

                    {/* Countdown - bottom right */}
                    <div className="absolute bottom-4 right-4 sm:bottom-5 sm:right-5">
                      <span className="text-white/80 text-xs sm:text-sm font-medium bg-white/5 rounded-full px-2.5 py-1">
                        {formatCountdown(
                          new Date(question.end_time).getTime() - now
                        )}
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
