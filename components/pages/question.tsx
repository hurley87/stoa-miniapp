'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useQuestion } from '@/hooks/use-active-questions';
import AnswerQuestion from '@/components/answer-question';
import Answers from '@/components/answers';
import Countdown from '@/components/countdown';

type Props = { idParam: string };

export default function QuestionPage({ idParam }: Props) {
  const asNumber = Number(idParam);
  const isInvalidId = Number.isNaN(asNumber);
  const questionId = isInvalidId ? undefined : asNumber;
  const searchParams = useSearchParams();
  const referrerAddress = searchParams.get('ref');

  const { data: question, isLoading, error } = useQuestion(questionId);
  const router = useRouter();

  const truncateAddress = (addr: string) =>
    addr && addr.startsWith('0x')
      ? `${addr.slice(0, 6)}…${addr.slice(-4)}`
      : addr;

  const getDisplayName = (username: string | null, wallet: string) =>
    username && username.trim().length > 0 ? username : truncateAddress(wallet);

  const getInitial = (text: string) => (text?.[0] ?? '?').toUpperCase();

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
            <AnswerQuestion
              question={question}
              referrerAddress={referrerAddress}
            />

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
                  {question.total_submissions} USDC
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
