import { useState, useEffect } from 'react';
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
    <div className="bg-stone-800 relative z-10 flex h-full flex-1 flex-col flex-wrap gap-y-2.5 px-3 py-2.5">
      {/* Question */}
      <h2 className="text-lg font-semibold">{question.content}</h2>

      {/* Stats */}
      <div className="flex items-center justify-center space-x-1">
        <span className="text-white/80 text-sm">
          {question.total_submissions} submissions
        </span>
      </div>

      {/* Bottom Section */}
      <div className="">
        <div className="flex justify-between items-center mb-4">
          {answerCheck?.hasAnswered && (
            <span className="text-purple-300 text-sm font-medium">
              You Answered
            </span>
          )}
        </div>

        {userWallet && (
          <>
            {checkingAnswer ? (
              <div className="flex items-center justify-center py-3">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                <span className="ml-2 text-white/70">Checking...</span>
              </div>
            ) : alreadySubmitted ? (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium">Your Answer</span>
                  {answerCheck?.answer?.score !== undefined &&
                    (answerCheck?.answer?.score ?? 0) > 0 && (
                      <span className="bg-coral-500/20 text-coral-400 px-2 py-1 rounded-lg text-xs font-medium">
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
                    className={`w-full py-3 px-6 rounded-xl font-semibold transition-colors ${
                      timeLeft === 'ENDED'
                        ? 'bg-slate-700 text-slate-400 cursor-not-allowed border border-slate-600'
                        : 'bg-coral-500 hover:bg-coral-600 text-white'
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
                    <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-3">
                      <p className="text-yellow-200 text-sm">
                        <span className="font-medium">⚠️ Cost:</span>{' '}
                        {formatUSDC(question.submission_cost)} USDC
                      </p>
                    </div>
                    <textarea
                      value={answerText}
                      onChange={(e) => setAnswerText(e.target.value)}
                      placeholder="Write your answer..."
                      className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:border-coral-500 focus:outline-none resize-none"
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
                        className="flex-1 bg-coral-500 hover:bg-coral-600 text-white py-3 px-6 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {submittingOnchain ? (
                          <span className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
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
                      <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-3">
                        <p className="text-red-200 text-sm">{onchainError}</p>
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
