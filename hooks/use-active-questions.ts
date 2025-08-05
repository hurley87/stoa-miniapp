import { useQuery } from '@tanstack/react-query'

export type Question = {
  id: string
  question_id: number
  contract_address: string
  creator: string
  content: string
  token_address: string
  submission_cost: number
  max_winners: number
  duration: number
  evaluator: string
  start_time: string
  end_time: string
  evaluation_deadline: string
  seeded_amount: number
  total_reward_pool: number
  total_submissions: number
  protocol_fees_collected: number
  creator_fees_collected: number
  status: 'active' | 'ended' | 'evaluated' | 'emergency'
  evaluated_at?: string
  creation_tx_hash?: string
  evaluation_tx_hash?: string
}

async function fetchActiveQuestions(): Promise<Question[]> {
  const response = await fetch('/api/questions/active')
  
  if (!response.ok) {
    throw new Error('Failed to fetch active questions')
  }
  
  return response.json()
}

export function useActiveQuestions() {
  return useQuery({
    queryKey: ['questions', 'active'],
    queryFn: fetchActiveQuestions,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 2, // refetch every 2 minutes
  })
}