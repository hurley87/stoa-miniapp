'use client';

import { useUser } from '@/contexts/user-context';
import { useActiveQuestions } from '@/hooks/use-active-questions';
import Link from 'next/link';
import AppHeader from '@/components/app-header';
import Image from 'next/image';

export default function Home() {
  const { user, isLoading, signIn } = useUser();
  const {
    data: questions,
    isLoading: questionsLoading,
    error: questionsError,
  } = useActiveQuestions();

  if (!user.data) {
    return (
      <div className="flex flex-col items-center justify-between p-5 h-screen pb-[100px]">
        <div></div>
        <div className="flex flex-col gap-0 items-center justify-center">
          <Image src="/logo.png" alt="logo" width={138} height={138} />
          <div className="flex flex-col gap-1 items-center justify-center">
            <p className="text-white text-xl">Stoa</p>
            <p className="text-[#7C8194] text-sm">Proof of Knowledge</p>
          </div>
        </div>
        <div className="flex flex-col gap-6 text-center w-full">
          <button
            onClick={signIn}
            disabled={isLoading}
            className="px-6 py-3 w-full bg-[#FBBF24] text-black font-semibold rounded-lg shadow-md hover:bg-[#FBBF24]/80 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center space-x-2 min-w-[160px] min-h-[48px]"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                <span>Signing in...</span>
              </>
            ) : (
              'Sign in'
            )}
          </button>
          <p className="text-[#7C8194] text-sm">Get paid to answer questions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <AppHeader />
      {/* Content */}
      <div className="max-w-md mx-auto">
        {questionsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-coral-500 border-t-transparent" />
          </div>
        ) : questionsError ? (
          <div className="bg-red-900/50 border border-red-500/50 rounded-xl p-4 text-red-200">
            Error loading questions: {questionsError.message}
          </div>
        ) : questions?.length === 0 ? (
          <div className="bg-slate-800/50 border border-white/10 rounded-xl p-8 text-center text-gray-400">
            No active questions available
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {questions?.map((question) => (
              <div key={question.id} className="space-y-2">
                <Link href={`/questions/${question.question_id}`}>
                  <div
                    style={{
                      background: 'rgba(238,242,248,.1)',
                    }}
                    className="backdrop-blur-md relative z-10 flex h-full flex-1 flex-col flex-wrap gap-y-2.5 px-3 py-2.5 rounded-sm"
                  >
                    {/* Question */}
                    <h2 className="text-lg font-semibold">
                      {question.content}
                    </h2>

                    {/* Stats */}
                    <div className="flex items-center justify-start space-x-1">
                      <span className="text-white/80 text-sm bg-stone-500 rounded-full px-2 py-1">
                        {question.total_submissions}{' '}
                        {question.total_submissions === 1
                          ? 'submission'
                          : 'submissions'}
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
