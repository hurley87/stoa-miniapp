import { useApiQuery } from './use-api-query';

export interface QuestionAnswer {
  id: number;
  answer_index: number;
  content: string;
  timestamp: string;
  score: number | null;
  rank: number | null;
  reward_amount?: number;
  ai_reward_amount?: number;
  creator_reward_amount?: number;
  ai_reward_reason?: string;
  creator_reward_reason?: string;
  evaluation_status?: string;
  username: string | null;
  pfp: string | null;
  wallet: string | null;
}

/**
 * Hook to fetch all answers for a specific question
 */
export function useQuestionAnswers(questionId: number | undefined) {
  return useApiQuery<QuestionAnswer[]>({
    queryKey: ['question-answers', questionId],
    url: `/api/answers/question/${questionId}`,
    enabled: questionId !== undefined,
  });
}
