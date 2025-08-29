'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useAccount } from 'wagmi';
import { useCreateQuestionOnchain } from '@/hooks/use-create-question-onchain';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { sdk } from '@farcaster/miniapp-sdk';
import Link from 'next/link';

const ALLOWLISTED_CREATORS = [
  '0x26e94d56892521c4c7bbbd1d9699725932797e9c',
  '0x891161c0fdd4797c79400ca2256a967bd6198450',
  '0xeFe07d20e9b15aCc922457060B93DA1052F60ea3',
].map((a) => a.toLowerCase());

const isAllowedCreator = (addr?: string | null) => {
  if (!addr) return false;
  return ALLOWLISTED_CREATORS.includes(addr.toLowerCase());
};

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
  { label: '$100', usd: 100 },
] as const;

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
    .refine((v) => [1, 10, 100].includes(v), 'Invalid submission cost'),
});

type FormState = {
  questionContent: string;
  durationSeconds: number;
  submissionCostUsd: number;
};

export function CreateQuestionForm() {
  const { address } = useAccount();
  const { create } = useCreateQuestionOnchain();
  const [form, setForm] = useState<FormState>({
    questionContent: '',
    durationSeconds: 60 * 60, // 1 hour default
    submissionCostUsd: SUBMISSION_COSTS[0].usd,
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [created, setCreated] = useState<{
    id: number;
    content: string;
    durationSeconds: number;
    submissionCostUsd: number;
  } | null>(null);

  const canCreate = isAllowedCreator(address?.toLowerCase());

  interface CreateQuestionRequest {
    questionId: number;
    questionContent: string;
    txHash: string;
    blockNumber?: number;
    creator: string;
    token: string;
    submissionCost: string;
    duration: number;
    maxWinners: number;
    seedAmount: string;
    questionContract: string;
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

    if (!isAllowedCreator(address)) {
      setError(
        "You can't create questions yet. Only Logos members can create questions. DM Stoa to apply to join."
      );
      return;
    }

    setIsSubmitting(true);
    try {
      // On-chain create
      const onchain = await create({
        questionContent: form.questionContent.trim(),
        durationSeconds: form.durationSeconds,
        tokenAddress: USDC_ADDRESS,
        submissionCostUsd: form.submissionCostUsd,
        maxWinners: 3,
        seedAmount: BigInt(0),
      });

      // DB save
      const saved = await saveMutation.mutateAsync({
        questionId: onchain.questionId,
        questionContent: form.questionContent.trim(),
        txHash: onchain.txHash,
        blockNumber: onchain.blockNumber,
        creator: address,
        token: USDC_ADDRESS,
        submissionCost: String(form.submissionCostUsd * 1_000_000),
        duration: form.durationSeconds,
        maxWinners: 3,
        seedAmount: DEFAULT_SEED_AMOUNT,
        questionContract: onchain.questionContract,
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
    const url = `${window.location.origin}/questions/${created.id}`;
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
      <div className="mx-auto w-full max-w-md flex flex-col gap-4 pb-6">
        <div className="rounded-xl border border-white/15 bg-white/5 p-4">
          <p className="text-white text-lg font-semibold">Only Logos may ask</p>
          {address ? (
            <p className="text-white/80 text-sm mt-1">
              This wallet ({address.slice(0, 6)}…{address.slice(-4)}) isn’t on
              Logos. DM Stoa to apply.
            </p>
          ) : (
            <p className="text-white/80 text-sm mt-1">
              Connect a Logos wallet to ask. DM Stoa to apply.
            </p>
          )}
        </div>
        <div className="rounded-xl border border-white/15 bg-white/5 p-4">
          <p className="text-white text-sm font-semibold">Why join the Logos</p>
          <ul className="mt-2 space-y-1 text-white/80 text-sm list-disc list-inside">
            <li>Earn 10% of all answer fees</li>
            <li>Guide quality discussions through curation</li>
            <li>Build reputation and influence thoughtful discussions</li>
          </ul>
          <p className="text-white/60 text-xs mt-2">
            Example: $1 answer fee × 500 answers = $500 fees → you earn $50.
          </p>
        </div>
        <button
          type="button"
          onClick={() => sdk.actions.viewProfile({ fid: 1265133 })}
          className="cta-button w-full"
        >
          DM Stoa
        </button>
        <Link
          href="/"
          className="w-full text-center py-3 px-6 rounded-xl font-semibold border border-white/20 text-white hover:bg-white/10"
        >
          Explore the Discourse
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-md flex flex-col gap-6 py-4"
    >
      {created ? (
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-white text-lg font-semibold">
              Your question is live in the discourse!
            </p>
            <p className="text-white/80 text-sm">
              Share it to attract more answers.
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-white/90 text-sm">{created.content}</p>
            <p className="text-white/60 text-xs">
              Ends in {formatDurationForShare(created.durationSeconds)} •
              Submission cost ${created.submissionCostUsd}
            </p>
          </div>
          <button
            type="button"
            onClick={handleShare}
            className="cta-button w-full"
          >
            Share question
          </button>
          <Link
            href={`/questions/${created.id}`}
            className="w-full text-center py-3 px-6 rounded-xl font-semibold border border-white/20 text-white hover:bg-white/10"
          >
            View question
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <label className="block text-sm font-medium">Question</label>
            <textarea
              rows={3}
              value={form.questionContent}
              onChange={(e) =>
                setForm((s) => ({ ...s, questionContent: e.target.value }))
              }
              maxLength={150}
              placeholder="Frame the discourse (max 150 chars)"
              className="w-full rounded-md border border-gray-700 bg-black p-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="text-right text-xs text-gray-400">
              {form.questionContent.length}/150
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium">Duration</label>
              <span className="text-sm font-mono text-indigo-400">
                {formatDuration(form.durationSeconds)}
              </span>
            </div>

            {/* Slider */}
            <div className="space-y-2">
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
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${durationToSlider(
                    form.durationSeconds
                  )}%, #374151 ${durationToSlider(
                    form.durationSeconds
                  )}%, #374151 100%)`,
                }}
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>1min</span>
                <span>1hr</span>
                <span>6hr</span>
                <span>24hr</span>
              </div>
            </div>

            {/* Preset buttons */}
            <div className="grid grid-cols-6 gap-2">
              {DURATION_PRESETS.map((preset) => (
                <button
                  key={preset.seconds}
                  type="button"
                  onClick={() =>
                    setForm((s) => ({ ...s, durationSeconds: preset.seconds }))
                  }
                  className={
                    `rounded-md border p-2 text-xs font-medium ` +
                    (form.durationSeconds === preset.seconds
                      ? 'border-indigo-500 bg-indigo-600 text-white'
                      : 'border-gray-700 bg-black text-gray-200 hover:border-gray-500')
                  }
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="block text-sm font-medium">Submission cost</label>
            <div className="grid grid-cols-3 gap-2">
              {SUBMISSION_COSTS.map((c) => (
                <button
                  key={c.usd}
                  type="button"
                  onClick={() =>
                    setForm((s) => ({ ...s, submissionCostUsd: c.usd }))
                  }
                  className={
                    `rounded-md border p-2 text-sm ` +
                    (form.submissionCostUsd === c.usd
                      ? 'border-indigo-500 bg-indigo-600 text-white'
                      : 'border-gray-700 bg-black text-gray-200 hover:border-gray-500')
                  }
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex flex-col gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="cta-button w-full disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating…' : 'Create question'}
            </button>
            <p className="text-xs text-gray-400">
              Earn 10% of all answer fees.
            </p>
          </div>
        </>
      )}
    </form>
  );
}

export default CreateQuestionForm;
