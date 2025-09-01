'use client';

import { useState } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { base } from 'wagmi/chains';
import { useAnswerCheck } from '@/hooks/use-answer-check';
import { useOnchainSubmissionStatus } from '@/hooks/use-onchain-submission-status';
import { useSubmitAnswerOnchain } from '@/hooks/use-submit-answer-onchain';
import { useUser } from '@/contexts/user-context';
import { sdk } from '@farcaster/miniapp-sdk';

type QuestionLike = {
  question_id: number;
  submission_cost: number;
  contract_address: string;
  token_address: string;
  total_submissions: number;
  end_time: string;
};

type Props = {
  question: QuestionLike;
  referrerAddress?: string | null;
};

export default function AnswerQuestion({ question, referrerAddress }: Props) {
  const account = useAccount();
  const userWallet = account.address;
  const { user } = useUser();

  const [answerText, setAnswerText] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const [isReferralAccordionOpen, setIsReferralAccordionOpen] = useState(false);

  const {
    connectors,
    connectAsync,
    isPending,
    error: connectError,
  } = useConnect();
  const { disconnect } = useDisconnect();

  const { data: answerCheck, isLoading: checkingAnswer } = useAnswerCheck(
    question?.question_id,
    user.data?.creator?.creator_id
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

    if (!user.data?.creator?.creator_id) {
      alert('Please sign in to submit an answer');
      return;
    }

    try {
      await submitOnchain({
        questionId: question.question_id,
        content: answerText.trim(),
        contractAddress: question.contract_address,
        tokenAddress: question.token_address,
        submissionCost: question.submission_cost,
        creatorId: user.data.creator.creator_id,
        referrerAddress,
      });

      setAnswerText('');
      setShowForm(false);
    } catch (err) {
      console.error('Error submitting answer:', err);
    }
  };

  const formatUSDC = (amount: number) => (amount / 1e6).toFixed(2);

  const getTimeLeft = () => {
    if (!question?.end_time) return '';

    const now = new Date().getTime();
    const endTime = new Date(question.end_time).getTime();
    const difference = endTime - now;

    if (difference <= 0) return 'ENDED';

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    if (days > 0) {
      return `${days}D ${hours}H ${minutes}M ${seconds}S`;
    } else if (hours > 0) {
      return `${hours}H ${minutes}M ${seconds}S`;
    } else if (minutes > 0) {
      return `${minutes}M ${seconds}S`;
    } else {
      return `${seconds}S`;
    }
  };

  const isQuestionEnded = () => {
    if (!question?.end_time) return false;
    return new Date().getTime() >= new Date(question.end_time).getTime();
  };


  const handleShare = async () => {
    try {
      const url = `${window.location.origin}/questions/${question.question_id}${
        userWallet ? `?ref=${userWallet}` : ''
      }`;
      const timeLeft = getTimeLeft();
      let timeText = 'soon';
      if (timeLeft && timeLeft !== 'ENDED') {
        const parts = timeLeft.split(' ');
        const first = parts[0];
        if (first) {
          const num = Number(first.slice(0, -1));
          const unit = first.slice(-1);
          if (!Number.isNaN(num) && num > 0) {
            const unitMap: Record<string, [singular: string, plural: string]> = {
              D: ['day', 'days'],
              H: ['hour', 'hours'],
              M: ['minute', 'minutes'],
              S: ['second', 'seconds'],
            };
            const words = unitMap[unit] ?? ['second', 'seconds'];
            const label = num === 1 ? words[0] : words[1];
            timeText = `${num} ${label}`;
          }
        }
      }
      const potentialEarnings = `${question.total_submissions} USDC`;
      const text = `I may earn ${potentialEarnings} for my thoughtful answer. Rewards distributed in ${timeText}.`;

      const result = await sdk.actions.composeCast({
        text,
        embeds: [url],
      });

      if (!result?.cast) {
        await navigator.clipboard.writeText(url);
      }
    } catch (err) {
      try {
        const url = `${window.location.origin}/questions/${
          question.question_id
        }${userWallet ? `?ref=${userWallet}` : ''}`;
        await navigator.clipboard.writeText(url);
      } catch {}
      console.error('Error composing cast:', err);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {answerCheck?.hasAnswered && (
        <>
          <div className="rounded-xl border border-white/15 bg-white/5">
            <button
              onClick={() =>
                setIsReferralAccordionOpen(!isReferralAccordionOpen)
              }
              className="w-full p-4 text-left flex items-center justify-between hover:bg-white/5 transition-colors rounded-xl"
            >
              <p className="text-white text-sm font-semibold">Referral program</p>
              <svg
                className={`w-4 h-4 text-white/60 transition-transform duration-200 ${
                  isReferralAccordionOpen ? 'rotate-180' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {isReferralAccordionOpen && (
              <div className="px-4 pb-4 border-t border-white/10">
                <div className="mt-3 space-y-3 text-white/80 text-sm">
                  <p className="text-white text-sm font-semibold">
                    Earn 5% referral fees
                  </p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Share questions with your referral link</li>
                    <li>Earn 5% of every answer fee from people you refer</li>
                    <li>Get paid automatically when rewards are distributed</li>
                  </ul>
                  {referrerAddress && (
                    <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-400/20">
                      <p className="text-amber-300 text-xs">
                        💡 You were referred by {referrerAddress.slice(0, 6)}...
                        {referrerAddress.slice(-4)}. They&apos;ll earn a 5%
                        referral fee if you submit an answer!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <button onClick={handleShare} className="cta-button w-full">Share and earn</button>
        </>
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
                <div className="flex flex-col gap-4">
                  <div className="rounded-xl border border-white/15 bg-white/5">
                    <button
                      onClick={() => setIsAccordionOpen(!isAccordionOpen)}
                      className="w-full p-4 text-left flex items-center justify-between hover:bg-white/5 transition-colors rounded-xl"
                    >
                      <p className="text-white text-sm font-semibold">
                        Why answer?
                      </p>
                      <svg
                        className={`w-4 h-4 text-white/60 transition-transform duration-200 ${
                          isAccordionOpen ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                    {isAccordionOpen && (
                      <div className="px-4 pb-4 border-t border-white/10">
                        <ul className="mt-3 space-y-1 text-white/80 text-sm list-disc list-inside">
                          <li>Earn rewards for quality answers</li>
                          <li>80% of fees go to winners</li>
                          <li>
                            Build your reputation through thoughtful
                            contributions
                          </li>
                        </ul>
                        <div className="mt-4 text-white/70 text-xs">
                          <p className="text-white text-sm font-semibold">
                            How winners are chosen
                          </p>
                          <p className="mt-1">
                            When the timer ends, an AI agent reviews every
                            answer for accuracy, originality, and clarity. It
                            scores, ranks, and then distributes rewards
                            proportionally across the top answers. Fees split:
                            80% to winners, 10% to the question creator, 10% to
                            the protocol. Ask. Think. Answer. Earn.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setShowForm(true)}
                    disabled={isQuestionEnded()}
                    className={`w-full ${
                      isQuestionEnded()
                        ? 'bg-slate-700 text-slate-400 cursor-not-allowed border border-slate-600 py-3 px-6 rounded-xl font-semibold transition-all'
                        : 'cta-button'
                    }`}
                  >
                    {isQuestionEnded() ? 'Question Ended' : 'Answer'}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {alreadySubmitted && (
                    <div className="bg-purple-500/10 border border-purple-400/30 rounded-xl p-3">
                      <p className="text-purple-200 text-sm">
                        You have already answered this question. Submitting
                        again will replace your previous answer onchain (if
                        contract allows) and will still incur the submission
                        cost.
                      </p>
                    </div>
                  )}
                  <textarea
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    placeholder="Share your thoughtful answer..."
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
                        isQuestionEnded()
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
                await connectAsync({ connector: preferred, chainId: base.id });
              } catch {}
            }}
            className="cta-button w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {account.status === 'connecting' || isPending
              ? 'Connecting...'
              : 'Connect Wallet'}
          </button>
          {(account.status === 'connecting' || isPending) && (
            <button
              type="button"
              onClick={async () => {
                try {
                  disconnect();
                  // slight delay to allow state to settle before retrying
                  await new Promise((r) => setTimeout(r, 50));
                  const preferred = connectors?.[0];
                  if (!preferred) return;
                  await connectAsync({
                    connector: preferred,
                    chainId: base.id,
                  });
                } catch {}
              }}
              className="mt-2 text-xs underline text-white/80 hover:text-white"
            >
              Having trouble? Retry
            </button>
          )}
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
