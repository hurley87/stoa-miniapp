'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useAccount } from 'wagmi';
import { Address } from 'viem';
import { useCreateQuestionOnchain } from '@/hooks/use-create-question-onchain';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { sdk } from '@farcaster/miniapp-sdk';
import Link from 'next/link';

const ALLOWLISTED_CREATORS = [
  '0x26e94d56892521c4c7bbbd1d9699725932797e9c',
  '0x891161c0fdd4797c79400ca2256a967bd6198450',
].map((a) => a.toLowerCase());

const isAllowedCreator = (addr?: string | null) => {
  if (!addr) return false;
  console.log('addr', addr);
  console.log('ALLOWLISTED_CREATORS', ALLOWLISTED_CREATORS);
  console.log('includes', ALLOWLISTED_CREATORS.includes(addr.toLowerCase()));
  return ALLOWLISTED_CREATORS.includes(addr.toLowerCase());
};

const DURATIONS = [
  { label: '1 hour', seconds: 60 * 60 },
  { label: '1 day', seconds: 24 * 60 * 60 },
  { label: '1 week', seconds: 7 * 24 * 60 * 60 },
] as const;

const SUBMISSION_COSTS = [
  { label: '$1', usd: 1 },
  { label: '$5', usd: 5 },
  { label: '$10', usd: 10 },
] as const;

const schema = z.object({
  questionContent: z
    .string()
    .trim()
    .min(1, 'Question is required')
    .max(150, 'Max 150 characters'),
  durationSeconds: z.number().int().positive(),
  submissionCostUsd: z
    .number()
    .int()
    .refine((v) => [1, 5, 10].includes(v), 'Invalid submission cost'),
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
    durationSeconds: DURATIONS[2].seconds,
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

  const saveMutation = useApiMutation<
    { success: boolean; question: { question_id?: number } },
    any
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
        tokenAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address,
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
        token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        submissionCost: String(form.submissionCostUsd * 1_000_000),
        duration: form.durationSeconds,
        maxWinners: 3,
        seedAmount: '1000000',
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
        durationSeconds: DURATIONS[2].seconds,
        submissionCostUsd: 1,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to create question';
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

          <div className="flex flex-col gap-2">
            <label className="block text-sm font-medium">Duration</label>
            <div className="grid grid-cols-3 gap-2">
              {DURATIONS.map((d) => (
                <button
                  key={d.seconds}
                  type="button"
                  onClick={() =>
                    setForm((s) => ({ ...s, durationSeconds: d.seconds }))
                  }
                  className={
                    `rounded-md border p-2 text-sm ` +
                    (form.durationSeconds === d.seconds
                      ? 'border-indigo-500 bg-indigo-600 text-white'
                      : 'border-gray-700 bg-black text-gray-200 hover:border-gray-500')
                  }
                >
                  {d.label}
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
