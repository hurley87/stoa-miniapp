import { useQuery } from '@tanstack/react-query';

export type UserAnswer = {
  id: string;
  content: string;
  score: number;
  rank?: number;
  reward_amount: number;
  ai_reward_amount?: number;
  creator_reward_amount?: number;
  ai_reward_reason?: string;
  creator_reward_reason?: string;
  rewarded: boolean;
  timestamp: string;
  created_at: string;
  evaluation_status: string;
  question: {
    question_id: number;
    content: string;
    status: string;
    start_time: string;
    end_time: string;
    evaluated_at?: string;
    max_winners: number;
    creator: string;
    creator_username?: string;
    creator_pfp?: string;
  };
};

export type UserAnswerStats = {
  totalAnswers: number;
  totalEarnings: number;
  averageScore: number;
  scoredAnswers: number;
  rankedAnswers: number;
  topRankedAnswers: number;
  answersWithRewards: number;
};

export type UserAnswersResponse = {
  answers: UserAnswer[];
  stats: UserAnswerStats;
};

async function fetchUserAnswers(address: string): Promise<UserAnswersResponse> {
  const response = await fetch(`/api/users/${address}/answers`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user answers');
  }

  return response.json();
}

export function useUserAnswers(address: string | undefined) {
  return useQuery({
    queryKey: ['user-answers', address],
    queryFn: () => fetchUserAnswers(address!),
    enabled: !!address,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}