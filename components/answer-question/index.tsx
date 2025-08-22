'use client';

import { useState } from 'react';
import { useAccount, useConnect } from 'wagmi';
import { useAnswerCheck } from '@/hooks/use-answer-check';
import { useOnchainSubmissionStatus } from '@/hooks/use-onchain-submission-status';
import { useSubmitAnswerOnchain } from '@/hooks/use-submit-answer-onchain';
import { sdk } from '@farcaster/miniapp-sdk';

type QuestionLike = {
  question_id: number;
  submission_cost: number;
  contract_address: string;
  token_address: string;
  total_submissions: number;
};

type Props = {
  question: QuestionLike;
  timeLeft: string;
};

export default function AnswerQuestion({ question, timeLeft }: Props) {
  const account = useAccount();
  const userWallet = account.address;

  const [answerText, setAnswerText] = useState('');
  const [showForm, setShowForm] = useState(false);

  const {
    connectors,
    connectAsync,
    isPending,
    error: connectError,
  } = useConnect();

  const { data: answerCheck, isLoading: checkingAnswer } = useAnswerCheck(
    question?.question_id,
    userWallet
  );

  const { data: onchainStatus } = useOnchainSubmissionStatus(
    question?.contract_address,
    userWallet as `0x${string}` | undefined
  );

  const {
    submit: submitOnchain,
    step,
    error: onchainError,
    isLoading: submittingOnchain,
    reset,
  } = useSubmitAnswerOnchain();

  const alreadySubmitted =
    !!answerCheck?.hasAnswered ||
    !!onchainStatus?.hasSubmitted ||
    (onchainError?.toLowerCase().includes('already') ?? false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerText.trim() || !userWallet || !question) return;

    try {
      await submitOnchain({
        questionId: question.question_id,
        content: answerText.trim(),
        contractAddress: question.contract_address,
        tokenAddress: question.token_address,
        submissionCost: question.submission_cost,
      });

      setAnswerText('');
      setShowForm(false);
    } catch (err) {
      console.error('Error submitting answer:', err);
    }
  };

  const formatUSDC = (amount: number) => (amount / 1e6).toFixed(2);

  const formatTimeLeftForShare = (value: string) => {
    if (!value || value === 'ENDED') return 'soon';
    const parts = value.split(' ');
    const first = parts[0];
    if (!first) return 'soon';
    const num = Number(first.slice(0, -1));
    const unit = first.slice(-1);
    if (Number.isNaN(num) || num <= 0) return 'soon';
    const unitMap: Record<string, [singular: string, plural: string]> = {
      D: ['day', 'days'],
      H: ['hour', 'hours'],
      M: ['minute', 'minutes'],
      S: ['second', 'seconds'],
    };
    const words = unitMap[unit] ?? ['second', 'seconds'];
    const label = num === 1 ? words[0] : words[1];
    return `${num} ${label}`;
  };

  const handleShare = async () => {
    try {
      const url = `${window.location.origin}/questions/${question.question_id}`;
      const timeText = formatTimeLeftForShare(timeLeft);
      const potentialEarnings = `${question.total_submissions} USDC`;
      const text = `I may earn ${potentialEarnings} by contributing to this discourse. Rewards distributed in ${timeText}.`;

      const result = await sdk.actions.composeCast({
        text,
        embeds: [url],
      });

      if (!result?.cast) {
        await navigator.clipboard.writeText(url);
      }
    } catch (err) {
      try {
        const url = `${window.location.origin}/questions/${question.question_id}`;
        await navigator.clipboard.writeText(url);
      } catch {}
      console.error('Error composing cast:', err);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {answerCheck?.hasAnswered && (
        <button
          onClick={handleShare}
          className="cta-button w-full"
        >
          Invite Friends To Answer
        </button>
      )}

      {userWallet ? (
        <>
          {checkingAnswer ? (
            <div className="flex items-center justify-center py-3">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-amber-400 border-t-transparent" />
              <span className="ml-2 text-white/80">Checking...</span>
            </div>
          ) : alreadySubmitted ? (
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium">Your Answer</span>
                {answerCheck?.answer?.score !== undefined &&
                  (answerCheck?.answer?.score ?? 0) > 0 && (
                    <span className="bg-amber-500/20 text-amber-300 px-2 py-1 rounded-lg text-xs font-medium">
                      Score: {answerCheck?.answer?.score}
                      {answerCheck?.answer?.rank &&
                        ` (#${answerCheck?.answer?.rank})`}
                    </span>
                  )}
              </div>
              {answerCheck?.answer?.content ? (
                <p className="text-white/80 text-sm">
                  {answerCheck?.answer?.content}
                </p>
              ) : (
                <p className="text-white/60 text-sm italic">
                  Already submitted.
                </p>
              )}
            </div>
          ) : (
            <>
              {!showForm ? (
                <button
                  onClick={() => setShowForm(true)}
                  disabled={timeLeft === 'ENDED'}
                  className={`w-full ${
                    timeLeft === 'ENDED'
                      ? 'bg-slate-700 text-slate-400 cursor-not-allowed border border-slate-600 py-3 px-6 rounded-xl font-semibold transition-all'
                      : 'cta-button'
                  }`}
                >
                  {timeLeft === 'ENDED' ? 'Discourse Ended' : 'Answer'}
                </button>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {alreadySubmitted && (
                    <div className="bg-purple-500/10 border border-purple-400/30 rounded-xl p-3">
                      <p className="text-purple-200 text-sm">
                        You've already contributed to this discourse. Submitting
                        again will replace your previous answer onchain (if
                        contract allows) and will still incur the submission
                        cost.
                      </p>
                    </div>
                  )}
                  <textarea
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    placeholder="Contribute to the discourse..."
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-amber-400/60 resize-none"
                    rows={8}
                    required
                  />
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={
                        !answerText.trim() ||
                        submittingOnchain ||
                        timeLeft === 'ENDED'
                      }
                      className="cta-button flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submittingOnchain ? (
                        <span className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-black/60 border-t-transparent mr-2" />
                          {step === 'checking-allowance' && 'Checking...'}
                          {step === 'approving' && 'Approving...'}
                          {step === 'submitting' && 'Submitting...'}
                          {step === 'storing' && 'Storing...'}
                        </span>
                      ) : (
                        'Submit (' +
                        formatUSDC(question.submission_cost) +
                        ' USDC)'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setAnswerText('');
                        reset();
                      }}
                      className="px-6 py-3 bg-white/10 border border-white/20 rounded-xl text-white hover:bg-white/20 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                  {onchainError && (
                    <div className="rounded-xl border border-rose-500/30 bg-rose-950/50 p-3">
                      <p className="text-rose-200 text-sm">{onchainError}</p>
                    </div>
                  )}
                </form>
              )}
            </>
          )}
        </>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
          <p className="text-white/80 mb-3">
            Connect your wallet to contribute.
          </p>
          <button
            disabled={
              isPending || !connectors?.[0] || account.status === 'connecting'
            }
            onClick={async () => {
              try {
                const preferred = connectors?.[0];
                if (!preferred) return;
                await connectAsync({ connector: preferred });
              } catch {}
            }}
            className="cta-button w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {account.status === 'connecting' || isPending
              ? 'Connecting...'
              : 'Connect Wallet'}
          </button>
          {connectError && (
            <p className="mt-2 text-rose-300 text-sm">
              {connectError.message || 'Failed to connect'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
