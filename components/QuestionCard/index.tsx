import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Question } from '@/hooks/use-active-questions';
import { useAnswerCheck } from '@/hooks/use-answer-check';
import { useSubmitAnswerOnchain } from '@/hooks/use-submit-answer-onchain';
import { useOnchainSubmissionStatus } from '@/hooks/use-onchain-submission-status';

interface QuestionCardProps {
  question: Question;
  userWallet?: string;
}

export default function QuestionCard({
  question,
  userWallet,
}: QuestionCardProps) {
  const [answerText, setAnswerText] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');

  console.log(question);
  console.log(userWallet);

  const { data: answerCheck, isLoading: checkingAnswer } = useAnswerCheck(
    question.question_id,
    userWallet
  );

  const { data: onchainStatus } = useOnchainSubmissionStatus(
    question.contract_address,
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
    if (!answerText.trim() || !userWallet) return;

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
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  };
  const formatUSDC = (amount: number) => (amount / 1e6).toFixed(2);

  // Format countdown with large numbers and small letters
  const formatCountdown = (timeString: string) => {
    if (timeString === 'ENDED') {
      return <span className="text-red-400">ENDED</span>;
    }

    // Split the time string and format each part
    const parts = timeString.split(' ');
    return (
      <span className="flex items-baseline space-x-1">
        {parts.map((part, index) => {
          const number = part.slice(0, -1);
          const letter = part.slice(-1);
          return (
            <span key={index} className="flex items-baseline">
              <span className="text-2xl font-bold">{number}</span>
              <span className="text-xs uppercase ml-0.5">{letter}</span>
            </span>
          );
        })}
      </span>
    );
  };

  // Countdown timer effect
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const endTime = new Date(question.end_time).getTime();
      const difference = endTime - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const minutes = Math.floor(
          (difference % (1000 * 60 * 60)) / (1000 * 60)
        );
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        if (days > 0) {
          setTimeLeft(`${days}D ${hours}H ${minutes}M ${seconds}S`);
        } else if (hours > 0) {
          setTimeLeft(`${hours}H ${minutes}M ${seconds}S`);
        } else if (minutes > 0) {
          setTimeLeft(`${minutes}M ${seconds}S`);
        } else {
          setTimeLeft(`${seconds}S`);
        }
      } else {
        setTimeLeft('ENDED');
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [question.end_time]);

  return (
    <div className="glass-card group relative overflow-hidden rounded-2xl p-6 text-white">
      <div className="pointer-events-none absolute -top-24 right-1/2 h-48 w-48 translate-x-1/2 rounded-full bg-amber-500/10 blur-2xl group-hover:bg-amber-500/15" />
      {/* Date and Countdown */}
      <div className="flex justify-center mb-4">
        <div className="text-slate-300 font-medium tracking-tight uppercase">
          {formatCountdown(timeLeft)}
        </div>
      </div>

      {/* Reward Amount */}
      <div className="flex items-center justify-center mb-6">
        <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-300 to-orange-400">
          ${question.total_reward_pool.toString()}
        </span>
      </div>

      {/* Question */}
      <Link href={`/questions/${question.question_id}`}>
        <h3 className="text-xl font-semibold text-center mb-4 leading-relaxed text-slate-100 hover:text-amber-300 transition-colors cursor-pointer">
          {question.content}
        </h3>
      </Link>

      {/* Stats */}
      <div className="flex items-center justify-center">
        <span className="text-white/80 text-xs sm:text-sm font-medium bg-white/5 rounded-full px-2.5 py-1">
          {question.total_submissions} submissions
        </span>
      </div>

      {/* Bottom Section */}
      <div className="">
        <div className="flex justify-between items-center mb-4">
          {answerCheck?.hasAnswered && (
            <span className="text-emerald-300 text-xs font-medium bg-emerald-500/10 ring-1 ring-emerald-500/20 px-2 py-1 rounded-md">
              You Answered
            </span>
          )}
        </div>

        {userWallet && (
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
                    className={`w-full py-3 px-6 rounded-xl font-semibold transition-all ${
                      timeLeft === 'ENDED'
                        ? 'bg-slate-700 text-slate-400 cursor-not-allowed border border-slate-600'
                        : 'bg-gradient-to-b from-amber-400 to-orange-500 text-black shadow-lg shadow-amber-500/20 ring-1 ring-black/10 hover:brightness-105 hover:-translate-y-0.5'
                    }`}
                  >
                    {timeLeft === 'ENDED' ? 'Question Ended' : 'Answer'}
                  </button>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {alreadySubmitted && (
                      <div className="bg-purple-500/10 border border-purple-400/30 rounded-xl p-3">
                        <p className="text-purple-200 text-sm">
                          You have already submitted. Submitting again will
                          replace your previous answer on-chain (if contract
                          allows) and will still incur the submission cost.
                        </p>
                      </div>
                    )}
                    <div className="bg-yellow-500/15 ring-1 ring-yellow-500/30 rounded-xl p-3 text-yellow-100">
                      <p className="text-sm">
                        <span className="font-medium">Cost:</span>{' '}
                        {formatUSDC(question.submission_cost)} USDC
                      </p>
                    </div>
                    <textarea
                      value={answerText}
                      onChange={(e) => setAnswerText(e.target.value)}
                      placeholder="Write your answer..."
                      className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-amber-400/60 resize-none"
                      rows={3}
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
                        className="flex-1 bg-gradient-to-b from-amber-400 to-orange-500 text-black py-3 px-6 rounded-xl font-semibold shadow-lg shadow-amber-500/20 ring-1 ring-black/10 hover:brightness-105 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
                          'Submit Answer'
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
        )}
      </div>
    </div>
  );
}
