import { useQuery } from '@tanstack/react-query';

export type UserAnswer = {
  id: string;
  content: string;
  score: number;
  rank?: number;
};

export type AnswerCheckResponse = {
  hasAnswered: boolean;
  answer: UserAnswer | null;
};

async function checkUserAnswer(
  questionId: number,
  userWallet: string
): Promise<AnswerCheckResponse> {
  const response = await fetch(
    `/api/answers/check?questionId=${questionId}&userWallet=${userWallet}`
  );

  if (!response.ok) {
    throw new Error('Failed to check answer');
  }

  return response.json();
}

export function useAnswerCheck(
  questionId: number | undefined,
  userWallet: string | undefined
) {
  return useQuery({
    queryKey: ['answer-check', questionId, userWallet],
    queryFn: () => checkUserAnswer(questionId!, userWallet!),
    enabled:
      !!userWallet &&
      typeof questionId === 'number' &&
      !Number.isNaN(questionId),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
