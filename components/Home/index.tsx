'use client';

import { useUser } from '@/contexts/user-context';
import { useActiveQuestions } from '@/hooks/use-active-questions';
import QuestionCard from '@/components/QuestionCard';
import Image from 'next/image';
import Link from 'next/link';
import { useAccount } from 'wagmi';

export default function Home() {
  const { user, isLoading, signIn } = useUser();
  const {
    data: questions,
    isLoading: questionsLoading,
    error: questionsError,
  } = useActiveQuestions();

  const account = useAccount();

  console.log('user', user);

  console.log(account);
  console.log(account.address);

  if (!user.data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white mb-2">
              Welcome to Stoa
            </h1>
            <p className="text-gray-400">Connect your wallet to get started</p>
          </div>
          <button
            onClick={signIn}
            disabled={isLoading}
            className="w-full bg-gradient-coral text-white font-semibold rounded-xl py-3 px-6 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                <span>Connecting...</span>
              </>
            ) : (
              'Connect Wallet'
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 max-w-md mx-auto">
        <div className="flex items-center space-x-3">
          {user.isLoading ? (
            <div className="w-8 h-8 rounded-full bg-slate-700 animate-pulse" />
          ) : (
            <Image
              src={user.data.pfp_url!}
              alt="Profile"
              className="w-8 h-8 rounded-full border border-white/20"
              width={32}
              height={32}
            />
          )}
        </div>

        {/* Logo - Center */}
        <Link href="/" className="flex items-center">
          <Image
            src="/logo.png"
            alt="Stoa Logo"
            className="w-8 h-8 hover:opacity-80 transition-opacity"
            width={32}
            height={32}
          />
        </Link>

        <Link
          href="/about"
          className="flex items-center text-gray-400 hover:text-white transition-colors"
        >
          <span className="text-sm mr-1">About</span>
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </Link>
      </div>

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
          <div className="space-y-4">
            {questions?.map((question) => (
              <QuestionCard
                key={question.id}
                question={question}
                userWallet={account.address}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
