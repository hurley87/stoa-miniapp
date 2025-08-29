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
  creatorId: number
): Promise<AnswerCheckResponse> {
  const response = await fetch(
    `/api/answers/check?questionId=${questionId}&creatorId=${creatorId}`
  );

  if (!response.ok) {
    throw new Error('Failed to check answer');
  }

  return response.json();
}

export function useAnswerCheck(
  questionId: number | undefined,
  creatorId: number | undefined
) {
  return useQuery({
    queryKey: ['answer-check', questionId, creatorId],
    queryFn: () => checkUserAnswer(questionId!, creatorId!),
    enabled:
      typeof creatorId === 'number' &&
      typeof questionId === 'number' &&
      !Number.isNaN(questionId) &&
      !Number.isNaN(creatorId),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
