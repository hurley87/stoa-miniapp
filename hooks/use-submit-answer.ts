import { useMutation, useQueryClient } from '@tanstack/react-query'

export type SubmitAnswerData = {
  questionId: number
  userWallet: string
  content: string
  contractAddress: string
  txHash?: string
}

async function submitAnswer(data: SubmitAnswerData) {
  const response = await fetch('/api/answers/submit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to submit answer')
  }
  
  return response.json()
}

export function useSubmitAnswer() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: submitAnswer,
    onSuccess: (data, variables) => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ 
        queryKey: ['answer-check', variables.questionId, variables.userWallet] 
      })
      queryClient.invalidateQueries({ 
        queryKey: ['questions', 'active'] 
      })
    },
  })
}