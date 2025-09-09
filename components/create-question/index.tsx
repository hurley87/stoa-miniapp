'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useAccount } from 'wagmi';
import { useCreateQuestionOnchain } from '@/hooks/use-create-question-onchain';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { useUser } from '@/contexts/user-context';
import { useIsWhitelisted } from '@/hooks/use-whitelist-status';
import { sdk } from '@farcaster/miniapp-sdk';
import Link from 'next/link';
import WhitelistDisplay from '@/components/whitelist-display';

const DURATION_PRESETS = [
  { label: '5min', seconds: 5 * 60 },
  { label: '30min', seconds: 30 * 60 },
  { label: '1hr', seconds: 60 * 60 },
  { label: '6hr', seconds: 6 * 60 * 60 },
  { label: '12hr', seconds: 12 * 60 * 60 },
  { label: '24hr', seconds: 24 * 60 * 60 },
] as const;

const MIN_DURATION = 60; // 1 minute
const MAX_DURATION = 24 * 60 * 60; // 24 hours

const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m`;
  }
  if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
};

// Convert slider value (0-100) to duration in seconds using a non-linear scale
const sliderToDuration = (value: number): number => {
  // Use different scales for different ranges
  if (value <= 20) {
    // 0-20: 1min to 1hr (more granular for short durations)
    return Math.floor(MIN_DURATION + (value / 20) * (3600 - MIN_DURATION));
  } else if (value <= 60) {
    // 20-60: 1hr to 6hr
    return Math.floor(3600 + ((value - 20) / 40) * (6 * 3600 - 3600));
  } else {
    // 60-100: 6hr to 24hr
    return Math.floor(
      6 * 3600 + ((value - 60) / 40) * (MAX_DURATION - 6 * 3600)
    );
  }
};

// Convert duration in seconds to slider value (0-100)
const durationToSlider = (seconds: number): number => {
  if (seconds <= 3600) {
    return Math.floor(((seconds - MIN_DURATION) / (3600 - MIN_DURATION)) * 20);
  } else if (seconds <= 6 * 3600) {
    return Math.floor(20 + ((seconds - 3600) / (6 * 3600 - 3600)) * 40);
  } else {
    return Math.floor(
      60 + ((seconds - 6 * 3600) / (MAX_DURATION - 6 * 3600)) * 40
    );
  }
};

// Constants for the token and contract addresses
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const;
const DEFAULT_SEED_AMOUNT = '1000000' as const;

const SUBMISSION_COSTS = [
  { label: '$1', usd: 1 },
  { label: '$10', usd: 10 },
  { label: '$50', usd: 50 },
] as const;

// More granular slider options
const SLIDER_PRICE_OPTIONS = [
  1, 2, 3, 5, 7, 10, 15, 20, 25, 30, 40, 50,
] as const;

// Helpers for mapping price values to slider indices/percentages (avoids drift between UI and value)
const isValidPriceOption = (value: number): boolean =>
  (SLIDER_PRICE_OPTIONS as readonly number[]).includes(value);

// Note: priceIndex is currently unused after switching to a linear scale.
// Keeping for potential future discrete-index UI affordances. Prefix with underscore to satisfy linter.
const _priceIndex = (value: number): number =>
  SLIDER_PRICE_OPTIONS.findIndex((p) => p === value);

// Linear dollar-based positioning for visual uniformity
const MIN_PRICE = SLIDER_PRICE_OPTIONS[0];
const MAX_PRICE = SLIDER_PRICE_OPTIONS[SLIDER_PRICE_OPTIONS.length - 1];
const pricePercentLinear = (value: number): number =>
  ((value - MIN_PRICE) / (MAX_PRICE - MIN_PRICE)) * 100;

const getNearestAllowedPrice = (value: number): number => {
  let nearest: number = SLIDER_PRICE_OPTIONS[0] as number;
  let smallestDiff = Math.abs(value - nearest);
  for (const option of SLIDER_PRICE_OPTIONS) {
    const diff = Math.abs(value - option);
    if (diff < smallestDiff) {
      smallestDiff = diff;
      nearest = option;
    }
  }
  return nearest;
};

// Tick labels to render along the slider at their true positions
const TICK_VALUES = [1, 25, 50] as const;

const MIN_WINNERS = 1;
const MAX_WINNERS = 10;

const DEFAULT_EVALUATION_PROMPT = `You are an expert evaluator tasked with ranking answers to the given question. 

Evaluate each answer based on:
- Accuracy and factual correctness
- Completeness and depth of response
- Clarity and coherence
- Relevance to the question

Rank the answers from best to worst, providing a score from 1-10 for each answer and explaining your reasoning for the ranking.`;

const schema = z.object({
  questionContent: z
    .string()
    .trim()
    .min(1, 'Question is required')
    .max(150, 'Max 150 characters'),
  durationSeconds: z
    .number()
    .int()
    .min(MIN_DURATION, 'Duration must be at least 1 minute')
    .max(MAX_DURATION, 'Duration must be at most 24 hours'),
  submissionCostUsd: z
    .number()
    .int()
    .refine((v) => isValidPriceOption(v), 'Invalid submission cost'),
  maxWinners: z
    .number()
    .int()
    .min(MIN_WINNERS, 'Must have at least 1 winner')
    .max(MAX_WINNERS, 'Maximum 10 winners allowed'),
  evaluationPrompt: z
    .string()
    .trim()
    .min(10, 'Evaluation prompt must be at least 10 characters')
    .max(1000, 'Max 1000 characters'),
});

type FormState = {
  questionContent: string;
  durationSeconds: number;
  submissionCostUsd: number;
  maxWinners: number;
  evaluationPrompt: string;
};

export function CreateQuestionForm() {
  const { address } = useAccount();
  const { user } = useUser();
  const { create } = useCreateQuestionOnchain();
  const { isWhitelisted, isLoading: isCheckingWhitelist } =
    useIsWhitelisted(address);
  const [form, setForm] = useState<FormState>({
    questionContent: '',
    durationSeconds: 60 * 60, // 1 hour default
    submissionCostUsd: SUBMISSION_COSTS[0].usd,
    maxWinners: 3, // Default to 3 winners
    evaluationPrompt: DEFAULT_EVALUATION_PROMPT,
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [created, setCreated] = useState<{
    id: number;
    content: string;
    durationSeconds: number;
    submissionCostUsd: number;
  } | null>(null);

  console.log('user', user);
  console.log('address', address);
  console.log('isWhitelisted', isWhitelisted);
  console.log('isCheckingWhitelist', isCheckingWhitelist);

  const canCreate = isWhitelisted;

  interface CreateQuestionRequest {
    questionId: number;
    questionContent: string;
    txHash: string;
    blockNumber?: number;
    creatorId: number;
    token: string;
    submissionCost: string;
    duration: number;
    maxWinners: number;
    seedAmount: string;
    questionContract: string;
    evaluationPrompt: string;
  }

  interface CreateQuestionResponse {
    success: boolean;
    question: { question_id?: number };
  }

  const saveMutation = useApiMutation<
    CreateQuestionResponse,
    CreateQuestionRequest
  >({
    url: '/api/questions/create',
    method: 'POST',
    isProtected: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parse = schema.safeParse(form);
    if (!parse.success) {
      setError(parse.error.errors[0]?.message ?? 'Invalid input');
      return;
    }

    if (!address) {
      setError('Connect your wallet');
      return;
    }

    if (!isWhitelisted) {
      setError(
        "You can't create questions yet. Only whitelisted members can create questions. Check the whitelist below or contact an admin to apply."
      );
      return;
    }

    console.log('user', user);

    setIsSubmitting(true);
    try {
      // On-chain create
      const onchain = await create({
        questionContent: form.questionContent.trim(),
        durationSeconds: form.durationSeconds,
        tokenAddress: USDC_ADDRESS,
        submissionCostUsd: form.submissionCostUsd,
        maxWinners: form.maxWinners,
        seedAmount: BigInt(0),
      });

      // DB save
      if (!user.data?.creator?.creator_id) {
        throw new Error('Creator ID not found. Please sign in again.');
      }

      const saved = await saveMutation.mutateAsync({
        questionId: onchain.questionId,
        questionContent: form.questionContent.trim(),
        txHash: onchain.txHash,
        blockNumber: onchain.blockNumber,
        creatorId: user.data.creator.creator_id,
        token: USDC_ADDRESS,
        submissionCost: String(form.submissionCostUsd * 1_000_000),
        duration: form.durationSeconds,
        maxWinners: form.maxWinners,
        seedAmount: DEFAULT_SEED_AMOUNT,
        questionContract: onchain.questionContract,
        evaluationPrompt: form.evaluationPrompt.trim(),
      });

      const savedQuestionId = saved.question?.question_id ?? onchain.questionId;

      // Show success + share prompt
      setCreated({
        id: savedQuestionId,
        content: form.questionContent.trim(),
        durationSeconds: form.durationSeconds,
        submissionCostUsd: form.submissionCostUsd,
      });

      setForm({
        questionContent: '',
        durationSeconds: 60 * 60, // 1 hour default
        submissionCostUsd: 1,
        maxWinners: 3, // Default to 3 winners
        evaluationPrompt: DEFAULT_EVALUATION_PROMPT,
      });
    } catch (err) {
      let message = 'Failed to create question';
      if (err instanceof Error) {
        message = err.message;
      } else if (typeof err === 'string') {
        message = err;
      }
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDurationForShare = (seconds: number) => {
    if (!seconds || seconds <= 0) return 'soon';
    const days = Math.floor(seconds / 86400);
    if (days > 0) return `${days} ${days === 1 ? 'day' : 'days'}`;
    const hours = Math.floor((seconds % 86400) / 3600);
    if (hours > 0) return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
    const minutes = Math.floor((seconds % 3600) / 60);
    if (minutes > 0)
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
    return 'minutes';
  };

  const handleShare = async () => {
    if (!created) return;
    const url = `${window.location.origin}/questions/${created.id}?ref=${address}`;
    const timeText = formatDurationForShare(created.durationSeconds);
    const text = `I just posed a question: "${created.content}" Share your best answer to earn rewards. Ends in ${timeText}.`;
    try {
      const result = await sdk.actions.composeCast({ text, embeds: [url] });
      if (!result?.cast) {
        await navigator.clipboard.writeText(url);
      }
    } catch (err) {
      try {
        await navigator.clipboard.writeText(url);
      } catch {}
      // eslint-disable-next-line no-console
      console.error('Error composing cast:', err);
    }
  };

  if (!canCreate) {
    return (
      <div className="mx-auto w-full max-w-lg flex flex-col gap-6 pb-6">
        <div className="">
          <h2 className="text-white text-xl font-semibold mb-3">
            Only approved KOLs may drop prompts
          </h2>
          {address ? (
            <p className="text-white/70 mb-4">
              This wallet ({address.slice(0, 6)}…{address.slice(-4)}) isn&#39;t
              approved to drop prompts yet. DM Stoa to apply.
            </p>
          ) : (
            <p className="text-white/70 mb-4">
              Connect a wallet to continue. DM Stoa to apply for KOL access.
            </p>
          )}
        </div>

        <div className="">
          <h3 className="text-white font-semibold mb-3">
            Why become a KOL (Prompt Creator)
          </h3>
          <ul className="space-y-2 text-white/70 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-amber-400 mt-0.5">•</span>
              <span>Earn 10% of all Entry Fees</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 mt-0.5">•</span>
              <span>Curate prompts; guide quality replies</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 mt-0.5">•</span>
              <span>Build your influence</span>
            </li>
          </ul>
          <div className="mt-4 p-3 rounded-lg bg-white/5 border border-white/10">
            <p className="text-white/60 text-xs">
              Example: $1 Entry Fee × 500 replies = $500 fees → you earn $50.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => sdk.actions.viewProfile({ fid: 1265133 })}
            className="cta-button w-full"
          >
            DM Stoa
          </button>
        </div>
        {/* Whitelist Display Section */}
        <WhitelistDisplay className="mt-8" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-lg py-4">
      {created ? (
        <div className=" space-y-6">
          <div className="text-center">
            <h2 className="text-white text-xl font-semibold mb-2">
              Prompt posted
            </h2>
            <p className="text-white/70">
              Your prompt is live. The game is on.
            </p>
          </div>

          <div className="glass-panel rounded-lg p-4">
            <p className="text-white/90 mb-2">{created.content}</p>
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/60">
                Ends in {formatDurationForShare(created.durationSeconds)}
              </span>
              <span className="text-white/60">
                ${created.submissionCostUsd} Entry Fee
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={handleShare}
              className="cta-button w-full"
            >
              Share and earn
            </button>
            <Link
              href={`/questions/${created.id}`}
              className="glass-button w-full text-center py-3 px-6 rounded-xl font-medium text-white transition-all"
            >
              View prompt
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-12">
          <div className="rounded-xl">
            <div className="space-y-3">
              <label className="block text-sm font-medium text-white/80">
                Your prompt
              </label>
              <textarea
                rows={3}
                value={form.questionContent}
                onChange={(e) =>
                  setForm((s) => ({ ...s, questionContent: e.target.value }))
                }
                maxLength={150}
                placeholder="Drop a clear, concrete prompt"
                className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-amber-400/60 resize-none transition-all"
              />
              <div className="flex justify-between text-xs">
                <span className="text-white/50">
                  Clear prompts get better replies
                </span>
                <span className="text-white/60">
                  {form.questionContent.length}/150
                </span>
              </div>
            </div>
          </div>

          {/* Separator */}
          <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

          <div className="">
            <label className="block text-sm font-medium text-white/80 mb-3">
              Evaluation instructions
            </label>
            <textarea
              rows={6}
              value={form.evaluationPrompt}
              onChange={(e) =>
                setForm((s) => ({ ...s, evaluationPrompt: e.target.value }))
              }
              maxLength={1000}
              placeholder="Tell the AI how to evaluate and rank answers"
              className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-amber-400/60 resize-none text-sm transition-all"
            />
            <div className="flex justify-between text-xs mt-2">
              <span className="text-white/50">
                Guide the AI evaluator&#39;s decisions
              </span>
              <span className="text-white/60">
                {form.evaluationPrompt.length}/1000
              </span>
            </div>
          </div>

          {/* Separator */}
          <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

          <div className="">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-white/80">
                Reply window
              </label>
              <span className="text-sm font-mono text-amber-400">
                {formatDuration(form.durationSeconds)}
              </span>
            </div>

            <div className="space-y-4">
              <input
                type="range"
                min="0"
                max="100"
                value={durationToSlider(form.durationSeconds)}
                onChange={(e) => {
                  const sliderValue = parseInt(e.target.value);
                  const duration = sliderToDuration(sliderValue);
                  setForm((s) => ({ ...s, durationSeconds: duration }));
                }}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer transition-all"
                style={{
                  background: `linear-gradient(to right, #f59e0b 0%, #f59e0b ${durationToSlider(
                    form.durationSeconds
                  )}%, rgba(255,255,255,0.1) ${durationToSlider(
                    form.durationSeconds
                  )}%, rgba(255,255,255,0.1) 100%)`,
                }}
              />
              <div className="flex justify-between text-xs text-white/50">
                <span>1min</span>
                <span>1hr</span>
                <span>6hr</span>
                <span>24hr</span>
              </div>

              <div className="grid grid-cols-6 gap-2">
                {DURATION_PRESETS.map((preset) => (
                  <button
                    key={preset.seconds}
                    type="button"
                    onClick={() =>
                      setForm((s) => ({
                        ...s,
                        durationSeconds: preset.seconds,
                      }))
                    }
                    className={
                      `glass-button rounded-lg p-2 text-xs font-medium transition-all ` +
                      (form.durationSeconds === preset.seconds
                        ? 'bg-amber-500/20 border-amber-400/40 text-amber-300'
                        : 'text-white/70 hover:text-white')
                    }
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Separator */}
          <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

          <div className="">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-white/80">
                Entry Fee
              </label>
              <span className="text-sm font-mono text-amber-400">
                ${form.submissionCostUsd}
              </span>
            </div>

            <div className="space-y-4">
              <input
                type="range"
                min={MIN_PRICE}
                max={MAX_PRICE}
                step={1}
                value={form.submissionCostUsd}
                onChange={(e) => {
                  const raw = parseInt(e.target.value);
                  const price = getNearestAllowedPrice(raw);
                  setForm((s) => ({ ...s, submissionCostUsd: price }));
                }}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer transition-all"
                style={{
                  background: `linear-gradient(to right, #f59e0b 0%, #f59e0b ${pricePercentLinear(
                    form.submissionCostUsd
                  )}%, rgba(255,255,255,0.1) ${pricePercentLinear(
                    form.submissionCostUsd
                  )}%, rgba(255,255,255,0.1) 100%)`,
                }}
              />
              <div className="relative h-5">
                {TICK_VALUES.map((v) => (
                  <span
                    key={v}
                    className="absolute -translate-x-1/2 transform text-xs text-white/50"
                    style={{ left: `${pricePercentLinear(v)}%` }}
                  >
                    ${v}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-2">
                {SUBMISSION_COSTS.map((c) => (
                  <button
                    key={c.usd}
                    type="button"
                    onClick={() =>
                      setForm((s) => ({ ...s, submissionCostUsd: c.usd }))
                    }
                    className={
                      `glass-button rounded-lg p-2 text-xs font-medium transition-all ` +
                      (form.submissionCostUsd === c.usd
                        ? 'bg-amber-500/20 border-amber-400/40 text-amber-300'
                        : 'text-white/70 hover:text-white')
                    }
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Separator */}
          <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

          <div className="">
            <label className="block text-sm font-medium text-white/80 mb-4">
              Max winners
            </label>
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setForm((s) => ({ ...s, maxWinners: num }))}
                  className={
                    `glass-button rounded-lg p-3 text-sm font-medium transition-all ` +
                    (form.maxWinners === num
                      ? 'bg-amber-500/20 border-amber-400/40 text-amber-300'
                      : 'text-white/70 hover:text-white')
                  }
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="rounded-xl p-4 border border-rose-500/30 bg-rose-950/20">
              <p className="text-rose-300 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="cta-button w-full disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-black/60 border-t-transparent mr-2" />
                  Posting...
                </span>
              ) : (
                'Post prompt'
              )}
            </button>
            <p className="text-white/60 text-xs text-center">
              Earn 10% of all Entry Fees
            </p>
          </div>
        </form>
      )}
    </div>
  );
}

export default CreateQuestionForm;
