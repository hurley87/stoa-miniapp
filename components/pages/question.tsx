'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useQuestion } from '@/hooks/use-active-questions';
import { useTotalRewardValue } from '@/hooks/use-total-reward-value';
import { useEvaluateAnswersOnchain } from '@/hooks/use-evaluate-answers-onchain';
import { useQuestionEvaluated } from '@/hooks/use-question-evaluated';
import AnswerQuestion from '@/components/answer-question';
import Answers from '@/components/answers';
import Countdown from '@/components/countdown';
import { useUser } from '@/contexts/user-context';

type Props = { idParam: string };

type EvaluationResult = {
  address: string;
  response: string;
  reward_amount: number;
  reward_reason: string;
};

export default function QuestionPage({ idParam }: Props) {
  const asNumber = Number(idParam);
  const isInvalidId = Number.isNaN(asNumber);
  const questionId = isInvalidId ? undefined : asNumber;
  const searchParams = useSearchParams();
  const referrerAddress = searchParams.get('ref');

  const { data: question, isLoading, error } = useQuestion(questionId);
  const { data: currentRewardPool, isLoading: isLoadingRewards } =
    useTotalRewardValue(question?.contract_address);
  const { data: isEvaluatedOnchain, isLoading: isLoadingEvaluationStatus } =
    useQuestionEvaluated(question?.contract_address);
  const router = useRouter();
  const { user } = useUser();

  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResults, setEvaluationResults] = useState<
    EvaluationResult[] | null
  >(null);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [reviewAnswers, setReviewAnswers] = useState<any[]>([]);
  const [isSavingReview, setIsSavingReview] = useState(false);

  const {
    submit: submitEvaluationOnchain,
    step: evaluationStep,
    error: onchainError,
    isLoading: isSubmittingOnchain,
    reset: resetOnchainEvaluation,
  } = useEvaluateAnswersOnchain();

  const truncateAddress = (addr: string) =>
    addr && addr.startsWith('0x')
      ? `${addr.slice(0, 6)}…${addr.slice(-4)}`
      : addr;

  const getDisplayName = (username: string | null, wallet: string) =>
    username && username.trim().length > 0 ? username : truncateAddress(wallet);

  const getInitial = (text: string) => (text?.[0] ?? '?').toUpperCase();

  const isQuestionEnded = () => {
    if (!question?.end_time) return false;
    return new Date().getTime() >= new Date(question.end_time).getTime();
  };

  const isQuestionCreator = () => {
    return user.data?.creator?.creator_id === question?.creator_id;
  };

  const handleEvaluateAnswers = async () => {
    if (!question) return;

    // Check if question is already evaluated onchain
    if (isEvaluatedOnchain) {
      setEvaluationError('This question has already been evaluated onchain.');
      return;
    }

    const actualRewardPool = getTotalRewardPool();
    if (actualRewardPool <= 0) {
      setEvaluationError('No reward pool available for distribution');
      return;
    }

    setIsEvaluating(true);
    setEvaluationError(null);

    try {
      const response = await fetch(
        `/api/questions/${question.question_id}/evaluate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            actualRewardPool,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to evaluate answers');
      }

      setEvaluationResults(data.evaluation_results);
      // Switch to review mode after AI evaluation
      await loadReviewData();
      setIsReviewMode(true);
    } catch (err) {
      console.error('Evaluation error:', err);
      setEvaluationError(
        err instanceof Error ? err.message : 'Failed to evaluate answers'
      );
    } finally {
      setIsEvaluating(false);
    }
  };

  const loadReviewData = async () => {
    if (!question) return;

    try {
      const response = await fetch(
        `/api/questions/${question.question_id}/review`
      );
      const data = await response.json();

      if (response.ok) {
        setReviewAnswers(data.answers);
      }
    } catch (err) {
      console.error('Error loading review data:', err);
    }
  };

  const getTotalRewardPool = () => {
    // Use current reward pool from contract, fallback to database value
    if (currentRewardPool !== undefined) {
      return currentRewardPool;
    }

    if (!question) return 0;
    // Fallback: seeded_amount from database (in smallest unit, 6 decimals for USDC)
    const totalPoolRaw = Number(question.seeded_amount);
    return totalPoolRaw / 1e6; // Convert to USDC
  };

  const getCurrentDistribution = () => {
    return reviewAnswers.reduce(
      (sum, answer) => sum + (answer.creator_reward_amount || 0),
      0
    );
  };

  const isFullyDistributed = () => {
    const expected = getTotalRewardPool();
    const current = getCurrentDistribution();
    return Math.abs(current - expected) <= 0.01;
  };

  const handleReviewSave = async () => {
    if (!question || !reviewAnswers.length) return;

    // Validate distribution before saving
    if (!isFullyDistributed()) {
      setEvaluationError(
        `All tokens must be distributed. Expected: ${getTotalRewardPool().toFixed(
          2
        )} USDC, Current: ${getCurrentDistribution().toFixed(2)} USDC`
      );
      return;
    }

    setIsSavingReview(true);

    try {
      const evaluations = reviewAnswers.map((answer) => ({
        answer_id: answer.id,
        reward_amount: answer.creator_reward_amount || 0,
        reward_reason: answer.creator_reward_reason || 'No reward',
      }));

      const response = await fetch(
        `/api/questions/${question.question_id}/review`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            evaluations,
            actualRewardPool: getTotalRewardPool(),
          }),
        }
      );

      if (response.ok) {
        // Update local state to show completion
        setIsReviewMode(false);
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save review');
      }
    } catch (err) {
      console.error('Error saving review:', err);
      setEvaluationError(
        err instanceof Error ? err.message : 'Failed to save review'
      );
    } finally {
      setIsSavingReview(false);
    }
  };

  const updateReviewAnswer = (answerId: number, field: string, value: any) => {
    setReviewAnswers((prev) =>
      prev.map((answer) =>
        answer.id === answerId ? { ...answer, [field]: value } : answer
      )
    );
  };

  const getRankedIndices = () => {
    // Sort answers by reward amount (descending) to get ranking
    // Filter out answers with 0 rewards as they don't get ranked
    const winnersOnly = reviewAnswers.filter(
      (answer) => (answer.creator_reward_amount || 0) > 0
    );

    // Sort by reward amount descending (highest rewards first)
    const sortedWinners = winnersOnly.sort(
      (a, b) => (b.creator_reward_amount || 0) - (a.creator_reward_amount || 0)
    );

    // Return the answer_index values in ranked order
    return sortedWinners.map((answer) => answer.answer_index);
  };

  const handleSubmitToBlockchain = async () => {
    if (!question || !reviewAnswers.length) return;

    // Check if question is already evaluated onchain
    if (isEvaluatedOnchain) {
      setEvaluationError('This question has already been evaluated onchain.');
      return;
    }

    try {
      resetOnchainEvaluation();

      const rankedIndices = getRankedIndices();
      if (rankedIndices.length === 0) {
        setEvaluationError(
          'No winners selected. At least one answer must receive a reward.'
        );
        return;
      }

      await submitEvaluationOnchain({
        contractAddress: question.contract_address,
        rankedIndices,
      });
    } catch (err) {
      console.error('Onchain evaluation error:', err);
      setEvaluationError(
        err instanceof Error
          ? err.message
          : 'Failed to submit evaluation to blockchain'
      );
    }
  };

  const formatUsdc = (n: number) =>
    n.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const formatAddress = (address: string, leading = 6, trailing = 4) => {
    if (!address) return '';
    const normalized = String(address);
    if (normalized.length <= leading + trailing + 1) return normalized;
    return `${normalized.slice(0, leading)}…${normalized.slice(-trailing)}`;
  };

  // Load review data if question is ended and user is creator (and not already evaluated)
  React.useEffect(() => {
    if (
      question &&
      isQuestionEnded() &&
      isQuestionCreator() &&
      !isReviewMode &&
      !evaluationResults &&
      !isEvaluatedOnchain &&
      !isLoadingEvaluationStatus
    ) {
      loadReviewData();
    }
  }, [question, isEvaluatedOnchain, isLoadingEvaluationStatus]);

  return (
    <div className="min-h-screen px-4 pt-16 pb-6">
      <div className="max-w-2xl mx-auto px-0">
        {isInvalidId ? (
          <div className="rounded-xl border border-rose-500/30 bg-rose-950/50 p-4 text-rose-200">
            Invalid question id
          </div>
        ) : isLoading ? (
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
          <div className="flex w-full max-w-lg shrink-0 flex-col gap-y-6 text-white">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => router.back()}
                aria-label="Go back"
                className="glass-button inline-flex items-center gap-2 rounded-md px-2 py-1 text-slate-300 hover:text-white hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-amber-400/40 active:bg-white/10 transition"
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                <span className="hidden sm:inline">Back</span>
              </button>
              {question.end_time && <Countdown endTime={question.end_time} />}
            </div>
            {/* Creator */}
            <div className="flex items-center gap-3">
              {question.creator_pfp ? (
                <img
                  src={question.creator_pfp}
                  alt={`${getDisplayName(
                    question.creator_username,
                    question.creator
                  )}'s avatar`}
                  className="h-10 w-10 rounded-full object-cover ring-1 ring-white/10"
                  loading="lazy"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-500/30 to-amber-300/20 ring-1 ring-white/10 flex items-center justify-center text-sm font-semibold text-slate-100">
                  {getInitial(
                    getDisplayName(question.creator_username, question.creator)
                  )}
                </div>
              )}
              <div className="flex flex-col">
                <Link
                  href={`/profile/${question.creator}`}
                  className="text-slate-200 text-base font-medium hover:text-white transition-colors"
                >
                  {getDisplayName(question.creator_username, question.creator)}
                </Link>
                <span className="text-slate-400 text-sm">
                  Asked this question
                </span>
              </div>
            </div>

            <h3 className="text-xl font-semibold text-slate-100">
              {question.content}
            </h3>

            {isQuestionEnded() ? (
              <div className="space-y-4">
                {isQuestionCreator() ? (
                  isEvaluatedOnchain ? (
                    <div className="bg-purple-500/10 border border-purple-400/30 rounded-xl p-4">
                      <h4 className="text-purple-300 font-semibold mb-2">
                        Question Already Evaluated
                      </h4>
                      <p className="text-purple-200/80 text-sm">
                        This question has been evaluated and submitted to the
                        blockchain. Winners can now claim their rewards.
                      </p>
                    </div>
                  ) : !evaluationResults ? (
                    <div className="bg-amber-500/10 border border-amber-400/30 rounded-xl p-4">
                      <h4 className="text-amber-300 font-semibold mb-2">
                        Question Ended - Ready for Evaluation
                      </h4>
                      <p className="text-amber-200/80 text-sm mb-4">
                        Your question has ended. Click below to evaluate the
                        answers and distribute rewards.
                      </p>
                      <button
                        onClick={handleEvaluateAnswers}
                        disabled={isEvaluating || isEvaluatedOnchain}
                        className="cta-button w-full disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isEvaluating ? (
                          <span className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-black/60 border-t-transparent mr-2" />
                            Evaluating...
                          </span>
                        ) : (
                          'Evaluate Answers'
                        )}
                      </button>
                      {evaluationError && (
                        <div className="mt-3 rounded-xl border border-rose-500/30 bg-rose-950/50 p-3">
                          <p className="text-rose-200 text-sm">
                            {evaluationError}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : isReviewMode ? (
                    <div className="space-y-4">
                      <div className="bg-blue-500/10 border border-blue-400/30 rounded-xl p-4">
                        <h4 className="text-blue-300 font-semibold mb-2">
                          Review AI Evaluation
                        </h4>
                        <p className="text-blue-200/80 text-sm mb-3">
                          Review and modify the AI&apos;s evaluation below. You
                          can adjust reward amounts and reasons before
                          submitting.
                        </p>

                        {/* Distribution Status */}
                        <div
                          className={`rounded-lg p-3 mb-4 ${
                            isFullyDistributed()
                              ? 'bg-emerald-500/10 border border-emerald-400/30'
                              : 'bg-amber-500/10 border border-amber-400/30'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-sm font-semibold ${
                                isFullyDistributed()
                                  ? 'text-emerald-300'
                                  : 'text-amber-300'
                              }`}
                            >
                              Token Distribution
                            </span>
                            <span
                              className={`text-sm ${
                                isFullyDistributed()
                                  ? 'text-emerald-200'
                                  : 'text-amber-200'
                              }`}
                            >
                              {getCurrentDistribution().toFixed(2)} /{' '}
                              {getTotalRewardPool().toFixed(2)} USDC
                            </span>
                          </div>
                          {!isFullyDistributed() && (
                            <div className="text-xs text-amber-200/80 mt-1">
                              ⚠️ All {getTotalRewardPool().toFixed(2)} USDC must
                              be distributed to winners
                            </div>
                          )}
                        </div>

                        <div className="flex gap-3">
                          <button
                            onClick={handleReviewSave}
                            disabled={isSavingReview || !isFullyDistributed()}
                            className="cta-button flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isSavingReview ? 'Saving...' : 'Save Review'}
                          </button>
                          <button
                            onClick={() => setIsReviewMode(false)}
                            className="px-6 py-3 bg-white/10 border border-white/20 rounded-xl text-white hover:bg-white/20 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3">
                        {reviewAnswers.map((answer) => (
                          <div
                            key={answer.id}
                            className="glass-card rounded-2xl p-4 space-y-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div
                                  className="text-xs text-white/70 font-mono break-all"
                                  title={answer.address}
                                >
                                  {formatAddress(answer.address)}
                                </div>
                                <p className="mt-2 text-sm sm:text-base text-slate-100 leading-relaxed">
                                  {answer.content}
                                </p>
                              </div>
                            </div>

                            {/* AI Evaluation (Read-only) */}
                            <div className="bg-slate-800/50 rounded-lg p-3 border-l-4 border-amber-400">
                              <div className="text-xs text-amber-300 font-semibold mb-1">
                                AI Evaluation:
                              </div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm text-white/90">
                                  Reward:{' '}
                                  {formatUsdc(answer.ai_reward_amount || 0)}{' '}
                                  USDC
                                </span>
                              </div>
                              <div className="text-xs text-white/70">
                                {answer.ai_reward_reason}
                              </div>
                            </div>

                            {/* Creator Review (Editable) */}
                            <div className="bg-slate-700/50 rounded-lg p-3 border-l-4 border-blue-400">
                              <div className="text-xs text-blue-300 font-semibold mb-2">
                                Your Review:
                              </div>
                              <div className="space-y-2">
                                <div>
                                  <label className="text-xs text-white/70 block mb-1">
                                    Reward Amount (USDC):
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={answer.creator_reward_amount || 0}
                                    onChange={(e) =>
                                      updateReviewAnswer(
                                        answer.id,
                                        'creator_reward_amount',
                                        Number(e.target.value)
                                      )
                                    }
                                    className="w-full px-2 py-1 bg-white/5 border border-white/20 rounded text-sm text-white"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-white/70 block mb-1">
                                    Reason:
                                  </label>
                                  <textarea
                                    value={answer.creator_reward_reason || ''}
                                    onChange={(e) =>
                                      updateReviewAnswer(
                                        answer.id,
                                        'creator_reward_reason',
                                        e.target.value
                                      )
                                    }
                                    rows={2}
                                    className="w-full px-2 py-1 bg-white/5 border border-white/20 rounded text-sm text-white resize-none"
                                    placeholder="Explain your reward decision..."
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div
                        className={`rounded-xl p-4 ${
                          evaluationStep === 'completed'
                            ? 'bg-emerald-500/10 border border-emerald-400/30'
                            : 'bg-emerald-500/10 border border-emerald-400/30'
                        }`}
                      >
                        <h4 className="text-emerald-300 font-semibold mb-2">
                          {evaluationStep === 'completed'
                            ? 'Evaluation Submitted!'
                            : 'Review Complete'}
                        </h4>
                        <p className="text-emerald-200/80 text-sm mb-4">
                          {evaluationStep === 'completed' ? (
                            'Your evaluation has been successfully submitted to the blockchain. Winners can now claim their rewards.'
                          ) : (
                            <>
                              You have reviewed all answers.{' '}
                              {isFullyDistributed()
                                ? 'Ready to submit to blockchain.'
                                : 'Complete token distribution to submit.'}
                            </>
                          )}
                        </p>
                        {evaluationStep !== 'completed' && (
                          <button
                            onClick={handleSubmitToBlockchain}
                            className="cta-button w-full disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={
                              !isFullyDistributed() ||
                              isSubmittingOnchain ||
                              isEvaluatedOnchain
                            }
                          >
                            {isSubmittingOnchain ? (
                              <span className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-black/60 border-t-transparent mr-2" />
                                {evaluationStep === 'evaluating'
                                  ? 'Submitting to Blockchain...'
                                  : 'Processing...'}
                              </span>
                            ) : (
                              'Submit to Blockchain'
                            )}
                          </button>
                        )}

                        {(evaluationError || onchainError) && (
                          <div className="mt-3 rounded-xl border border-rose-500/30 bg-rose-950/50 p-3">
                            <p className="text-rose-200 text-sm">
                              {onchainError || evaluationError}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="mt-2 rounded-2xl border border-dashed border-white/15 bg-slate-900/40 p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-white/80 text-xs uppercase">
                              Total Evaluated
                            </span>
                            <span className="text-white text-lg font-bold">
                              {evaluationResults.length}
                            </span>
                          </div>
                          <div className="flex flex-col text-right">
                            <span className="text-white/80 text-xs uppercase">
                              Rewards to Distribute
                            </span>
                            <span className="text-white text-lg font-bold">
                              {formatUsdc(
                                evaluationResults.reduce(
                                  (sum, r) => sum + r.reward_amount,
                                  0
                                )
                              )}{' '}
                              USDC
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3">
                        {evaluationResults.map((result, idx) => {
                          const hasReward = result.reward_amount > 0;
                          return (
                            <div
                              key={idx}
                              className="glass-card rounded-2xl p-4"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div
                                    className="text-xs text-white/70 font-mono break-all"
                                    title={result.address}
                                  >
                                    {formatAddress(result.address)}
                                  </div>
                                  <p className="mt-2 text-sm sm:text-base text-slate-100 leading-relaxed">
                                    {result.response}
                                  </p>
                                </div>
                                <div className="shrink-0 text-right">
                                  {hasReward ? (
                                    <span className="inline-block text-emerald-300 bg-emerald-500/10 rounded-full px-2.5 py-1 text-xs font-medium">
                                      +{formatUsdc(result.reward_amount)} USDC
                                    </span>
                                  ) : (
                                    <span className="inline-block text-slate-300 bg-white/5 rounded-full px-2.5 py-1 text-xs font-medium">
                                      No reward
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="mt-2 text-xs text-white/70">
                                {result.reward_reason}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )
                ) : (
                  <div
                    className={`rounded-xl p-4 ${
                      isEvaluatedOnchain
                        ? 'bg-emerald-500/10 border border-emerald-400/30'
                        : 'bg-slate-700/50 border border-slate-600/50'
                    }`}
                  >
                    <h4
                      className={`font-semibold mb-2 ${
                        isEvaluatedOnchain
                          ? 'text-emerald-300'
                          : 'text-slate-300'
                      }`}
                    >
                      {isEvaluatedOnchain
                        ? 'Question Evaluated'
                        : 'Question Ended'}
                    </h4>
                    <p
                      className={`text-sm ${
                        isEvaluatedOnchain
                          ? 'text-emerald-200/80'
                          : 'text-slate-400'
                      }`}
                    >
                      {isEvaluatedOnchain
                        ? 'This question has been evaluated and submitted to the blockchain. Winners can now claim their rewards.'
                        : 'This question has ended and is waiting to be evaluated by the creator. Results will be available once evaluation is complete.'}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <AnswerQuestion
                question={question}
                referrerAddress={referrerAddress}
              />
            )}

            <div className="flex justify-between">
              <div className="flex flex-col">
                <span className="text-white/80 text-xs uppercase">
                  Submissions
                </span>
                <span className="text-white text-lg font-bold">
                  {question.total_submissions}
                </span>
              </div>

              <div className="flex flex-col text-right">
                <span className="text-white/80 text-xs uppercase">
                  Reward Pool
                </span>
                <span className="text-white text-lg font-bold">
                  {isLoadingRewards ? (
                    <span className="animate-pulse">Loading...</span>
                  ) : (
                    `${getTotalRewardPool().toFixed(2)} USDC`
                  )}
                </span>
              </div>
            </div>

            <Answers questionId={question.question_id} />
          </div>
        )}
      </div>
    </div>
  );
}
