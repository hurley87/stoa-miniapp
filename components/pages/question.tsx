'use client';

import { useMemo } from 'react';
import { useQuestion } from '@/hooks/use-active-questions';
import QuestionCard from '@/components/QuestionCard';
import { useAccount } from 'wagmi';
import AppHeader from '@/components/app-header';

type Props = { idParam: string };

export default function QuestionPage({ idParam }: Props) {
  const questionId = useMemo(() => {
    const asNumber = Number(idParam);
    return Number.isNaN(asNumber) ? undefined : asNumber;
  }, [idParam]);

  const { data: question, isLoading, error } = useQuestion(questionId);
  const account = useAccount();

  if (!questionId) {
    return (
      <div className="min-h-screen px-6 py-6">
        <div className="max-w-2xl mx-auto rounded-xl border border-rose-500/30 bg-rose-950/50 p-4 text-rose-200">
          Invalid question id
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 pt-24 pb-6">
      <AppHeader />
      <div className="max-w-2xl mx-auto px-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-amber-400 border-t-transparent" />
          </div>
        ) : error ? (
          <div className="rounded-xl border border-rose-500/30 bg-rose-950/50 p-4 text-rose-200">
            Error loading question: {(error as Error).message}
          </div>
        ) : !question ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-slate-900/40 p-8 text-center text-slate-400">
            Question not found
          </div>
        ) : (
          <QuestionCard question={question} userWallet={account.address} />
        )}
      </div>
    </div>
  );
}
