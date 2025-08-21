'use client';

import { useState, useEffect } from 'react';
import { useQuestion } from '@/hooks/use-active-questions';
import AnswerQuestion from '@/components/answer-question';

type Props = { idParam: string };

export default function QuestionPage({ idParam }: Props) {
  const asNumber = Number(idParam);
  const isInvalidId = Number.isNaN(asNumber);
  const questionId = isInvalidId ? undefined : asNumber;

  const { data: question, isLoading, error } = useQuestion(questionId);

  const [timeLeft, setTimeLeft] = useState('');

  const formatCountdown = (timeString: string) => {
    if (timeString === 'ENDED') {
      return <span className="text-red-400">ENDED</span>;
    }

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

  useEffect(() => {
    if (!question?.end_time) return;
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
  }, [question?.end_time]);

  return (
    <div className="min-h-screen px-4 pt-20 pb-6">
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
          <div className="flex w-full max-w-lg shrink-0 flex-col gap-y-4 text-white">
            <div className="flex justify-center">
              <div className="text-slate-300 font-medium tracking-tight uppercase">
                {formatCountdown(timeLeft)}
              </div>
            </div>
            <h3 className="text-xl font-semibold  text-slate-100">
              {question.content}
            </h3>
            <AnswerQuestion question={question} timeLeft={timeLeft} />
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
                  ${question.total_reward_pool.toString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
