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
      <div className="min-h-screen p-4">
        <div className="max-w-md mx-auto bg-red-900/50 border border-red-500/50 rounded-xl p-4 text-red-200">
          Invalid question id
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <AppHeader />
      <div className="max-w-md mx-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-coral-500 border-t-transparent" />
          </div>
        ) : error ? (
          <div className="bg-red-900/50 border border-red-500/50 rounded-xl p-4 text-red-200">
            Error loading question: {(error as Error).message}
          </div>
        ) : !question ? (
          <div className="bg-slate-800/50 border border-white/10 rounded-xl p-8 text-center text-gray-400">
            Question not found
          </div>
        ) : (
          <QuestionCard question={question} userWallet={account.address} />
        )}
      </div>
    </div>
  );
}
