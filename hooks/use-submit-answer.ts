import { useMutation, useQueryClient } from '@tanstack/react-query';

export type SubmitAnswerData = {
  questionId: number;
  creatorId: number;
  content: string;
  contractAddress: string;
  txHash: string;
  referrerAddress?: string | null;
};

async function submitAnswer(data: SubmitAnswerData) {
  const response = await fetch('/api/answers/submit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to submit answer');
  }

  return response.json();
}

export function useSubmitAnswer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitAnswer,
    // Optimistic update to reflect new submission immediately
    onMutate: async (variables) => {
      await Promise.all([
        queryClient.cancelQueries({
          queryKey: ['question', variables.questionId],
        }),
        queryClient.cancelQueries({ queryKey: ['questions', 'active'] }),
      ]);

      const previousQuestion = queryClient.getQueryData<any>([
        'question',
        variables.questionId,
      ]);
      const previousActive = queryClient.getQueryData<any>([
        'questions',
        'active',
      ]);

      if (previousQuestion) {
        queryClient.setQueryData(['question', variables.questionId], {
          ...previousQuestion,
          total_submissions: (previousQuestion.total_submissions ?? 0) + 1,
        });
      }

      if (Array.isArray(previousActive)) {
        queryClient.setQueryData(
          ['questions', 'active'],
          previousActive.map((q: any) =>
            Number(q.question_id) === Number(variables.questionId)
              ? {
                  ...q,
                  total_submissions: (q.total_submissions ?? 0) + 1,
                }
              : q
          )
        );
      }

      return { previousQuestion, previousActive };
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({
        queryKey: ['answer-check', variables.questionId, variables.creatorId],
      });
      queryClient.invalidateQueries({
        queryKey: ['question', variables.questionId],
      });
      queryClient.invalidateQueries({
        queryKey: ['questions', 'active'],
      });
    },
    onError: (_error, variables, context) => {
      // Rollback optimistic updates
      if (context?.previousQuestion) {
        queryClient.setQueryData(
          ['question', variables.questionId],
          context.previousQuestion
        );
      }
      if (context?.previousActive) {
        queryClient.setQueryData(
          ['questions', 'active'],
          context.previousActive
        );
      }
      // Refresh to reflect server-side state (e.g., already submitted)
      queryClient.invalidateQueries({
        queryKey: ['answer-check', variables.questionId, variables.creatorId],
      });
      queryClient.invalidateQueries({
        queryKey: ['question', variables.questionId],
      });
      queryClient.invalidateQueries({ queryKey: ['questions', 'active'] });
    },
    onSettled: (_data, _error, variables) => {
      // Ensure caches are in sync no matter what
      queryClient.invalidateQueries({
        queryKey: ['question', variables.questionId],
      });
      queryClient.invalidateQueries({ queryKey: ['questions', 'active'] });
    },
  });
}
