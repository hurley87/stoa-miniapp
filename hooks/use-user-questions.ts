import { useQuery } from '@tanstack/react-query';

export type UserCreatedQuestion = {
  id: string;
  question_id: number;
  contract_address: string;
  token_address: string;
  submission_cost: string;
  max_winners: number;
  duration: number;
  evaluator: string;
  start_time: string;
  end_time: string;
  evaluation_deadline: string;
  seeded_amount: string;
  total_reward_pool: string;
  total_submissions: number;
  protocol_fees_collected: string;
  creator_fees_collected: string;
  status: string;
  content: string;
};

export type UserCreatedQuestionsResponse = {
  questions: UserCreatedQuestion[];
  stats: {
    totalQuestions: number;
    activeQuestions: number;
    totalSubmissions: number;
    totalFeesEarned: number;
  };
};

async function fetchUserQuestions(address: string): Promise<UserCreatedQuestionsResponse> {
  const response = await fetch(`/api/users/${address}/questions`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user questions');
  }

  return response.json();
}

export function useUserQuestions(address: string | undefined) {
  return useQuery({
    queryKey: ['user-questions', address],
    queryFn: () => fetchUserQuestions(address!),
    enabled: !!address,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}